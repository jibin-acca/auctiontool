'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, Radio, Loader2, Play, Pause, CheckCircle2, Users, Coins } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/arena/empty-state';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { cn } from '@/lib/utils';
import type { Player, TeamOwner } from '@/lib/types';

export default function AdminAuctionPage() {
  const { tournament, loading, updateTournament, setTournamentPhase } = useTournament();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [owners, setOwners] = useState<TeamOwner[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!tournament) return;
    (async () => {
      setDataLoading(true);
      const { data: pl } = await supabase
        .from('players')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('auction_number', { ascending: true, nullsFirst: false });
      const { data: ow } = await supabase
        .from('team_owners')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('team_name', { ascending: true });
      setPlayers((pl ?? []) as Player[]);
      setOwners((ow ?? []) as TeamOwner[]);
      setDataLoading(false);
    })();
  }, [tournament]);

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><Gavel className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Live Auction" />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState
            icon={Gavel}
            title="No Live Auction"
            description="No tournament has been created yet. Create a tournament to begin the auction process."
            action={<Button size="sm" onClick={() => router.push('/admin')}>Create Tournament</Button>}
          />
        </div>
      </AdminShell>
    );
  }

  // Not yet at auction stage
  if (tournament.current_phase !== 'Auction Live' && tournament.current_phase !== 'Auction Preparation') {
    return (
      <AdminShell>
        <PageHeader title="Live Auction" subtitle={`${tournament.name} · ${tournament.season}`} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState
            icon={Gavel}
            title="No Live Auction"
            description={`The auction has not started yet. Current phase: ${tournament.current_phase}. The auction will become available once player nominations are complete.`}
          />
        </div>
      </AdminShell>
    );
  }

  // Auction Preparation — show Start Auction button
  if (tournament.current_phase === 'Auction Preparation') {
    const handleStartAuction = async () => {
      setStarting(true);
      await setTournamentPhase(tournament.id, 'Auction Live');
      setStarting(false);
    };

    const soldCount = players.filter((p) => p.status === 'Sold').length;
    const availableCount = players.filter((p) => p.status === 'Available' || p.status === 'Pending').length;

    return (
      <AdminShell>
        <PageHeader
          title="Live Auction"
          subtitle={`${tournament.name} · ${tournament.season}`}
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Auction' }]}
          action={
            <Button asChild variant="outline" size="sm">
              <a href="/admin/broadcast"><Radio className="mr-1.5 h-4 w-4" /> Broadcast Mode</a>
            </Button>
          }
        />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card className="glass-card p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Players in Pool</div>
              <div className="mt-1 font-display text-2xl font-bold">{players.length}</div>
            </Card>
            <Card className="glass-card p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Available</div>
              <div className="mt-1 font-display text-2xl font-bold text-success">{availableCount}</div>
            </Card>
            <Card className="glass-card p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Teams Registered</div>
              <div className="mt-1 font-display text-2xl font-bold">{owners.length}</div>
            </Card>
          </div>
          <EmptyState
            icon={Gavel}
            title="Auction Ready to Start"
            description="The auction pool has been published. Start the auction to begin live bidding."
            action={
              <Button size="sm" onClick={handleStartAuction} disabled={starting || players.length === 0 || owners.length === 0}>
                {starting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Starting...</> : <><Play className="mr-1.5 h-4 w-4" /> Start Auction</>}
              </Button>
            }
          />
          {players.length === 0 && (
            <p className="mt-3 text-center text-sm text-destructive">No players in the auction pool. Add players before starting.</p>
          )}
          {owners.length === 0 && (
            <p className="mt-3 text-center text-sm text-destructive">No team owners registered. Invite owners before starting.</p>
          )}
        </div>
      </AdminShell>
    );
  }

  // Auction Live — show live auction interface
  const soldPlayers = players.filter((p) => p.status === 'Sold');
  const unsoldPlayers = players.filter((p) => p.status === 'Unsold' || p.status === 'Available' || p.status === 'Pending');
  const totalSpent = soldPlayers.reduce((sum, p) => sum + (p.sold_price ?? 0), 0);

  const handleEndAuction = async () => {
    await setTournamentPhase(tournament.id, 'Squad Finalized');
  };

  return (
    <AdminShell>
      <PageHeader
        title="Live Auction"
        subtitle={`${tournament.name} · ${tournament.season}`}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Auction' }]}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/admin/broadcast"><Radio className="mr-1.5 h-4 w-4" /> Broadcast Mode</a>
            </Button>
            <Button size="sm" variant="gold" onClick={handleEndAuction}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete Auction
            </Button>
          </div>
        }
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Live stats bar */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><Gavel className="h-4 w-4" /></div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Players Sold</div>
                <div className="font-display text-xl font-bold">{soldPlayers.length}</div>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success"><Users className="h-4 w-4" /></div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Teams</div>
                <div className="font-display text-xl font-bold">{owners.length}</div>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent"><Coins className="h-4 w-4" /></div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Spent</div>
                <div className="font-display text-xl font-bold">{totalSpent} {tournament.currency}</div>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/30 text-muted-foreground"><Gavel className="h-4 w-4" /></div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Remaining</div>
                <div className="font-display text-xl font-bold">{unsoldPlayers.length}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sold players */}
        {soldPlayers.length > 0 && (
          <Card className="glass-card mb-6 overflow-hidden p-0">
            <div className="border-b border-border/60 bg-card/40 px-4 py-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-success">Sold Players ({soldPlayers.length})</h3>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {soldPlayers.map((p) => {
                const buyer = owners.find((o) => o.id === p.sold_to);
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-success/20 bg-success/5 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {buyer && <TeamBadge initials={getInitials(buyer.team_name ?? buyer.name)} color={buyer.team_color} name={buyer.team_name ?? buyer.name} size="sm" />}
                        <span>{buyer?.team_name ?? buyer?.name ?? 'Unknown'}</span>
                      </div>
                    </div>
                    <Badge className="shrink-0 border-0 bg-success/15 text-success">{p.sold_price} {tournament.currency}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Unsold / Available players */}
        {unsoldPlayers.length > 0 && (
          <Card className="glass-card overflow-hidden p-0">
            <div className="border-b border-border/60 bg-card/40 px-4 py-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Available Players ({unsoldPlayers.length})</h3>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {unsoldPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">Base: {p.base_price} {tournament.currency}</div>
                  </div>
                  <Badge variant="outline" className="shrink-0">{p.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {dataLoading && (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        )}

        {!dataLoading && players.length === 0 && (
          <EmptyState icon={Gavel} title="No Players in Pool" description="No players have been added to the auction pool yet." />
        )}
      </div>
    </AdminShell>
  );
}
