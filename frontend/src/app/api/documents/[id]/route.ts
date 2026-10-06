import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        candidate: true,
        employee: true,
        offer: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    await logAuditEvent({
      orgId: document.orgId,
      actorName: 'Admin',
      actorEmail: 'admin@infinitecareers.com',
      action: 'DOCUMENT_ARCHIVED',
      entityType: 'DOCUMENT',
      entityId: params.id,
      previousState: { status: document.status },
      newState: { status: 'ARCHIVED' },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    console.error('Error archiving document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
