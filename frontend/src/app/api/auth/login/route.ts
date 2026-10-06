import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import {
  ACCESS_COOKIE,
  SESSION_COOKIE,
  Session,
  accessCookieOptions,
  createSessionToken,
  sessionCookieOptions,
} from '@/lib/session';
import { clientIp, isRateLimited } from '@/lib/auth';
import { backendFetch } from '@/lib/backend';

export const dynamic = 'force-dynamic';

// Compared against when the email is unknown so response timing doesn't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

// Most privileged first; the UI shows one role per user
const ROLE_PRIORITY = ['SUPER_ADMIN', 'RECRUITING_ADMIN', 'HR_OPS', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'EXECUTIVE', 'EMPLOYEE'];

interface SpringAuth {
  accessToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roles: string[];
}

/** Staff credentials live in Spring. Returns the session plus the Spring access token, or null if not staff. */
async function staffLogin(email: string, password: string): Promise<{ session: Session; accessToken: string } | 'unavailable' | null> {
  const auth = await backendFetch<SpringAuth>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (auth.status >= 500) return 'unavailable';
  if (!auth.ok || !auth.data) return null;
  const a = auth.data;

  // Bridge to the legacy SQLite organization (same slug) for pages not yet on the Spring API
  const tenant = await backendFetch<{ slug: string }>('/api/v1/tenants/current', { token: a.accessToken });
  const [org, legacyUser] = await Promise.all([
    tenant.data?.slug ? prisma.organization.findUnique({ where: { slug: tenant.data.slug } }) : null,
    prisma.user.findFirst({ where: { email: a.email } }),
  ]);

  return {
    accessToken: a.accessToken,
    session: {
      sub: legacyUser?.id ?? a.userId,
      kind: 'staff',
      email: a.email,
      name: `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim() || a.email,
      orgId: org?.id,
      role: ROLE_PRIORITY.find((r) => a.roles?.includes(r)) ?? a.roles?.[0] ?? 'EMPLOYEE',
      tenantId: a.tenantId,
      backendUserId: a.userId,
    },
  };
}

async function applicantLogin(email: string, password: string): Promise<Session | null> {
  const account = await prisma.candidateAccount.findUnique({ where: { email }, omit: { passwordHash: false } });
  if (!(await bcrypt.compare(password, account?.passwordHash || DUMMY_HASH)) || !account) return null;
  await prisma.candidateAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
  return { sub: account.id, kind: 'candidate', email: account.email, name: `${account.firstName} ${account.lastName}` };
}

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

  const staff = await staffLogin(email, password);
  if (staff && staff !== 'unavailable') {
    const response = NextResponse.json({ kind: 'staff', redirectTo: '/' });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(staff.session), sessionCookieOptions());
    response.cookies.set(ACCESS_COOKIE, staff.accessToken, accessCookieOptions());
    return response;
  }

  const applicant = await applicantLogin(email, password);
  if (applicant) {
    const response = NextResponse.json({ kind: 'candidate', redirectTo: '/jobs' });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(applicant), sessionCookieOptions());
    response.cookies.set(ACCESS_COOKIE, '', { ...accessCookieOptions(), maxAge: 0 });
    return response;
  }

  if (staff === 'unavailable') {
    return NextResponse.json({ error: 'Sign-in is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
  return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
}
