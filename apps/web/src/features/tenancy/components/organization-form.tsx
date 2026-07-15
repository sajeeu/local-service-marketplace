'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { persistSession } from '@/features/auth/session';
import { organizationSchema, type OrganizationFormValues } from '../schemas';

export function OrganizationForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      legalName: '',
      displayName: '',
      description: '',
      phone: '',
      website: '',
      logo: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const session = await apiClient.createOrganization({
        legalName: values.legalName,
        displayName: values.displayName,
        description: values.description || undefined,
        phone: values.phone || undefined,
        website: values.website || undefined,
        logo: values.logo || undefined,
      });
      await persistSession(session);
      toast.success('Organization created');
      router.push('/account');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Unable to create organization. Try again.';
      setFormError(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="legalName">Legal name</Label>
        <Input id="legalName" aria-invalid={Boolean(errors.legalName)} {...register('legalName')} />
        {errors.legalName ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.legalName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          aria-invalid={Boolean(errors.displayName)}
          {...register('displayName')}
        />
        {errors.displayName ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.displayName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" {...register('phone')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://"
          aria-invalid={Boolean(errors.website)}
          {...register('website')}
        />
        {errors.website ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.website.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating organization…' : 'Create organization'}
      </Button>
    </form>
  );
}
