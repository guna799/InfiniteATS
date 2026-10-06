import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const verifiedBy = body.verifiedBy || 'HR Operations';

    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: {
        status: 'VERIFIED',
        verifiedBy,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    });

    // Audit log
    await logAuditEvent({
      orgId: document.orgId,
      actorName: verifiedBy,
      actorEmail: `${verifiedBy.toLowerCase().replace(/\s+/g, '.')}@infinitecareers.com`,
      action: 'DOCUMENT_VERIFIED',
      entityType: 'DOCUMENT',
      entityId: params.id,
      previousState: { status: document.status },
      newState: { status: 'VERIFIED', verifiedBy, verifiedAt: updated.verifiedAt },
    });

    return NextResponse.json({ document: updated });
  } catch (error: any) {
    console.error('Error verifying document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
