import type { Metadata } from 'next';
import { NewServicePage } from './new-client';

export const metadata: Metadata = { title: 'New service' };

export default function Page(): React.JSX.Element {
  return <NewServicePage />;
}
