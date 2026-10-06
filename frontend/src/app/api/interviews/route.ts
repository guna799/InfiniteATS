import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const applicationId = searchParams.get('applicationId');
    const interviewerId = searchParams.get('interviewerId');

    const where: any = {};
    if (orgId) where.orgId = orgId;
    if (applicationId) where.applicationId = applicationId;

    const interviews = await prisma.interviewSchedule.findMany({
      where,
      include: {
        application: {
          include: {
            candidate: true,
            requisition: true,
          },
        },
        scorecards: {
          include: { interviewer: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ interviews });
  } catch (error: any) {
    console.error('Interviews GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orgId,
      applicationId,
      requisitionId,
      title,
      interviewType,
      startTime,
      endTime,
      timezone = 'America/New_York',
      locationOrMeetingUrl,
      interviewers, // Array of user objects or IDs
      notes,
      actorUser,
    } = body;

    if (!orgId || !applicationId || !requisitionId || !title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required interview fields' }, { status: 400 });
    }

    const meetingUrl = locationOrMeetingUrl || `https://meet.infinitecareers.io/room/${Math.random().toString(36).substring(2, 9)}`;

    const interview = await prisma.interviewSchedule.create({
      data: {
        orgId,
        applicationId,
        requisitionId,
        title,
        interviewType: interviewType || 'TECHNICAL',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        timezone,
        locationOrMeetingUrl: meetingUrl,
        interviewers: JSON.stringify(interviewers || []),
        notes: notes || null,
        status: 'SCHEDULED',
      },
      include: {
        application: {
          include: { candidate: true, requisition: true },
        },
      },
    });

    await logAuditEvent({
      orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'Recruiter',
      actorEmail: actorUser?.email || 'recruiter@system.local',
      action: 'INTERVIEW_SCHEDULED',
      entityType: 'INTERVIEW',
      entityId: interview.id,
      newState: {
        candidate: `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
        title,
        startTime,
        meetingUrl,
      },
    });

    return NextResponse.json({ interview, message: 'Interview scheduled successfully' });
  } catch (error: any) {
    console.error('Interview POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
