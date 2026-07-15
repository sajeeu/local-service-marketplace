import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageBackground } from '@/components/page-background';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
  topRight?: ReactNode;
}

const maxWidthClass = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
} as const;

export function AppShell({ children, maxWidth = 'md', className, topRight }: AppShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <PageBackground />
      <div
        className={cn(
          'relative mx-auto px-4 py-12 sm:px-6 sm:py-16',
          maxWidthClass[maxWidth],
          className,
        )}
      >
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.2em] text-primary uppercase transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Local Service Marketplace
          </Link>
          {topRight}
        </div>
        {children}
      </div>
    </main>
  );
}
