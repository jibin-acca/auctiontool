import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'glass-card relative flex flex-col items-center justify-center overflow-hidden rounded-xl px-6 py-16 text-center',
        className
      )}
    >
      {/* Spotlight effect behind icon */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-[60%] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-20" />

      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20">
        <Icon className="h-8 w-8" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 animate-glow-pulse" />
      </div>
      <h3 className="relative font-display text-lg font-bold uppercase tracking-wide">{title}</h3>
      {description && (
        <p className="relative mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}
