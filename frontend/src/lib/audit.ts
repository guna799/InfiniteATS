import prisma from './prisma';

interface LogAuditParams {
  orgId: string;
  actorId?: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent({
  orgId,
  actorId,
  actorName,
  actorEmail,
  action,
  entityType,
  entityId,
  previousState,
  newState,
  ipAddress = '127.0.0.1',
  userAgent = 'InfiniteCareers Engine/1.0',
}: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        actorName,
        actorEmail,
        action,
        entityType,
        entityId,
        previousState: previousState ? JSON.stringify(previousState) : null,
        newState: newState ? JSON.stringify(newState) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
}
