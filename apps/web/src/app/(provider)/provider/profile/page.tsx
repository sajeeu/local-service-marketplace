import type { Metadata } from 'next';
import { ProviderProfilePage } from './profile-client';

export const metadata: Metadata = {
  title: 'Provider profile',
};

export default function Page(): React.JSX.Element {
  return <ProviderProfilePage />;
}
