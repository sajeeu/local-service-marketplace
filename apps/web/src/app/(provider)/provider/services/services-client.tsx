'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ServiceListItemDto } from '@local-service-marketplace/shared-types';
import { Button } from '@/components/ui/button';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { ServiceStatusBadge } from '@/features/services/components/service-status-badge';

export function ServicesListPage(): React.JSX.Element {
  const [items, setItems] = useState<ServiceListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setError(null);
      try {
        const data = await apiClient.listMyServices();
        if (!cancelled) {
          setItems(data.items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Unable to load services.');
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

  if (loading) {
    return <p className="text-muted-foreground">Loading services…</p>;
  }

  if (error) {
    return (
      <p
        className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
            Services
          </h2>
          <p className="mt-1 text-muted-foreground">
            Create drafts, publish verified offerings, and manage your catalog.
          </p>
        </div>
        <Button asChild>
          <Link href="/provider/services/new">New service</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="space-y-3">
          <p className="text-muted-foreground">No services yet.</p>
          <Button asChild variant="outline">
            <Link href="/provider/services/new">Create your first service</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {items.map((service) => (
            <li key={service.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/provider/services/${service.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {service.title}
                  </Link>
                  <ServiceStatusBadge status={service.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {service.categoryName ?? 'Uncategorized'} · {service.pricingModel}
                  {service.basePrice !== null ? ` · ${service.currency} ${service.basePrice}` : ''}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/provider/services/${service.id}/edit`}>Edit</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
