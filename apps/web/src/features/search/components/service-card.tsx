import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { ServiceSearchHitDto } from '@local-service-marketplace/shared-types';

interface ServiceCardProps {
  service: ServiceSearchHitDto;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const location = service.cities[0] || service.states[0] || service.countries[0] || 'Remote';

  return (
    <Link
      href={`/service/${service.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary"
    >
      {service.coverImageUrl && (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-muted">
          <img
            src={service.coverImageUrl}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-2">{service.title}</h3>
          {service.featured && (
            <Badge variant="default" className="shrink-0 text-xs">
              Featured
            </Badge>
          )}
        </div>
        {service.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">{service.shortDescription}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{service.providerDisplayName}</span>
          {service.providerVerificationStatus === 'VERIFIED' && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{location}</span>
          {service.basePrice !== null && (
            <span className="font-semibold text-foreground">
              {service.currency} {service.basePrice.toFixed(2)}
            </span>
          )}
        </div>
        {service.rating > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-600">★ {service.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({service.completedJobs} jobs)</span>
          </div>
        )}
      </div>
    </Link>
  );
}
