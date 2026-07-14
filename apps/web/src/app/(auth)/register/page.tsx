import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = {
  title: 'Create account | Local Service Marketplace',
};

export default function RegisterPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground">
        Create account
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Register with email to get started as a customer.
      </p>
      <RegisterForm />
    </div>
  );
}
