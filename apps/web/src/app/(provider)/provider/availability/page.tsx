import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { AvailabilityEditor } from '@/features/provider/components/availability-editor';

export const metadata: Metadata = {
  title: 'Provider availability',
};

export default function Page(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Availability"
        description="Set your recurring weekly hours. Booking conflict checks come in a later phase."
        className="mb-0"
      />
      <AvailabilityEditor />
    </div>
  );
}
