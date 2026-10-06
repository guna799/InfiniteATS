import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions, Session } from '@/lib/session';
import { clientIp, isRateLimited } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Compared against when the email is unknown so response timing doesn't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

export async function POST(request: Request) {
  if (isRateLimited(`login:${clientIp(request)}`, 20)) {
    return NextResponse.json({ error: 'Too many sign-in attempts. Try again in a few minutes.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  let session: Session | null = null;

  const staff = await prisma.user.findFirst({ where: { email }, omit: { passwordHash: false } });
  if (staff?.passwordHash && staff.isActive && (await bcrypt.compare(password, staff.passwordHash))) {
    await prisma.user.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
    session = { sub: staff.id, kind: 'staff', email: staff.email, name: staff.name, orgId: staff.orgId, role: staff.role };
  } else {
    const account = await prisma.candidateAccount.findUnique({ where: { email }, omit: { passwordHash: false } });
    if (await bcrypt.compare(password, account?.passwordHash || DUMMY_HASH)) {
      if (account) {
        await prisma.candidateAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
        session = {
          sub: account.id,
          kind: 'candidate',
          email: account.email,
          name: `${account.firstName} ${account.lastName}`,
        };
      }
    }
  }

  if (!session) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const response = NextResponse.json({ kind: session.kind, redirectTo: session.kind === 'candidate' ? '/jobs' : '/' });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(session), sessionCookieOptions());
  return response;
}
