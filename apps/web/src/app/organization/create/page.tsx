import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { OrganizationForm } from '@/features/tenancy/components/organization-form';
import { TenantProvider } from '@/features/tenancy/tenant-provider';

export const metadata: Metadata = {
  title: 'Create organization',
  description: 'Create a business organization workspace',
};

export default function CreateOrganizationPage() {
  return (
    <TenantProvider>
      <AppShell
        maxWidth="sm"
        topRight={
          <Button asChild variant="ghost" size="sm">
            <Link href="/account">Back to account</Link>
          </Button>
        }
      >
        <PageHeader
          title="Create organization"
          description="Create one business workspace. You can only own a single business organization."
          backHref="/account"
          backLabel="Back to account"
        />
        <OrganizationForm />
      </AppShell>
    </TenantProvider>
  );
}
