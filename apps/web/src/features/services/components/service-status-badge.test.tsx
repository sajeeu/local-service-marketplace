import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ServiceStatusBadge } from './service-status-badge';

describe('ServiceStatusBadge', () => {
  it('renders published status', () => {
    render(<ServiceStatusBadge status="PUBLISHED" />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('renders draft status', () => {
    render(<ServiceStatusBadge status="DRAFT" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
