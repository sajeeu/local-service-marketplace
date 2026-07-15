'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type {
  CategoryTreeNodeDto,
  CreateServiceRequest,
  ServiceDto,
  UpdateServiceRequest,
} from '@local-service-marketplace/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiClientError } from '@/lib/api-client';
import { emptyServiceFormValues, serviceFormSchema, type ServiceFormValues } from '../schemas';
import { CategorySelector } from './category-selector';
import { FaqEditor } from './faq-editor';
import { LocationEditor } from './location-editor';
import { MediaGalleryEditor } from './media-gallery-editor';
import { PricingEditor } from './pricing-editor';
import { RequirementsEditor } from './requirements-editor';

function nullableNumber(value: number | '' | undefined | null): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === '' || value === null) {
    return null;
  }
  return value;
}

function toPayload(values: ServiceFormValues): CreateServiceRequest {
  return {
    categoryId: values.categoryId,
    title: values.title.trim(),
    shortDescription: values.shortDescription?.trim() || null,
    description: values.description?.trim() || null,
    pricingModel: values.pricingModel,
    basePrice: nullableNumber(values.basePrice) ?? null,
    currency: values.currency.toUpperCase(),
    duration: nullableNumber(values.duration) ?? null,
    cancellationPolicy: values.cancellationPolicy?.trim() || null,
    instantBookingEnabled: values.instantBookingEnabled,
    featured: values.featured,
    tags: values.tags.map((tag) => tag.trim()).filter(Boolean),
    locations: values.locations.map((location) => ({
      type: location.type,
      city: location.city?.trim() || null,
      state: location.state?.trim() || null,
      country: location.country?.trim() || null,
      latitude: nullableNumber(location.latitude) ?? null,
      longitude: nullableNumber(location.longitude) ?? null,
      serviceRadius: nullableNumber(location.serviceRadius) ?? null,
    })),
    faqs: values.faqs.map((faq, index) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      sortOrder: faq.sortOrder ?? index,
    })),
    requirements: values.requirements.map((requirement, index) => ({
      description: requirement.description.trim(),
      isRequired: requirement.isRequired,
      sortOrder: requirement.sortOrder ?? index,
    })),
    media: values.media.map((media, index) => ({
      type: media.type,
      url: media.url.trim(),
      altText: media.altText?.trim() || null,
      sortOrder: media.sortOrder ?? index,
    })),
  };
}

function toFormValues(service: ServiceDto): ServiceFormValues {
  return {
    categoryId: service.categoryId,
    title: service.title,
    shortDescription: service.shortDescription ?? '',
    description: service.description ?? '',
    pricingModel: service.pricingModel,
    basePrice: service.basePrice ?? undefined,
    currency: service.currency,
    duration: service.duration ?? undefined,
    cancellationPolicy: service.cancellationPolicy ?? '',
    instantBookingEnabled: service.instantBookingEnabled,
    featured: service.featured,
    tags: service.tags.map((tag) => tag.name),
    locations: service.locations.map((location) => ({
      type: location.type,
      city: location.city ?? '',
      state: location.state ?? '',
      country: location.country ?? '',
      latitude: location.latitude ?? undefined,
      longitude: location.longitude ?? undefined,
      serviceRadius: location.serviceRadius ?? undefined,
    })),
    faqs: service.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
    })),
    requirements: service.requirements.map((requirement) => ({
      description: requirement.description,
      isRequired: requirement.isRequired,
      sortOrder: requirement.sortOrder,
    })),
    media: service.media.map((media) => ({
      type: media.type,
      url: media.url,
      altText: media.altText ?? '',
      sortOrder: media.sortOrder,
    })),
  };
}

interface ServiceFormProps {
  categories: CategoryTreeNodeDto[];
  initial?: ServiceDto;
  submitLabel: string;
  onSubmit: (payload: CreateServiceRequest | UpdateServiceRequest) => Promise<void>;
}

export function ServiceForm({
  categories,
  initial,
  submitLabel,
  onSubmit,
}: ServiceFormProps): React.JSX.Element {
  const defaults = useMemo(
    () => (initial ? toFormValues(initial) : emptyServiceFormValues()),
    [initial],
  );
  const [tagDraft, setTagDraft] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    // zod preprocess + resolver generics can diverge; values remain ServiceFormValues at runtime
    resolver: zodResolver(serviceFormSchema) as never,
    defaultValues: defaults,
  });

  const pricingModel = useWatch({ control, name: 'pricingModel' });
  const tags = useWatch({ control, name: 'tags' }) ?? [];

  const onValid = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : 'Unable to save service.');
    }
  });

  return (
    <form className="space-y-10" onSubmit={onValid} noValidate>
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Basics</h3>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <CategorySelector
              categories={categories}
              value={field.value}
              onChange={field.onChange}
              error={errors.categoryId?.message}
            />
          )}
        />
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title')} />
          {errors.title?.message ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.title.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short description</Label>
          <Input id="shortDescription" {...register('shortDescription')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={8} {...register('description')} />
          <p className="text-xs text-muted-foreground">
            Publishing requires a detailed description (20+ characters).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input id="duration" type="number" min={1} {...register('duration')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancellationPolicy">Cancellation policy</Label>
            <Input id="cancellationPolicy" {...register('cancellationPolicy')} />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('instantBookingEnabled')} />
            Instant booking enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('featured')} />
            Featured listing
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Pricing</h3>
        <PricingEditor control={control} errors={errors} pricingModel={pricingModel} />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-md border border-border px-2 py-1 text-sm hover:bg-muted"
              onClick={() =>
                setValue(
                  'tags',
                  tags.filter((item) => item !== tag),
                  { shouldDirty: true },
                )
              }
            >
              {tag} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            placeholder="Add a tag"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                const next = tagDraft.trim();
                if (next && !tags.includes(next) && tags.length < 20) {
                  setValue('tags', [...tags, next], { shouldDirty: true });
                  setTagDraft('');
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const next = tagDraft.trim();
              if (next && !tags.includes(next) && tags.length < 20) {
                setValue('tags', [...tags, next], { shouldDirty: true });
                setTagDraft('');
              }
            }}
          >
            Add
          </Button>
        </div>
      </section>

      <LocationEditor control={control} register={register} errors={errors} />
      <MediaGalleryEditor control={control} register={register} errors={errors} />
      <FaqEditor control={control} register={register} errors={errors} />
      <RequirementsEditor control={control} register={register} errors={errors} />

      {serverError ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {serverError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}

export { toFormValues, toPayload };
