'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField, getFormFieldAria } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <FormField
        id="email"
        label="Email"
        error={errors.email?.message}
        description="We will send a reset link if an account exists."
        required
      >
        <Input
          type="email"
          autoComplete="email"
          {...getFormFieldAria(
            'email',
            errors.email?.message,
            'We will send a reset link if an account exists.',
          )}
          {...register('email')}
        />
      </FormField>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert variant="success">
          <AlertDescription>
            <p>{successMessage}</p>
            {devResetToken ? (
              <p className="mt-2 break-all text-muted-foreground">
                Dev reset token:{' '}
                <Link
                  href={`/reset-password?token=${encodeURIComponent(devResetToken)}`}
                  className="font-medium text-primary hover:underline"
                >
                  Continue to reset
                </Link>
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
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
