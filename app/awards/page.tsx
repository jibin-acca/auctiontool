'use client';

import { Trophy, Award as AwardIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/arena/empty-state';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { PublicNav } from '@/components/arena/public-nav';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Award, TeamOwner } from '@/lib/types';

const iconMap: Record<string, typeof Trophy> = {
  trophy: Trophy, medal: AwardIcon, award: AwardIcon, star: Trophy,
};

export default function PublicAwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [owners, setOwners] = useState<Record<string, TeamOwner>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: aw } = await supabase.from('awards').select('*').eq('is_published', true).order('display_order');
      const { data: ow } = await supabase.from('team_owners').select('*');
      const map: Record<string, TeamOwner> = {};
      (ow ?? []).forEach((o) => { map[o.id] = o; });
      setOwners(map);
      setAwards((aw ?? []) as Award[]);
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

      <PublicNav active="awards" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-glow-gold sm:text-4xl">Awards</h1>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
              <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-ball-spin" />
              <AwardIcon className="h-5 w-5 text-accent" />
            </div>
          </div>
        ) : awards.length === 0 ? (
          <div className="mt-6"><EmptyState icon={AwardIcon} title="No Awards Available" description="Awards will be published after the tournament concludes and champions are declared." /></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {awards.map((award, i) => {
              const Icon = iconMap[award.icon] ?? Trophy;
              const isChampion = award.name === 'Champion';
              const winner = award.winner_team_id ? owners[award.winner_team_id] : null;
              return (
                <Card key={award.id} className={cn('glass-card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 animate-slide-up-fade', isChampion && 'glass-card-gold border-accent/30')} style={{ animationDelay: `${i * 0.05}s` }}>
                  {isChampion && <div className="absolute right-0 top-0 h-24 w-24 bg-accent/10 blur-2xl" />}
                  <div className="relative">
                    <div className={cn('mb-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ring-1 transition-transform group-hover:scale-110', isChampion ? 'bg-accent/20 text-accent shadow-accent/10 ring-accent/20 glow-gold' : 'bg-primary/10 text-primary shadow-primary/10 ring-primary/20')}><Icon className="h-6 w-6" /></div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide">{award.name}</h3>
                    {award.description && <p className="mt-1 text-sm text-muted-foreground">{award.description}</p>}
                    {award.prize && <div className="mt-3"><Badge variant="gold" className="border-accent/30">{award.prize}</Badge></div>}
                    {winner && (
                      <div className="mt-4 border-t border-primary/10 pt-3">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Winner</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <TeamBadge initials={getInitials(winner.team_name ?? winner.name)} color={winner.team_color} name={winner.team_name ?? winner.name} size="sm" />
                          <span className="font-display font-bold text-accent text-glow-gold">{winner.team_name ?? winner.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
