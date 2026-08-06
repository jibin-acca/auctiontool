'use client';

import { Radio } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { EmptyState } from '@/components/arena/empty-state';

export default function AdminBroadcastPage() {
  const { tournament, loading } = useTournament();

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><Radio className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Broadcast Mode" />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={Radio} title="Broadcast Mode will become available once the auction starts." description="No tournament has been created yet." />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader title="Broadcast Mode" subtitle={`${tournament.name} · ${tournament.season}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Broadcast' }]} />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EmptyState
          icon={Radio}
          title="Broadcast Mode will become available once the auction starts."
          description={`Current phase: ${tournament.current_phase}. Broadcast Mode is a fullscreen, projector-optimized display for live auctions and match days.`}
        />
      </div>
    </AdminShell>
  );
}
