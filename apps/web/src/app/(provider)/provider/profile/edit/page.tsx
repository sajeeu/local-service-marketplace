import type { Metadata } from 'next';
import { ProviderProfileEditPage } from './edit-client';

export const metadata: Metadata = {
  title: 'Edit provider profile',
};

export default function Page(): React.JSX.Element {
  return <ProviderProfileEditPage />;
}
