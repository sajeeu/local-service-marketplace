import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(199_89%_90%)_0%,_transparent_50%),linear-gradient(180deg,_hsl(40_33%_98%)_0%,_hsl(200_20%_96%)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(hsl(210_24%_12%_/_0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(210_24%_12%_/_0.04)_1px,transparent_1px)] [background-size:40px_40px]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Link
          href="/"
          className="mb-8 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          Local Service Marketplace
        </Link>
        {children}
      </div>
    </main>
  );
}
