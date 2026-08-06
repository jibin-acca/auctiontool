'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Gavel,
  CalendarDays,
  BarChart3,
  Bell,
  Trophy,
  User,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/arena/public-nav';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { getOwnerSession, clearOwnerSession } from '@/lib/owner-session';

const bottomNav = [
  { href: '/owner/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/owner/auction', label: 'Auction', icon: Gavel },
  { href: '/owner/fixtures', label: 'Fixtures', icon: CalendarDays },
  { href: '/owner/standings', label: 'Standings', icon: BarChart3 },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tournament } = useTournament();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const session = getOwnerSession();
    if (!session) {
      router.replace('/join');
      return;
    }
    (async () => {
      const { data: owner } = await supabase
        .from('team_owners')
        .select('id, name')
        .eq('id', session.teamOwnerId)
        .maybeSingle();
      if (cancelled) return;
      if (!owner) {
        clearOwnerSession();
        router.replace('/join');
        return;
      }
      setOwnerName(owner.name);
      setSessionChecked(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleLogout = () => {
    clearOwnerSession();
    router.push('/');
  };

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-16">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-stadium-pan" />
        <div className="absolute inset-0 bg-floodlight opacity-60" />
        <div className="absolute inset-0 bg-fog opacity-40" />
        <div className="absolute inset-0 bg-vignette" />
      </div>

      <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-lg shadow-primary/20">
              <Trophy className="h-4 w-4" />
              <div className="absolute inset-0 rounded-lg ring-1 ring-primary/30" />
            </div>
            <div>
              <div className="font-display text-sm font-bold leading-none tracking-wide">{tournament?.name ?? 'ArenaOS'}</div>
              <div className="text-[10px] uppercase tracking-widest text-accent/70">{tournament?.season ?? 'No active tournament'}</div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <BackButton />
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_2px_hsl(43_96%_56%/0.4)]" />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                title="Profile"
              >
                <User className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border/60 bg-card/95 p-2 shadow-xl backdrop-blur-xl">
                    <div className="border-b border-border/40 px-3 py-2">
                      <div className="text-sm font-medium">{ownerName ?? 'Team Owner'}</div>
                      <div className="text-xs text-muted-foreground">Manager</div>
                    </div>
                    <Link
                      href="/owner/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="divider-animated" />
      </header>

      <div className="relative z-10">{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/10 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {bottomNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium uppercase tracking-wide transition-all',
                  active ? 'text-primary drop-shadow-[0_0_4px_hsl(217_91%_56%/0.4)]' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
                {item.label}
                {active && <span className="h-0.5 w-6 rounded-full bg-primary shadow-[0_0_6px_2px_hsl(217_91%_56%/0.4)]" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
