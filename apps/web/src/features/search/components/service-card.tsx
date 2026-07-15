import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { ServiceSearchHitDto } from '@local-service-marketplace/shared-types';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: ServiceSearchHitDto;
  className?: string;
  style?: React.CSSProperties;
}

export function ServiceCard({ service, className, style }: ServiceCardProps) {
  const location = service.cities[0] || service.states[0] || service.countries[0] || 'Remote';

  return (
    <Link
      href={`/service/${service.id}`}
      style={style}
      className={cn(
        'block rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300',
        className,
      )}
    >
      {service.coverImageUrl ? (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-muted">
          {/* External marketplace URLs vary by provider; keep img for flexibility */}
          <img
            src={service.coverImageUrl}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-foreground">{service.title}</h3>
          {service.featured ? (
            <Badge variant="default" className="shrink-0 text-xs">
              Featured
            </Badge>
          ) : null}
        </div>
        {service.shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{service.shortDescription}</p>
        ) : null}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{service.providerDisplayName}</span>
          {service.providerVerificationStatus === 'VERIFIED' ? (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{location}</span>
          {service.basePrice !== null ? (
            <span className="font-semibold text-foreground">
              {service.currency} {service.basePrice.toFixed(2)}
            </span>
          ) : null}
        </div>
        {service.rating > 0 ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-warning">★ {service.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({service.completedJobs} jobs)</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
