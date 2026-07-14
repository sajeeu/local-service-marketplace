import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderProfileForm } from './provider-profile-form';

const updateMyProvider = vi.fn();

vi.mock('@/lib/api-client', () => ({
  ApiClientError: class ApiClientError extends Error {
    code = 'REQUEST_FAILED';
    status = 400;
  },
  apiClient: {
    updateMyProvider: (...args: unknown[]) => updateMyProvider(...args),
  },
}));

describe('ProviderProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates display name length', async () => {
    const user = userEvent.setup();
    render(<ProviderProfileForm />);

    await user.clear(screen.getByLabelText(/display name/i));
    await user.type(screen.getByLabelText(/display name/i), 'A');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(updateMyProvider).not.toHaveBeenCalled();
  });

  it('submits profile updates', async () => {
    const user = userEvent.setup();
    updateMyProvider.mockResolvedValue({
      id: 'p1',
      displayName: 'Alex Rivera',
      verifications: [],
    });
    const onSuccess = vi.fn();

    render(
      <ProviderProfileForm
        initial={{
          id: 'p1',
          tenantId: 't1',
          userId: 'u1',
          displayName: 'Alex',
          bio: null,
          profilePhoto: null,
          yearsOfExperience: 2,
          verificationStatus: 'PENDING',
          averageRating: 0,
          completedJobs: 0,
          responseRate: null,
          responseTime: null,
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          qualifications: [],
          certifications: [],
          languages: [],
          verifications: [],
        }}
        onSuccess={onSuccess}
      />,
    );

    await user.clear(screen.getByLabelText(/display name/i));
    await user.type(screen.getByLabelText(/display name/i), 'Alex Rivera');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(updateMyProvider).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'Alex Rivera', yearsOfExperience: 2 }),
      );
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
