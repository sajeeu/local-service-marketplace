import type { Metadata } from 'next';
import { ServicesListPage } from './services-client';

export const metadata: Metadata = { title: 'Services' };

export default function Page(): React.JSX.Element {
  return <ServicesListPage />;
}
