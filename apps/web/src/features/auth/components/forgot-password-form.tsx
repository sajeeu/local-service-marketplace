'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas';

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);
    setDevResetToken(null);
    try {
      const result = await apiClient.forgotPassword(values.email);
      setSuccessMessage(result.message);
      if (result.resetToken) {
        setDevResetToken(result.resetToken);
      }
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : 'Unable to request reset. Try again.';
      setFormError(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <div className="space-y-3 rounded-md border border-accent/30 bg-accent/5 px-3 py-3 text-sm text-foreground">
          <p role="status">{successMessage}</p>
          {devResetToken ? (
            <p className="break-all text-muted-foreground">
              Dev reset token:{' '}
              <Link
                href={`/reset-password?token=${encodeURIComponent(devResetToken)}`}
                className="font-medium text-primary hover:underline"
              >
                Continue to reset
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
