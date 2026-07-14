'use client';

import type { ProviderVerificationStatus } from '@local-service-marketplace/shared-types';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<ProviderVerificationStatus, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
};

const STATUS_VARIANT: Record<
  ProviderVerificationStatus,
  'muted' | 'warning' | 'success' | 'destructive' | 'secondary'
> = {
  PENDING: 'muted',
  UNDER_REVIEW: 'warning',
  VERIFIED: 'success',
  REJECTED: 'destructive',
  SUSPENDED: 'secondary',
};

interface VerificationStatusBadgeProps {
  status: ProviderVerificationStatus;
}

export function VerificationStatusBadge({
  status,
}: VerificationStatusBadgeProps): React.JSX.Element {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
