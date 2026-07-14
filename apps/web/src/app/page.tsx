import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(199_89%_90%)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_left,_hsl(174_42%_90%)_0%,_transparent_50%),linear-gradient(180deg,_hsl(40_33%_98%)_0%,_hsl(200_20%_96%)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(hsl(210_24%_12%_/_0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(210_24%_12%_/_0.04)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Local Service Marketplace
        </p>
        <h1 className="max-w-3xl text-5xl leading-tight font-semibold tracking-tight text-foreground md:text-6xl">
          Trusted local services, built for clarity and confidence.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Platform foundation is ready. Marketplace discovery, bookings, and provider tools come
          next.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/register">Create account</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/api-status">Check API status</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
