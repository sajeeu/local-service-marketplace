'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import type { ServiceListItemDto } from '@local-service-marketplace/shared-types';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageSkeleton } from '@/components/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Services"
        description="Create drafts, publish verified offerings, and manage your catalog."
        className="mb-0"
        actions={
          <Button asChild>
            <Link href="/provider/services/new">New service</Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="No services yet"
          description="Create your first service listing to start appearing in search results."
          primaryAction={
            <Button asChild>
              <Link href="/provider/services/new">Create your first service</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((service) => (
            <li key={service.id}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/provider/services/${service.id}`}
                        className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {service.title}
                      </Link>
                      <ServiceStatusBadge status={service.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {service.categoryName ?? 'Uncategorized'} · {service.pricingModel}
                      {service.basePrice !== null
                        ? ` · ${service.currency} ${service.basePrice}`
                        : ''}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/provider/services/${service.id}/edit`}>Edit</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
