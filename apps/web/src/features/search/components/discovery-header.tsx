import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DiscoveryHeaderProps {
  className?: string;
  showSearchLink?: boolean;
}

export function DiscoveryHeader({ className, showSearchLink = true }: DiscoveryHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className,
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-xl"
        >
          Local Service Marketplace
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Primary">
          {showSearchLink ? (
            <Link
              href="/search"
              className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Search
            </Link>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
