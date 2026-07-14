'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ProviderPrivateProfileDto } from '@local-service-marketplace/shared-types';
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
    return <p className="text-muted-foreground">Preparing your provider profile…</p>;
  }

  if (error) {
    return (
      <p
        className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          Complete your provider profile
        </h2>
        <p className="mt-2 text-muted-foreground">
          Tell customers who you are. You can update qualifications, languages, and availability
          anytime.
        </p>
      </div>
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
