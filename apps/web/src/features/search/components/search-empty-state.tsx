import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';

interface SearchEmptyStateProps {
  query?: string;
  onClearFilters?: () => void;
}

export function SearchEmptyState({ query, onClearFilters }: SearchEmptyStateProps) {
  return (
    <EmptyState
      title="No services found"
      description={
        query
          ? `We couldn't find any services matching "${query}". Try adjusting your search or filters.`
          : 'Try adjusting your filters to see more results.'
      }
      primaryAction={
        <Button asChild>
          <Link href="/search">Browse all services</Link>
        </Button>
      }
      secondaryAction={
        onClearFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : undefined
      }
    />
  );
}
