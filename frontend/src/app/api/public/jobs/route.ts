import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { clientIp, isRateLimited } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  if (isRateLimited(`public-jobs:${ip}`, 60)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }

  const { searchParams } = request.nextUrl;
  const orgSlug = searchParams.get('orgSlug') || undefined;
  const orgId = searchParams.get('orgId') || undefined;
  const query = searchParams.get('query') || searchParams.get('search') || undefined;
  const department = searchParams.get('department') || undefined;
  const location = searchParams.get('location') || undefined;
  const workplaceType = searchParams.get('workplaceType') || undefined;
  const employmentType = searchParams.get('employmentType') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  try {
    const whereClause: any = {
      isPublished: true,
      status: 'OPEN',
    };

    if (orgSlug) {
      whereClause.organization = { slug: orgSlug };
    } else if (orgId) {
      whereClause.organizationId = orgId;
    }

    if (workplaceType && workplaceType !== 'ALL') {
      whereClause.workplaceType = workplaceType;
    }

    if (employmentType && employmentType !== 'ALL') {
      whereClause.employmentType = employmentType;
    }

    if (department && department !== 'ALL') {
      whereClause.department = { name: { contains: department } };
    }

    if (location && location !== 'ALL') {
      whereClause.location = {
        OR: [
          { name: { contains: location } },
          { city: { contains: location } },
          { country: { contains: location } },
        ],
      };
    }

    if (query && query.trim()) {
      const q = query.trim();
      whereClause.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { requirements: { contains: q } },
        { department: { name: { contains: q } } },
        { location: { city: { contains: q } } },
        { location: { country: { contains: q } } },
      ];
    }

    const [total, requisitions] = await Promise.all([
      prisma.jobRequisition.count({ where: whereClause }),
      prisma.jobRequisition.findMany({
        where: whereClause,
        skip,
        take: limit,
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
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      jobs: requisitions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (err: any) {
    console.error('Error fetching public jobs:', err);
    return NextResponse.json({ error: 'Failed to retrieve public jobs' }, { status: 500 });
  }
}
