'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, Trophy, Gavel, Users, DollarSign, BarChart3 } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { downloadCSV } from '@/lib/csv-utils';
import type { TeamOwner, Player, Fixture } from '@/lib/types';

export default function AdminReportsPage() {
  const { tournament, loading } = useTournament();
  const [generating, setGenerating] = useState<string | null>(null);

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><FileText className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Reports" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }]} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={FileText} title="No Reports Available" description="No tournament has been created yet." />
        </div>
      </AdminShell>
    );
  }

  const reports = [
    { id: 'tournament', label: 'Tournament Report', desc: 'Complete tournament overview with all configuration and stats', icon: Trophy },
    { id: 'auction', label: 'Auction Report', desc: 'All player sales, unsold players, and budget utilization', icon: Gavel },
    { id: 'team', label: 'Team Report', desc: 'Per-team squad breakdown with player details and spending', icon: Users },
    { id: 'financial', label: 'Financial Report', desc: 'Budget allocation, spending, and remaining balances', icon: DollarSign },
  ];

  const generateReport = async (reportId: string) => {
    setGenerating(reportId);
    const tid = tournament.id;

    if (reportId === 'tournament') {
      const { data: owners } = await supabase.from('team_owners').select('*').eq('tournament_id', tid);
      const { data: players } = await supabase.from('players').select('*').eq('tournament_id', tid);
      const { data: fixtures } = await supabase.from('fixtures').select('*').eq('tournament_id', tid);
      const completed = (fixtures ?? []).filter((f: Fixture) => f.status === 'Completed').length;
      const rows = [
        ['Tournament Name', tournament.name],
        ['Season', tournament.season],
        ['Organizer', tournament.organizer],
        ['Format', tournament.tournament_format],
        ['Status', tournament.status],
        ['Current Phase', tournament.current_phase],
        ['Team Count', String(tournament.manager_count)],
        ['Squad Size', String(tournament.squad_size)],
        ['Budget', `${tournament.budget} ${tournament.currency}`],
        ['Team Owners Joined', String(owners?.length ?? 0)],
        ['Total Players', String(players?.length ?? 0)],
        ['Total Fixtures', String(fixtures?.length ?? 0)],
        ['Completed Matches', String(completed)],
      ];
      downloadCSV(`tournament-report-${tournament.season}.csv`, ['Field', 'Value'], rows);
    }

    if (reportId === 'auction') {
      const { data: players } = await supabase.from('players').select('*, team_owners!sold_to(name, team_name)').eq('tournament_id', tid).order('auction_number');
      const rows = (players ?? []).map((p: any) => [
        p.auction_number ?? '',
        p.name,
        p.category ?? '',
        p.base_price,
        p.status === 'Sold' ? `Sold to ${p.team_owners?.team_name ?? p.team_owners?.name ?? 'Unknown'}` : p.status,
        p.sold_price ?? '',
      ]);
      downloadCSV(`auction-report-${tournament.season}.csv`, ['Auction #', 'Player', 'Category', 'Base Price', 'Status', 'Sold Price'], rows);
    }

    if (reportId === 'team') {
      const { data: owners } = await supabase.from('team_owners').select('*').eq('tournament_id', tid).order('name');
      const { data: players } = await supabase.from('players').select('*').eq('tournament_id', tid);
      const rows: (string|number)[][] = [];
      (owners ?? []).forEach((o: TeamOwner) => {
        const squad = (players ?? []).filter((p: Player) => p.sold_to === o.id || (p.is_retained && p.retained_by === o.id));
        const spent = squad.filter(p => !p.is_retained).reduce((s, p) => s + (p.sold_price ?? 0), 0);
        rows.push([o.team_name ?? o.name, o.name, o.phone, String(squad.length), String(spent), `${tournament.budget - spent} ${tournament.currency}`]);
        squad.forEach((p) => {
          rows.push(['', p.name, p.category ?? '', p.is_retained ? 'Retained' : 'Auction', String(p.sold_price ?? p.base_price), '']);
        });
        rows.push(['', '', '', '', '', '']);
      });
      downloadCSV(`team-report-${tournament.season}.csv`, ['Team', 'Manager', 'Phone', 'Squad Size', 'Spent', 'Remaining'], rows);
    }

    if (reportId === 'financial') {
      const { data: owners } = await supabase.from('team_owners').select('*').eq('tournament_id', tid).order('name');
      const { data: players } = await supabase.from('players').select('*').eq('tournament_id', tid);
      const rows = (owners ?? []).map((o: TeamOwner) => {
        const squad = (players ?? []).filter((p: Player) => p.sold_to === o.id);
        const spent = squad.reduce((s, p) => s + (p.sold_price ?? 0), 0);
        return [o.team_name ?? o.name, tournament.budget, spent, tournament.budget - spent, squad.length];
      });
      downloadCSV(`financial-report-${tournament.season}.csv`, ['Team', 'Budget', 'Spent', 'Remaining', 'Players Bought'], rows);
    }

    setGenerating(null);
  };

  return (
    <AdminShell>
      <PageHeader title="Reports" subtitle={`${tournament.name} · ${tournament.season}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }]} />
      <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <Card key={r.id} className="glass-card group p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold uppercase tracking-wide">{r.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => generateReport(r.id)} disabled={generating === r.id}>
                    {generating === r.id ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating...</> : <><Download className="mr-1.5 h-4 w-4" /> Generate CSV</>}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
