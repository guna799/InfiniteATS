'use client';

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Client } from '@stomp/stompjs';
import { useTenant } from '@/context/TenantContext';
import type { DomainEvent } from '@/lib/events';

export type RealtimeStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';
type Listener = (event: DomainEvent) => void;

interface RealtimeContextValue {
  status: RealtimeStatus;
  /** Subscribe to tenant events; returns an unsubscribe function. */
  subscribe: (listener: Listener) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({ status: 'offline', subscribe: () => () => {} });

/**
 * One STOMP-over-SockJS connection per tab to the tenant's event topic. Authentication rides on the
 * HttpOnly ic_access cookie sent with the SockJS handshake; the backend rejects other tenants' topics.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { tenantId, sessionKind } = useTenant();
  const [status, setStatus] = useState<RealtimeStatus>('offline');
  const listeners = useRef(new Set<Listener>());

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (sessionKind !== 'staff' || !tenantId) return;
    let client: Client | null = null;
    let cancelled = false;
    setStatus('connecting');

    (async () => {
      // Browser-only modules
      const [{ Client }, { default: SockJS }] = await Promise.all([import('@stomp/stompjs'), import('sockjs-client')]);
      if (cancelled) return;
      client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        reconnectDelay: 3000,
        heartbeatIncoming: 20000,
        heartbeatOutgoing: 20000,
        onConnect: () => {
          setStatus('live');
          client?.subscribe(`/topic/tenants/${tenantId}/events`, (frame) => {
            try {
              const event = JSON.parse(frame.body) as DomainEvent;
              listeners.current.forEach((l) => l(event));
            } catch {
              // ignore malformed frames
            }
          });
        },
        onWebSocketClose: () => {
          if (!cancelled) setStatus('reconnecting');
        },
        onStompError: () => setStatus('reconnecting'),
      });
      client.activate();
    })();

    return () => {
      cancelled = true;
      setStatus('offline');
      client?.deactivate();
    };
  }, [tenantId, sessionKind]);

  return <RealtimeContext.Provider value={{ status, subscribe }}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

/** Runs the handler for each tenant event of the given types while the component is mounted. */
export function useRealtimeEvent(types: string[], handler: (event: DomainEvent) => void) {
  const { subscribe } = useRealtime();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const key = types.join(',');
  useEffect(
    () =>
      subscribe((event) => {
        if (key.split(',').includes(event.eventType)) handlerRef.current(event);
      }),
    [subscribe, key]
  );
}
