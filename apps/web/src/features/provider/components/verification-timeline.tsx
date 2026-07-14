'use client';

import type { ProviderVerificationDto } from '@local-service-marketplace/shared-types';
import { VerificationStatusBadge } from './verification-status-badge';

interface VerificationTimelineProps {
  verifications: ProviderVerificationDto[];
}

export function VerificationTimeline({
  verifications,
}: VerificationTimelineProps): React.JSX.Element {
  if (verifications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No verification submissions yet. Submit documents when you are ready for review.
      </p>
    );
  }

  return (
    <ol className="space-y-4 border-l border-border pl-4">
      {verifications.map((entry) => (
        <li key={entry.id} className="relative space-y-1">
          <span
            aria-hidden
            className="absolute top-1.5 -left-[1.325rem] h-2.5 w-2.5 rounded-full bg-primary"
          />
          <div className="flex flex-wrap items-center gap-2">
            <VerificationStatusBadge status={entry.status} />
            <time className="text-xs text-muted-foreground" dateTime={entry.submittedAt}>
              Submitted {new Date(entry.submittedAt).toLocaleString()}
            </time>
          </div>
          {entry.reviewedAt ? (
            <p className="text-xs text-muted-foreground">
              Reviewed {new Date(entry.reviewedAt).toLocaleString()}
            </p>
          ) : null}
          {entry.rejectionReason ? (
            <p className="text-sm text-destructive" role="status">
              {entry.rejectionReason}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
