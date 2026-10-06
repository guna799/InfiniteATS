import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCandidate } from '@/lib/auth';
import { missingProfileFields, profileSchema, toCandidateFields, toProfileView } from '@/lib/candidateProfile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { session, error } = await requireCandidate();
  if (error) return error;

  const account = await prisma.candidateAccount.findUnique({ where: { id: session.sub } });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const profile = toProfileView(account);
  return NextResponse.json({ profile, missingFields: missingProfileFields(profile) });
}

export async function PUT(request: Request) {
  const { session, error } = await requireCandidate();
  if (error) return error;

  const parsed = profileSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: `${issue.path.join('.')}: ${issue.message}` }, { status: 400 });
  }
  const p = parsed.data;

  const account = await prisma.candidateAccount.update({
    where: { id: session.sub },
    data: {
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      location: p.location,
      headline: p.headline,
      summary: p.summary,
      currentTitle: p.currentTitle,
      currentCompany: p.currentCompany,
      experienceYears: p.experienceYears ?? null,
      educationLevel: p.educationLevel,
      skills: JSON.stringify(p.skills),
      workHistory: JSON.stringify(p.workHistory),
      education: JSON.stringify(p.education),
      linkedinUrl: p.linkedinUrl,
      githubUrl: p.githubUrl,
      portfolioUrl: p.portfolioUrl,
    },
  });

  // Keep recruiters' copies of this applicant current
  await prisma.candidate.updateMany({ where: { accountId: account.id }, data: toCandidateFields(account) });

  const profile = toProfileView(account);
  return NextResponse.json({ profile, missingFields: missingProfileFields(profile) });
}
