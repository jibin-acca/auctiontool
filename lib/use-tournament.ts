'use client';

import { useTournamentContext } from './tournament-context';

export function useTournament() {
  const ctx = useTournamentContext();
  return {
    tournament: ctx.tournament,
    loading: ctx.loading,
    setTournament: ctx.setTournament,
    tournaments: ctx.tournaments,
    switchTournament: ctx.switchTournament,
    refreshTournaments: ctx.refreshTournaments,
    createTournament: ctx.createTournament,
    updateTournament: ctx.updateTournament,
    archiveTournament: ctx.archiveTournament,
    deleteTournament: ctx.deleteTournament,
    duplicateTournament: ctx.duplicateTournament,
    setTournamentPhase: ctx.setTournamentPhase,
  };
}
