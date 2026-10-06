import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
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
        application: true,
        approvalChains: {
          include: { approver: true },
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ offer });
  } catch (error: any) {
    console.error('Offer detail GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, approverId, comments, signatureData, declineReason, actorUser } = body;

    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        candidate: true,
        requisition: true,
        application: true,
        approvalChains: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // 1. APPROVE Offer Step
    if (action === 'APPROVE') {
      const pendingStep = offer.approvalChains.find((c) => c.status === 'PENDING' && (!approverId || c.approverId === approverId));
      if (pendingStep) {
        await prisma.approvalChain.update({
          where: { id: pendingStep.id },
          data: {
            status: 'APPROVED',
            comments: comments || 'Offer package approved',
            approvedAt: new Date(),
          },
        });
      }

      const allChains = await prisma.approvalChain.findMany({ where: { offerId: params.id } });
      const allApproved = allChains.every((c) => c.status === 'APPROVED');

      if (allApproved) {
        await prisma.offer.update({
          where: { id: params.id },
          data: { status: 'APPROVED' },
        });
      }

      await logAuditEvent({
        orgId: offer.orgId,
        actorId: actorUser?.id,
        actorName: actorUser?.name || 'Approver',
        actorEmail: actorUser?.email || 'approver@domain.com',
        action: 'OFFER_APPROVAL_RECORDED',
        entityType: 'OFFER',
        entityId: params.id,
        newState: { allApproved },
      });

      return NextResponse.json({ message: 'Offer approved successfully', isFullyApproved: allApproved });
    }

    // 2. EXTEND Offer to Candidate
    if (action === 'EXTEND') {
      const updated = await prisma.offer.update({
        where: { id: params.id },
        data: { status: 'EXTENDED' },
      });

      await prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: 'OFFER_EXTENDED', stageOrder: 8 },
      });

      await logAuditEvent({
        orgId: offer.orgId,
        actorId: actorUser?.id,
        actorName: actorUser?.name || 'Recruiter',
        actorEmail: actorUser?.email || 'recruiter@system.local',
        action: 'OFFER_EXTENDED_TO_CANDIDATE',
        entityType: 'OFFER',
        entityId: params.id,
        newState: { candidateEmail: offer.candidate.email, offerNumber: offer.offerNumber },
      });

      return NextResponse.json({ offer: updated, message: 'Offer successfully extended to candidate' });
    }

    // 3. ACCEPT & SIGN Offer (Candidate Signing Ceremony)
    if (action === 'ACCEPT') {
      const signedAt = new Date();
      const updatedOffer = await prisma.offer.update({
        where: { id: params.id },
        data: {
          status: 'ACCEPTED',
          signedAt,
          signatureData: JSON.stringify({
            signatureType: signatureData?.signatureType || 'DIGITAL_TYPED',
            signatureValue: signatureData?.signatureValue || `${offer.candidate.firstName} ${offer.candidate.lastName}`,
            ipAddress: '127.0.0.1',
            userAgent: 'InfiniteCareers Candidate Portal',
            timestamp: signedAt.toISOString(),
            verificationHash: 'signed_' + Math.random().toString(36).substring(2, 15),
          }),
        },
      });

      // Advance application stage
      await prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: 'OFFER_ACCEPTED', stageOrder: 9 },
      });

      // Increment filled count on requisition
      await prisma.jobRequisition.update({
        where: { id: offer.requisitionId },
        data: { filledCount: { increment: 1 } },
      });

      // Create Employee Record
      const empCount = await prisma.employee.count({ where: { orgId: offer.orgId } });
      const empNumber = `EMP-${String(empCount + 1090).padStart(4, '0')}`;
      const workEmail = `${offer.candidate.firstName.toLowerCase()}.${offer.candidate.lastName.toLowerCase()}@acmeglobal.io`;

      let employee = await prisma.employee.findFirst({
        where: { candidateId: offer.candidateId },
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            orgId: offer.orgId,
            candidateId: offer.candidateId,
            applicationId: offer.applicationId,
            employeeNumber: empNumber,
            firstName: offer.candidate.firstName,
            lastName: offer.candidate.lastName,
            email: offer.candidate.email,
            workEmail,
            phone: offer.candidate.phone || null,
            title: offer.title,
            departmentId: offer.departmentId || offer.requisition.departmentId,
            locationId: offer.locationId || offer.requisition.locationId,
            managerId: offer.requisition.hiringManagerId,
            hireDate: new Date(),
            startDate: offer.startDate,
            employmentStatus: 'FULL_TIME',
            status: 'PREBOARDING',
            salary: offer.baseSalary,
            currency: offer.currency,
            bio: offer.candidate.summary || `${offer.title} joining our team.`,
            skills: offer.candidate.skills || null,
          },
        });
      }

      // Generate Preboarding & Onboarding Checklist Tasks
      const defaultTasks = [
        {
          title: 'Laptop & Hardware Kit Setup',
          description: 'Configure and dispatch MacBook Pro with security key and workspace kit.',
          category: 'IT_SETUP',
          assignedRole: 'IT_ADMIN',
          dueDate: new Date(offer.startDate.getTime() - 86400000 * 3),
        },
        {
          title: 'Form I-9 Employment Verification',
          description: 'Complete Section 1 of Form I-9 and upload required identity and employment authorization documents.',
          category: 'HR_COMPLIANCE',
          assignedRole: 'CANDIDATE',
          signatureRequired: true,
          dueDate: new Date(offer.startDate.getTime() + 86400000 * 3),
        },
        {
          title: 'Non-Disclosure & Confidentiality Agreement (NDA)',
          description: 'Review and electronically sign company employee handbook and confidentiality agreement.',
          category: 'HR_COMPLIANCE',
          assignedRole: 'CANDIDATE',
          signatureRequired: true,
          dueDate: new Date(offer.startDate.getTime() - 86400000 * 1),
        },
        {
          title: 'Direct Deposit & Tax Withholding (Form W-4)',
          description: 'Submit payroll direct deposit routing numbers and Federal/State W-4 tax withholdings.',
          category: 'BENEFITS',
          assignedRole: 'CANDIDATE',
          dueDate: new Date(offer.startDate.getTime() + 86400000 * 5),
        },
        {
          title: 'Manager Kickoff & Onboarding Buddy Introduction',
          description: 'Schedule Day 1 greeting, introduce team buddy, and review first-week expectations.',
          category: 'TEAM_INTRO',
          assignedRole: 'MANAGER',
          dueDate: offer.startDate,
        },
      ];

      for (const t of defaultTasks) {
        await prisma.onboardingTask.create({
          data: {
            orgId: offer.orgId,
            employeeId: employee.id,
            applicationId: offer.applicationId,
            title: t.title,
            description: t.description,
            category: t.category,
            assignedRole: t.assignedRole,
            signatureRequired: t.signatureRequired || false,
            dueDate: t.dueDate,
            status: 'PENDING',
          },
        });
      }

      await logAuditEvent({
        orgId: offer.orgId,
        actorId: offer.candidateId,
        actorName: `${offer.candidate.firstName} ${offer.candidate.lastName}`,
        actorEmail: offer.candidate.email,
        action: 'OFFER_ACCEPTED_AND_SIGNED',
        entityType: 'OFFER',
        entityId: params.id,
        newState: {
          offerNumber: offer.offerNumber,
          employeeNumber: empNumber,
          workEmail,
          tasksGenerated: defaultTasks.length,
        },
      });

      return NextResponse.json({
        offer: updatedOffer,
        employee,
        message: 'Offer accepted! Preboarding workflow and employee record initiated.',
      });
    }

    // 4. DECLINE Offer
    if (action === 'DECLINE') {
      const updatedOffer = await prisma.offer.update({
        where: { id: params.id },
        data: {
          status: 'DECLINED',
          candidateDeclineReason: declineReason || 'Candidate accepted competing offer',
        },
      });

      await prisma.application.update({
        where: { id: offer.applicationId },
        data: {
          status: 'WITHDRAWN',
          rejectionReason: 'Candidate declined offer',
          rejectionNotes: declineReason,
        },
      });

      await logAuditEvent({
        orgId: offer.orgId,
        actorId: offer.candidateId,
        actorName: `${offer.candidate.firstName} ${offer.candidate.lastName}`,
        actorEmail: offer.candidate.email,
        action: 'OFFER_DECLINED_BY_CANDIDATE',
        entityType: 'OFFER',
        entityId: params.id,
        newState: { declineReason },
      });

      return NextResponse.json({ offer: updatedOffer, message: 'Offer declined' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Offer PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
