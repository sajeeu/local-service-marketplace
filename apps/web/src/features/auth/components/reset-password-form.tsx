'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField, getFormFieldAria } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams.get('token') ?? '';
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromQuery,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const result = await apiClient.resetPassword({
        token: values.token,
        password: values.password,
      });
      setSuccessMessage(result.message);
      toast.success('Password updated');
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : 'Unable to reset password. Try again.';
      setFormError(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {!tokenFromQuery ? (
        <FormField id="token" label="Reset token" error={errors.token?.message} required>
          <Input {...getFormFieldAria('token', errors.token?.message)} {...register('token')} />
        </FormField>
      ) : (
        <input type="hidden" {...register('token')} />
      )}

      <FormField id="password" label="New password" error={errors.password?.message} required>
        <Input
          type="password"
          autoComplete="new-password"
          {...getFormFieldAria('password', errors.password?.message)}
          {...register('password')}
        />
      </FormField>

      <FormField
        id="confirmPassword"
        label="Confirm password"
        error={errors.confirmPassword?.message}
        required
      >
        <Input
          type="password"
          autoComplete="new-password"
          {...getFormFieldAria('confirmPassword', errors.confirmPassword?.message)}
          {...register('confirmPassword')}
        />
      </FormField>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert variant="success">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Updating…' : 'Reset password'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
