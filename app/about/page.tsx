'use client';

import Link from 'next/link';
import { Trophy, Gavel, Shield, CalendarDays, BarChart3, Award, ArrowRight } from 'lucide-react';
import { AuthNav } from '@/components/arena/public-nav';

const features = [
  { icon: Trophy, title: 'Tournament Management', desc: 'Create and manage multiple tournaments with custom formats, budgets, and auction rules.' },
  { icon: Gavel, title: 'Live Auction', desc: 'Run real-time player auctions with budget enforcement, timers, and squad tracking.' },
  { icon: Shield, title: 'Squad Management', desc: 'Build and manage team squads with retained players and auction-picked rosters.' },
  { icon: CalendarDays, title: 'Fixtures & Results', desc: 'Auto-generate fixtures, record match results, and track progress through the season.' },
  { icon: BarChart3, title: 'Live Standings', desc: 'Real-time league tables with points, goal difference, and qualification tracking.' },
  { icon: Award, title: 'Awards & Recognition', desc: 'Publish awards and celebrate tournament champions and top performers.' },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-stadium-pan" />
        <div className="absolute inset-0 bg-floodlight opacity-60" />
        <div className="absolute inset-0 bg-fog opacity-40" />
        <div className="absolute inset-0 bg-vignette" />
      </div>

      <AuthNav />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg shadow-primary/20 ring-1 ring-primary/20 animate-float">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide text-glow-blue sm:text-5xl">
            About ArenaOS
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            The operating system for internal eFootball tournaments.
          </p>
        </div>

        <div className="mt-12">
          <p className="text-center text-muted-foreground">
            ArenaOS is a complete tournament management platform designed for organizing
            eFootball competitions within organizations. From tournament creation through
            live auctions, league play, knockout stages, and awards — everything is managed
            from one unified platform.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-primary/40 animate-slide-up-fade"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold uppercase tracking-wide">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-6 py-3 text-sm font-medium text-primary transition-all hover:bg-primary/20 hover:shadow-[0_0_20px_-4px_hsl(217_91%_56%/0.4)]"
          >
            Back to Home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
