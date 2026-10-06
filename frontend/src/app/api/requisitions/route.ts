import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');
    const publishedOnly = searchParams.get('publishedOnly') === 'true';

    const where: any = {};
    if (orgId) where.orgId = orgId;
    if (status && status !== 'ALL') where.status = status;
    if (departmentId && departmentId !== 'ALL') where.departmentId = departmentId;
    if (publishedOnly) where.isPublished = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { reqNumber: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const requisitions = await prisma.jobRequisition.findMany({
      where,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requisitions });
  } catch (error: any) {
    console.error('Requisitions GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orgId,
      title,
      departmentId,
      businessUnitId,
      locationId,
      jobProfileId,
      hiringManagerId,
      recruiterId,
      headcountType,
      employmentType,
      workplaceType,
      targetStartDate,
      minSalary,
      maxSalary,
      currency = 'USD',
      priority = 'MEDIUM',
      openingsCount = 1,
      description,
      requirements,
      benefits,
      isPublished = false,
      submitForApproval = true,
      approverIds = [],
      actorUser,
    } = body;

    if (!orgId || !title || !departmentId || !locationId || !hiringManagerId || !recruiterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate reqNumber e.g. REQ-2026-105
    const count = await prisma.jobRequisition.count({ where: { orgId } });
    const reqNumber = `REQ-2026-${String(count + 101).padStart(3, '0')}`;

    const status = submitForApproval ? 'PENDING_APPROVAL' : 'DRAFT';

    const requisition = await prisma.jobRequisition.create({
      data: {
        orgId,
        reqNumber,
        title,
        departmentId,
        businessUnitId: businessUnitId || null,
        locationId,
        jobProfileId: jobProfileId || null,
        hiringManagerId,
        recruiterId,
        headcountType: headcountType || 'NEW_HEADCOUNT',
        employmentType: employmentType || 'FULL_TIME',
        workplaceType: workplaceType || 'HYBRID',
        targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
        minSalary: parseFloat(minSalary) || 0,
        maxSalary: parseFloat(maxSalary) || 0,
        currency,
        priority,
        openingsCount: parseInt(openingsCount) || 1,
        description: description || '',
        requirements: requirements || '',
        benefits: benefits || '',
        status,
        isPublished: false,
      },
    });

    // Create approval chain if submitted
    if (submitForApproval && approverIds.length > 0) {
      for (let i = 0; i < approverIds.length; i++) {
        await prisma.approvalChain.create({
          data: {
            requisitionId: requisition.id,
            entityType: 'REQUISITION',
            stepNumber: i + 1,
            approverId: approverIds[i],
            status: i === 0 ? 'PENDING' : 'PENDING',
          },
        });
      }
    } else if (submitForApproval) {
      // Default approval: Hiring Manager then Department Head / Super Admin
      await prisma.approvalChain.create({
        data: {
          requisitionId: requisition.id,
          entityType: 'REQUISITION',
          stepNumber: 1,
          approverId: hiringManagerId,
          status: 'PENDING',
        },
      });
    }

    await logAuditEvent({
      orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'System User',
      actorEmail: actorUser?.email || 'user@system.local',
      action: 'REQUISITION_CREATED',
      entityType: 'REQUISITION',
      entityId: requisition.id,
      newState: { reqNumber, title, status },
    });

    return NextResponse.json({ requisition, message: 'Requisition created successfully' });
  } catch (error: any) {
    console.error('Requisitions POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
