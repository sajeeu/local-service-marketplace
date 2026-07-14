import type { Metadata } from 'next';
import Link from 'next/link';
import { OrganizationForm } from '@/features/tenancy/components/organization-form';
import { TenantProvider } from '@/features/tenancy/tenant-provider';

export const metadata: Metadata = {
  title: 'Create organization',
  description: 'Create a business organization workspace',
};

export default function CreateOrganizationPage() {
  return (
    <TenantProvider>
      <main className="relative min-h-screen overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(199_89%_90%)_0%,_transparent_55%),linear-gradient(180deg,_hsl(40_33%_98%)_0%,_hsl(200_20%_96%)_100%)]"
        />
        <div className="relative mx-auto max-w-lg px-6 py-16">
          <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
            Local Service Marketplace
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground">
            Create organization
          </h1>
          <p className="mt-3 text-muted-foreground">
            Create one business workspace. You can only own a single business organization.
          </p>

          <div className="mt-10">
            <OrganizationForm />
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/account" className="font-medium text-primary hover:underline">
              Back to account
            </Link>
          </p>
        </div>
      </main>
    </TenantProvider>
  );
}
