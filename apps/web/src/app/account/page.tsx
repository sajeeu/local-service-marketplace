'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, Briefcase, Plus } from 'lucide-react';
import type { AuthUser } from '@local-service-marketplace/shared-types';
import { AppShell } from '@/components/app-shell';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageSkeleton } from '@/components/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const canManageProvider = user?.roles.some(
    (role) => role === 'PROVIDER' || role === 'BUSINESS' || role === 'ADMIN',
  );

  return (
    <AppShell
      maxWidth="md"
      topRight={
        <Button variant="ghost" size="sm" onClick={() => void handleLogout()} disabled={loggingOut}>
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      }
    >
      <PageHeader
        title="Your account"
        description="Manage your identity, workspaces, and provider tools."
        className="mb-6"
      />

      {loading ? <PageSkeleton /> : null}
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {user && !loading ? (
        <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signed in as</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-lg font-medium text-foreground">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{user.status}</Badge>
                {user.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Workspaces</h2>
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
            {tenants.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No workspaces yet"
                description="Create an organization to collaborate with a team, or continue as an individual."
                primaryAction={
                  <Button asChild>
                    <Link href="/organization/create">
                      <Plus className="size-4" aria-hidden />
                      Create organization
                    </Link>
                  </Button>
                }
                className="py-10"
              />
            ) : null}
          </section>

          <section className="flex flex-wrap gap-3 border-t border-border pt-6">
            {canManageProvider ? (
              <Button asChild>
                <Link href="/provider/profile">
                  <Briefcase className="size-4" aria-hidden />
                  Provider workspace
                </Link>
              </Button>
            ) : null}
            {!ownsBusiness ? (
              <Button asChild variant="secondary">
                <Link href="/organization/create">Create organization</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function AccountPage() {
  return (
    <TenantProvider>
      <AccountContent />
    </TenantProvider>
  );
}
