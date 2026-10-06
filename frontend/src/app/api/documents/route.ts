import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import {
  buildS3Key,
  uploadToS3,
  validateDocument,
  ALLOWED_MIME_TYPES,
} from '@/lib/documentStorage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'tenant-acme-tech';
    const candidateId = searchParams.get('candidateId');
    const employeeId = searchParams.get('employeeId');
    const applicationId = searchParams.get('applicationId');
    const offerId = searchParams.get('offerId');
    const onboardingId = searchParams.get('onboardingId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: any = { orgId };
    if (candidateId) where.candidateId = candidateId;
    if (employeeId) where.employeeId = employeeId;
    if (applicationId) where.applicationId = applicationId;
    if (offerId) where.offerId = offerId;
    if (onboardingId) where.onboardingId = onboardingId;
    if (category) where.documentCategory = category;
    if (status) where.status = status;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const orgId = (formData.get('orgId') as string) || 'tenant-acme-tech';
    const candidateId = formData.get('candidateId') as string | null;
    const employeeId = formData.get('employeeId') as string | null;
    const applicationId = formData.get('applicationId') as string | null;
    const offerId = formData.get('offerId') as string | null;
    const onboardingId = formData.get('onboardingId') as string | null;
    const documentType = (formData.get('documentType') as string) || 'OTHER';
    const documentCategory = (formData.get('documentCategory') as string) || 'OTHER';
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Candidate / HR';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const validation = validateDocument(file.type, bytes);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const documentId = crypto.randomUUID();
    const entityType = candidateId ? 'candidates' : employeeId ? 'employees' : offerId ? 'offers' : 'documents';
    const entityId = candidateId || employeeId || offerId || onboardingId || 'general';

    const s3Key = buildS3Key({
      tenantId: orgId,
      entityType,
      entityId,
      category: documentCategory,
      documentId,
      filename: file.name,
    });

    // Upload to S3 (or local fallback)
    const { bucket, key, sha256 } = await uploadToS3({
      key: s3Key,
      buffer: bytes,
      contentType: file.type,
      metadata: {
        orgId,
        documentType,
        documentCategory,
        originalFilename: file.name,
      },
    });

    // Save document metadata in Prisma
    const document = await prisma.document.create({
      data: {
        id: documentId,
        orgId,
        candidateId: candidateId || undefined,
        employeeId: employeeId || undefined,
        applicationId: applicationId || undefined,
        offerId: offerId || undefined,
        onboardingId: onboardingId || undefined,
        documentType,
        documentCategory,
        originalFilename: file.name,
        storedFilename: `${documentId}.${ALLOWED_MIME_TYPES[file.type]?.ext || 'pdf'}`,
        s3Bucket: bucket,
        s3Key: key,
        mimeType: file.type,
        fileSize: bytes.length,
        sha256Hash: sha256,
        status: 'PENDING_VERIFICATION',
        uploadedBy,
      },
    });

    // Cryptographic audit log
    await logAuditEvent({
      orgId,
      actorName: uploadedBy,
      actorEmail: `${uploadedBy.toLowerCase().replace(/\s+/g, '.')}@infinitecareers.com`,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: document.id,
      newState: {
        documentId: document.id,
        documentType,
        s3Key: key,
        sha256,
        fileSize: bytes.length,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
