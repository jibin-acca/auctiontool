import { cn } from '@/lib/utils';

interface TeamBadgeProps {
  initials: string;
  color: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export function TeamBadge({ initials, color, name, size = 'md', className }: TeamBadgeProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl font-bold font-display text-white shadow-lg ring-1 ring-white/10',
        sizeMap[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}aa)`,
        boxShadow: `0 4px 20px -4px ${color}66, inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
