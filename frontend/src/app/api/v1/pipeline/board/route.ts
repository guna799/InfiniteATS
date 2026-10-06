import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = request.nextUrl;
  const requisitionId = searchParams.get('requisitionId');

  try {
    const orgWhere: any = {};
    if (session?.orgId) {
      orgWhere.orgId = session.orgId;
    }

    const appWhere: any = { ...orgWhere };
    if (requisitionId && requisitionId !== 'ALL') {
      appWhere.requisitionId = requisitionId;
    }

    const [applications, requisitions] = await Promise.all([
      prisma.application.findMany({
        where: appWhere,
        include: {
          candidate: true,
          requisition: true,
          scorecards: true,
        },
        orderBy: { appliedDate: 'desc' },
      }),
      prisma.jobRequisition.findMany({
        where: orgWhere,
        select: {
          id: true,
          reqNumber: true,
          title: true,
        },
        orderBy: { title: 'asc' },
      }),
    ]);

    const cards = applications.map((app) => {
      // Calculate avg scorecard rating if available
      let rating: number | null = null;
      if (app.scorecards && app.scorecards.length > 0) {
        const recMap: Record<string, number> = { STRONG_YES: 5, YES: 4, NEUTRAL: 3, NO: 2, STRONG_NO: 1 };
        const scores = app.scorecards.map((s) => s.culturalAddScore || recMap[s.overallRecommendation] || 3);
        if (scores.length > 0) {
          rating = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
      }

      // Format stage string to canonical pipeline stage name
      let stage = app.status || 'APPLIED';
      if (stage === 'OFFER_PENDING') stage = 'EVALUATION';
      if (stage === 'PREBOARDING') stage = 'OFFER_ACCEPTED';

      return {
        applicationId: app.id,
        stage,
        version: app.stageOrder || 1,
        rating,
        appliedDate: app.appliedDate ? app.appliedDate.toISOString() : null,
        lastActivity: app.updatedAt ? app.updatedAt.toISOString() : null,
        candidate: {
          id: app.candidate?.id || app.candidateId,
          name: app.candidate ? `${app.candidate.firstName} ${app.candidate.lastName}` : 'Candidate',
          headline: app.candidate?.headline || app.candidate?.currentTitle || null,
        },
        requisition: {
          id: app.requisition?.id || app.requisitionId,
          reqNumber: app.requisition?.reqNumber || null,
          title: app.requisition?.title || 'Open Position',
        },
      };
    });

    return NextResponse.json({
      data: {
        cards,
        requisitions: requisitions.map((r) => ({
          id: r.id,
          reqNumber: r.reqNumber,
          title: r.title,
        })),
      },
    });
  } catch (err: any) {
    console.error('Error fetching pipeline board:', err);
    return NextResponse.json(
      { errors: [{ code: 'PIPELINE_ERROR', message: err.message || 'Failed to load pipeline board' }] },
      { status: 500 }
    );
  }
}
