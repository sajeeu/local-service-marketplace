/// <reference types="vitest/globals" />
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationForm } from './organization-form';

const push = vi.fn();
const refresh = vi.fn();
const createOrganization = vi.fn();
const persistSession = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    createOrganization: (...args: unknown[]) => createOrganization(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    code = 'CONFLICT';
    status = 409;
  },
}));

vi.mock('@/features/auth/session', () => ({
  persistSession: (...args: unknown[]) => persistSession(...args),
}));

describe('OrganizationForm', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    createOrganization.mockReset();
    persistSession.mockReset();
  });

  it('validates required names', async () => {
    const user = userEvent.setup();
    render(<OrganizationForm />);

    await user.click(screen.getByRole('button', { name: /create organization/i }));

    expect(await screen.findByText(/legal name is required/i)).toBeInTheDocument();
    expect(createOrganization).not.toHaveBeenCalled();
  });

  it('submits organization details and persists session', async () => {
    const user = userEvent.setup();
    createOrganization.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@example.com',
        roles: ['BUSINESS'],
        permissions: [],
        status: 'ACTIVE',
        emailVerifiedAt: null,
        activeTenantId: 't1',
        createdAt: new Date().toISOString(),
      },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: '15m' },
      tenantContext: null,
    });
    persistSession.mockResolvedValue(undefined);

    render(<OrganizationForm />);

    await user.type(screen.getByLabelText(/legal name/i), 'Acme Ltd');
    await user.type(screen.getByLabelText(/display name/i), 'Acme');
    await user.click(screen.getByRole('button', { name: /create organization/i }));

    await waitFor(() => {
      expect(createOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          legalName: 'Acme Ltd',
          displayName: 'Acme',
        }),
      );
      expect(persistSession).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/account');
    });
  });
});
