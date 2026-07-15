import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { DiscoveryHeader } from '@/features/search/components/discovery-header';
import { TrackServiceView } from '@/features/search/components/track-service-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ServicePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const service = await apiClient.getPublicService(id);

    return {
      title: `${service.title} | Local Service Marketplace`,
      description:
        service.shortDescription || service.description || `Book ${service.title} service`,
      openGraph: {
        title: service.title,
        description: service.shortDescription || service.description || undefined,
        images: service.media[0] ? [service.media[0].url] : undefined,
      },
    };
  } catch (error) {
    console.error('Failed to generate service metadata:', error);
    return {
      title: 'Service Not Found | Local Service Marketplace',
    };
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { id } = await params;

  let service = null;

  try {
    service = await apiClient.getPublicService(id);
  } catch (error) {
    console.error('Failed to load service:', error);
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description || service.shortDescription,
    provider: {
      '@type': 'LocalBusiness',
      name: service.provider.displayName,
      aggregateRating:
        service.provider.averageRating > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: service.provider.averageRating,
              reviewCount: service.provider.completedJobs,
            }
          : undefined,
    },
    offers: service.basePrice
      ? {
          '@type': 'Offer',
          price: service.basePrice,
          priceCurrency: service.currency,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackServiceView serviceId={id} />
      <div className="min-h-screen bg-background">
        <DiscoveryHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                {service.media[0] && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={service.media[0].url}
                      alt={service.media[0].altText || service.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <h1 className="font-display text-3xl font-semibold">{service.title}</h1>
                    {service.featured && <Badge variant="default">Featured</Badge>}
                  </div>
                  <p className="text-muted-foreground">
                    in{' '}
                    <Link href={`/category/${service.category.slug}`} className="hover:underline">
                      {service.category.name}
                    </Link>
                  </p>
                </div>

                {service.shortDescription && (
                  <p className="text-lg text-muted-foreground">{service.shortDescription}</p>
                )}

                {service.description && (
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="mb-4 font-display text-xl font-semibold">Description</h2>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                )}

                {service.requirements.length > 0 && (
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="mb-4 font-display text-xl font-semibold">Requirements</h2>
                    <ul className="space-y-2">
                      {service.requirements.map((req) => (
                        <li key={req.id} className="flex items-start gap-2">
                          <span className="text-primary">{req.isRequired ? '•' : '◦'}</span>
                          <span className="text-muted-foreground">{req.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {service.faqs.length > 0 && (
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="mb-4 font-display text-xl font-semibold">
                      Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                      {service.faqs.map((faq) => (
                        <div key={faq.id}>
                          <h3 className="mb-2 font-semibold">{faq.question}</h3>
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-6">
                <div className="rounded-lg border bg-card p-6">
                  {service.basePrice !== null && (
                    <div className="mb-4">
                      <div className="text-3xl font-semibold">
                        {service.currency} {service.basePrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {service.pricingModel === 'HOURLY' && 'per hour'}
                        {service.pricingModel === 'DAILY' && 'per day'}
                        {service.pricingModel === 'FIXED' && 'fixed price'}
                      </div>
                    </div>
                  )}

                  {service.duration && (
                    <div className="mb-4 text-sm text-muted-foreground">
                      Duration: ~{service.duration} minutes
                    </div>
                  )}

                  {service.instantBookingEnabled && (
                    <Badge variant="secondary" className="mb-4">
                      Instant booking available
                    </Badge>
                  )}

                  <Button className="w-full" size="lg">
                    Book now
                  </Button>
                </div>

                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-4 font-semibold">Provider</h3>
                  <Link
                    href={`/provider/${service.provider.id}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    {service.provider.profilePhoto ? (
                      <img
                        src={service.provider.profilePhoto}
                        alt={service.provider.displayName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                        {service.provider.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{service.provider.displayName}</div>
                      {service.provider.verificationStatus === 'VERIFIED' && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </Link>
                  {service.provider.averageRating > 0 && (
                    <div className="mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-600">
                          ★ {service.provider.averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({service.provider.completedJobs} jobs)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {service.locations.length > 0 && (
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="mb-4 font-semibold">Service Areas</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {service.locations.map((loc) => (
                        <div key={loc.id}>
                          {loc.type === 'REMOTE' && 'Remote'}
                          {loc.city && `${loc.city}, `}
                          {loc.state && `${loc.state}, `}
                          {loc.country}
                          {loc.serviceRadius && ` (${loc.serviceRadius} km radius)`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {service.tags.length > 0 && (
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="mb-4 font-semibold">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {service.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
