// Edge-safe session helpers (used by middleware and route handlers).
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'ic_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export type SessionKind = 'staff' | 'candidate';

export interface Session {
  sub: string; // User.id for staff, CandidateAccount.id for candidates
  kind: SessionKind;
  email: string;
  name: string;
  orgId?: string; // staff only
  role?: string; // staff only
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be set in production');
    }
    return new TextEncoder().encode('infinitecareers-local-dev-only-secret');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || (payload.kind !== 'staff' && payload.kind !== 'candidate')) return null;
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    // Set COOKIE_SECURE=true once the site is served over HTTPS
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
