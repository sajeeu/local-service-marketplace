'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type {
  CategoryTreeNodeDto,
  ServiceDto,
  UpdateServiceRequest,
} from '@local-service-marketplace/shared-types';
import { PageHeader } from '@/components/page-header';
import { PageSkeleton } from '@/components/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    return <PageSkeleton />;
  }

  if (error || !service) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? 'Service not found.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Edit service"
        description={service.title}
        backHref={`/provider/services/${service.id}`}
        backLabel="Back to service"
        className="mb-0"
      />
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
          toast.success('Service updated');
          router.push(`/provider/services/${updated.id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
