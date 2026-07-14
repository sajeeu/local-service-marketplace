import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password | Local Service Marketplace',
};

export default function ForgotPasswordPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground">
        Forgot password
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Enter your email and we will help you reset your password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
