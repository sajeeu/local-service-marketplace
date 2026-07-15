'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FormField, getFormFieldAria } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <FormField id="accountType" label="Account type" error={errors.accountType?.message} required>
        <Select
          {...getFormFieldAria('accountType', errors.accountType?.message)}
          {...register('accountType')}
        >
          <option value="CUSTOMER">Customer</option>
          <option value="PROVIDER">Provider</option>
          <option value="BUSINESS">Business</option>
        </Select>
      </FormField>

      {accountType === 'BUSINESS' ? (
        <FormField
          id="organizationName"
          label="Organization name"
          error={errors.organizationName?.message}
          required
        >
          <Input
            {...getFormFieldAria('organizationName', errors.organizationName?.message)}
            {...register('organizationName')}
          />
        </FormField>
      ) : null}

      <FormField id="email" label="Email" error={errors.email?.message} required>
        <Input
          type="email"
          autoComplete="email"
          {...getFormFieldAria('email', errors.email?.message)}
          {...register('email')}
        />
      </FormField>

      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
        description="Use at least 8 characters."
        required
      >
        <Input
          type="password"
          autoComplete="new-password"
          {...getFormFieldAria('password', errors.password?.message, 'Use at least 8 characters.')}
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
