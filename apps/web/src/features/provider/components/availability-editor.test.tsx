import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvailabilityEditor } from './availability-editor';

const listMyAvailability = vi.fn();
const createMyAvailability = vi.fn();
const deleteMyAvailability = vi.fn();

vi.mock('@/lib/api-client', () => ({
  ApiClientError: class ApiClientError extends Error {
    code = 'REQUEST_FAILED';
    status = 400;
  },
  apiClient: {
    listMyAvailability: (...args: unknown[]) => listMyAvailability(...args),
    createMyAvailability: (...args: unknown[]) => createMyAvailability(...args),
    deleteMyAvailability: (...args: unknown[]) => deleteMyAvailability(...args),
  },
}));

describe('AvailabilityEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMyAvailability.mockResolvedValue([]);
  });

  it('shows empty state then validates end time before start', async () => {
    const user = userEvent.setup();
    render(<AvailabilityEditor />);

    expect(await screen.findByText(/no availability slots yet/i)).toBeInTheDocument();

    const start = screen.getByLabelText(/start time/i);
    const end = screen.getByLabelText(/end time/i);
    await user.clear(start);
    await user.type(start, '17:00');
    await user.clear(end);
    await user.type(end, '09:00');
    await user.click(screen.getByRole('button', { name: /add availability/i }));

    expect(await screen.findByText(/before end time/i)).toBeInTheDocument();
    expect(createMyAvailability).not.toHaveBeenCalled();
  });

  it('creates an availability slot', async () => {
    const user = userEvent.setup();
    createMyAvailability.mockResolvedValue({
      id: 'slot-1',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'UTC',
    });
    listMyAvailability.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'slot-1',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC',
      },
    ]);

    render(<AvailabilityEditor />);
    await screen.findByText(/no availability slots yet/i);

    await user.click(screen.getByRole('button', { name: /add availability/i }));

    await waitFor(() => {
      expect(createMyAvailability).toHaveBeenCalled();
    });
  });
});
