import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    const org = await prisma.organization.findFirst({
      where: orgId ? { id: orgId } : {},
      include: {
        departments: true,
        businessUnits: true,
        locations: true,
        users: true,
        customFields: true,
        webhooks: true,
      },
    });

    return NextResponse.json({ organization: org });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orgId, name, primaryColor, currency, timezone, settings, actorUser } = body;

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name,
        primaryColor,
        currency,
        timezone,
        settings: typeof settings === 'object' ? JSON.stringify(settings) : settings,
      },
    });

    await logAuditEvent({
      orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'Admin',
      actorEmail: actorUser?.email || 'admin@domain.com',
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      entityType: 'ORGANIZATION',
      entityId: orgId,
      newState: { name, primaryColor, currency },
    });

    return NextResponse.json({ organization: org, message: 'Settings saved' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
