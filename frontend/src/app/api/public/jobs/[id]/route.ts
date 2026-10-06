import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { clientIp, isRateLimited } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = clientIp(request);
  if (isRateLimited(`public-job-detail:${ip}`, 120)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Job identifier is required' }, { status: 400 });
  }

  try {
    const job = await prisma.jobRequisition.findFirst({
      where: {
        OR: [
          { id },
          { reqNumber: id },
        ],
        isPublished: true,
        status: 'OPEN',
      },
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
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found or no longer active' }, { status: 404 });
    }

    return NextResponse.json({ job }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    console.error('Error fetching public job detail:', err);
    return NextResponse.json({ error: 'Failed to retrieve job details' }, { status: 500 });
  }
}
