'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        <div className="space-y-2">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" aria-invalid={Boolean(errors.token)} {...register('token')} />
          {errors.token ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.token.message}
            </p>
          ) : null}
        </div>
      ) : (
        <input type="hidden" {...register('token')} />
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
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
        <p
          className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm"
          role="status"
        >
          {successMessage}
        </p>
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
