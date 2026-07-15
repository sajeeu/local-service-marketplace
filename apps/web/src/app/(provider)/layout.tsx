'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '@local-service-marketplace/shared-types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageBackground } from '@/components/page-background';
import { PageSkeleton } from '@/components/spinner';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { TenantProvider } from '@/features/tenancy/tenant-provider';
import { cn } from '@/lib/utils';

const PROVIDER_ROLES = new Set(['PROVIDER', 'BUSINESS', 'ADMIN']);

const PRIMARY_NAV = [
  {
    href: '/provider/profile',
    label: 'Profile',
    match: (path: string) => path.startsWith('/provider/profile'),
  },
  {
    href: '/provider/availability',
    label: 'Availability',
    match: (path: string) => path.startsWith('/provider/availability'),
  },
  {
    href: '/provider/services',
    label: 'Services',
    match: (path: string) => path.startsWith('/provider/services'),
  },
] as const;

const SETUP_NAV = [{ href: '/provider/onboarding', label: 'Onboarding' }] as const;

function ProviderShell({ children }: { children: ReactNode }): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function gate(): Promise<void> {
      try {
        const identity = await apiClient.me();
        const user: AuthUser = identity.user;
        const allowed = user.roles.some((role) => PROVIDER_ROLES.has(role));
        if (!allowed) {
          router.replace('/account');
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Unable to verify access.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void gate();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <PageBackground />
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-2 inline-block text-sm font-semibold tracking-[0.2em] text-primary uppercase transition-opacity hover:opacity-80"
            >
              Local Service Marketplace
            </Link>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Provider workspace
            </h1>
          </div>
          <Link
            href="/account"
            className="text-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to account
          </Link>
        </div>

        <nav
          aria-label="Provider"
          className="mb-8 -mx-1 flex gap-1 overflow-x-auto border-b border-border pb-px"
        >
          {PRIMARY_NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-t-md border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="ml-auto flex shrink-0 items-center gap-1 pl-2">
            {SETUP_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    active
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {loading ? <PageSkeleton /> : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {!loading && !error ? (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            {children}
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function ProviderLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <TenantProvider>
      <ProviderShell>{children}</ProviderShell>
    </TenantProvider>
  );
}
