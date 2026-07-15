import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spinner } from '@/components/spinner';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in | Local Service Marketplace',
};

export default function LoginPage() {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Sign in
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Access your Local Service Marketplace account.
      </p>
      <Suspense fallback={<Spinner label="Loading form" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
