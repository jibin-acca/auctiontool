'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  CalendarDays,
  Megaphone,
  Gavel,
  CheckCircle2,
  ArrowRight,
  Plus,
  ShieldCheck,
  Clock,
  TrendingUp,
  Activity,
  Loader2,
  X,
  Radio,
} from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Tournament } from '@/lib/types';

const onboardingSteps = [
  { label: 'Create your tournament', desc: 'Set up tournament name, format, budget, and auction rules.', icon: Trophy },
  { label: 'Invite Team Owners', desc: 'Add managers and send invitation links.', icon: Users },
  { label: 'Collect player nominations', desc: 'Team Owners submit their preferred players.', icon: CalendarDays },
  { label: 'Run the live auction', desc: 'Conduct the auction with real-time bidding and budget enforcement.', icon: Gavel },
  { label: 'Generate fixtures & play', desc: 'Auto-generate fixtures, record results, and publish standings.', icon: Activity },
];

export default function AdminDashboard() {
  const { tournament, loading, createTournament } = useTournament();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-ball-spin" />
            <Trophy className="h-5 w-5 text-primary" />
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!tournament) {
    return (
      <AdminShell>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-spotlight opacity-60" />
          <div className="absolute inset-0 bg-pitch-grid opacity-20" />
          <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="text-center">
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg shadow-primary/20 ring-1 ring-primary/20 animate-float">
                <Trophy className="h-10 w-10" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 animate-glow-pulse" />
              </div>
              <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide text-glow-blue sm:text-5xl">
                Welcome to ArenaOS
              </h1>
              <p className="mt-3 text-muted-foreground">
                No tournament has been created yet. Let&apos;s set up your first eFootball tournament.
              </p>
              <Button size="lg" className="mt-6 glow-blue animate-pulse-gold" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-5 w-5" /> Create Your First Tournament
              </Button>
            </div>

            <div className="mt-12 space-y-3">
              <h2 className="mb-4 text-center font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Your tournament journey
              </h2>
              {onboardingSteps.map((step, i) => (
                <Card
                  key={step.label}
                  className="glass-card group flex items-start gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 animate-slide-up-fade"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent shadow-[0_0_6px_-1px_hsl(43_96%_56%/0.4)]">
                        {i + 1}
                      </span>
                      <h3 className="font-display font-semibold uppercase tracking-wide">{step.label}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/30" />
                </Card>
              ))}
            </div>
          </div>
        </div>
        {showCreateModal && (
          <CreateTournamentModal
            onClose={() => setShowCreateModal(false)}
            onCreate={async (data) => {
              const t = await createTournament(data);
              if (t) setShowCreateModal(false);
            }}
          />
        )}
      </AdminShell>
    );
  }

  return <DashboardWithTournament tournament={tournament} />;
}

function DashboardWithTournament({ tournament }: { tournament: Tournament }) {
  const [stats, setStats] = useState({
    teamOwners: 0,
    players: 0,
    fixtures: 0,
    completedMatches: 0,
    announcements: 0,
  });

  useEffect(() => {
    if (!tournament) return;
    let cancelled = false;
    (async () => {
      const [{ count: teamOwners }, { count: players }, { count: fixtures }, { count: announcements }] = await Promise.all([
        supabase.from('team_owners').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
        supabase.from('players').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
        supabase.from('fixtures').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
      ]);
      const { count: completed } = await supabase.from('fixtures').select('*', { count: 'exact', head: true }).eq('tournament_id', tournament.id).eq('status', 'Completed');
      if (!cancelled) {
        setStats({
          teamOwners: teamOwners ?? 0,
          players: players ?? 0,
          fixtures: fixtures ?? 0,
          completedMatches: completed ?? 0,
          announcements: announcements ?? 0,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [tournament]);

  const quickActions = [
    { label: 'Invite Team Owners', href: '/admin/team-owners', icon: Users },
    { label: 'Start Auction', href: '/admin/auction', icon: Gavel },
    { label: 'Generate Fixtures', href: '/admin/fixtures', icon: CalendarDays },
    { label: 'Create Announcement', href: '/admin/announcements', icon: Megaphone },
  ];

  const healthItems = [
    { label: 'Tournament Configured', done: true },
    { label: 'Team Owners Joined', done: stats.teamOwners > 0 },
    { label: 'Retained Players Assigned', done: false },
    { label: 'Player Nominations', done: stats.players > 0 },
    { label: 'Auction Completed', done: ['League Stage', 'Knockout Stage', 'Completed'].includes(tournament.current_phase) },
    { label: 'Fixtures Generated', done: stats.fixtures > 0 },
    { label: 'League Stage Active', done: tournament.current_phase === 'League Stage' },
    { label: 'Knockout Ready', done: ['Knockout Stage', 'Completed'].includes(tournament.current_phase) },
  ];
  const completedHealth = healthItems.filter((h) => h.done).length;
  const healthPct = Math.round((completedHealth / healthItems.length) * 100);

  return (
    <AdminShell>
      <PageHeader
        title="Tournament Control Center"
        subtitle={`${tournament.name} · ${tournament.season}`}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]}
        action={
          <Button asChild size="sm" variant="outline" className="glow-blue">
            <Link href="/admin/broadcast"><Radio className="mr-1.5 h-4 w-4" /> Broadcast Mode</Link>
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Premium stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Team Owners', value: stats.teamOwners, hint: 'Joined', icon: Users, accent: 'blue' as const, max: tournament.manager_count },
            { label: 'Matches Completed', value: stats.completedMatches, hint: stats.fixtures ? `${stats.fixtures} total` : 'No fixtures', icon: CalendarDays, accent: 'green' as const, max: stats.fixtures || 1 },
            { label: 'Players Nominated', value: stats.players, hint: 'In pool', icon: TrendingUp, accent: 'gold' as const, max: 0 },
            { label: 'Current Phase', value: tournament.current_phase, icon: Activity, accent: 'blue' as const, max: 0, isText: true },
          ].map((s, i) => (
            <Card
              key={s.label}
              className="glass-card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 animate-slide-up-fade"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={cn(
                'absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100',
                s.accent === 'blue' && 'bg-primary/10',
                s.accent === 'gold' && 'bg-accent/10',
                s.accent === 'green' && 'bg-success/10',
              )} />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</div>
                  {s.isText ? (
                    <div className="mt-2 font-display text-lg font-bold uppercase tracking-wide text-glow-blue">{s.value}</div>
                  ) : (
                    <div className="mt-1 font-display text-3xl font-bold tracking-tight">
                      <Counter value={s.value as number} />
                    </div>
                  )}
                  {s.hint && <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>}
                </div>
                <div className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ring-1 transition-transform duration-300 group-hover:scale-110',
                  s.accent === 'blue' && 'bg-primary/15 text-primary shadow-primary/10 ring-primary/20',
                  s.accent === 'gold' && 'bg-accent/15 text-accent shadow-accent/10 ring-accent/20',
                  s.accent === 'green' && 'bg-success/15 text-success shadow-success/10 ring-success/20',
                )}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              {/* Progress bar */}
              {!s.isText && s.max > 0 && (
                <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      s.accent === 'blue' && 'bg-primary',
                      s.accent === 'gold' && 'bg-accent',
                      s.accent === 'green' && 'bg-success',
                    )}
                    style={{ width: `${Math.min(100, ((s.value as number) / s.max) * 100)}%` }}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="glass-card p-5 lg:col-span-2">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Quick Actions
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((a, i) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group flex items-center justify-between rounded-xl border border-primary/12 bg-card/40 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 animate-slide-up-fade"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                      <a.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{a.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </Card>

          {/* Tournament Health with progress ring */}
          <Card className="glass-card relative overflow-hidden p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Tournament Health
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing percent={healthPct} />
              <div className="flex-1 space-y-1.5">
                {healthItems.slice(0, 4).map((h) => (
                  <div key={h.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{h.label}</span>
                    {h.done ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Full health checklist */}
        <Card className="glass-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Tournament Progress
          </h3>
          <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {healthItems.map((h, i) => (
              <div key={h.label} className="flex items-center justify-between text-sm animate-row-slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="text-muted-foreground">{h.label}</span>
                {h.done ? (
                  <span className="flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground/50">
                    <Clock className="h-4 w-4" /> Pending
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (value === display) return;
    const start = ref.current;
    const duration = 600;
    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplay(current);
      ref.current = current;
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="animate-count-up">{display}</span>;
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="6" className="stroke-muted/30" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-success transition-all duration-700"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            filter: 'drop-shadow(0 0 4px hsl(142 71% 45% / 0.4))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-lg font-bold text-success">{percent}%</span>
      </div>
    </div>
  );
}

function CreateTournamentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<Tournament>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [season, setSeason] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('100');
  const [currency, setCurrency] = useState('Cr');
  const [squadSize, setSquadSize] = useState('17');
  const [managerCount, setManagerCount] = useState('8');
  const [auctionTimer, setAuctionTimer] = useState('20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim() || !season.trim() || !organizer.trim()) {
      setError('Tournament name, season, and organizer are required.');
      setLoading(false);
      return;
    }

    await onCreate({
      name: name.trim(),
      season: season.trim(),
      organizer: organizer.trim(),
      description: description.trim() || null,
      budget: parseFloat(budget) || 100,
      currency,
      squad_size: parseInt(squadSize) || 17,
      manager_count: parseInt(managerCount) || 8,
      auction_timer: parseInt(auctionTimer) || 20,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-1 font-display text-xl font-bold uppercase tracking-wide">Create Tournament</h2>
        <p className="mb-5 text-sm text-muted-foreground">Set up your eFootball tournament configuration.</p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tournament Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Analytix eFootball League" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Season *</label>
              <input value={season} onChange={(e) => setSeason(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Season 1" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Organizer *</label>
              <input value={organizer} onChange={(e) => setOrganizer(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Gaming Council" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Tournament description (optional)" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Budget</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                <option>Cr</option><option>Coins</option><option>Points</option><option>Custom</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Squad Size</label>
              <input type="number" value={squadSize} onChange={(e) => setSquadSize(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Managers</label>
              <input type="number" value={managerCount} onChange={(e) => setManagerCount(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Auction Timer (seconds)</label>
            <select value={auctionTimer} onChange={(e) => setAuctionTimer(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="10">10s</option><option value="15">15s</option><option value="20">20s</option><option value="30">30s</option><option value="45">45s</option><option value="60">60s</option>
            </select>
          </div>

          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : <><Trophy className="mr-2 h-4 w-4" /> Create Tournament</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
