import type { Metadata } from 'next';
import { AvailabilityEditor } from '@/features/provider/components/availability-editor';

export const metadata: Metadata = {
  title: 'Provider availability',
};

export default function Page(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          Availability
        </h2>
        <p className="mt-2 text-muted-foreground">
          Set your recurring weekly hours. Booking conflict checks come in a later phase.
        </p>
      </div>
      <AvailabilityEditor />
    </div>
  );
}
