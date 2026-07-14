import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in | Local Service Marketplace',
};

export default function LoginPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground">
        Sign in
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Access your Local Service Marketplace account.
      </p>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
