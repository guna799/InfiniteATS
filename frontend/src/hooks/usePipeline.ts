'use client';

import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';
import { useRealtimeEvent } from '@/providers/RealtimeProvider';
import type { DomainEvent } from '@/lib/events';

// Mirrors com.infinitecareers.modules.applications.PipelineCard
export interface PipelineCard {
  applicationId: string;
  stage: string;
  version: number;
  rating: number | null;
  appliedDate: string | null;
  lastActivity: string | null;
  candidate: { id: string; name: string; headline: string | null };
  requisition: { id: string; reqNumber: string | null; title: string };
}

export interface StageView {
  id: string;
  label: string;
  terminal: boolean;
}

interface Board {
  cards: PipelineCard[];
  requisitions: PipelineCard['requisition'][];
}

export interface StageChangedPayload {
  applicationId: string;
  candidateName: string;
  fromStage: string;
  toStage: string;
  actorName: string;
  card: PipelineCard;
}

const ALL = 'ALL';
const boardKey = (requisitionId: string) => ['pipeline', 'board', requisitionId] as const;

export function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline', 'stages'],
    queryFn: () => apiFetch<StageView[]>('/api/v1/pipeline/stages'),
    staleTime: Infinity,
  });
}

export function usePipelineBoard(requisitionId: string) {
  return useQuery({
    queryKey: boardKey(requisitionId),
    queryFn: () =>
      apiFetch<Board>(
        requisitionId === ALL ? '/api/v1/pipeline/board' : `/api/v1/pipeline/board?requisitionId=${encodeURIComponent(requisitionId)}`
      ),
    // Live events keep the board current; refetch on focus only as a safety net after disconnects
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Writes a card into every cached board it belongs to. Older versions never overwrite newer ones, so a late
 * WebSocket event cannot undo a fresher HTTP response (or vice versa).
 */
function upsertCard(queryClient: QueryClient, card: PipelineCard) {
  queryClient.getQueriesData<Board>({ queryKey: ['pipeline', 'board'] }).forEach(([key, board]) => {
    if (!board) return;
    const filter = key[2] as string;
    const existing = board.cards.find((c) => c.applicationId === card.applicationId);
    if (existing) {
      if (existing.version > card.version) return;
      queryClient.setQueryData<Board>(key, {
        ...board,
        cards: board.cards.map((c) => (c.applicationId === card.applicationId ? card : c)),
      });
    } else if (filter === ALL || filter === card.requisition.id) {
      queryClient.setQueryData<Board>(key, { ...board, cards: [card, ...board.cards] });
    }
  });
}

interface MoveVariables {
  card: PipelineCard;
  stage: string;
  reason?: string;
}

export function useMoveStage(callbacks: {
  onConflict: (current: PipelineCard) => void;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ card, stage, reason }: MoveVariables) =>
      apiFetch<PipelineCard>(`/api/v1/applications/${card.applicationId}/move-stage`, {
        method: 'POST',
        body: JSON.stringify({ stage, reason, expectedVersion: card.version }),
      }),
    // Optimistic: move the card immediately, remember every board for rollback
    onMutate: async ({ card, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline', 'board'] });
      const snapshot = queryClient.getQueriesData<Board>({ queryKey: ['pipeline', 'board'] });
      snapshot.forEach(([key, board]) => {
        if (!board) return;
        queryClient.setQueryData<Board>(key, {
          ...board,
          cards: board.cards.map((c) => (c.applicationId === card.applicationId ? { ...c, stage } : c)),
        });
      });
      return { snapshot };
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, board]) => queryClient.setQueryData(key, board));
      if (error instanceof ApiError && error.code === 'STALE_STATE' && error.details?.current) {
        const current = error.details.current as PipelineCard;
        upsertCard(queryClient, current);
        callbacks.onConflict(current);
      } else {
        // The rollback may have discarded live updates that arrived meanwhile; resync from the server
        queryClient.invalidateQueries({ queryKey: ['pipeline', 'board'] });
        callbacks.onError(error instanceof Error ? error.message : 'Could not move candidate');
      }
    },
    onSuccess: (card) => upsertCard(queryClient, card),
  });
}

/** Applies stage changes made by anyone in the tenant to the cached boards as they happen. */
export function usePipelineLiveUpdates(onRemoteChange: (event: DomainEvent<StageChangedPayload>) => void) {
  const queryClient = useQueryClient();
  useRealtimeEvent(['CANDIDATE_STAGE_CHANGED'], (event) => {
    const e = event as DomainEvent<StageChangedPayload>;
    if (e.payload?.card) {
      upsertCard(queryClient, e.payload.card);
      onRemoteChange(e);
    }
  });
}
