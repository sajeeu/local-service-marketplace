'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface SearchPageClientProps {
  initialCategories: CategoryTreeNodeDto[];
  initialCategory?: string;
}

export function SearchPageClient({ initialCategories, initialCategory }: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ServiceSearchResponse | null>(null);
  const [filters, setFilters] = useState<SearchParams>(() => {
    const parsed = parseSearchParams(searchParams);
    if (initialCategory && !parsed.category) {
      parsed.category = initialCategory;
    }
    return parsed;
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchResults = useCallback(async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.searchServices(params);
      setResponse(result);
    } catch (err) {
      console.error('Search failed:', err);
      setResponse(null);
      setError('We could not load search results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentFilters = parseSearchParams(searchParams);
    if (initialCategory && !currentFilters.category) {
      currentFilters.category = initialCategory;
      const queryString = serializeSearchParams(currentFilters);
      router.replace(`/search${queryString ? `?${queryString}` : ''}`);
      return;
    }
    setFilters(currentFilters);
    void fetchResults(currentFilters);
  }, [searchParams, fetchResults, initialCategory, router]);

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

  const filtersPanel = (
    <SearchFiltersPanel
      categories={initialCategories}
      filters={filters}
      onFilterChange={(updates) => {
        updateFilters(updates);
        setFiltersOpen(false);
      }}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <DiscoveryHeader />
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mb-6">
          <SearchBar defaultValue={filters.q} />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <ActiveFilters
            filters={filters}
            onRemoveFilter={removeFilter}
            onClearAll={clearAllFilters}
          />
          <div className="flex items-center gap-2 sm:gap-4">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="size-4" aria-hidden />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{filtersPanel}</div>
              </SheetContent>
            </Sheet>
            <SortSelector value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
            <MapListToggle />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden space-y-6 lg:block">{filtersPanel}</aside>

          <main>
            {isLoading ? <SearchSkeleton /> : null}
            {!isLoading && error ? (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{error}</span>
                  <Button size="sm" variant="outline" onClick={() => void fetchResults(filters)}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {!isLoading && !error && response ? (
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
