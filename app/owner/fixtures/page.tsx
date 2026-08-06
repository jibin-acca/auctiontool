'use client';

import { CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTournament } from '@/lib/use-tournament';
import type { Fixture, TeamOwner } from '@/lib/types';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  Completed: 'bg-success/20 text-success', Live: 'bg-destructive/20 text-destructive', Scheduled: 'bg-primary/20 text-primary', 'Pending Result': 'bg-warning/20 text-warning', Upcoming: 'bg-muted/40 text-muted-foreground',
};

export default function OwnerFixturesPage() {
  const { tournament, loading } = useTournament();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [owners, setOwners] = useState<Record<string, TeamOwner>>({});

  useEffect(() => {
    if (!tournament) { setFixtures([]); setOwners({}); return; }
    (async () => {
      const { data: fx } = await supabase.from('fixtures').select('*').eq('tournament_id', tournament.id).eq('is_published', true).order('created_at');
      const { data: ow } = await supabase.from('team_owners').select('*').eq('tournament_id', tournament.id);
      const map: Record<string, TeamOwner> = {};
      (ow ?? []).forEach((o) => { map[o.id] = o; });
      setOwners(map);
      setFixtures((fx ?? []) as Fixture[]);
    })();
  }, [tournament]);

  if (loading) return <div className="flex justify-center py-20"><CalendarDays className="h-6 w-6 animate-pulse text-primary" /></div>;

  if (!tournament) return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">My Fixtures</h1><EmptyState icon={CalendarDays} title="No Fixtures Generated" description="No tournament has been created yet." /></div>;

  if (fixtures.length === 0) return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">My Fixtures</h1><EmptyState icon={CalendarDays} title="No Fixtures Generated" description="Fixtures will appear here once they are published by the tournament administrator." /></div>;

  return (
    <div className="space-y-4 px-4 py-4">
      <h1 className="font-display text-xl font-bold">My Fixtures</h1>
      <div className="space-y-3">
        {fixtures.map((f) => {
          const home = f.home_id ? owners[f.home_id] : null;
          const away = f.away_id ? owners[f.away_id] : null;
          return (
            <Card key={f.id} className="glass-card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border/50 bg-card/30 px-4 py-2">
                <span className="text-xs text-muted-foreground">{f.round}</span>
                <Badge className={cn('border-0', statusStyles[f.status] ?? 'bg-muted/40 text-muted-foreground')}>{f.status}</Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex flex-1 flex-col items-center gap-2 text-center">
                  {home ? <TeamBadge initials={getInitials(home.team_name ?? home.name)} color={home.team_color} name={home.team_name ?? home.name} size="md" /> : <div className="h-11 w-11 rounded-xl bg-muted/40" />}
                  <span className="text-sm font-medium">{home?.team_name ?? 'TBD'}</span>
                </div>
                <span className="font-display text-base font-bold text-muted-foreground">VS</span>
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
}
