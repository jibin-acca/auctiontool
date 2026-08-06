'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BackButton({ className, label = 'Back' }: { className?: string; label?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={cn(
        'group flex items-center gap-1.5 rounded-lg border border-primary/25 bg-card/40 px-3 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_20px_-4px_hsl(217_91%_56%/0.4)]',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      {label}
    </button>
  );
}

export function PublicNav({ active }: { active?: 'tournament' | 'fixtures' | 'standings' | 'awards' }) {
  const links = [
    { href: '/tournament', label: 'Tournament', key: 'tournament' },
    { href: '/fixtures', label: 'Fixtures', key: 'fixtures' },
    { href: '/standings', label: 'Standings', key: 'standings' },
    { href: '/awards', label: 'Awards', key: 'awards' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-lg shadow-primary/20">
              <Trophy className="h-5 w-5" />
              <div className="absolute inset-0 rounded-lg ring-1 ring-primary/30" />
            </div>
            <span className="font-display font-bold tracking-wide">ArenaOS</span>
          </Link>
          <div className="hidden h-5 w-px bg-primary/15 sm:block" />
          <BackButton />
        </div>
        <nav className="flex items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'transition-colors hover:text-primary',
                active === l.key && 'font-medium text-primary'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function AuthNav() {
  return (
    <div className="absolute left-4 top-4 z-20 flex items-center gap-3">
      <BackButton />
      <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-lg shadow-primary/20">
          <Trophy className="h-4 w-4" />
          <div className="absolute inset-0 rounded-lg ring-1 ring-primary/30" />
        </div>
        <span className="font-display text-sm font-bold tracking-wide">ArenaOS</span>
      </Link>
    </div>
  );
}
