'use client';

import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTournament } from '@/lib/use-tournament';
import { getOwnerSession } from '@/lib/owner-session';
import type { Player, TeamOwner } from '@/lib/types';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';

export default function OwnerSquadPage() {
  const { tournament, loading } = useTournament();
  const [players, setPlayers] = useState<Player[]>([]);
  const [owner, setOwner] = useState<TeamOwner | null>(null);

  useEffect(() => {
    if (!tournament) { setPlayers([]); setOwner(null); return; }
    (async () => {
      const session = getOwnerSession();
      if (!session) { setPlayers([]); return; }
      const { data: ow } = await supabase.from('team_owners').select('*').eq('id', session.teamOwnerId).maybeSingle();
      if (!ow) { setPlayers([]); return; }
      setOwner(ow as TeamOwner);
      const { data: pl } = await supabase.from('players').select('*').eq('tournament_id', tournament.id).or(`sold_to.eq.${ow.id},retained_by.eq.${ow.id}`);
      setPlayers((pl ?? []) as Player[]);
    })();
  }, [tournament]);

  if (loading) return <div className="flex justify-center py-20"><Shield className="h-6 w-6 animate-pulse text-primary" /></div>;

  if (!tournament) return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">My Squad</h1><EmptyState icon={Shield} title="No Squad Available" description="No tournament has been created yet." /></div>;

  const auctionDone = ['Squad Finalized', 'League Stage', 'Knockout Stage', 'Completed'].includes(tournament.current_phase);

  if (!auctionDone) return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">My Squad</h1><EmptyState icon={Shield} title="Squads will appear after auction completion." description={`Current phase: ${tournament.current_phase}. Your squad will be finalized once the live auction concludes.`} /></div>;

  if (!owner || players.length === 0) return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">My Squad</h1><EmptyState icon={Shield} title="No Squad Available" description="Your squad will appear here once the auction is completed." /></div>;

  const retained = players.filter((p) => p.is_retained && p.retained_by === owner.id);
  const auctioned = players.filter((p) => p.sold_to === owner.id);

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-center gap-3">
        <TeamBadge initials={getInitials(owner.team_name ?? owner.name)} color={owner.team_color} name={owner.team_name ?? owner.name} size="md" />
        <div>
          <h1 className="font-display text-xl font-bold">{owner.team_name ?? 'My Team'}</h1>
          <p className="text-xs text-muted-foreground">{owner.name} · {players.length}/{tournament.squad_size} players</p>
        </div>
      </div>
      {retained.length > 0 && (
        <Card className="glass-card border-l-2 border-l-accent/40 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-accent">Retained Player</div>
          <div className="text-sm font-medium">{retained[0].name}</div>
        </Card>
      )}
      <Card className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Auction Players</h3>
        <div className="grid grid-cols-2 gap-2">
          {auctioned.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2 text-xs">
              <span className="truncate font-medium">{p.name}</span>
              <span className="ml-2 shrink-0 font-bold text-muted-foreground">{p.sold_price ?? '—'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
