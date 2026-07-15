'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField, getFormFieldAria } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { loginSchema, type LoginFormValues } from '../schemas';
import { persistSession } from '../session';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const session = await apiClient.login(values);
      await persistSession(session);
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : 'Unable to sign in. Try again.';
      setFormError(message);
    }
  });

  const emailError = errors.email?.message;
  const passwordError = errors.password?.message;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField id="email" label="Email" error={emailError} required>
        <Input
          type="email"
          autoComplete="email"
          {...getFormFieldAria('email', emailError)}
          {...register('email')}
        />
      </FormField>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-sm leading-none font-medium text-foreground">
            Password
          </label>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          type="password"
          autoComplete="current-password"
          {...getFormFieldAria('password', passwordError)}
          {...register('password')}
        />
        {passwordError ? (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {passwordError}
          </p>
        ) : null}
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
