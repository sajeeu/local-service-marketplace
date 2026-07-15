import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SearchEmptyStateProps {
  query?: string;
  onClearFilters?: () => void;
}

export function SearchEmptyState({ query, onClearFilters }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-6xl text-muted-foreground">🔍</div>
      <h3 className="mb-2 text-xl font-semibold">No services found</h3>
      <p className="mb-6 max-w-md text-muted-foreground">
        {query
          ? `We couldn't find any services matching "${query}". Try adjusting your search or filters.`
          : 'Try adjusting your filters to see more results.'}
      </p>
      <div className="flex gap-4">
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        <Button asChild>
          <Link href="/search">Browse all services</Link>
        </Button>
      </div>
    </div>
  );
}
