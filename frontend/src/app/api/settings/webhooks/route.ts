import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    const webhooks = await prisma.webhookEndpoint.findMany({
      where: orgId ? { orgId } : {},
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ webhooks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, name, url, events, actorUser } = body;

    if (!orgId || !name || !url || !events) {
      return NextResponse.json({ error: 'Name, URL, and Events are required' }, { status: 400 });
    }

    const secret = 'whsec_' + Math.random().toString(36).substring(2, 18);

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        orgId,
        name,
        url,
        events: JSON.stringify(events),
        secret,
        isActive: true,
      },
    });

    await logAuditEvent({
      orgId,
      actorId: actorUser?.id,
      actorName: actorUser?.name || 'Admin',
      actorEmail: actorUser?.email || 'admin@domain.com',
      action: 'WEBHOOK_ENDPOINT_CREATED',
      entityType: 'WEBHOOK',
      entityId: webhook.id,
      newState: { name, url },
    });

    return NextResponse.json({ webhook, message: 'Webhook endpoint registered' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
