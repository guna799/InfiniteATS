import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        applications: {
          include: {
            requisition: {
              include: {
                department: true,
                location: true,
                hiringManager: true,
                recruiter: true,
              },
            },
            interviews: {
              include: {
                scorecards: {
                  include: { interviewer: true },
                },
              },
              orderBy: { startTime: 'desc' },
            },
            scorecards: {
              include: { interviewer: true },
            },
            offers: {
              include: {
                approvalChains: {
                  include: { approver: true },
                },
              },
            },
            onboardingTasks: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        employee: {
          include: {
            department: true,
            location: true,
            manager: true,
            onboardingTasks: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ candidate });
  } catch (error: any) {
    console.error('Candidate detail GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Add note to candidate
  try {
    const body = await request.json();
    const { applicationId, authorId, authorName, content, isPrivate = false, tags } = body;

    if (!content || !authorName) {
      return NextResponse.json({ error: 'Content and author name are required' }, { status: 400 });
    }

    const note = await prisma.candidateNote.create({
      data: {
        candidateId: params.id,
        applicationId: applicationId || '',
        authorId: authorId || 'system',
        authorName,
        content,
        isPrivate: !!isPrivate,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    return NextResponse.json({ note, message: 'Note added successfully' });
  } catch (error: any) {
    console.error('Candidate note POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { actorUser, ...updateData } = body;

    const existing = await prisma.candidate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const updated = await prisma.candidate.update({
      where: { id: params.id },
      data: updateData,
    });

    await logAuditEvent({
      orgId: existing.orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'System User',
      actorEmail: actorUser?.email || 'user@system.local',
      action: 'CANDIDATE_PROFILE_UPDATED',
      entityType: 'CANDIDATE',
      entityId: params.id,
      previousState: existing,
      newState: updated,
    });

    return NextResponse.json({ candidate: updated, message: 'Candidate updated' });
  } catch (error: any) {
    console.error('Candidate PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
