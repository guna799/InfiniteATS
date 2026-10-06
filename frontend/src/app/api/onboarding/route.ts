import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const employeeId = searchParams.get('employeeId');
    const applicationId = searchParams.get('applicationId');
    const status = searchParams.get('status');

    const where: any = {};
    if (orgId) where.orgId = orgId;
    if (employeeId) where.employeeId = employeeId;
    if (applicationId) where.applicationId = applicationId;
    if (status && status !== 'ALL') where.status = status;

    const tasks = await prisma.onboardingTask.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            location: true,
            manager: true,
          },
        },
        assignedTo: true,
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    const employeesInOnboarding = await prisma.employee.findMany({
      where: {
        orgId: orgId || undefined,
        status: { in: ['PREBOARDING', 'ONBOARDING', 'ACTIVE'] },
      },
      include: {
        department: true,
        location: true,
        manager: true,
        onboardingTasks: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ tasks, employees: employeesInOnboarding });
  } catch (error: any) {
    console.error('Onboarding GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, employeeId, applicationId, title, description, category, assignedRole, assignedToId, dueDate, signatureRequired } = body;

    if (!orgId || !title) {
      return NextResponse.json({ error: 'Title and Org ID are required' }, { status: 400 });
    }

    const task = await prisma.onboardingTask.create({
      data: {
        orgId,
        employeeId: employeeId || null,
        applicationId: applicationId || null,
        title,
        description: description || '',
        category: category || 'HR_COMPLIANCE',
        assignedRole: assignedRole || 'HR_OPS',
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        signatureRequired: !!signatureRequired,
        status: 'PENDING',
      },
      include: { employee: true },
    });

    return NextResponse.json({ task, message: 'Onboarding task created' });
  } catch (error: any) {
    console.error('Onboarding POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { taskId, status, isSigned, signatureValue, submittedDocUrl, actorUser } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') updateData.completedAt = new Date();
    }
    if (isSigned) {
      updateData.isSigned = true;
      updateData.signedAt = new Date();
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }
    if (submittedDocUrl) {
      updateData.submittedDocUrl = submittedDocUrl;
    }

    const task = await prisma.onboardingTask.update({
      where: { id: taskId },
      data: updateData,
      include: { employee: true },
    });

    // If all tasks for this employee are COMPLETED, optionally promote to ACTIVE
    if (task.employeeId) {
      const remainingPending = await prisma.onboardingTask.count({
        where: { employeeId: task.employeeId, status: { not: 'COMPLETED' } },
      });

      if (remainingPending === 0) {
        await prisma.employee.update({
          where: { id: task.employeeId },
          data: { status: 'ACTIVE' },
        });
      }
    }

    await logAuditEvent({
      orgId: task.orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'Onboarding User',
      actorEmail: actorUser?.email || 'user@system.local',
      action: isSigned ? 'ONBOARDING_DOCUMENT_SIGNED' : 'ONBOARDING_TASK_UPDATED',
      entityType: 'ONBOARDING_TASK',
      entityId: taskId,
      newState: { title: task.title, status: task.status, isSigned: task.isSigned },
    });

    return NextResponse.json({ task, message: 'Task updated successfully' });
  } catch (error: any) {
    console.error('Onboarding PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
