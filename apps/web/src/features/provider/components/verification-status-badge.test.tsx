import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VerificationStatusBadge } from './verification-status-badge';

describe('VerificationStatusBadge', () => {
  it('renders verified status', () => {
    render(<VerificationStatusBadge status="VERIFIED" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders under review status', () => {
    render(<VerificationStatusBadge status="UNDER_REVIEW" />);
    expect(screen.getByText('Under review')).toBeInTheDocument();
  });
});
