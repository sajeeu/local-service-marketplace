'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type {
  CategoryTreeNodeDto,
  CreateServiceRequest,
} from '@local-service-marketplace/shared-types';
import { PageHeader } from '@/components/page-header';
import { PageSkeleton } from '@/components/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
        title="New service"
        description="Save as a draft now. Publish once your provider profile is verified."
        backHref="/provider/services"
        backLabel="Back to services"
        className="mb-0"
      />
      <ServiceForm
        categories={categories}
        submitLabel="Create draft"
        onSubmit={async (payload) => {
          const created = await apiClient.createService(payload as CreateServiceRequest);
          toast.success('Service created');
          router.push(`/provider/services/${created.id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
