'use client';

import type { OrganizationDto } from '@local-service-marketplace/shared-types';

interface OrganizationCardProps {
  organization: OrganizationDto;
  tenantName?: string;
}

export function OrganizationCard({ organization, tenantName }: OrganizationCardProps) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div>
        <p className="text-sm text-muted-foreground">Organization</p>
        <p className="mt-1 text-base font-medium text-foreground">{organization.displayName}</p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Legal name</dt>
          <dd className="mt-1 text-foreground">{organization.legalName}</dd>
        </div>
        {tenantName ? (
          <div>
            <dt className="text-muted-foreground">Tenant</dt>
            <dd className="mt-1 text-foreground">{tenantName}</dd>
          </div>
        ) : null}
        {organization.website ? (
          <div>
            <dt className="text-muted-foreground">Website</dt>
            <dd className="mt-1">
              <a
                href={organization.website}
                className="text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {organization.website}
              </a>
            </dd>
          </div>
        ) : null}
        {organization.phone ? (
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="mt-1 text-foreground">{organization.phone}</dd>
          </div>
        ) : null}
      </dl>
      {organization.description ? (
        <p className="text-sm text-muted-foreground">{organization.description}</p>
      ) : null}
    </div>
  );
}
