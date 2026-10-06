import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status');

    const where: any = {};
    if (orgId) where.orgId = orgId;
    if (status && status !== 'ALL') where.status = status;

    const offers = await prisma.offer.findMany({
      where,
      include: {
        candidate: true,
        requisition: {
          include: {
            department: true,
            location: true,
            hiringManager: true,
          },
        },
        application: true,
        approvalChains: {
          include: { approver: true },
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ offers });
  } catch (error: any) {
    console.error('Offers GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orgId,
      applicationId,
      candidateId,
      requisitionId,
      title,
      departmentId,
      locationId,
      baseSalary,
      targetBonusPercentage = 0,
      signingBonus = 0,
      equityShares = 0,
      equityVestingSchedule = '4-year standard with 1-year cliff',
      currency = 'USD',
      startDate,
      expirationDate,
      offerLetterContent,
      approverIds = [],
      actorUser,
    } = body;

    if (!orgId || !applicationId || !candidateId || !requisitionId || !baseSalary || !startDate) {
      return NextResponse.json({ error: 'Missing required offer fields' }, { status: 400 });
    }

    const offerCount = await prisma.offer.count({ where: { orgId } });
    const offerNumber = `OFF-2026-${String(offerCount + 101).padStart(3, '0')}`;

    // Default template letter if not customized
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    const req = await prisma.jobRequisition.findUnique({ where: { id: requisitionId } });

    const generatedLetter =
      offerLetterContent ||
      `# Formal Offer of Employment
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Dear ${candidate?.firstName} ${candidate?.lastName},

We are excited to extend a formal offer of employment for the position of **${title || req?.title}**.

### Compensation Package Overview:
- **Base Annual Salary:** $${Number(baseSalary).toLocaleString()} ${currency}
- **Target Performance Bonus:** ${targetBonusPercentage}%
- **Sign-on Bonus:** $${Number(signingBonus).toLocaleString()} ${currency}
- **Equity Award:** ${Number(equityShares).toLocaleString()} Stock Options (${equityVestingSchedule})
- **Start Date:** ${new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

We look forward to welcoming you to the team!
      `.trim();

    const offer = await prisma.offer.create({
      data: {
        orgId,
        applicationId,
        candidateId,
        requisitionId,
        offerNumber,
        title: title || req?.title || 'Employment Offer',
        departmentId: departmentId || req?.departmentId || null,
        locationId: locationId || req?.locationId || null,
        baseSalary: parseFloat(baseSalary),
        targetBonusPercentage: parseFloat(targetBonusPercentage) || 0,
        signingBonus: parseFloat(signingBonus) || 0,
        equityShares: parseInt(equityShares) || 0,
        equityVestingSchedule,
        currency,
        startDate: new Date(startDate),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        status: approverIds.length > 0 ? 'PENDING_APPROVAL' : 'APPROVED',
        offerLetterContent: generatedLetter,
      },
      include: {
        candidate: true,
        requisition: true,
      },
    });

    // Create approval chain if approvers provided
    if (approverIds.length > 0) {
      for (let i = 0; i < approverIds.length; i++) {
        await prisma.approvalChain.create({
          data: {
            offerId: offer.id,
            entityType: 'OFFER',
            stepNumber: i + 1,
            approverId: approverIds[i],
            status: 'PENDING',
          },
        });
      }
    }

    await logAuditEvent({
      orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'Recruiter',
      actorEmail: actorUser?.email || 'recruiter@system.local',
      action: 'OFFER_CREATED',
      entityType: 'OFFER',
      entityId: offer.id,
      newState: { offerNumber, candidateName: `${candidate?.firstName} ${candidate?.lastName}`, baseSalary },
    });

    return NextResponse.json({ offer, message: 'Offer created successfully' });
  } catch (error: any) {
    console.error('Offer POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
