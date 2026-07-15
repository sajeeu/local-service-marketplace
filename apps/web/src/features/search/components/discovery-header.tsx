import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function DiscoveryHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-semibold text-primary">
          Marketplace
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/search"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Search
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
