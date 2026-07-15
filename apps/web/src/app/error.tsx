'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/page-background';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <PageBackground withGrid />
      <div className="relative mx-auto max-w-md text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Local Service Marketplace
        </p>
        <h1 className="font-display mb-3 text-4xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mb-8 text-muted-foreground">
          We ran into an unexpected problem. You can try again or return to the home page.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
