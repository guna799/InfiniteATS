import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.kind === 'candidate') {
      return NextResponse.json({
        kind: 'candidate',
        currentUser: { id: session.sub, email: session.email, name: session.name, role: 'CANDIDATE' },
      });
    }

    const realtime = { tenantId: session.tenantId ?? null, backendUserId: session.backendUserId ?? null };
    // Staff signed in through Spring may not exist in the legacy SQLite data yet
    const sessionUser = { id: session.sub, orgId: session.orgId, email: session.email, name: session.name, role: session.role };

    const org = session.orgId
      ? await prisma.organization.findUnique({
          where: { id: session.orgId },
          include: { departments: true, businessUnits: true, locations: true },
        })
      : null;
    if (!org) {
      return NextResponse.json({ kind: 'staff', ...realtime, organization: null, organizations: [], currentUser: sessionUser, users: [] });
    }

    const allUsers = await prisma.user.findMany({
      where: { orgId: org.id },
      include: { department: true },
    });
    const legacyUser = allUsers.find((u) => u.id === session.sub);
    if (legacyUser && !legacyUser.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      kind: 'staff',
      ...realtime,
      organization: org,
      organizations: [{ id: org.id, name: org.name, slug: org.slug, logoUrl: org.logoUrl, subscriptionTier: org.subscriptionTier }],
      // Spring is the source of truth for role
      currentUser: legacyUser ? { ...legacyUser, role: session.role ?? legacyUser.role } : sessionUser,
      users: allUsers,
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
