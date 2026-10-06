import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const requisition = await prisma.jobRequisition.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        businessUnit: true,
        location: true,
        jobProfile: true,
        hiringManager: true,
        recruiter: true,
        approvalChains: {
          include: { approver: true },
          orderBy: { stepNumber: 'asc' },
        },
        applications: {
          include: {
            candidate: true,
            scorecards: {
              include: { interviewer: true },
            },
            interviews: true,
            offers: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!requisition) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
    }

    return NextResponse.json({ requisition });
  } catch (error: any) {
    console.error('Requisition detail GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, approverId, comments, actorUser, ...updateData } = body;

    const existingReq = await prisma.jobRequisition.findUnique({
      where: { id: params.id },
      include: { approvalChains: true },
    });

    if (!existingReq) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
    }

    // Handle Approval Action
    if (action === 'APPROVE') {
      // Find pending step for this approver or first pending
      const pendingStep = existingReq.approvalChains.find(
        (c) => c.status === 'PENDING' && (!approverId || c.approverId === approverId)
      );

      if (pendingStep) {
        await prisma.approvalChain.update({
          where: { id: pendingStep.id },
          data: {
            status: 'APPROVED',
            comments: comments || 'Approved',
            approvedAt: new Date(),
          },
        });
      }

      // Check if all steps are approved
      const updatedChains = await prisma.approvalChain.findMany({
        where: { requisitionId: params.id },
      });

      const allApproved = updatedChains.every((c) => c.status === 'APPROVED');
      let newReqStatus = existingReq.status;

      if (allApproved) {
        newReqStatus = 'OPEN';
        await prisma.jobRequisition.update({
          where: { id: params.id },
          data: { status: 'OPEN', isPublished: true },
        });
      }

      await logAuditEvent({
        orgId: existingReq.orgId,
        actorId: actorUser?.id,
        actorName: actorUser?.name || 'Approver',
        actorEmail: actorUser?.email || 'approver@domain.com',
        action: allApproved ? 'REQUISITION_FULLY_APPROVED_AND_OPENED' : 'REQUISITION_APPROVAL_STEP_COMPLETED',
        entityType: 'REQUISITION',
        entityId: params.id,
        previousState: { status: existingReq.status },
        newState: { status: newReqStatus, stepApproved: pendingStep?.stepNumber },
      });

      const updated = await prisma.jobRequisition.findUnique({
        where: { id: params.id },
        include: { approvalChains: { include: { approver: true } } },
      });

      return NextResponse.json({ requisition: updated, message: 'Approval recorded successfully' });
    }

    // Handle Reject Action
    if (action === 'REJECT') {
      const pendingStep = existingReq.approvalChains.find((c) => c.status === 'PENDING');
      if (pendingStep) {
        await prisma.approvalChain.update({
          where: { id: pendingStep.id },
          data: {
            status: 'REJECTED',
            comments: comments || 'Requisition rejected',
          },
        });
      }

      await prisma.jobRequisition.update({
        where: { id: params.id },
        data: { status: 'DRAFT', isPublished: false },
      });

      await logAuditEvent({
        orgId: existingReq.orgId,
        actorId: actorUser?.id,
        actorName: actorUser?.name || 'Approver',
        actorEmail: actorUser?.email || 'approver@domain.com',
        action: 'REQUISITION_APPROVAL_REJECTED',
        entityType: 'REQUISITION',
        entityId: params.id,
        previousState: { status: existingReq.status },
        newState: { status: 'DRAFT', rejectionComments: comments },
      });

      return NextResponse.json({ message: 'Requisition rejected and returned to draft' });
    }

    // General Requisition Update
    const updated = await prisma.jobRequisition.update({
      where: { id: params.id },
      data: updateData,
      include: {
        department: true,
        location: true,
        hiringManager: true,
        recruiter: true,
      },
    });

    await logAuditEvent({
      orgId: existingReq.orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'System User',
      actorEmail: actorUser?.email || 'user@system.local',
      action: 'REQUISITION_UPDATED',
      entityType: 'REQUISITION',
      entityId: params.id,
      previousState: existingReq,
      newState: updated,
    });

    return NextResponse.json({ requisition: updated });
  } catch (error: any) {
    console.error('Requisition PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
