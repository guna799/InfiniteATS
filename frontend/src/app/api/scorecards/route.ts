import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const interviewScheduleId = searchParams.get('interviewScheduleId');

    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    if (interviewScheduleId) where.interviewScheduleId = interviewScheduleId;

    const scorecards = await prisma.interviewScorecard.findMany({
      where,
      include: {
        interviewer: true,
        interviewSchedule: true,
        application: {
          include: { candidate: true, requisition: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ scorecards });
  } catch (error: any) {
    console.error('Scorecards GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orgId,
      interviewScheduleId,
      applicationId,
      interviewerId,
      overallRecommendation,
      overallFeedback,
      competencyScores,
      culturalAddScore,
      strengths,
      weaknesses,
      actorUser,
    } = body;

    if (!orgId || !interviewScheduleId || !applicationId || !interviewerId || !overallRecommendation) {
      return NextResponse.json({ error: 'Missing required scorecard fields' }, { status: 400 });
    }

    // Check if scorecard already exists for this interviewer on this interview
    let scorecard = await prisma.interviewScorecard.findFirst({
      where: { interviewScheduleId, interviewerId },
    });

    if (scorecard) {
      scorecard = await prisma.interviewScorecard.update({
        where: { id: scorecard.id },
        data: {
          overallRecommendation,
          overallFeedback: overallFeedback || '',
          competencyScores: competencyScores ? JSON.stringify(competencyScores) : null,
          culturalAddScore: culturalAddScore ? parseInt(culturalAddScore) : 4,
          strengths: strengths || null,
          weaknesses: weaknesses || null,
          isSubmitted: true,
          submittedAt: new Date(),
        },
        include: { interviewer: true },
      });
    } else {
      scorecard = await prisma.interviewScorecard.create({
        data: {
          orgId,
          interviewScheduleId,
          applicationId,
          interviewerId,
          overallRecommendation,
          overallFeedback: overallFeedback || '',
          competencyScores: competencyScores ? JSON.stringify(competencyScores) : null,
          culturalAddScore: culturalAddScore ? parseInt(culturalAddScore) : 4,
          strengths: strengths || null,
          weaknesses: weaknesses || null,
          isSubmitted: true,
          submittedAt: new Date(),
        },
        include: { interviewer: true },
      });
    }

    // Mark interview as COMPLETED if not already
    await prisma.interviewSchedule.update({
      where: { id: interviewScheduleId },
      data: { status: 'COMPLETED' },
    });

    await logAuditEvent({
      orgId,
      actorId: interviewerId,
      actorName: actorUser?.name || 'Interviewer',
      actorEmail: actorUser?.email || 'interviewer@system.local',
      action: 'SCORECARD_SUBMITTED',
      entityType: 'SCORECARD',
      entityId: scorecard.id,
      newState: { overallRecommendation, interviewerId },
    });

    return NextResponse.json({ scorecard, message: 'Scorecard submitted successfully' });
  } catch (error: any) {
    console.error('Scorecard POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
