'use client';

import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { PublicNav } from '@/components/arena/public-nav';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TeamOwner, Fixture, Tournament } from '@/lib/types';

export default function PublicStandingsPage() {
  const [standings, setStandings] = useState<Array<TeamOwner & { played: number; wins: number; draws: number; losses: number; gf: number; ga: number; gd: number; points: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: tournament } = await supabase.from('tournaments').select('*').neq('status', 'Draft').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!tournament) { setLoading(false); return; }
      const t = tournament as Tournament;
      const { data: owners } = await supabase.from('team_owners').select('*').eq('tournament_id', t.id);
      if (!owners || owners.length === 0) { setLoading(false); return; }

      const { data: fixtures } = await supabase.from('fixtures').select('*, match_results!inner(*)').eq('tournament_id', t.id).eq('status', 'Completed').eq('is_published', true);

      const rows = owners.map((o) => {
        let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
        (fixtures ?? []).forEach((f: any) => {
          const result = f.match_results?.find((r: any) => r.verification_status === 'Verified');
          if (!result || result.home_score == null) return;
          const isHome = f.home_id === o.id; const isAway = f.away_id === o.id;
          if (!isHome && !isAway) return;
          played++;
          const my = isHome ? result.home_score : result.away_score;
          const opp = isHome ? result.away_score : result.home_score;
          gf += my; ga += opp;
          if (my > opp) wins++; else if (my < opp) losses++; else draws++;
        });
        const points = wins * t.points_win + draws * t.points_draw;
        return { ...o, played, wins, draws, losses, gf, ga, gd: gf - ga, points };
      }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

      setStandings(rows);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-stadium-pan" />
        <div className="absolute inset-0 bg-floodlight opacity-60" />
        <div className="absolute inset-0 bg-vignette" />
      </div>

      <PublicNav active="standings" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-glow-blue sm:text-4xl">League Standings</h1>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-ball-spin" />
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
        ) : standings.length === 0 ? (
          <div className="mt-6"><EmptyState icon={BarChart3} title="No Standings Available" description="Standings will appear here once matches are completed and results are verified." /></div>
        ) : (
          <Card className="glass-card mt-6 overflow-hidden p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[2.5rem_1fr_repeat(6,2.5rem)_3rem] gap-1 border-b border-primary/15 bg-card/50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid-cols-[2.5rem_1fr_repeat(7,3rem)_3.5rem]">
                  <span>#</span><span>Team</span><span className="text-center">P</span><span className="text-center">W</span><span className="text-center">D</span><span className="text-center">L</span><span className="text-center">GF</span><span className="text-center">GA</span><span className="hidden text-center sm:block">GD</span><span className="text-center">PTS</span>
                </div>
                {standings.map((t, i) => (
                  <div key={t.id} className={cn('grid grid-cols-[2.5rem_1fr_repeat(6,2.5rem)_3rem] items-center gap-1 border-b border-primary/10 px-4 py-3 text-sm transition-colors hover:bg-primary/5 sm:grid-cols-[2.5rem_1fr_repeat(7,3rem)_3.5rem] animate-row-slide-in', i < 4 && 'bg-accent/5')} style={{ animationDelay: `${i * 0.05}s` }}>
                    <span className={cn('font-display font-bold', i < 4 ? 'text-accent' : 'text-muted-foreground')}>{i + 1}</span>
                    <div className="flex items-center gap-2.5"><TeamBadge initials={getInitials(t.team_name ?? t.name)} color={t.team_color} name={t.team_name ?? t.name} size="sm" /><span className="truncate font-medium">{t.team_name ?? t.name}</span></div>
                    <span className="text-center tabular-nums">{t.played}</span><span className="text-center tabular-nums">{t.wins}</span><span className="text-center tabular-nums">{t.draws}</span><span className="text-center tabular-nums">{t.losses}</span><span className="text-center tabular-nums">{t.gf}</span><span className="text-center tabular-nums">{t.ga}</span><span className="hidden text-center tabular-nums sm:block">{t.gd > 0 ? `+${t.gd}` : t.gd}</span><span className="text-center font-display font-bold tabular-nums text-glow-gold">{t.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
