import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

// Reachable without signing in
const PUBLIC_PAGES = ['/login', '/register', '/careers', '/jobs', '/portal'];
const PUBLIC_APIS = ['/api/auth/', '/api/public/', '/api/candidate/jobs'];

// The only areas a signed-in applicant may use
const CANDIDATE_PAGES = ['/careers', '/jobs', '/profile', '/my-applications', '/portal'];
const CANDIDATE_APIS = ['/api/candidate/', '/api/auth/', '/api/public/'];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`));

function sanitizeRedirect(url: string | null, fallback: string): string {
  if (!url) return fallback;
  // Ensure same-site relative path starting with a single '/'
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
    return url;
  }
  return fallback;
}

function deny(request: NextRequest, status: 401 | 403, redirectTo: string) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status });
  }
  let location = redirectTo;
  if (status === 401 && request.nextUrl.pathname !== '/') {
    location += `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  }
  // nextUrl carries the server's own host in standalone mode; redirect to the host the browser used
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const proto = (request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '')).split(',')[0].trim();
  return NextResponse.redirect(new URL(location, `${proto}://${host}`));
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const home = session?.kind === 'candidate' ? '/jobs' : '/';

  // 1. Auth pages (/login, /register): if already logged in, redirect to home or safe next param
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      const nextParam = searchParams.get('next') || searchParams.get('returnTo');
      const target = sanitizeRedirect(nextParam, home);
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 2. Public pages (/careers, /jobs, /portal) & Public APIs
  if (matches(pathname, PUBLIC_PAGES)) {
    return NextResponse.next();
  }
  if (matches(pathname, PUBLIC_APIS)) {
    return NextResponse.next();
  }

  // 3. If unauthenticated and accessing protected routes
  if (!session) {
    return deny(request, 401, '/login');
  }

  // 4. If logged in as Candidate (applicant)
  if (session.kind === 'candidate') {
    if (matches(pathname, CANDIDATE_PAGES) || matches(pathname, CANDIDATE_APIS)) {
      return NextResponse.next();
    }
    return deny(request, 403, '/jobs');
  }

  // 5. Staff users
  if (pathname === '/profile' || pathname === '/my-applications') {
    return deny(request, 403, '/');
  }

  // Legacy SQLite APIs take the tenant as ?orgId= and treat a missing one as "all orgs";
  // pin it to the signed-in user's org, and refuse them entirely if the user has none.
  const legacyApi =
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/public/') &&
    !pathname.startsWith('/api/v1/');
  if (legacyApi && !session.orgId) {
    return deny(request, 403, '/');
  }
  if (legacyApi && session.orgId) {
    const requestedOrg = searchParams.get('orgId');
    if (requestedOrg && requestedOrg !== session.orgId) {
      return deny(request, 403, '/');
    }
    if (!requestedOrg) {
      const url = request.nextUrl.clone();
      url.searchParams.set('orgId', session.orgId);
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // /api/v1 and /ws belong to Spring (its own JWT auth); Next only proxies them in local development
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/v1/|ws/).*)'],
};
