import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { DiscoveryHeader } from '@/features/search/components/discovery-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProviderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const provider = await apiClient.getPublicProvider(id);

    return {
      title: `${provider.displayName} | Local Service Marketplace`,
      description: provider.bio || `View ${provider.displayName}'s profile and services`,
      openGraph: {
        title: provider.displayName,
        description: provider.bio || undefined,
        images: provider.profilePhoto ? [provider.profilePhoto] : undefined,
      },
    };
  } catch (error) {
    console.error('Failed to generate provider metadata:', error);
    return {
      title: 'Provider Not Found | Local Service Marketplace',
    };
  }
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { id } = await params;

  let provider = null;

  try {
    provider = await apiClient.getPublicProvider(id);
  } catch (error) {
    console.error('Failed to load provider:', error);
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: provider.displayName,
    description: provider.bio,
    image: provider.profilePhoto,
    aggregateRating:
      provider.averageRating > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: provider.averageRating,
            reviewCount: provider.completedJobs,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background">
        <DiscoveryHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 rounded-lg border bg-card p-8">
              <div className="flex flex-col gap-8 md:flex-row">
                <div className="shrink-0">
                  {provider.profilePhoto ? (
                    <img
                      src={provider.profilePhoto}
                      alt={provider.displayName}
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted text-4xl font-semibold text-muted-foreground">
                      {provider.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h1 className="font-display text-3xl font-semibold">
                        {provider.displayName}
                      </h1>
                      {provider.verificationStatus === 'VERIFIED' && (
                        <Badge variant="default">Verified</Badge>
                      )}
                    </div>
                    {provider.averageRating > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-yellow-600">
                          ★ {provider.averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({provider.completedJobs} {provider.completedJobs === 1 ? 'job' : 'jobs'}{' '}
                          completed)
                        </span>
                      </div>
                    )}
                  </div>

                  {provider.bio && <p className="text-muted-foreground">{provider.bio}</p>}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Experience:</span>{' '}
                      {provider.yearsOfExperience}{' '}
                      {provider.yearsOfExperience === 1 ? 'year' : 'years'}
                    </div>
                    {provider.responseRate !== null && (
                      <div>
                        <span className="font-semibold">Response rate:</span>{' '}
                        {(provider.responseRate * 100).toFixed(0)}%
                      </div>
                    )}
                    {provider.responseTime !== null && (
                      <div>
                        <span className="font-semibold">Response time:</span> ~
                        {Math.round(provider.responseTime / 60)} minutes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {provider.languages.length > 0 && (
              <div className="mb-8 rounded-lg border bg-card p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.languages.map((lang, idx) => (
                    <Badge key={idx} variant="secondary">
                      {lang.label} {lang.proficiency && `(${lang.proficiency})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {provider.qualifications.length > 0 && (
              <div className="mb-8 rounded-lg border bg-card p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Qualifications</h2>
                <div className="space-y-3">
                  {provider.qualifications.map((qual, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-0">
                      <div className="font-semibold">{qual.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {qual.issuer} • {new Date(qual.issueDate).getFullYear()}
                        {qual.expiryDate && ` - ${new Date(qual.expiryDate).getFullYear()}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {provider.certifications.length > 0 && (
              <div className="mb-8 rounded-lg border bg-card p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Certifications</h2>
                <div className="space-y-3">
                  {provider.certifications.map((cert, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-0">
                      <div className="font-semibold">{cert.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {cert.issuer}
                        {cert.issueDate && ` • ${new Date(cert.issueDate).getFullYear()}`}
                        {cert.expiryDate && ` - ${new Date(cert.expiryDate).getFullYear()}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href={`/search?provider=${id}`}>View services</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
