'use client';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useTenantContext } from '../tenant-provider';

export function TenantSelector() {
  const { tenants, current, loading, refreshing, error, switchTenant } = useTenantContext();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading workspaces…</p>;
  }

  if (tenants.length === 0) {
    return <p className="text-sm text-muted-foreground">No workspaces available.</p>;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="tenant-selector">Active workspace</Label>
      <Select
        id="tenant-selector"
        value={current?.tenant.id ?? ''}
        disabled={refreshing || tenants.length < 2}
        onChange={(event) => {
          const next = event.target.value;
          if (next && next !== current?.tenant.id) {
            void switchTenant(next);
          }
        }}
      >
        {tenants.map((item) => (
          <option key={item.tenant.id} value={item.tenant.id}>
            {item.organization?.displayName ?? item.tenant.name} ({item.tenant.type})
          </option>
        ))}
      </Select>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {refreshing ? <p className="text-xs text-muted-foreground">Switching…</p> : null}
    </div>
  );
}
