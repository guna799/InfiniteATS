import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');

    const where: any = {};
    if (orgId) where.orgId = orgId;
    if (entityType && entityType !== 'ALL') where.entityType = entityType;
    if (action && action !== 'ALL') where.action = action;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
