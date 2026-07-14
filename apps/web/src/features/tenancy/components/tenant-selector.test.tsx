/// <reference types="vitest/globals" />
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantSelector } from './tenant-selector';

const switchTenant = vi.fn();

vi.mock('../tenant-provider', () => ({
  useTenantContext: () => ({
    tenants: [
      {
        tenant: {
          id: 't1',
          name: 'Personal',
          slug: 'personal',
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        organization: null,
        membership: {
          id: 'm1',
          userId: 'u1',
          tenantId: 't1',
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      {
        tenant: {
          id: 't2',
          name: 'Acme',
          slug: 'acme',
          type: 'BUSINESS',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        organization: {
          id: 'o1',
          tenantId: 't2',
          legalName: 'Acme Ltd',
          displayName: 'Acme',
          description: null,
          phone: null,
          website: null,
          logo: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        membership: {
          id: 'm2',
          userId: 'u1',
          tenantId: 't2',
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    ],
    current: {
      tenant: {
        id: 't1',
        name: 'Personal',
        slug: 'personal',
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      organization: null,
      membership: {
        id: 'm1',
        userId: 'u1',
        tenantId: 't1',
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
      permissions: ['tenant.read'],
    },
    loading: false,
    refreshing: false,
    error: null,
    switchTenant: (...args: unknown[]) => switchTenant(...args),
    refresh: vi.fn(),
  }),
}));

describe('TenantSelector', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    switchTenant.mockReset();
    switchTenant.mockResolvedValue(undefined);
  });

  it('switches tenant when a different workspace is selected', async () => {
    const user = userEvent.setup();
    render(<TenantSelector />);

    await user.selectOptions(screen.getByLabelText(/active workspace/i), 't2');

    await waitFor(() => {
      expect(switchTenant).toHaveBeenCalledWith('t2');
    });
  });
});
