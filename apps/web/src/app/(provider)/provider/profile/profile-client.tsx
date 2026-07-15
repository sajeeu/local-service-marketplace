'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ProviderPrivateProfileDto } from '@local-service-marketplace/shared-types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/spinner';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { VerificationStatusBadge } from '@/features/provider/components/verification-status-badge';
import { VerificationSubmitForm } from '@/features/provider/components/verification-submit-form';
import { VerificationTimeline } from '@/features/provider/components/verification-timeline';

export function ProviderProfilePage(): React.JSX.Element {
  const [profile, setProfile] = useState<ProviderPrivateProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setError(null);
    try {
      const data = await apiClient.getMyProvider();
      setProfile(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load provider profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return <p className="text-muted-foreground">No provider profile found.</p>;
  }

  const canSubmitVerification =
    profile.verificationStatus === 'PENDING' || profile.verificationStatus === 'REJECTED';

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {profile.displayName}
            </h2>
            <VerificationStatusBadge status={profile.verificationStatus} />
          </div>
          <p className="max-w-2xl text-muted-foreground">
            {profile.bio || 'No biography added yet.'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/provider/profile/edit">Edit profile</Link>
        </Button>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Experience</dt>
          <dd className="text-lg font-medium">{profile.yearsOfExperience} years</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Completed jobs</dt>
          <dd className="text-lg font-medium">{profile.completedJobs}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Average rating</dt>
          <dd className="text-lg font-medium">{profile.averageRating.toFixed(1)}</dd>
        </div>
      </dl>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Languages</h3>
        {profile.languages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No languages listed.</p>
        ) : (
          <ul className="flex flex-wrap gap-2 text-sm">
            {profile.languages.map((lang) => (
              <li key={lang.id} className="border border-border px-2 py-1">
                {lang.label}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Qualifications</h3>
        {profile.qualifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No qualifications listed.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {profile.qualifications.map((row) => (
              <li key={row.id}>
                <span className="font-medium">{row.title}</span> · {row.issuer}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Certifications</h3>
        {profile.certifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No certifications listed.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {profile.certifications.map((row) => (
              <li key={row.id}>
                <span className="font-medium">{row.name}</span> · {row.issuer}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Verification</h3>
        <VerificationTimeline verifications={profile.verifications} />
        {canSubmitVerification ? (
          <VerificationSubmitForm onSuccess={setProfile} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Verification is {profile.verificationStatus.toLowerCase().replace('_', ' ')}.
          </p>
        )}
      </section>
    </div>
  );
}
