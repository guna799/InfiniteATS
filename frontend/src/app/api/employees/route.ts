import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (orgId) where.orgId = orgId;
    if (departmentId && departmentId !== 'ALL') where.departmentId = departmentId;
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { title: { contains: search } },
        { workEmail: { contains: search } },
        { employeeNumber: { contains: search } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        businessUnit: true,
        location: true,
        manager: true,
        onboardingTasks: true,
      },
      orderBy: { firstName: 'asc' },
    });

    // Structure Org Chart tree nodes
    const orgTree = employees.map((emp) => ({
      ...emp,
      directReports: employees.filter((e) => e.managerId === emp.id || (e.manager && e.manager.email === emp.workEmail)),
    }));

    return NextResponse.json({ employees, orgTree });
  } catch (error: any) {
    console.error('Employees GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
