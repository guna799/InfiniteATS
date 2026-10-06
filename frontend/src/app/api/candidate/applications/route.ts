import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireCandidate } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { missingProfileFields, toCandidateFields, toProfileView } from '@/lib/candidateProfile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { session, error } = await requireCandidate();
  if (error) return error;

  const applications = await prisma.application.findMany({
    where: { candidate: { accountId: session.sub } },
    select: {
      id: true,
      status: true,
      appliedDate: true,
      updatedAt: true,
      requisition: {
        select: {
          id: true,
          title: true,
          reqNumber: true,
          organization: { select: { name: true } },
          location: { select: { city: true, country: true } },
        },
      },
    },
    orderBy: { appliedDate: 'desc' },
  });
  return NextResponse.json({ applications });
}

const applySchema = z.object({
  requisitionId: z.string().min(1),
  coverLetter: z.string().trim().max(5000).optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireCandidate();
  if (error) return error;

  const parsed = applySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'A job must be selected' }, { status: 400 });
  const { requisitionId, coverLetter } = parsed.data;

  const [account, job] = await Promise.all([
    prisma.candidateAccount.findUnique({ where: { id: session.sub } }),
    prisma.jobRequisition.findUnique({ where: { id: requisitionId } }),
  ]);
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  if (!job || job.status !== 'OPEN' || !job.isPublished) {
    return NextResponse.json({ error: 'This job is no longer accepting applications' }, { status: 404 });
  }

  const missing = missingProfileFields(toProfileView(account));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Complete your profile before applying. Missing: ${missing.join(', ')}`, missingFields: missing },
      { status: 422 }
    );
  }

  const candidateFields = toCandidateFields(account);
  const application = await prisma.$transaction(async (tx) => {
    // One Candidate per org per applicant; adopt a recruiter-created record with the same email if present
    let candidate =
      (await tx.candidate.findFirst({ where: { orgId: job.orgId, accountId: account.id } })) ||
      (await tx.candidate.findFirst({ where: { orgId: job.orgId, email: account.email, accountId: null } }));

    candidate = candidate
      ? await tx.candidate.update({ where: { id: candidate.id }, data: { ...candidateFields, accountId: account.id } })
      : await tx.candidate.create({
          data: { ...candidateFields, orgId: job.orgId, accountId: account.id, source: 'CAREER_SITE', tags: JSON.stringify(['Self-registered']) },
        });

    const existing = await tx.application.findFirst({ where: { requisitionId, candidateId: candidate.id } });
    if (existing) return null;

    return tx.application.create({
      data: {
        orgId: job.orgId,
        requisitionId,
        candidateId: candidate.id,
        status: 'APPLIED',
        stageOrder: 1,
        source: 'CAREER_SITE',
        customAnswers: coverLetter ? JSON.stringify({ coverLetter }) : null,
      },
    });
  });

  if (!application) {
    return NextResponse.json({ error: 'You have already applied to this job' }, { status: 409 });
  }

  await logAuditEvent({
    orgId: job.orgId,
    actorName: `${account.firstName} ${account.lastName}`,
    actorEmail: account.email,
    action: 'CANDIDATE_APPLIED',
    entityType: 'APPLICATION',
    entityId: application.id,
    newState: { requisition: job.title, source: 'CAREER_SITE' },
  });

  return NextResponse.json({ application: { id: application.id, status: application.status } }, { status: 201 });
}
