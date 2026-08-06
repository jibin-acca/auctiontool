'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from './supabase';
import type { Tournament } from './types';

interface TournamentContextValue {
  tournament: Tournament | null;
  tournaments: Tournament[];
  loading: boolean;
  setTournament: (t: Tournament | null) => void;
  switchTournament: (id: string) => Promise<void>;
  refreshTournaments: () => Promise<Tournament[]>;
  createTournament: (data: Partial<Tournament>) => Promise<Tournament | null>;
  updateTournament: (id: string, data: Partial<Tournament>) => Promise<Tournament | null>;
  archiveTournament: (id: string) => Promise<boolean>;
  deleteTournament: (id: string) => Promise<boolean>;
  duplicateTournament: (id: string) => Promise<Tournament | null>;
  setTournamentPhase: (id: string, phase: string) => Promise<boolean>;
}

const TournamentContext = createContext<TournamentContextValue>({
  tournament: null,
  tournaments: [],
  loading: true,
  setTournament: () => {},
  switchTournament: async () => {},
  refreshTournaments: async () => [],
  createTournament: async () => null,
  updateTournament: async () => null,
  archiveTournament: async () => false,
  deleteTournament: async () => false,
  duplicateTournament: async () => null,
  setTournamentPhase: async () => false,
});

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTournaments = useCallback(async (): Promise<Tournament[]> => {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    const list = (data ?? []) as Tournament[];
    setTournaments(list);
    return list;
  }, []);

  useEffect(() => {
    (async () => {
      const list = await refreshTournaments();
      const active = list.find((t) => t.is_active) ?? list.find((t) => t.status !== 'Draft' && t.status !== 'Archived') ?? null;
      setTournament(active);
      setLoading(false);
    })();
  }, [refreshTournaments]);

  // Realtime subscription: sync tournament changes across all clients without refresh
  useEffect(() => {
    const channel = supabase
      .channel('tournaments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments' },
        () => { refreshTournaments(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshTournaments]);

  // Keep the active tournament object in sync with the latest tournaments array
  useEffect(() => {
    if (!tournament) return;
    const latest = tournaments.find((t) => t.id === tournament.id);
    if (latest && (latest.current_phase !== tournament.current_phase || latest.status !== tournament.status)) {
      setTournament(latest);
    }
  }, [tournaments, tournament]);

  const switchTournament = useCallback(async (id: string) => {
    const t = tournaments.find((t) => t.id === id);
    if (t) {
      setTournament(t);
    }
    // Update is_active flags in DB
    await supabase.from('tournaments').update({ is_active: false }).neq('id', id);
    await supabase.from('tournaments').update({ is_active: true }).eq('id', id);
  }, [tournaments]);

  const createTournament = useCallback(async (data: Partial<Tournament>): Promise<Tournament | null> => {
    // Set all others to inactive
    await supabase.from('tournaments').update({ is_active: false }).eq('is_active', true);

    const code = (data.name ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() + new Date().getFullYear();

    const { data: result, error } = await supabase
      .from('tournaments')
      .insert({
        name: data.name,
        short_name: data.short_name ?? null,
        season: data.season,
        description: data.description ?? null,
        logo_url: data.logo_url ?? null,
        banner_url: data.banner_url ?? null,
        organizer: data.organizer,
        status: data.status ?? 'Registration Open',
        current_phase: data.current_phase ?? 'Registration',
        tournament_code: code,
        start_date: data.start_date ?? null,
        end_date: data.end_date ?? null,
        registration_start: data.registration_start ?? null,
        registration_end: data.registration_end ?? null,
        nomination_start: data.nomination_start ?? null,
        nomination_end: data.nomination_end ?? null,
        auction_date: data.auction_date ?? null,
        league_start: data.league_start ?? null,
        league_end: data.league_end ?? null,
        knockout_start: data.knockout_start ?? null,
        knockout_end: data.knockout_end ?? null,
        theme_color: data.theme_color ?? '#3b82f6',
        tie_break_rule: data.tie_break_rule ?? 'Head-to-head, then goal difference, then goals scored',
        is_active: true,
        manager_count: data.manager_count ?? 8,
        squad_size: data.squad_size ?? 17,
        retained_players: data.retained_players ?? 1,
        auction_players: data.auction_players ?? 16,
        budget: data.budget ?? 100,
        currency: data.currency ?? 'Cr',
        base_price: data.base_price ?? 1,
        auction_timer: data.auction_timer ?? 20,
        match_format: data.match_format ?? 'Single Match',
        tournament_format: data.tournament_format ?? 'League + Knockout',
        qualification_rule: data.qualification_rule ?? 'Top 4',
        points_win: data.points_win ?? 3,
        points_draw: data.points_draw ?? 1,
        points_loss: data.points_loss ?? 0,
      })
      .select()
      .single();

    if (error || !result) return null;

    const newTournament = result as Tournament;
    await refreshTournaments();
    setTournament(newTournament);
    return newTournament;
  }, [refreshTournaments]);

  const updateTournament = useCallback(async (id: string, data: Partial<Tournament>): Promise<Tournament | null> => {
    const { data: result, error } = await supabase
      .from('tournaments')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !result) return null;

    const updated = result as Tournament;
    await refreshTournaments();
    setTournament((prev) => (prev?.id === id ? updated : prev));
    return updated;
  }, [refreshTournaments]);

  const archiveTournament = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tournaments')
      .update({ status: 'Archived', is_active: false })
      .eq('id', id);

    if (error) return false;

    await refreshTournaments();
    setTournament((prev) => (prev?.id === id ? null : prev));
    return true;
  }, [refreshTournaments]);

  const deleteTournament = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) return false;

    await refreshTournaments();
    setTournament((prev) => (prev?.id === id ? null : prev));
    return true;
  }, [refreshTournaments]);

  const duplicateTournament = useCallback(async (id: string): Promise<Tournament | null> => {
    const source = tournaments.find((t) => t.id === id);
    if (!source) return null;

    const code = (source.name ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() + (new Date().getFullYear() + 1);

    const { data: result, error } = await supabase
      .from('tournaments')
      .insert({
        name: `${source.name} (Copy)`,
        short_name: source.short_name,
        season: `${source.season} (Copy)`,
        description: source.description,
        logo_url: source.logo_url,
        banner_url: source.banner_url,
        organizer: source.organizer,
        status: 'Draft',
        current_phase: 'Draft',
        tournament_code: code,
        manager_count: source.manager_count,
        squad_size: source.squad_size,
        retained_players: source.retained_players,
        auction_players: source.auction_players,
        budget: source.budget,
        currency: source.currency,
        base_price: source.base_price,
        auction_timer: source.auction_timer,
        match_format: source.match_format,
        tournament_format: source.tournament_format,
        qualification_rule: source.qualification_rule,
        points_win: source.points_win,
        points_draw: source.points_draw,
        points_loss: source.points_loss,
        theme_color: source.theme_color,
        tie_break_rule: source.tie_break_rule,
        is_active: false,
      })
      .select()
      .single();

    if (error || !result) return null;
    await refreshTournaments();
    return result as Tournament;
  }, [tournaments, refreshTournaments]);

  const setTournamentPhase = useCallback(async (id: string, phase: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('set_tournament_phase', {
      p_tournament_id: id,
      p_new_phase: phase,
    });
    if (error || !data || data.error) return false;
    const list = await refreshTournaments();
    setTournament((prev) => {
      if (!prev || prev.id !== id) return prev;
      return list.find((t) => t.id === id) ?? prev;
    });
    return true;
  }, [refreshTournaments]);

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        tournaments,
        loading,
        setTournament,
        switchTournament,
        refreshTournaments,
        createTournament,
        updateTournament,
        archiveTournament,
        deleteTournament,
        duplicateTournament,
        setTournamentPhase,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournamentContext() {
  return useContext(TournamentContext);
}
