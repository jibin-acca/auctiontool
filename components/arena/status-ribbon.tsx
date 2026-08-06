'use client';

import { PHASES, type TournamentPhase } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

export function StatusRibbon({
  tournamentName,
  seasonName,
  activePhase,
  className,
}: {
  tournamentName?: string;
  seasonName?: string;
  activePhase?: TournamentPhase;
  className?: string;
}) {
  if (!tournamentName) return null;
  const currentIndex = activePhase ? PHASES.indexOf(activePhase) : -1;

  return (
    <div
      className={cn(
        'relative z-20 border-b border-primary/15 bg-card/50 backdrop-blur-xl',
        className
      )}
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-bold uppercase tracking-wider text-accent">
            {tournamentName}
          </span>
          <span className="text-xs text-muted-foreground">{seasonName}</span>
        </div>
        <div className="hidden h-4 w-px bg-primary/20 sm:block" />
        <div className="flex flex-wrap items-center gap-1.5">
          {PHASES.map((phase, i) => {
            const isActive = phase === activePhase;
            const isPast = activePhase && i < currentIndex;
            return (
              <span
                key={phase}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-all',
                  isActive && 'bg-primary/20 text-primary ring-1 ring-primary/40 shadow-[0_0_12px_-2px_hsl(217_91%_56%/0.4)]',
                  isPast && !isActive && 'text-success/60',
                  !isActive && !isPast && 'text-muted-foreground/40'
                )}
              >
                {isActive && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
                {phase}
              </span>
            );
          })}
        </div>
      </div>
      <div className="divider-animated" />
    </div>
  );
}
