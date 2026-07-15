import type { Metadata } from 'next';
import { EditServicePage } from './edit-client';

export const metadata: Metadata = { title: 'Edit service' };

export default function Page(): React.JSX.Element {
  return <EditServicePage />;
}
