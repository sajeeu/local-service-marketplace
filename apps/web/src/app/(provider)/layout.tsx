'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '@local-service-marketplace/shared-types';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { TenantProvider } from '@/features/tenancy/tenant-provider';

const PROVIDER_ROLES = new Set(['PROVIDER', 'BUSINESS', 'ADMIN']);

const NAV = [
  { href: '/provider/profile', label: 'Profile' },
  { href: '/provider/profile/edit', label: 'Edit' },
  { href: '/provider/availability', label: 'Availability' },
  { href: '/provider/onboarding', label: 'Onboarding' },
] as const;

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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(199_89%_90%)_0%,_transparent_55%),linear-gradient(180deg,_hsl(40_33%_98%)_0%,_hsl(200_20%_96%)_100%)]"
      />
      <div className="relative mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
              Local Service Marketplace
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground">
              Provider workspace
            </h1>
          </div>
          <Link href="/account" className="text-sm text-primary hover:underline">
            Back to account
          </Link>
        </div>

        <nav
          aria-label="Provider"
          className="mb-10 flex flex-wrap gap-4 border-b border-border pb-4"
        >
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? 'text-sm font-semibold text-foreground'
                    : 'text-sm text-muted-foreground hover:text-foreground'
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {loading ? <p className="text-muted-foreground">Loading…</p> : null}
        {error ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {!loading && !error ? children : null}
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
