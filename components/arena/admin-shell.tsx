'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCheck,
  ClipboardList,
  Gavel,
  Shield,
  CalendarDays,
  BarChart3,
  Award,
  Megaphone,
  FileText,
  Settings,
  Radio,
  LogOut,
  ChevronRight,
  Home,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useTournament } from '@/lib/use-tournament';
import { StatusRibbon } from './status-ribbon';
import { NotificationCenter } from './notification-center';
import { useState, useRef, useEffect } from 'react';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tournament', label: 'Tournament', icon: Trophy },
  { href: '/admin/team-owners', label: 'Team Owners', icon: Users },
  { href: '/admin/retained-players', label: 'Retained Players', icon: UserCheck },
  { href: '/admin/player-nominations', label: 'Player Nominations', icon: ClipboardList },
  { href: '/admin/auction', label: 'Auction', icon: Gavel },
  { href: '/admin/squads', label: 'Squads', icon: Shield },
  { href: '/admin/fixtures', label: 'Fixtures', icon: CalendarDays },
  { href: '/admin/standings', label: 'Standings', icon: BarChart3 },
  { href: '/admin/awards', label: 'Awards', icon: Award },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/broadcast', label: 'Broadcast', icon: Radio },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { tournament } = useTournament();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Layered stadium background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-stadium-pan" />
        <div className="absolute inset-0 bg-floodlight opacity-60" />
        <div className="absolute inset-0 bg-fog opacity-40" />
        <div className="absolute inset-0 bg-vignette" />
      </div>

      {tournament && (
        <StatusRibbon
          tournamentName={tournament.name}
          seasonName={tournament.season}
          activePhase={tournament.current_phase}
        />
      )}

      <div className="relative z-10 mx-auto flex max-w-[1600px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-primary/10 bg-card/40 backdrop-blur-xl lg:flex">
          {/* Logo / Brand */}
          <Link href="/" className="group flex items-center gap-3 border-b border-primary/10 px-5 py-5 transition-colors hover:bg-primary/5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-lg shadow-primary/20">
              <Trophy className="h-6 w-6" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-primary/30" />
            </div>
            <div>
              <div className="font-display text-lg font-bold leading-none tracking-wide">
                ArenaOS
              </div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-accent/80">
                Admin Console
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3 scrollbar-thin">
            {nav.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                    active
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                  )}
                >
                  {/* Sliding active indicator */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_2px_hsl(217_91%_56%/0.5)]" />
                  )}
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-all duration-200',
                      active
                        ? 'text-primary drop-shadow-[0_0_6px_hsl(217_91%_56%/0.5)]'
                        : 'group-hover:scale-110 group-hover:text-primary'
                    )}
                  />
                  <span className="font-medium tracking-wide">{item.label}</span>
                  {active && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/50" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile + logout */}
          <div className="border-t border-primary/10 px-3 py-3">
            <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-card/40 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {(user?.email ?? 'A')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{user?.email}</div>
                <div className="text-[10px] text-accent/70">Administrator</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="relative min-w-0 flex-1">
          {/* Mobile nav */}
          <div className="border-b border-primary/10 bg-card/40 backdrop-blur-xl lg:hidden">
            <AdminMobileNav />
          </div>

          {/* Top header bar (desktop) */}
          <div className="hidden items-center justify-between border-b border-primary/10 bg-card/30 px-6 py-3 backdrop-blur-xl lg:flex">
            <div className="flex items-center gap-3">
              {tournament && (
                <>
                  <TournamentSwitcher />
                  <div className="ml-1 flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{tournament.current_phase}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_12px_-2px_hsl(217_91%_56%/0.4)]" title="Back to Homepage">
                <Home className="h-4 w-4" />
              </Link>
              <NotificationCenter />
              <div className="h-6 w-px bg-border/60" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {(user?.email ?? 'A')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Animated divider */}
          <div className="divider-animated" />

          {children}
        </main>
      </div>
    </div>
  );
}

function AdminMobileNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-thin">
      <Link href="/" className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      {nav.map((item) => {
        const active =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              active
                ? 'bg-primary/15 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="relative border-b border-primary/10 px-4 py-5 sm:px-6 lg:px-8">
      <div className="absolute bottom-0 left-0 right-0 h-px divider-animated" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((bc, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                  {bc.href ? (
                    <Link href={bc.href} className="transition-colors hover:text-primary">{bc.label}</Link>
                  ) : (
                    <span className="text-muted-foreground">{bc.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

function TournamentSwitcher() {
  const { tournament, tournaments, switchTournament } = useTournament();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!tournament) return null;
  const otherTournaments = tournaments.filter((t) => t.id !== tournament.id);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2.5 rounded-lg border border-primary/15 bg-card/40 px-3 py-1.5 transition-all hover:border-primary/30 hover:bg-primary/5"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Trophy className="h-3.5 w-3.5" />
        </div>
        <div className="text-left">
          <div className="font-display text-sm font-bold leading-none">{tournament.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{tournament.season}</div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-primary/15 bg-card/90 p-2 shadow-xl backdrop-blur-xl animate-scale-in">
          <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Active Tournament
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{tournament.name}</div>
              <div className="text-[10px] text-muted-foreground">{tournament.season}</div>
            </div>
            <Check className="h-4 w-4 text-primary" />
          </div>
          {otherTournaments.length > 0 && (
            <>
              <div className="mb-1 mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Switch To
              </div>
              <div className="max-h-48 space-y-0.5 overflow-y-auto scrollbar-thin">
                {otherTournaments.map((t) => (
                  <button
                    key={t.id}
                    onClick={async () => {
                      await switchTournament(t.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-primary/10"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground">{t.season} · {t.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="mt-2 border-t border-primary/10 pt-2">
            <Link
              href="/admin/tournament"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Settings className="h-4 w-4" /> Manage Tournaments
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
