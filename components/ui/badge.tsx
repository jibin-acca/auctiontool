import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-primary/30 bg-primary/15 text-primary backdrop-blur-sm',
        secondary:
          'border-border/60 bg-secondary/60 text-secondary-foreground backdrop-blur-sm',
        destructive:
          'border-destructive/30 bg-destructive/15 text-destructive backdrop-blur-sm',
        success:
          'border-success/30 bg-success/15 text-success backdrop-blur-sm',
        warning:
          'border-warning/30 bg-warning/15 text-warning backdrop-blur-sm',
        gold:
          'border-accent/30 bg-accent/15 text-accent backdrop-blur-sm',
        outline: 'border-border/60 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
