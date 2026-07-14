import type { Metadata } from 'next';
import { ProviderOnboardingPage } from './onboarding-client';

export const metadata: Metadata = {
  title: 'Provider onboarding',
};

export default function Page(): React.JSX.Element {
  return <ProviderOnboardingPage />;
}
