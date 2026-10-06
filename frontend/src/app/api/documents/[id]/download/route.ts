import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPresignedDownloadUrl } from '@/lib/documentStorage';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Generate short-lived presigned URL (300 seconds = 5 minutes)
    const url = await getPresignedDownloadUrl(
      document.s3Key,
      document.originalFilename,
      document.mimeType,
      300
    );

    // Audit document access
    await logAuditEvent({
      orgId: document.orgId,
      actorName: 'Authorized User',
      actorEmail: 'user@infinitecareers.com',
      action: 'DOCUMENT_DOWNLOADED',
      entityType: 'DOCUMENT',
      entityId: document.id,
      newState: {
        documentId: document.id,
        sha256: document.sha256Hash,
      },
    });

    return NextResponse.json({ url, document });
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
