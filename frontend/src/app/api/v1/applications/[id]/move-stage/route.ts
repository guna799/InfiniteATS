import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const applicationId = params.id;
  const body = await request.json().catch(() => ({}));
  const { stage, reason } = body;

  if (!applicationId || !stage) {
    return NextResponse.json(
      { errors: [{ code: 'INVALID_REQUEST', message: 'Application ID and target stage are required' }] },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        requisition: true,
        scorecards: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { errors: [{ code: 'NOT_FOUND', message: 'Application not found' }] },
        { status: 404 }
      );
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: stage,
        stageOrder: (existing.stageOrder || 1) + 1,
        rejectionReason: stage === 'REJECTED' ? reason || existing.rejectionReason : existing.rejectionReason,
      },
      include: {
        candidate: true,
        requisition: true,
        scorecards: true,
      },
    });

    // Calculate rating
    let rating: number | null = null;
    if (updated.scorecards && updated.scorecards.length > 0) {
      const recMap: Record<string, number> = { STRONG_YES: 5, YES: 4, NEUTRAL: 3, NO: 2, STRONG_NO: 1 };
      const scores = updated.scorecards.map((s) => s.culturalAddScore || recMap[s.overallRecommendation] || 3);
      if (scores.length > 0) {
        rating = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    const card = {
      applicationId: updated.id,
      stage: updated.status,
      version: updated.stageOrder,
      rating,
      appliedDate: updated.appliedDate ? updated.appliedDate.toISOString() : null,
      lastActivity: updated.updatedAt ? updated.updatedAt.toISOString() : null,
      candidate: {
        id: updated.candidate?.id || updated.candidateId,
        name: updated.candidate ? `${updated.candidate.firstName} ${updated.candidate.lastName}` : 'Candidate',
        headline: updated.candidate?.headline || updated.candidate?.currentTitle || null,
      },
      requisition: {
        id: updated.requisition?.id || updated.requisitionId,
        reqNumber: updated.requisition?.reqNumber || null,
        title: updated.requisition?.title || 'Open Position',
      },
    };

    return NextResponse.json({
      data: card,
    });
  } catch (err: any) {
    console.error('Error moving application stage:', err);
    return NextResponse.json(
      { errors: [{ code: 'STAGE_MOVE_FAILED', message: err.message || 'Failed to move stage' }] },
      { status: 500 }
    );
  }
}
