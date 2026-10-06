import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const requisitionId = searchParams.get('requisitionId');
    const status = searchParams.get('status');

    const where: any = {};
    if (orgId) where.orgId = orgId;
    if (requisitionId && requisitionId !== 'ALL') where.requisitionId = requisitionId;
    if (status && status !== 'ALL') where.status = status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        candidate: true,
        requisition: {
          include: {
            department: true,
            location: true,
            hiringManager: true,
            recruiter: true,
          },
        },
        interviews: {
          include: {
            scorecards: {
              include: { interviewer: true },
            },
          },
          orderBy: { startTime: 'desc' },
        },
        scorecards: {
          include: { interviewer: true },
        },
        offers: true,
      },
      orderBy: [{ stageOrder: 'asc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error('Applications GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, newStatus, rejectionReason, rejectionNotes, actorUser } = body;

    if (!applicationId || !newStatus) {
      return NextResponse.json({ error: 'Application ID and new status are required' }, { status: 400 });
    }

    const existing = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        requisition: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Stage order mapping
    const stageOrders: Record<string, number> = {
      APPLIED: 1,
      SCREENING: 2,
      PHONE_SCREEN: 3,
      TECHNICAL_INTERVIEW: 4,
      HIRING_MANAGER_INTERVIEW: 5,
      ONSITE_PANEL: 6,
      EVALUATION: 7,
      OFFER_EXTENDED: 8,
      OFFER_ACCEPTED: 9,
      ONBOARDED: 10,
      REJECTED: 99,
      WITHDRAWN: 100,
    };

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        stageOrder: stageOrders[newStatus] || 1,
        rejectionReason: newStatus === 'REJECTED' ? rejectionReason || 'Skills mismatch' : null,
        rejectionNotes: newStatus === 'REJECTED' ? rejectionNotes || '' : null,
      },
      include: {
        candidate: true,
        requisition: true,
      },
    });

    await logAuditEvent({
      orgId: existing.orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'Recruiter',
      actorEmail: actorUser?.email || 'recruiter@system.local',
      action: 'APPLICATION_STAGE_CHANGED',
      entityType: 'APPLICATION',
      entityId: applicationId,
      previousState: { status: existing.status, candidate: `${existing.candidate.firstName} ${existing.candidate.lastName}` },
      newState: { status: newStatus, requisition: existing.requisition.title },
    });

    return NextResponse.json({ application: updated, message: `Candidate stage moved to ${newStatus}` });
  } catch (error: any) {
    console.error('Application PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
