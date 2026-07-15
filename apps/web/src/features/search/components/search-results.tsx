'use client';

import { ServiceCard } from './service-card';
import { SearchEmptyState } from './search-empty-state';
import { SearchPagination } from './search-pagination';
import type { ServiceSearchResponse } from '@local-service-marketplace/shared-types';

interface SearchResultsProps {
  response: ServiceSearchResponse;
  query?: string;
  onPageChange: (page: number) => void;
  onClearFilters?: () => void;
}

export function SearchResults({
  response,
  query,
  onPageChange,
  onClearFilters,
}: SearchResultsProps) {
  if (response.items.length === 0) {
    return <SearchEmptyState query={query} onClearFilters={onClearFilters} />;
  }

  const totalPages = Math.ceil(response.meta.total / response.meta.limit);

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Found {response.meta.total} {response.meta.total === 1 ? 'service' : 'services'}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {response.items.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          />
        ))}
      </div>
      <SearchPagination
        currentPage={response.meta.page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
