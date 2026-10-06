// Server-side auth helpers for route handlers (Node runtime).
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, Session, verifySessionToken } from './session';

export async function getSession(): Promise<Session | null> {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

type Guarded<T extends Session> = { session: T; error?: never } | { session?: never; error: NextResponse };

export async function requireCandidate(): Promise<Guarded<Session>> {
  const session = await getSession();
  if (!session || session.kind !== 'candidate') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session };
}

export async function requireStaff(): Promise<Guarded<Session & { orgId: string; role: string }>> {
  const session = await getSession();
  if (!session || session.kind !== 'staff' || !session.orgId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session: session as Session & { orgId: string; role: string } };
}

// Simple per-process fixed-window limiter for login/registration attempts.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit = 10, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}
