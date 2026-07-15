import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spinner } from '@/components/spinner';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset password | Local Service Marketplace',
};

export default function ResetPasswordPage() {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Reset password
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">Choose a new password for your account.</p>
      <Suspense fallback={<Spinner label="Loading form" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
