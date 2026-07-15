'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ServiceDto } from '@local-service-marketplace/shared-types';
import { PageHeader } from '@/components/page-header';
import { PageSkeleton } from '@/components/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { ConfirmDialog } from '@/features/services/components/confirm-dialog';
import { ServiceStatusBadge } from '@/features/services/components/service-status-badge';

export function ServiceDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const serviceId = params.id;

  const [service, setService] = useState<ServiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const data = await apiClient.getService(serviceId);
      setService(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load service.');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    action: () => Promise<ServiceDto | void>,
    successMessage?: string,
  ): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      const result = await action();
      if (result) {
        setService(result);
      }
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
      setPublishOpen(false);
      setDeleteOpen(false);
    }
  }

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
        title={service.title}
        description={service.shortDescription || 'No short description.'}
        backHref="/provider/services"
        backLabel="Back to services"
        className="mb-0"
        actions={
          <div className="flex flex-wrap gap-2">
            <ServiceStatusBadge status={service.status} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/provider/services/${service.id}/edit`}>Edit</Link>
            </Button>
          </div>
        }
      />
      <p className="text-sm text-muted-foreground">Slug: {service.slug}</p>
      <div className="flex flex-wrap gap-2">
        {service.status === 'DRAFT' || service.status === 'PAUSED' ? (
          <Button type="button" onClick={() => setPublishOpen(true)} disabled={busy}>
            Publish
          </Button>
        ) : null}
        {service.status === 'PUBLISHED' ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runAction(() => apiClient.pauseService(service.id), 'Service paused')
            }
          >
            Pause
          </Button>
        ) : null}
        {service.status !== 'ARCHIVED' ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runAction(() => apiClient.archiveService(service.id), 'Service archived')
            }
          >
            Archive
          </Button>
        ) : null}
        {service.status !== 'PUBLISHED' ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Pricing</dt>
          <dd className="font-medium">
            {service.pricingModel}
            {service.basePrice !== null ? ` · ${service.currency} ${service.basePrice}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Duration</dt>
          <dd className="font-medium">
            {service.duration ? `${service.duration} minutes` : 'Not set'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Category</dt>
          <dd className="font-medium">{service.category?.name ?? service.categoryId}</dd>
        </div>
      </dl>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Description</h3>
        <p className="whitespace-pre-wrap text-muted-foreground">
          {service.description || 'No description yet.'}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Locations</h3>
        {service.locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No locations configured.</p>
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {service.locations.map((location) => (
              <li key={location.id}>
                {location.type}
                {location.city ? ` · ${location.city}` : ''}
                {location.country ? `, ${location.country}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">FAQs</h3>
        {service.faqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No FAQs yet.</p>
        ) : (
          <ul className="space-y-3">
            {service.faqs.map((faq) => (
              <li key={faq.id}>
                <p className="font-medium">{faq.question}</p>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Requirements</h3>
        {service.requirements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requirements listed.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {service.requirements.map((requirement) => (
              <li key={requirement.id}>
                {requirement.description}
                {requirement.isRequired ? ' (required)' : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={publishOpen}
        title="Publish this service?"
        description="Publishing requires a verified provider profile and complete required fields."
        confirmLabel="Publish"
        confirming={busy}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() =>
          void runAction(() => apiClient.publishService(service.id), 'Service published')
        }
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this service?"
        description="This permanently removes the draft or archived service."
        confirmLabel="Delete"
        confirming={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() =>
          void runAction(async () => {
            await apiClient.deleteService(service.id);
            router.push('/provider/services');
            router.refresh();
          }, 'Service deleted')
        }
      />
    </div>
  );
}
