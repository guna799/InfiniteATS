import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  const [jobs, applied] = await Promise.all([
    prisma.jobRequisition.findMany({
      where: { status: 'OPEN', isPublished: true },
      select: {
        id: true,
        reqNumber: true,
        title: true,
        employmentType: true,
        workplaceType: true,
        minSalary: true,
        maxSalary: true,
        currency: true,
        description: true,
        requirements: true,
        benefits: true,
        openingsCount: true,
        createdAt: true,
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
        department: { select: { name: true } },
        location: { select: { name: true, city: true, country: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    session?.kind === 'candidate' && session?.sub
      ? prisma.application.findMany({
          where: { candidate: { accountId: session.sub } },
          select: { requisitionId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const appliedStatus = new Map(applied.map((a) => [a.requisitionId, a.status]));
  return NextResponse.json({
    isAuthenticated: session?.kind === 'candidate',
    user: session ? { name: session.name, email: session.email, kind: session.kind } : null,
    jobs: jobs.map((j) => ({ ...j, applicationStatus: appliedStatus.get(j.id) || null })),
  });
}
