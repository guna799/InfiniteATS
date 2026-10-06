// Mirrors com.infinitecareers.common.events.DomainEvent
export interface DomainEvent<P = Record<string, any>> {
  eventId: string;
  eventType: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  correlationId: string | null;
  occurredAt: string;
  version: number;
  payload: P;
}
