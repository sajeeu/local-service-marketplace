import type { Metadata } from 'next';
import { ServiceDetailPage } from './detail-client';

export const metadata: Metadata = { title: 'Service details' };

export default function Page(): React.JSX.Element {
  return <ServiceDetailPage />;
}
