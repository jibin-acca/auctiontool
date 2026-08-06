'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Download, Lock, Loader2 } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { cn } from '@/lib/utils';
import type { TeamOwner, MatchResult } from '@/lib/types';

export default function AdminStandingsPage() {
  const { tournament, loading, setTournamentPhase } = useTournament();
  const [standings, setStandings] = useState<Array<TeamOwner & { played: number; wins: number; draws: number; losses: number; gf: number; ga: number; gd: number; points: number }>>([]);

  useEffect(() => {
    if (!tournament) return;
    (async () => {
      const { data: owners } = await supabase.from('team_owners').select('*').eq('tournament_id', tournament.id);
      if (!owners || owners.length === 0) { setStandings([]); return; }

      const { data: fixtures } = await supabase
        .from('fixtures')
        .select('*, match_results!inner(*)')
        .eq('tournament_id', tournament.id)
        .eq('status', 'Completed');

      const rows = owners.map((o) => {
        let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
        (fixtures ?? []).forEach((f: any) => {
          const result = f.match_results?.find((r: MatchResult) => r.verification_status === 'Verified');
          if (!result || result.home_score == null) return;
          const isHome = f.home_id === o.id;
          const isAway = f.away_id === o.id;
          if (!isHome && !isAway) return;
          played++;
          const myScore = isHome ? result.home_score : result.away_score;
          const oppScore = isHome ? result.away_score : result.home_score;
          gf += myScore; ga += oppScore;
          if (myScore > oppScore) wins++;
          else if (myScore < oppScore) losses++;
          else draws++;
        });
        const points = wins * (tournament?.points_win ?? 3) + draws * (tournament?.points_draw ?? 1);
        return { ...o, played, wins, draws, losses, gf, ga, gd: gf - ga, points };
      }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

      setStandings(rows);
    })();
  }, [tournament]);

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><BarChart3 className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Standings' }];

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="League Standings" breadcrumbs={breadcrumbs} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={BarChart3} title="No Standings Available" description="No tournament has been created yet." />
        </div>
      </AdminShell>
    );
  }

  if (standings.length === 0) {
    return (
      <AdminShell>
        <PageHeader title="League Standings" subtitle={`${tournament.name} · ${tournament.season}`} breadcrumbs={breadcrumbs} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={BarChart3} title="No Standings Available" description="No matches have been completed yet. Standings will appear after results are verified." />
        </div>
      </AdminShell>
    );
  }

  const qualRule = tournament.qualification_rule;

  const handleExport = () => {
    const headers = ['Rank', 'Team', 'Played', 'Won', 'Draw', 'Lost', 'GF', 'GA', 'GD', 'Points'];
    const rows = standings.map((t, i) => [i + 1, t.team_name ?? t.name, t.played, t.wins, t.draws, t.losses, t.gf, t.ga, t.gd, t.points]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c)}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `standings-${tournament.season}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
      <PageHeader
        title="League Standings"
        subtitle={`${standings.length} teams · ${qualRule} qualify for knockout`}
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button size="sm" onClick={async () => {
              if (tournament) await setTournamentPhase(tournament.id, 'Knockout Stage');
            }}><Lock className="mr-1.5 h-4 w-4" /> Publish</Button>
          </div>
        }
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[2.5rem_1fr_repeat(6,2.5rem)_3rem] gap-1 border-b border-border/60 bg-card/50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid-cols-[2.5rem_1fr_repeat(7,3rem)_3.5rem]">
                <span>Rank</span><span>Team</span><span className="text-center">P</span><span className="text-center">W</span><span className="text-center">D</span><span className="text-center">L</span><span className="text-center">GF</span><span className="text-center">GA</span><span className="hidden text-center sm:block">GD</span><span className="text-center">PTS</span>
              </div>
              {standings.map((t, i) => (
                <div key={t.id} className={cn('grid grid-cols-[2.5rem_1fr_repeat(6,2.5rem)_3rem] items-center gap-1 border-b border-border/30 px-4 py-3 text-sm transition-colors hover:bg-muted/30 sm:grid-cols-[2.5rem_1fr_repeat(7,3rem)_3.5rem]', i < 4 && 'bg-accent/5')}>
                  <span className={cn('font-display font-bold', i < 4 ? 'text-accent' : 'text-muted-foreground')}>{i + 1}</span>
                  <div className="flex items-center gap-2.5">
                    <TeamBadge initials={getInitials(t.team_name ?? t.name)} color={t.team_color} name={t.team_name ?? t.name} size="sm" />
                    <span className="truncate font-medium">{t.team_name ?? t.name}</span>
                  </div>
                  <span className="text-center tabular-nums">{t.played}</span><span className="text-center tabular-nums">{t.wins}</span><span className="text-center tabular-nums">{t.draws}</span><span className="text-center tabular-nums">{t.losses}</span><span className="text-center tabular-nums">{t.gf}</span><span className="text-center tabular-nums">{t.ga}</span><span className="hidden text-center tabular-nums sm:block">{t.gd > 0 ? `+${t.gd}` : t.gd}</span><span className="text-center font-display font-bold tabular-nums">{t.points}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
