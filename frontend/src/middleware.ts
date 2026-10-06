import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

// Reachable without signing in
const PUBLIC_PAGES = ['/login', '/register'];
const PUBLIC_APIS = ['/api/auth/login', '/api/auth/register', '/api/auth/logout'];

// The only areas a signed-in applicant may use
const CANDIDATE_PAGES = ['/jobs', '/profile', '/my-applications'];
const CANDIDATE_APIS = ['/api/candidate/', '/api/auth/'];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`));

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

  if (matches(pathname, PUBLIC_PAGES)) {
    return session ? deny(request, 403, home) : NextResponse.next();
  }
  if (matches(pathname, PUBLIC_APIS)) {
    return NextResponse.next();
  }
  if (!session) {
    return deny(request, 401, '/login');
  }

  if (session.kind === 'candidate') {
    if (matches(pathname, CANDIDATE_PAGES) || matches(pathname, CANDIDATE_APIS)) {
      return NextResponse.next();
    }
    return deny(request, 403, '/jobs');
  }

  // Staff
  if (matches(pathname, CANDIDATE_PAGES) || pathname.startsWith('/api/candidate/')) {
    return deny(request, 403, '/');
  }
  // Staff APIs take the tenant as ?orgId= and treat a missing one as "all orgs";
  // pin it to the signed-in user's org.
  if (pathname.startsWith('/api/') && session.orgId) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
