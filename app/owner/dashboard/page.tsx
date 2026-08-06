'use client';

import { Trophy, Gavel, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTournament } from '@/lib/use-tournament';
import type { Announcement } from '@/lib/types';

export default function OwnerDashboard() {
  const { tournament, loading } = useTournament();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!tournament) { setAnnouncements([]); return; }
    (async () => {
      const { data: ann } = await supabase.from('announcements').select('*').eq('tournament_id', tournament.id).eq('status', 'Published').order('created_at', { ascending: false }).limit(3);
      setAnnouncements((ann ?? []) as Announcement[]);
    })();
  }, [tournament]);

  if (loading) {
    return <div className="flex justify-center py-20"><Trophy className="h-6 w-6 animate-pulse text-primary" /></div>;
  }

  if (!tournament) {
    return (
      <div className="space-y-5 px-4 py-4">
        <h1 className="font-display text-xl font-bold">Welcome</h1>
        <EmptyState icon={Trophy} title="No Active Tournament" description="No tournament has been published yet. Check back soon." />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-bold">Welcome, Team Owner</h1>
        <p className="text-sm text-muted-foreground">{tournament.current_phase} · {tournament.season}</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/owner/auction"><Card className="glass-card flex items-center gap-3 p-3 transition-all hover:border-primary/30"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Gavel className="h-4.5 w-4.5" /></div><span className="text-sm font-medium">Auction</span></Card></Link>
        <Link href="/owner/squad"><Card className="glass-card flex items-center gap-3 p-3 transition-all hover:border-primary/30"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Shield className="h-4.5 w-4.5" /></div><span className="text-sm font-medium">My Squad</span></Card></Link>
      </div>

      {/* Announcements */}
      <div>
        <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Announcements</h3>
        {announcements.length === 0 ? (
          <Card className="glass-card border-l-2 border-l-primary/40 p-3">
            <div className="text-sm text-muted-foreground">No announcements have been published.</div>
          </Card>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <Card key={a.id} className="glass-card border-l-2 border-l-primary/40 p-3">
                <div className="text-sm font-medium">{a.title}</div>
                {a.body && <div className="mt-0.5 text-xs text-muted-foreground">{a.body}</div>}
                <div className="mt-1 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()} · {a.category}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
