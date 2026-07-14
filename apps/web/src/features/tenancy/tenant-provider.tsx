'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  CurrentTenantResponse,
  TenantListItem,
} from '@local-service-marketplace/shared-types';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { getStoredTenantContext, persistSession } from '@/features/auth/session';

interface TenantContextValue {
  tenants: TenantListItem[];
  current: CurrentTenantResponse | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [current, setCurrent] = useState<CurrentTenantResponse | null>(() =>
    getStoredTenantContext(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [list, currentTenant] = await Promise.all([
        apiClient.listTenants(),
        apiClient.getCurrentTenant().catch((err: unknown) => {
          if (err instanceof ApiClientError && (err.status === 403 || err.status === 404)) {
            return null;
          }
          throw err;
        }),
      ]);
      setTenants(list);
      setCurrent(currentTenant);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Unable to load tenant context.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const switchTenant = useCallback(
    async (tenantId: string) => {
      setRefreshing(true);
      setError(null);
      try {
        const session = await apiClient.switchTenant(tenantId);
        await persistSession(session);
        setCurrent(session.tenantContext ?? null);
        await refresh();
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Unable to switch tenant.';
        setError(message);
        setRefreshing(false);
        throw err;
      }
    },
    [refresh],
  );

  return (
    <TenantContext.Provider
      value={{
        tenants,
        current,
        loading,
        error,
        refreshing,
        switchTenant,
        refresh,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext(): TenantContextValue {
  const value = useContext(TenantContext);
  if (!value) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }
  return value;
}
