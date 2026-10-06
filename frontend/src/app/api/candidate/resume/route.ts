import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCandidate } from '@/lib/auth';
import { deleteResume, putResume, resumeResponse, validateResume } from '@/lib/storage';
import { toCandidateFields } from '@/lib/candidateProfile';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { session, error } = await requireCandidate();
  if (error) return error;

  const form = await request.formData().catch(() => null);
  const file = form?.get('resume');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Attach a resume file in the "resume" field' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const invalid = validateResume(file.type, bytes);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const previous = await prisma.candidateAccount.findUnique({ where: { id: session.sub }, select: { resumeKey: true } });

  let key: string;
  try {
    key = await putResume(session.sub, file.type, bytes);
  } catch (err) {
    console.error('Resume upload failed', err);
    return NextResponse.json({ error: 'Resume upload failed. Please try again.' }, { status: 502 });
  }

  const fileName = file.name.replace(/[^\w.\- ()]/g, '_').slice(0, 200) || 'resume';
  const account = await prisma.candidateAccount.update({
    where: { id: session.sub },
    data: {
      resumeKey: key,
      resumeFileName: fileName,
      resumeContentType: file.type,
      resumeSize: bytes.length,
      resumeUploadedAt: new Date(),
    },
  });
  await prisma.candidate.updateMany({ where: { accountId: account.id }, data: toCandidateFields(account) });

  if (previous?.resumeKey && previous.resumeKey !== key) {
    await deleteResume(previous.resumeKey);
  }

  return NextResponse.json({
    resumeFileName: account.resumeFileName,
    resumeSize: account.resumeSize,
    resumeUploadedAt: account.resumeUploadedAt,
  });
}

export async function GET() {
  const { session, error } = await requireCandidate();
  if (error) return error;

  const account = await prisma.candidateAccount.findUnique({ where: { id: session.sub } });
  if (!account?.resumeKey) return NextResponse.json({ error: 'No resume uploaded' }, { status: 404 });

  return resumeResponse(account.resumeKey, account.resumeFileName || 'resume', account.resumeContentType || 'application/octet-stream');
}
