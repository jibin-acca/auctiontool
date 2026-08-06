'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Settings as SettingsIcon } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/arena/empty-state';

const meta: Record<string, { title: string; subtitle: string; icon: typeof Trophy; emptyTitle: string; emptyDesc: string; cta: string; ctaHref: string }> = {
  settings: { title: 'Settings', subtitle: 'Application and tournament configuration', icon: SettingsIcon, emptyTitle: 'Settings', emptyDesc: 'Configure application settings, tournament defaults, and system preferences.', cta: 'Go to Dashboard', ctaHref: '/admin' },
};

export default function GenericAdminPage({ params }: { params: { slug?: string[] } }) {
  const { tournament, loading } = useTournament();
  const router = useRouter();
  const slug = params.slug?.[0] ?? 'tournament';
  const m = meta[slug] ?? meta.tournament;

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><m.icon className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  return (
    <AdminShell>
      <PageHeader title={m.title} subtitle={m.subtitle} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: m.title }]} />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="glass-card p-6">
          <EmptyState
            icon={m.icon}
            title={tournament ? m.emptyTitle : 'No Tournament Created'}
            description={tournament ? m.emptyDesc : 'No tournament has been created yet. Create your first tournament to get started.'}
            action={<Button size="sm" onClick={() => router.push(m.ctaHref)}>{m.cta}</Button>}
          />
        </Card>
      </div>
    </AdminShell>
  );
}
