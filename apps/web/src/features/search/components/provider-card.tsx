import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { ProviderSearchHitDto } from '@local-service-marketplace/shared-types';

interface ProviderCardProps {
  provider: ProviderSearchHitDto;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const location =
    provider.cities[0] || provider.states[0] || provider.countries[0] || 'Location not specified';

  return (
    <Link
      href={`/provider/${provider.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary"
    >
      <div className="flex gap-4">
        <div className="shrink-0">
          {provider.profilePhoto ? (
            <img
              src={provider.profilePhoto}
              alt={provider.displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
              {provider.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">{provider.displayName}</h3>
            {provider.verificationStatus === 'VERIFIED' && (
              <Badge variant="default" className="shrink-0 text-xs">
                Verified
              </Badge>
            )}
          </div>
          {provider.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{provider.bio}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{location}</span>
          </div>
          {provider.averageRating > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-yellow-600">★ {provider.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({provider.completedJobs} jobs)</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
