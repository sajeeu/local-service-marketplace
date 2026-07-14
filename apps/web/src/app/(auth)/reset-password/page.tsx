import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset password | Local Service Marketplace',
};

export default function ResetPasswordPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground">
        Reset password
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">Choose a new password for your account.</p>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
