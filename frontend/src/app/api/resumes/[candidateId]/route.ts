import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { resumeResponse } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Recruiter download of a self-registered applicant's resume
export async function GET(_request: Request, { params }: { params: { candidateId: string } }) {
  const { session, error } = await requireStaff();
  if (error) return error;

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.candidateId },
    select: { orgId: true, account: { select: { resumeKey: true, resumeFileName: true, resumeContentType: true } } },
  });
  if (!candidate || candidate.orgId !== session.orgId || !candidate.account?.resumeKey) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  }

  const { resumeKey, resumeFileName, resumeContentType } = candidate.account;
  return resumeResponse(resumeKey, resumeFileName || 'resume', resumeContentType || 'application/octet-stream');
}
