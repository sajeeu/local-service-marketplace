import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Search,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-4 py-16 text-center', className)}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="font-display mb-2 text-xl font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mb-6 max-w-md text-muted-foreground">{description}</p>
      ) : (
        <div className="mb-6" />
      )}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
