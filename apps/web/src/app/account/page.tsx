'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AuthUser } from '@local-service-marketplace/shared-types';
import { Button } from '@/components/ui/button';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { clearSession, getRefreshToken } from '@/features/auth/session';
import { OrganizationCard } from '@/features/tenancy/components/organization-card';
import { TenantSelector } from '@/features/tenancy/components/tenant-selector';
import { TenantProvider, useTenantContext } from '@/features/tenancy/tenant-provider';

function AccountContent() {
  const router = useRouter();
  const { current, tenants } = useTenantContext();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const identity = await apiClient.me();
        if (!cancelled) {
          setUser(identity.user);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError ? err.message : 'Unable to load your account.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout(): Promise<void> {
    setLoggingOut(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }
    } catch {
      // Still clear local session even if API logout fails.
    } finally {
      await clearSession();
      router.push('/login');
      router.refresh();
    }
  }

  const ownsBusiness = tenants.some(
    (item) => item.tenant.type === 'BUSINESS' && item.membership.role === 'OWNER',
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(199_89%_90%)_0%,_transparent_55%),linear-gradient(180deg,_hsl(40_33%_98%)_0%,_hsl(200_20%_96%)_100%)]"
      />
      <div className="relative mx-auto max-w-2xl px-6 py-16">
        <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Local Service Marketplace
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground">
          Your account
        </h1>
        <p className="mt-3 text-muted-foreground">
          Identity and workspace details for the signed-in user.
        </p>

        <div className="mt-10 space-y-6 border-t border-border pt-8">
          {loading ? <p className="text-sm text-muted-foreground">Loading your identity…</p> : null}
          {error ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {user ? (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 text-base font-medium text-foreground">{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1 text-base font-medium text-foreground">{user.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Roles</dt>
                <dd className="mt-1 text-base font-medium text-foreground">
                  {user.roles.join(', ')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Permissions</dt>
                <dd className="mt-1 text-base font-medium text-foreground">
                  {user.permissions.length > 0 ? user.permissions.join(', ') : 'None'}
                </dd>
              </div>
            </dl>
          ) : null}

          <TenantSelector />

          {current?.organization ? (
            <OrganizationCard
              organization={current.organization}
              tenantName={current.tenant.name}
            />
          ) : current ? (
            <p className="text-sm text-muted-foreground">
              Individual workspace — no organization attached.
            </p>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button onClick={() => void handleLogout()} disabled={loggingOut}>
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
          {!ownsBusiness ? (
            <Button asChild variant="secondary">
              <Link href="/organization/create">Create organization</Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <TenantProvider>
      <AccountContent />
    </TenantProvider>
  );
}
