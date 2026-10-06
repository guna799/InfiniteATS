// Resume storage: S3 when S3_BUCKET is set, otherwise the local filesystem (dev fallback).
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, { ext: string; magic: number[] }> = {
  'application/pdf': { ext: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', magic: [0x50, 0x4b, 0x03, 0x04] }, // ZIP
  'application/msword': { ext: 'doc', magic: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE2
};

const bucket = process.env.S3_BUCKET;
const s3 = bucket ? new S3Client({ region: process.env.AWS_REGION || 'us-east-1' }) : null;
const localDir = process.env.RESUME_LOCAL_DIR || path.resolve(process.cwd(), 'uploads');

export function storageBackend(): 's3' | 'local' {
  return s3 ? 's3' : 'local';
}

/** Validates type by both declared MIME type and file signature. Returns an error message or null. */
export function validateResume(contentType: string, bytes: Buffer): string | null {
  const allowed = ALLOWED_TYPES[contentType];
  if (!allowed) return 'Resume must be a PDF, DOC or DOCX file';
  if (bytes.length === 0) return 'File is empty';
  if (bytes.length > MAX_RESUME_BYTES) return 'Resume must be 10 MB or smaller';
  if (!allowed.magic.every((b, i) => bytes[i] === b)) return 'File content does not match its type';
  return null;
}

export async function putResume(accountId: string, contentType: string, bytes: Buffer): Promise<string> {
  const key = `resumes/${accountId}/${crypto.randomUUID()}.${ALLOWED_TYPES[contentType].ext}`;
  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      })
    );
  } else {
    const target = path.join(localDir, key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
  return key;
}

export async function deleteResume(key: string): Promise<void> {
  try {
    if (s3) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } else {
      await fs.unlink(path.join(localDir, key));
    }
  } catch (err) {
    console.error('Failed to delete old resume', key, err);
  }
}

/**
 * Returns either a short-lived presigned URL (S3) or the file bytes (local) for download.
 */
export async function getResumeDownload(
  key: string,
  fileName: string,
  contentType: string
): Promise<{ url: string } | { bytes: Buffer }> {
  if (s3) {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentType: contentType,
        ResponseContentDisposition: `attachment; filename="${fileName.replace(/["\\\r\n]/g, '_')}"`,
      }),
      { expiresIn: 300 }
    );
    return { url };
  }
  const resolved = path.resolve(localDir, key);
  if (!resolved.startsWith(path.resolve(localDir) + path.sep)) throw new Error('Invalid resume key');
  return { bytes: await fs.readFile(resolved) };
}

/** Redirects to a presigned S3 URL, or streams the file when using local storage. */
export async function resumeResponse(key: string, fileName: string, contentType: string) {
  const download = await getResumeDownload(key, fileName, contentType);
  if ('url' in download) {
    return NextResponse.redirect(download.url);
  }
  return new NextResponse(new Uint8Array(download.bytes), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName.replace(/["\\\r\n]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
