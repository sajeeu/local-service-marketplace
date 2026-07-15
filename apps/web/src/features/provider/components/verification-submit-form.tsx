'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ProviderPrivateProfileDto } from '@local-service-marketplace/shared-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { verificationSubmitSchema, type VerificationSubmitFormValues } from '../schemas';

interface VerificationSubmitFormProps {
  disabled?: boolean;
  onSuccess?: (profile: ProviderPrivateProfileDto) => void;
}

export function VerificationSubmitForm({
  disabled,
  onSuccess,
}: VerificationSubmitFormProps): React.JSX.Element {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VerificationSubmitFormValues>({
    resolver: zodResolver(verificationSubmitSchema),
    defaultValues: {
      filename: '',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      url: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccess(false);
    try {
      const profile = await apiClient.submitMyVerification({
        documents: [
          {
            filename: values.filename,
            mimeType: values.mimeType,
            sizeBytes: values.sizeBytes,
            url: values.url || undefined,
          },
        ],
      });
      reset();
      setSuccess(true);
      toast.success('Verification submitted');
      onSuccess?.(profile);
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to submit verification documents.',
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Upload integration is coming later. For now, submit document metadata (filename, type, size,
        and optional URL).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="filename">Filename</Label>
          <Input
            id="filename"
            aria-invalid={Boolean(errors.filename)}
            disabled={disabled}
            {...register('filename')}
          />
          {errors.filename ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.filename.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mimeType">MIME type</Label>
          <Input
            id="mimeType"
            aria-invalid={Boolean(errors.mimeType)}
            disabled={disabled}
            {...register('mimeType')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sizeBytes">Size (bytes)</Label>
          <Input
            id="sizeBytes"
            type="number"
            min={1}
            aria-invalid={Boolean(errors.sizeBytes)}
            disabled={disabled}
            {...register('sizeBytes')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="docUrl">Document URL</Label>
          <Input
            id="docUrl"
            type="url"
            placeholder="https://"
            disabled={disabled}
            {...register('url')}
          />
        </div>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert variant="success">
          <AlertDescription>Verification submitted for review.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Submit for verification'}
      </Button>
    </form>
  );
}
