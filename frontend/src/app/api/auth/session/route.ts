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

    const org = await prisma.organization.findUnique({
      where: { id: session.orgId },
      include: {
        departments: true,
        businessUnits: true,
        locations: true,
      },
    });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const allUsers = await prisma.user.findMany({
      where: { orgId: org.id },
      include: { department: true },
    });
    const currentUser = allUsers.find((u) => u.id === session.sub);
    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      kind: 'staff',
      organization: org,
      organizations: [{ id: org.id, name: org.name, slug: org.slug, logoUrl: org.logoUrl, subscriptionTier: org.subscriptionTier }],
      currentUser,
      users: allUsers,
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
