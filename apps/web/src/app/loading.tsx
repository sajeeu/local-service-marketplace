import { PageSkeleton } from '@/components/spinner';

export default function Loading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <PageSkeleton />
    </div>
  );
}
