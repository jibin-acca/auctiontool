'use client';

import { supabase } from './supabase';
import type { Tournament } from './types';

export async function createNotification(params: {
  tournamentId?: string | null;
  recipientRole?: 'admin' | 'owner';
  recipientId?: string | null;
  title: string;
  body?: string | null;
  category?: 'info' | 'success' | 'warning' | 'error';
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    tournament_id: params.tournamentId ?? null,
    recipient_role: params.recipientRole ?? 'admin',
    recipient_id: params.recipientId ?? null,
    title: params.title,
    body: params.body ?? null,
    category: params.category ?? 'info',
  });
  if (error) console.error('Failed to create notification:', error.message);
}

export async function notifyTournamentEvent(tournament: Tournament | null, title: string, body?: string, category?: 'info' | 'success' | 'warning' | 'error'): Promise<void> {
  await createNotification({
    tournamentId: tournament?.id,
    recipientRole: 'admin',
    title,
    body,
    category,
  });
}
