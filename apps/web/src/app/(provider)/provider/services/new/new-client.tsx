'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CategoryTreeNodeDto,
  CreateServiceRequest,
} from '@local-service-marketplace/shared-types';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { ServiceForm } from '@/features/services/components/service-form';

export function NewServicePage(): React.JSX.Element {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryTreeNodeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const tree = await apiClient.getCategoryTree();
        if (!cancelled) {
          setCategories(tree);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Unable to load categories.');
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
    return <p className="text-muted-foreground">Loading form…</p>;
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
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          New service
        </h2>
        <p className="mt-1 text-muted-foreground">
          Save as a draft now. Publish once your provider profile is verified.
        </p>
      </div>
      <ServiceForm
        categories={categories}
        submitLabel="Create draft"
        onSubmit={async (payload) => {
          const created = await apiClient.createService(payload as CreateServiceRequest);
          router.push(`/provider/services/${created.id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
