'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Trophy, LogOut, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/arena/empty-state';
import { supabase } from '@/lib/supabase';
import { useTournament } from '@/lib/use-tournament';
import { getOwnerSession, clearOwnerSession } from '@/lib/owner-session';
import type { TeamOwner } from '@/lib/types';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';

export default function OwnerProfilePage() {
  const router = useRouter();
  const { tournament, loading } = useTournament();
  const [owner, setOwner] = useState<TeamOwner | null>(null);

  useEffect(() => {
    const session = getOwnerSession();
    if (!session) {
      router.replace('/join');
      return;
    }
    if (!tournament) return;
    (async () => {
      const { data } = await supabase
        .from('team_owners')
        .select('*')
        .eq('id', session.teamOwnerId)
        .maybeSingle();
      setOwner(data as TeamOwner | null);
    })();
  }, [tournament, router]);

  const handleLogout = () => {
    clearOwnerSession();
    router.push('/');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><User className="h-6 w-6 animate-pulse text-primary" /></div>;
  }

  if (!tournament) {
    return (
      <div className="space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-bold">Profile</h1>
        <EmptyState icon={User} title="No Active Tournament" description="No tournament has been created yet." />
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-bold">Profile</h1>
        <EmptyState icon={User} title="Profile Not Found" description="Your manager profile could not be loaded. Please try registering again." />
        <div className="flex justify-center">
          <Button asChild><a href="/join">Register Again</a></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-4">
      <h1 className="font-display text-xl font-bold">Profile</h1>

      {/* Profile header */}
      <Card className="glass-card p-5">
        <div className="flex items-center gap-4">
          <TeamBadge initials={getInitials(owner.team_name ?? owner.name)} color={owner.team_color} name={owner.team_name ?? owner.name} size="lg" />
          <div>
            <div className="font-display text-lg font-bold">{owner.name}</div>
            <div className="text-sm text-muted-foreground">{owner.team_name ?? 'No team name set'}</div>
            <div className="mt-1 text-xs text-muted-foreground">Status: {owner.status}</div>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card className="glass-card divide-y divide-border/40 p-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Phone className="h-4 w-4" /></div>
          <div>
            <div className="text-xs text-muted-foreground">Phone</div>
            <div className="text-sm font-medium">{owner.phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Trophy className="h-4 w-4" /></div>
          <div>
            <div className="text-xs text-muted-foreground">Tournament</div>
            <div className="text-sm font-medium">{tournament.name} · {tournament.season}</div>
          </div>
        </div>
        {owner.department && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground"><Shield className="h-4 w-4" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Department</div>
              <div className="text-sm font-medium">{owner.department}</div>
            </div>
          </div>
        )}
        {owner.email && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground"><User className="h-4 w-4" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="text-sm font-medium">{owner.email}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Logout */}
      <Button variant="outline" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    </div>
  );
}
