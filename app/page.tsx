'use client';

import Link from 'next/link';
import {
  Trophy,
  Gavel,
  Users,
  CalendarDays,
  BarChart3,
  Megaphone,
  ArrowRight,
  Zap,
  ShieldCheck,
  Radio,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Gavel,
    title: 'Live Auction',
    description:
      'IPL-style real-time bidding with budget enforcement, dynamic increments, and broadcast mode.',
  },
  {
    icon: Users,
    title: 'Team Owner Portal',
    description:
      'Invitation-based joining, player nominations, squad management, and match scheduling.',
  },
  {
    icon: CalendarDays,
    title: 'Fixtures & Match Centre',
    description:
      'Auto-generated fixtures, in-app match chat, result submission with screenshot verification.',
  },
  {
    icon: BarChart3,
    title: 'Live Standings',
    description:
      'Automatic standings calculation, knockout brackets, and qualification tracking.',
  },
  {
    icon: Trophy,
    title: 'Awards & Completion',
    description:
      'Champion declaration, award assignment, and a professional tournament summary dashboard.',
  },
  {
    icon: Radio,
    title: 'Broadcast Mode',
    description:
      'Fullscreen projector-optimized display for live auctions and match days — no controls, pure spectacle.',
  },
];

const lifecycle = [
  'Create Tournament',
  'Invite Team Owners',
  'Player Nominations',
  'Live Auction',
  'Squad Finalization',
  'Fixture Generation',
  'League Stage',
  'Knockout Stage',
  'Awards',
  'Archive',
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Layered stadium background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-stadium-pan" />
        <div className="absolute inset-0 bg-floodlight opacity-60" />
        <div className="absolute inset-0 bg-fog opacity-40" />
        <div className="absolute inset-0 bg-vignette" />
        {/* Spotlight sweep */}
        <div className="absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 opacity-20">
          <div className="h-full w-full bg-gradient-to-b from-primary/30 to-transparent blur-3xl animate-spotlight-sweep" />
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-lg shadow-primary/20">
              <Trophy className="h-5 w-5" />
              <div className="absolute inset-0 rounded-lg ring-1 ring-primary/30" />
            </div>
            <div>
              <div className="font-display text-base font-bold leading-none tracking-wide">
                ArenaOS
              </div>
              <div className="text-[10px] uppercase tracking-widest text-accent/70">
                Tournament OS
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/tournament" className="transition-colors hover:text-primary">Tournament</Link>
            <Link href="/fixtures" className="transition-colors hover:text-primary">Fixtures</Link>
            <Link href="/standings" className="transition-colors hover:text-primary">Standings</Link>
            <Link href="/awards" className="transition-colors hover:text-primary">Awards</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link href="/join">Join Tournament</Link>
            </Button>
            <Button asChild size="sm" className="glow-blue">
              <Link href="/admin/login">
                <Lock className="mr-1.5 h-3.5 w-3.5" /> Admin Login
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-pitch-grid opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:pt-36">
          <div className="max-w-3xl">
            <Badge variant="gold" className="mb-4 animate-slide-up-fade">
              <Zap className="mr-1 h-3 w-3" /> Tournament Operating System
            </Badge>
            <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-wide animate-slide-up-fade sm:text-6xl lg:text-7xl" style={{ animationDelay: '0.1s' }}>
              The operating system for{' '}
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent text-glow-blue">
                eFootball tournaments
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
              From tournament creation through live auction, league stages,
              knockout rounds, and awards — run your entire tournament from one
              platform. No spreadsheets. No WhatsApp groups. Just ArenaOS.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
              <Button asChild size="lg" className="glow-blue">
                <Link href="/join">
                  Join Tournament <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/admin/login">
                  <Lock className="mr-1.5 h-4 w-4" /> Administrator Login
                </Link>
              </Button>
            </div>
          </div>

          {/* Premium empty hero card */}
          <div className="mt-12 max-w-2xl animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <Card className="glass-card relative overflow-hidden p-6">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-accent/5 blur-3xl" />
              <div className="relative flex items-center gap-5">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-lg shadow-accent/10 ring-1 ring-accent/20">
                  <Trophy className="h-7 w-7" />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-accent/10 animate-glow-pulse" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold uppercase tracking-widest text-accent/80">
                    No Active Tournament
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    No tournament has been published yet. Check back soon, or sign in as an administrator to create one.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-y border-primary/10 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
          {[
            { label: 'Modules', value: '15+' },
            { label: 'Phases', value: '10' },
            { label: 'Roles', value: '3' },
            { label: 'Version', value: '1.0' },
          ].map((s, i) => (
            <div key={s.label} className="px-4 py-5 text-center sm:px-6 animate-slide-up-fade" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
              <div className="font-display text-3xl font-bold tracking-tight text-glow-blue sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-0.5 text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl text-glow-blue">
            Everything your tournament needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            One platform. Every phase. Zero spreadsheets.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card
              key={f.title}
              className="glass-card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl animate-slide-up-fade"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:bg-primary/10" />
              <div className="relative">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110 group-hover:text-glow-blue">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Lifecycle */}
      <section className="relative z-10 border-y border-primary/10 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl text-glow-blue">
              The tournament lifecycle
            </h2>
            <p className="mt-3 text-muted-foreground">
              ArenaOS guides every stage — modules unlock only when prerequisites are met.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {lifecycle.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-card/60 px-4 py-2 text-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary shadow-[0_0_8px_-1px_hsl(217_91%_56%/0.4)]">
                    {i + 1}
                  </span>
                  {step}
                </div>
                {i < lifecycle.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground/50 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-primary/10">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-lg shadow-accent/10 ring-1 ring-accent/20">
            <ShieldCheck className="h-7 w-7" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-accent/10 animate-glow-pulse" />
          </div>
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl text-glow-gold">
            Ready to run your tournament?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join with your tournament code or sign in as an administrator to start.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="glow-blue">
              <Link href="/join">
                Join Tournament <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/admin/login">Administrator Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/10 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span>Powered by ArenaOS</span>
          </div>
          <div>Version 1.0 · Tournament Operating System</div>
        </div>
      </footer>
    </div>
  );
}
