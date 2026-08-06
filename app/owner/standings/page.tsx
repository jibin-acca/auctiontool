'use client';

import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTournament } from '@/lib/use-tournament';
import type { Tournament, TeamOwner, Fixture } from '@/lib/types';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { cn } from '@/lib/utils';

export default function OwnerStandingsPage() {
  const { tournament, loading } = useTournament();
  const [standings, setStandings] = useState<Array<TeamOwner & { played: number; wins: number; draws: number; losses: number; gd: number; points: number }>>([]);

  useEffect(() => {
    if (!tournament) { setStandings([]); return; }
    (async () => {
      const t = tournament as Tournament;
      const { data: owners } = await supabase.from('team_owners').select('*').eq('tournament_id', t.id);
      if (!owners || owners.length === 0) { setStandings([]); return; }
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
        return { ...o, played, wins, draws, losses, gd: gf - ga, points };
      }).sort((a, b) => b.points - a.points || b.gd - a.gd);
      setStandings(rows);
    })();
  }, [tournament]);

  if (loading) return <div className="flex justify-center py-20"><BarChart3 className="h-6 w-6 animate-pulse text-primary" /></div>;

  if (!tournament) return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">Standings</h1><EmptyState icon={BarChart3} title="No Standings Available" description="No tournament has been created yet." /></div>;

  if (standings.length === 0) return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">Standings</h1><EmptyState icon={BarChart3} title="No Standings Available" description="Standings will appear after matches are completed and results are verified." /></div>;

  return (
    <div className="space-y-4 px-4 py-4">
      <h1 className="font-display text-xl font-bold">Standings</h1>
      <Card className="glass-card overflow-hidden p-0">
        <div className="grid grid-cols-[2rem_1fr_repeat(4,2rem)_2.5rem] gap-1 border-b border-border/60 bg-card/50 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>#</span><span>Team</span><span className="text-center">P</span><span className="text-center">W</span><span className="text-center">L</span><span className="text-center">GD</span><span className="text-center">PTS</span>
        </div>
        {standings.map((t, i) => (
          <div key={t.id} className="grid grid-cols-[2rem_1fr_repeat(4,2rem)_2.5rem] items-center gap-1 border-b border-border/30 px-3 py-2.5 text-sm">
            <span className={cn('font-bold', i < 4 ? 'text-accent' : 'text-muted-foreground')}>{i + 1}</span>
            <div className="flex items-center gap-2"><TeamBadge initials={getInitials(t.team_name ?? t.name)} color={t.team_color} name={t.team_name ?? t.name} size="sm" className="h-7 w-7 text-[9px]" /><span className="truncate text-xs font-medium">{t.team_name ?? t.name}</span></div>
            <span className="text-center text-xs tabular-nums">{t.played}</span><span className="text-center text-xs tabular-nums">{t.wins}</span><span className="text-center text-xs tabular-nums">{t.losses}</span><span className="text-center text-xs tabular-nums">{t.gd > 0 ? `+${t.gd}` : t.gd}</span><span className="text-center font-bold tabular-nums">{t.points}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
