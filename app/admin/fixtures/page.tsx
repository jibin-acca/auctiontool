'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, CalendarPlus, Loader2, Trash2, Eye, X, Download } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/arena/empty-state';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv-utils';
import type { Fixture, TeamOwner } from '@/lib/types';

const statusStyles: Record<string, string> = {
  Completed: 'bg-success/20 text-success',
  Live: 'bg-destructive/20 text-destructive',
  Scheduled: 'bg-primary/20 text-primary',
  'Pending Result': 'bg-warning/20 text-warning',
  Upcoming: 'bg-muted/40 text-muted-foreground',
};

export default function AdminFixturesPage() {
  const { tournament, loading } = useTournament();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [owners, setOwners] = useState<Record<string, TeamOwner>>({});
  const [generating, setGenerating] = useState(false);
  const [filterRound, setFilterRound] = useState<string>('all');
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const fetchFixtures = useCallback(async (tid: string) => {
    const { data: fx } = await supabase.from('fixtures').select('*').eq('tournament_id', tid).order('created_at');
    const { data: ow } = await supabase.from('team_owners').select('*').eq('tournament_id', tid);
    const map: Record<string, TeamOwner> = {};
    (ow ?? []).forEach((o) => { map[o.id] = o; });
    setOwners(map);
    setFixtures((fx ?? []) as Fixture[]);
  }, []);

  useEffect(() => {
    if (!tournament) return;
    fetchFixtures(tournament.id);
  }, [tournament, fetchFixtures]);

  const [genError, setGenError] = useState('');

  const handleGenerate = async () => {
    if (!tournament) return;
    setGenerating(true);
    setGenError('');

    const { error: delError } = await supabase.from('fixtures').delete().eq('tournament_id', tournament.id);
    if (delError) { setGenError(delError.message); setGenerating(false); return; }

    const ownerList = Object.values(owners);
    if (ownerList.length < 2) {
      setGenError('At least 2 team owners are required to generate fixtures.');
      setGenerating(false);
      return;
    }

    const teams = ownerList.map((o) => o.id);
    const newFixtures: Array<{ tournament_id: string; round: string; home_id: string; away_id: string; status: string; is_published: boolean }> = [];
    const n = teams.length;
    const rounds = n % 2 === 0 ? n - 1 : n;
    const teamsCopy = [...teams];
    if (n % 2 !== 0) teamsCopy.push('');

    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < teamsCopy.length / 2; i++) {
        const home = teamsCopy[i];
        const away = teamsCopy[teamsCopy.length - 1 - i];
        if (home && away) {
          newFixtures.push({
            tournament_id: tournament.id,
            round: `Round ${round + 1}`,
            home_id: home,
            away_id: away,
            status: 'Upcoming',
            is_published: false,
          });
        }
      }
      const fixed = teamsCopy[0];
      const rest = teamsCopy.slice(1);
      rest.unshift(rest.pop()!);
      teamsCopy.splice(0, teamsCopy.length, fixed, ...rest);
    }

    if (newFixtures.length > 0) {
      const { error: insertError } = await supabase.from('fixtures').insert(newFixtures);
      if (insertError) { setGenError(insertError.message); setGenerating(false); return; }
      await fetchFixtures(tournament.id);
    }

    setGenerating(false);
    setShowRegenConfirm(false);
  };

  const handlePublishAll = async () => {
    if (!tournament) return;
    const { error } = await supabase.from('fixtures').update({ is_published: true }).eq('tournament_id', tournament.id);
    if (error) { setGenError(error.message); return; }
    fetchFixtures(tournament.id);
  };

  const handleDeleteFixture = async (id: string) => {
    const { error } = await supabase.from('fixtures').delete().eq('id', id);
    if (error) { setGenError(error.message); return; }
    if (tournament) fetchFixtures(tournament.id);
  };

  const handleExport = () => {
    const rows = fixtures.map((f) => {
      const home = f.home_id ? owners[f.home_id] : null;
      const away = f.away_id ? owners[f.away_id] : null;
      return [f.round, home?.team_name ?? home?.name ?? 'TBD', away?.team_name ?? away?.name ?? 'TBD', f.status, f.scheduled_date ?? '', f.scheduled_time ?? ''];
    });
    downloadCSV(`fixtures-${tournament!.season}.csv`, ['Round', 'Home', 'Away', 'Status', 'Date', 'Time'], rows);
  };

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><CalendarDays className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Fixtures' }];

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Fixtures" breadcrumbs={breadcrumbs} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={CalendarDays} title="No Fixtures Generated" description="No tournament has been created yet." />
        </div>
      </AdminShell>
    );
  }

  if (fixtures.length === 0) {
    const ownerList = Object.values(owners);
    return (
      <AdminShell>
        <PageHeader title="Fixtures" subtitle={`${tournament.name} · ${tournament.season}`} breadcrumbs={breadcrumbs} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState
            icon={CalendarDays}
            title="No Fixtures Generated"
            description={ownerList.length < 2 ? 'At least 2 team owners are required to generate fixtures.' : 'Generate round-robin fixtures from the joined team owners.'}
            action={
              <Button size="sm" onClick={handleGenerate} disabled={generating || ownerList.length < 2}>
                {generating ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating...</> : <><CalendarPlus className="mr-1.5 h-4 w-4" /> Generate Fixtures</>}
              </Button>
            }
          />
        </div>
      </AdminShell>
    );
  }

  const allRounds = Array.from(new Set(fixtures.map((f) => f.round)));
  const filteredFixtures = filterRound === 'all' ? fixtures : fixtures.filter((f) => f.round === filterRound);
  const publishedCount = fixtures.filter((f) => f.is_published).length;

  return (
    <AdminShell>
      <PageHeader
        title="Fixtures"
        subtitle={`${fixtures.length} matches · ${allRounds.length} rounds · ${publishedCount} published`}
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" onClick={handlePublishAll}><Eye className="mr-1.5 h-4 w-4" /> Publish All</Button>
            <Button size="sm" onClick={() => setShowRegenConfirm(true)} disabled={generating}>
              {generating ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating...</> : <><CalendarPlus className="mr-1.5 h-4 w-4" /> Regenerate</>}
            </Button>
          </div>
        }
      />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterRound('all')} className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', filterRound === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:text-foreground')}>All Rounds</button>
          {allRounds.map((r) => (
            <button key={r} onClick={() => setFilterRound(r)} className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', filterRound === r ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:text-foreground')}>{r}</button>
          ))}
        </div>
        {allRounds.map((round) => {
          if (filterRound !== 'all' && filterRound !== round) return null;
          const roundFixtures = filteredFixtures.filter((f) => f.round === round);
          return (
            <div key={round}>
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{round}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roundFixtures.map((f) => {
                  const home = f.home_id ? owners[f.home_id] : null;
                  const away = f.away_id ? owners[f.away_id] : null;
                  return (
                    <Card key={f.id} className="glass-card group relative overflow-hidden p-0 transition-all hover:border-primary/30">
                      <div className="flex items-center justify-between border-b border-border/50 bg-card/30 px-4 py-2">
                        <span className="text-xs text-muted-foreground">{f.round}</span>
                        <div className="flex items-center gap-1">
                          {f.is_published && <Badge className="border-0 bg-success/20 text-success text-[10px]">Published</Badge>}
                          <Badge className={cn('border-0', statusStyles[f.status] ?? 'bg-muted/40 text-muted-foreground')}>{f.status}</Badge>
                          <button onClick={() => handleDeleteFixture(f.id)} className="rounded-md p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100" title="Delete"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-4">
                        <div className="flex flex-1 flex-col items-center gap-2 text-center">
                          {home ? <TeamBadge initials={getInitials(home.team_name ?? home.name)} color={home.team_color} name={home.team_name ?? home.name} size="md" /> : <div className="h-11 w-11 rounded-xl bg-muted/40" />}
                          <span className="text-sm font-medium">{home?.team_name ?? 'TBD'}</span>
                        </div>
                        <span className="font-display text-lg font-bold text-muted-foreground">VS</span>
                        <div className="flex flex-1 flex-col items-center gap-2 text-center">
                          {away ? <TeamBadge initials={getInitials(away.team_name ?? away.name)} color={away.team_color} name={away.team_name ?? away.name} size="md" /> : <div className="h-11 w-11 rounded-xl bg-muted/40" />}
                          <span className="text-sm font-medium">{away?.team_name ?? 'TBD'}</span>
                        </div>
                      </div>
                      <div className="border-t border-border/50 bg-card/20 px-4 py-2 text-center text-xs text-muted-foreground">
                        {f.scheduled_date ? `${f.scheduled_date}${f.scheduled_time ? ' · ' + f.scheduled_time : ''}` : 'Not scheduled'}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {showRegenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setShowRegenConfirm(false)}>
          <div className="glass-card relative w-full max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowRegenConfirm(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning"><CalendarPlus className="h-6 w-6" /></div>
            <h2 className="mb-1 font-display text-lg font-bold">Regenerate Fixtures?</h2>
            <p className="text-sm text-muted-foreground">This will delete all existing fixtures and create new ones. Any scheduled dates or results will be lost.</p>
            {genError && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{genError}</div>}
            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRegenConfirm(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleGenerate} disabled={generating}>
                {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><CalendarPlus className="mr-2 h-4 w-4" /> Regenerate</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
