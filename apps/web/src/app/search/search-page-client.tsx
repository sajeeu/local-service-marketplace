'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { DiscoveryHeader } from '@/features/search/components/discovery-header';
import { SearchBar } from '@/features/search/components/search-bar';
import { SearchFiltersPanel } from '@/features/search/components/search-filters-panel';
import { SearchResults } from '@/features/search/components/search-results';
import { SearchSkeleton } from '@/features/search/components/search-skeleton';
import { ActiveFilters } from '@/features/search/components/active-filters';
import { SortSelector } from '@/features/search/components/sort-selector';
import { MapListToggle } from '@/features/search/components/map-list-toggle';
import {
  parseSearchParams,
  serializeSearchParams,
  type SearchParams,
} from '@/features/search/lib/search-params';
import type {
  ServiceSearchResponse,
  CategoryTreeNodeDto,
} from '@local-service-marketplace/shared-types';

interface SearchPageClientProps {
  initialCategories: CategoryTreeNodeDto[];
}

export function SearchPageClient({ initialCategories }: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState<ServiceSearchResponse | null>(null);
  const [filters, setFilters] = useState<SearchParams>(() => parseSearchParams(searchParams));

  const fetchResults = useCallback(async (params: SearchParams) => {
    setIsLoading(true);
    try {
      const result = await apiClient.searchServices(params);
      setResponse(result);
    } catch (error) {
      console.error('Search failed:', error);
      setResponse({ items: [], meta: { page: 1, limit: 20, total: 0 } });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentFilters = parseSearchParams(searchParams);
    setFilters(currentFilters);
    fetchResults(currentFilters);
  }, [searchParams, fetchResults]);

  const updateFilters = (updates: Partial<SearchParams>) => {
    const newFilters = { ...filters, ...updates };
    if (updates.page === undefined) {
      newFilters.page = 1;
    }
    const queryString = serializeSearchParams(newFilters);
    router.push(`/search${queryString ? `?${queryString}` : ''}`);
  };

  const removeFilter = (key: keyof SearchParams) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    newFilters.page = 1;
    const queryString = serializeSearchParams(newFilters);
    router.push(`/search${queryString ? `?${queryString}` : ''}`);
  };

  const clearAllFilters = () => {
    const newFilters: SearchParams = { q: filters.q };
    const queryString = serializeSearchParams(newFilters);
    router.push(`/search${queryString ? `?${queryString}` : ''}`);
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  return (
    <div className="min-h-screen bg-background">
      <DiscoveryHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <SearchBar defaultValue={filters.q} />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <ActiveFilters
            filters={filters}
            onRemoveFilter={removeFilter}
            onClearAll={clearAllFilters}
          />
          <div className="flex items-center gap-4">
            <SortSelector value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
            <MapListToggle />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <SearchFiltersPanel
              categories={initialCategories}
              filters={filters}
              onFilterChange={updateFilters}
            />
          </aside>

          <main>
            {isLoading ? (
              <SearchSkeleton />
            ) : response ? (
              <SearchResults
                response={response}
                query={filters.q}
                onPageChange={handlePageChange}
                onClearFilters={clearAllFilters}
              />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
