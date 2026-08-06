'use client';

import { CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/arena/empty-state';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { PublicNav } from '@/components/arena/public-nav';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Fixture, TeamOwner } from '@/lib/types';

const statusStyles: Record<string, string> = {
  Completed: 'border-success/30 bg-success/15 text-success',
  Live: 'border-destructive/30 bg-destructive/15 text-destructive',
  Scheduled: 'border-primary/30 bg-primary/15 text-primary',
  'Pending Result': 'border-warning/30 bg-warning/15 text-warning',
  Upcoming: 'border-border/60 bg-muted/40 text-muted-foreground',
};

export default function PublicFixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [owners, setOwners] = useState<Record<string, TeamOwner>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: fx } = await supabase.from('fixtures').select('*').eq('is_published', true).order('created_at');
      const { data: ow } = await supabase.from('team_owners').select('*');
      const map: Record<string, TeamOwner> = {};
      (ow ?? []).forEach((o) => { map[o.id] = o; });
      setOwners(map);
      setFixtures((fx ?? []) as Fixture[]);
      setLoading(false);
    })();
  }, []);

  const rounds = Array.from(new Set(fixtures.map((f) => f.round)));

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-stadium-pan" />
        <div className="absolute inset-0 bg-floodlight opacity-60" />
        <div className="absolute inset-0 bg-vignette" />
      </div>

      <PublicNav active="fixtures" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-glow-blue sm:text-4xl">Fixtures</h1>
        <p className="mt-1 text-muted-foreground">All scheduled and completed matches</p>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-ball-spin" />
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="mt-6"><EmptyState icon={CalendarDays} title="No Fixtures Generated" description="Fixtures will appear here once they are published by the tournament administrator." /></div>
        ) : (
          <div className="mt-6 space-y-6">
            {rounds.map((round) => (
              <div key={round}>
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-accent/70">{round}</h2>
                <div className="divider-blue mb-3" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {fixtures.filter((f) => f.round === round).map((f, i) => {
                    const home = f.home_id ? owners[f.home_id] : null;
                    const away = f.away_id ? owners[f.away_id] : null;
                    return (
                      <Card key={f.id} className="glass-card group overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 animate-slide-up-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex items-center justify-between border-b border-primary/10 bg-card/30 px-4 py-2">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">{f.round}</span>
                          <Badge variant="outline" className={cn(statusStyles[f.status] ?? '')}>{f.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between px-4 py-5">
                          <div className="flex flex-1 flex-col items-center gap-2 text-center">
                            {home ? <TeamBadge initials={getInitials(home.team_name ?? home.name)} color={home.team_color} name={home.team_name ?? home.name} size="md" /> : <div className="h-11 w-11 rounded-xl bg-muted/40" />}
                            <span className="text-sm font-medium">{home?.team_name ?? 'TBD'}</span>
                          </div>
                          <span className="font-display text-lg font-bold text-muted-foreground/60">VS</span>
                          <div className="flex flex-1 flex-col items-center gap-2 text-center">
                            {away ? <TeamBadge initials={getInitials(away.team_name ?? away.name)} color={away.team_color} name={away.team_name ?? away.name} size="md" /> : <div className="h-11 w-11 rounded-xl bg-muted/40" />}
                            <span className="text-sm font-medium">{away?.team_name ?? 'TBD'}</span>
                          </div>
                        </div>
                        <div className="border-t border-primary/10 bg-card/20 px-4 py-2 text-center text-xs text-muted-foreground">
                          {f.scheduled_date ? `${f.scheduled_date}${f.scheduled_time ? ' · ' + f.scheduled_time : ''}` : 'Not scheduled'}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
