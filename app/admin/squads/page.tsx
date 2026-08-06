'use client';

import { useEffect, useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import type { TeamOwner, Player } from '@/lib/types';

export default function AdminSquadsPage() {
  const { tournament, loading, setTournamentPhase } = useTournament();
  const [owners, setOwners] = useState<TeamOwner[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (!tournament) return;
    (async () => {
      const { data: ow } = await supabase.from('team_owners').select('*').eq('tournament_id', tournament.id);
      const { data: pl } = await supabase.from('players').select('*').eq('tournament_id', tournament.id).eq('status', 'Sold');
      setOwners(ow ?? []);
      setPlayers((pl ?? []) as Player[]);
    })();
  }, [tournament]);

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><Shield className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Squads" />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={Shield} title="No Squads Available" description="No tournament has been created yet." />
        </div>
      </AdminShell>
    );
  }

  const auctionDone = tournament.current_phase === 'Squad Finalized' ||
    tournament.current_phase === 'League Stage' ||
    tournament.current_phase === 'Knockout Stage' ||
    tournament.current_phase === 'Completed';

  if (!auctionDone) {
    return (
      <AdminShell>
        <PageHeader title="Squads" subtitle={`${tournament.name} · ${tournament.season}`} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={Shield} title="Squads will appear after auction completion." description={`Current phase: ${tournament.current_phase}. Squads are finalized once the live auction concludes.`} />
        </div>
      </AdminShell>
    );
  }

  if (owners.length === 0) {
    return (
      <AdminShell>
        <PageHeader title="Squads" subtitle={`${tournament.name} · ${tournament.season}`} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={Shield} title="No Squads Available" description="No team owners have joined the tournament yet." />
        </div>
      </AdminShell>
    );
  }

  const handleFinalize = async () => {
    if (!tournament) return;
    setFinalizing(true);
    await setTournamentPhase(tournament.id, 'League Stage');
    setFinalizing(false);
  };

  return (
    <AdminShell>
      <PageHeader title="Squads" subtitle={`${owners.length} squads · ${tournament.squad_size} players each`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Squads' }]} action={<Button size="sm" onClick={handleFinalize} disabled={finalizing}><Lock className="mr-1.5 h-4 w-4" /> {finalizing ? 'Finalizing...' : 'Finalize Squads'}</Button>} />
      <div className="grid gap-4 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
        {owners.map((owner) => {
          const teamPlayers = players.filter((p) => p.sold_to === owner.id);
          const retained = players.filter((p) => p.is_retained && p.retained_by === owner.id);
          return (
            <Card key={owner.id} className="glass-card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border/60 bg-card/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <TeamBadge initials={getInitials(owner.team_name ?? owner.name)} color={owner.team_color} name={owner.team_name ?? owner.name} size="md" />
                  <div>
                    <div className="font-display font-bold">{owner.team_name ?? owner.name}</div>
                    <div className="text-xs text-muted-foreground">{owner.name}</div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {retained.length > 0 && (
                  <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent"><Shield className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-wider text-accent">Retained</div>
                      <div className="text-sm font-semibold">{retained[0].name}</div>
                    </div>
                  </div>
                )}
                {teamPlayers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {teamPlayers.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-2.5 py-1.5 text-xs">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="ml-2 shrink-0 font-bold text-muted-foreground">{p.sold_price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No auction players yet.</p>
                )}
                <div className="mt-3 text-xs text-muted-foreground">{teamPlayers.length + retained.length}/{tournament.squad_size} players</div>
              </div>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
