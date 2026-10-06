'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';

export interface RealtimeEvent {
  eventType: string;
  tenantId: string;
  payload: any;
  timestamp: string;
}

export function useRealtimeEvents() {
  const { organization, showToast } = useTenant();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!organization?.id) return;

    const tenantId = organization.id;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/events?tenantId=${encodeURIComponent(tenantId)}`;

    let reconnectTimer: NodeJS.Timeout;
    let isMounted = true;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log(`[RealTime] Connected to WebSocket event bus for tenant: ${tenantId}`);
        };

        ws.onmessage = (event) => {
          try {
            const data: RealtimeEvent = JSON.parse(event.data);
            handleRealtimeEvent(data);
          } catch (e) {
            console.warn('[RealTime] Unparseable event frame:', event.data);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            // Reconnect after backoff
            reconnectTimer = setTimeout(connect, 5000);
          }
        };

        ws.onerror = (err) => {
          // Fallback gracefully without breaking UI
          ws.close();
        };
      } catch (err) {
        // WebSocket not available in this env, fallback silently
      }
    };

    const handleRealtimeEvent = (event: RealtimeEvent) => {
      const { eventType, payload } = event;

      switch (eventType) {
        case 'CANDIDATE_STAGE_CHANGED':
        case 'CANDIDATE_MOVED':
          queryClient.invalidateQueries({ queryKey: ['candidates'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          showToast(
            'Candidate Pipeline Updated',
            payload?.candidateName ? `${payload.candidateName} moved to ${payload.toStage}` : 'Candidate status updated in real-time',
            'info'
          );
          break;

        case 'OFFER_APPROVED':
        case 'OFFER_ACCEPTED':
          queryClient.invalidateQueries({ queryKey: ['offers'] });
          queryClient.invalidateQueries({ queryKey: ['candidates'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          showToast(
            'Offer Update',
            payload?.candidateName ? `Offer for ${payload.candidateName} was updated` : 'Offer status updated',
            'success'
          );
          break;

        case 'REQUISITION_APPROVED':
        case 'REQUISITION_CREATED':
          queryClient.invalidateQueries({ queryKey: ['requisitions'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          showToast('Job Requisition Updated', payload?.title || 'Requisition status synchronized', 'info');
          break;

        case 'ONBOARDING_TASK_COMPLETED':
        case 'EMPLOYEE_ONBOARDED':
          queryClient.invalidateQueries({ queryKey: ['onboarding'] });
          queryClient.invalidateQueries({ queryKey: ['employees'] });
          showToast('Onboarding Progress', payload?.employeeName ? `${payload.employeeName} completed a task` : 'Onboarding milestone achieved', 'success');
          break;

        case 'WORKFLOW_STEP_EXECUTED':
          queryClient.invalidateQueries({ queryKey: ['workflows'] });
          break;

        default:
          queryClient.invalidateQueries();
          break;
      }
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [organization?.id, queryClient, showToast]);
}
