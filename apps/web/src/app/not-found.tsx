import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/page-background';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <PageBackground withGrid />
      <div className="relative mx-auto max-w-md text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Local Service Marketplace
        </p>
        <h1 className="font-display mb-3 text-4xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mb-8 text-muted-foreground">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">Browse services</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
