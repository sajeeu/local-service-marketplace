/// <reference types="vitest/globals" />
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './register-form';

const push = vi.fn();
const refresh = vi.fn();
const registerApi = vi.fn();
const persistSession = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    register: (...args: unknown[]) => registerApi(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    code = 'CONFLICT';
    status = 409;
  },
}));

vi.mock('../session', () => ({
  persistSession: (...args: unknown[]) => persistSession(...args),
}));

describe('RegisterForm', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    registerApi.mockReset();
    persistSession.mockReset();
  });

  it('validates password confirmation mismatch', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different1!');
    await user.click(screen.getByRole('button', { name: /^create account$/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(registerApi).not.toHaveBeenCalled();
  });

  it('requires organization name for business accounts', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.selectOptions(screen.getByLabelText(/account type/i), 'BUSINESS');
    await user.type(screen.getByLabelText(/^email$/i), 'biz@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: /^create account$/i }));

    expect(await screen.findByText(/organization name is required/i)).toBeInTheDocument();
    expect(registerApi).not.toHaveBeenCalled();
  });

  it('submits account type with registration', async () => {
    const user = userEvent.setup();
    registerApi.mockResolvedValue({
      user: {
        id: '1',
        email: 'new@example.com',
        roles: ['CUSTOMER'],
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

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: /^create account$/i }));

    await waitFor(() => {
      expect(registerApi).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          accountType: 'CUSTOMER',
        }),
      );
    });
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    let resolveRegister: (value: unknown) => void = () => undefined;
    registerApi.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve;
        }),
    );
    persistSession.mockResolvedValue(undefined);

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: /^create account$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    resolveRegister({
      user: {
        id: '1',
        email: 'new@example.com',
        roles: ['CUSTOMER'],
        permissions: [],
        status: 'ACTIVE',
        emailVerifiedAt: null,
        activeTenantId: 't1',
        createdAt: new Date().toISOString(),
      },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: '15m' },
      tenantContext: null,
    });
  });
});
