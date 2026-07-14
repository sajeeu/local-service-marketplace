'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { persistSession } from '../session';

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      accountType: 'CUSTOMER',
      organizationName: '',
    },
  });

  const accountType = useWatch({ control, name: 'accountType' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const session = await apiClient.register({
        email: values.email,
        password: values.password,
        accountType: values.accountType,
        organizationName: values.accountType === 'BUSINESS' ? values.organizationName : undefined,
      });
      await persistSession(session);
      router.push('/account');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : 'Unable to create account. Try again.';
      setFormError(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="accountType">Account type</Label>
        <Select
          id="accountType"
          aria-invalid={Boolean(errors.accountType)}
          {...register('accountType')}
        >
          <option value="CUSTOMER">Customer</option>
          <option value="PROVIDER">Provider</option>
          <option value="BUSINESS">Business</option>
        </Select>
        {errors.accountType ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.accountType.message}
          </p>
        ) : null}
      </div>

      {accountType === 'BUSINESS' ? (
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization name</Label>
          <Input
            id="organizationName"
            aria-invalid={Boolean(errors.organizationName)}
            {...register('organizationName')}
          />
          {errors.organizationName ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.organizationName.message}
            </p>
          ) : null}
        </div>
      ) : null}

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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
