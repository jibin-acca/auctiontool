'use client';

import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { PublicNav } from '@/components/arena/public-nav';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { Tournament } from '@/lib/types';

export default function TournamentPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('tournaments').select('*').eq('is_active', true).maybeSingle();
      if (!data) {
        const { data: fallback } = await supabase.from('tournaments').select('*').neq('status', 'Draft').order('created_at', { ascending: false }).limit(1).maybeSingle();
        setTournament(fallback as Tournament | null);
      } else {
        setTournament(data as Tournament | null);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Layered stadium background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-stadium-pan" />
        <div className="absolute inset-0 bg-floodlight opacity-60" />
        <div className="absolute inset-0 bg-fog opacity-40" />
        <div className="absolute inset-0 bg-vignette" />
      </div>

      <PublicNav active="tournament" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-ball-spin" />
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </div>
        ) : tournament ? (
          <>
            <div className="mb-8">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{tournament.current_phase}</span>
                </span>
                <span className="text-xs uppercase tracking-widest text-accent/70">{tournament.season}</span>
              </div>
              <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide text-glow-blue sm:text-5xl">
                {tournament.name}
              </h1>
              {tournament.description && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{tournament.description}</p>}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="glass-card p-5 lg:col-span-2">
                <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide">Tournament Details</h2>
                <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {[
                    ['Short Name', tournament.short_name ?? '—'],
                    ['Season', tournament.season],
                    ['Organizer', tournament.organizer],
                    ['Tournament Type', tournament.tournament_format],
                    ['Match Format', tournament.match_format],
                    ['Number of Teams', `${tournament.manager_count}`],
                    ['Squad Size', `${tournament.squad_size} players`],
                    ['Retained Players', `${tournament.retained_players}`],
                    ['Auction Players', `${tournament.auction_players}`],
                    ['Budget', `${tournament.budget} ${tournament.currency}`],
                    ['Base Price', `${tournament.base_price} ${tournament.currency}`],
                    ['Auction Timer', `${tournament.auction_timer}s`],
                    ['Qualification', tournament.qualification_rule],
                    ['Points (W/D/L)', `${tournament.points_win}/${tournament.points_draw}/${tournament.points_loss}`],
                    ['Tie-Break Rule', tournament.tie_break_rule ?? '—'],
                    ['Status', tournament.status],
                    ['Current Phase', tournament.current_phase],
                    ['Registration Window', tournament.registration_start && tournament.registration_end ? `${tournament.registration_start} → ${tournament.registration_end}` : tournament.registration_start ?? '—'],
                    ['Nomination Window', tournament.nomination_start && tournament.nomination_end ? `${tournament.nomination_start} → ${tournament.nomination_end}` : tournament.nomination_start ?? '—'],
                    ['Auction Date', tournament.auction_date ?? '—'],
                    ['League Schedule', tournament.league_start && tournament.league_end ? `${tournament.league_start} → ${tournament.league_end}` : tournament.league_start ?? '—'],
                    ['Knockout Schedule', tournament.knockout_start && tournament.knockout_end ? `${tournament.knockout_start} → ${tournament.knockout_end}` : tournament.knockout_start ?? '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-primary/10 py-2 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="glass-card-gold relative overflow-hidden p-5">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
                <div className="relative">
                  <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide text-accent">Organizer</h2>
                  <p className="text-sm text-muted-foreground">{tournament.organizer}</p>
                  {tournament.tournament_code && (
                    <div className="mt-4 border-t border-accent/15 pt-3">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Tournament Code</div>
                      <code className="mt-1 block font-display text-lg font-bold text-accent text-glow-gold">{tournament.tournament_code}</code>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <EmptyState icon={Trophy} title="No Active Tournament" description="No tournament has been published yet. Check back soon." />
        )}
      </div>
    </div>
  );
}
