'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ProviderPrivateProfileDto } from '@local-service-marketplace/shared-types';
import { PageHeader } from '@/components/page-header';
import { PageSkeleton } from '@/components/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { ProviderProfileForm } from '@/features/provider/components/provider-profile-form';

export function ProviderOnboardingPage(): React.JSX.Element {
  const router = useRouter();
  const [profile, setProfile] = useState<ProviderPrivateProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const data = await apiClient.getMyProvider();
        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Unable to start onboarding.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complete your provider profile"
        description="Tell customers who you are. You can update qualifications, languages, and availability anytime."
        className="mb-0"
      />
      <ProviderProfileForm
        initial={profile}
        submitLabel="Finish onboarding"
        onSuccess={() => {
          router.push('/provider/profile');
          router.refresh();
        }}
      />
    </div>
  );
}
