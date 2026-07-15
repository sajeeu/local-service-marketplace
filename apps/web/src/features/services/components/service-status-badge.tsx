'use client';

import type { ServiceStatus } from '@local-service-marketplace/shared-types';
import { Badge } from '@/components/ui/badge';

const LABELS: Record<ServiceStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  PAUSED: 'Paused',
  ARCHIVED: 'Archived',
};

const VARIANTS: Record<ServiceStatus, 'muted' | 'success' | 'warning' | 'secondary'> = {
  DRAFT: 'muted',
  PUBLISHED: 'success',
  PAUSED: 'warning',
  ARCHIVED: 'secondary',
};

interface ServiceStatusBadgeProps {
  status: ServiceStatus;
}

export function ServiceStatusBadge({ status }: ServiceStatusBadgeProps): React.JSX.Element {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
