'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type {
  CategoryTreeNodeDto,
  ServiceDto,
  UpdateServiceRequest,
} from '@local-service-marketplace/shared-types';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { ServiceForm } from '@/features/services/components/service-form';

export function EditServicePage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryTreeNodeDto[]>([]);
  const [service, setService] = useState<ServiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const [tree, detail] = await Promise.all([
          apiClient.getCategoryTree(),
          apiClient.getService(params.id),
        ]);
        if (!cancelled) {
          setCategories(tree);
          setService(detail);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Unable to load service.');
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
  }, [params.id]);

  if (loading) {
    return <p className="text-muted-foreground">Loading editor…</p>;
  }

  if (error || !service) {
    return (
      <p
        className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
        {error ?? 'Service not found.'}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          Edit service
        </h2>
        <p className="mt-1 text-muted-foreground">{service.title}</p>
      </div>
      <ServiceForm
        categories={categories}
        initial={service}
        submitLabel="Save changes"
        onSubmit={async (payload) => {
          const updated = await apiClient.updateService(
            service.id,
            payload as UpdateServiceRequest,
          );
          setService(updated);
          router.push(`/provider/services/${updated.id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
