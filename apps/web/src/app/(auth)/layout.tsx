import type { ReactNode } from 'react';
import Link from 'next/link';
import { PageBackground } from '@/components/page-background';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <PageBackground withGrid />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <Link
          href="/"
          className="font-display mb-8 text-3xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Local Service Marketplace
        </Link>
        {children}
      </div>
    </main>
  );
}
