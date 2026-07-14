/// <reference types="vitest/globals" />
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

const push = vi.fn();
const refresh = vi.fn();
const login = vi.fn();
const persistSession = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    login: (...args: unknown[]) => login(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    code: string;
    status: number;
    constructor(message: string, options: { code: string; status: number }) {
      super(message);
      this.name = 'ApiClientError';
      this.code = options.code;
      this.status = options.status;
    }
  },
}));

vi.mock('../session', () => ({
  persistSession: (...args: unknown[]) => persistSession(...args),
}));

describe('LoginForm', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    login.mockReset();
    persistSession.mockReset();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('submits credentials and redirects on success', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@b.com',
        roles: ['CUSTOMER'],
        permissions: [],
        status: 'ACTIVE',
        emailVerifiedAt: null,
        createdAt: new Date().toISOString(),
      },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: '15m' },
    });
    persistSession.mockResolvedValue(undefined);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'SecurePass1!' });
      expect(persistSession).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/account');
    });
  });

  it('shows an API error message on failure', async () => {
    const user = userEvent.setup();
    const { ApiClientError } = await import('@/lib/api-client');
    login.mockRejectedValue(
      new ApiClientError('Invalid email or password', { code: 'UNAUTHORIZED', status: 401 }),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
