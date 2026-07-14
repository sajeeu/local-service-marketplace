'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ProviderAvailabilityDto } from '@local-service-marketplace/shared-types';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { availabilitySchema, DAY_LABELS, type AvailabilityFormValues } from '../schemas';

export function AvailabilityEditor(): React.JSX.Element {
  const [slots, setSlots] = useState<ProviderAvailabilityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
  });

  async function loadSlots(): Promise<void> {
    setListError(null);
    try {
      const data = await apiClient.listMyAvailability();
      setSlots(data);
    } catch (error) {
      setListError(
        error instanceof ApiClientError ? error.message : 'Unable to load availability.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSlots();
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiClient.createMyAvailability(values);
      reset({
        dayOfWeek: values.dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        timezone: values.timezone,
      });
      await loadSlots();
    } catch (error) {
      setFormError(
        error instanceof ApiClientError ? error.message : 'Unable to add availability slot.',
      );
    }
  });

  async function handleDelete(id: string): Promise<void> {
    setDeletingId(id);
    setFormError(null);
    try {
      await apiClient.deleteMyAvailability(id);
      await loadSlots();
    } catch (error) {
      setFormError(
        error instanceof ApiClientError ? error.message : 'Unable to delete availability slot.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading availability…</p>;
  }

  return (
    <div className="space-y-8">
      {listError ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {listError}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Weekly schedule</h2>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No availability slots yet. Add your weekly hours below.
          </p>
        ) : (
          <ul className="space-y-2">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {DAY_LABELS[slot.dayOfWeek]} · {slot.startTime}–{slot.endTime}
                  </p>
                  <p className="text-sm text-muted-foreground">{slot.timezone}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === slot.id}
                  onClick={() => void handleDelete(slot.id)}
                >
                  {deletingId === slot.id ? 'Removing…' : 'Remove'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <h2 className="text-lg font-semibold text-foreground">Add slot</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day of week</Label>
            <Select id="dayOfWeek" {...register('dayOfWeek', { valueAsNumber: true })}>
              {DAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              aria-invalid={Boolean(errors.timezone)}
              {...register('timezone')}
            />
            {errors.timezone ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.timezone.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">Start time</Label>
            <Input
              id="startTime"
              type="time"
              aria-invalid={Boolean(errors.startTime)}
              {...register('startTime')}
            />
            {errors.startTime ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.startTime.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End time</Label>
            <Input
              id="endTime"
              type="time"
              aria-invalid={Boolean(errors.endTime)}
              {...register('endTime')}
            />
            {errors.endTime ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.endTime.message}
              </p>
            ) : null}
          </div>
        </div>

        {formError ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add availability'}
        </Button>
      </form>
    </div>
  );
}
