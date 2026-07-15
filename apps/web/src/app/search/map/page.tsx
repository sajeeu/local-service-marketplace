'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { DiscoveryHeader } from '@/features/search/components/discovery-header';
import { SearchBar } from '@/features/search/components/search-bar';
import { MapListToggle } from '@/features/search/components/map-list-toggle';
import { parseSearchParams } from '@/features/search/lib/search-params';
import type { ServiceSearchResponse } from '@local-service-marketplace/shared-types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const SearchMap = dynamic(
  () => import('@/features/search/components/search-map').then((mod) => mod.SearchMap),
  { ssr: false },
);

export default function SearchMapPage() {
  const searchParams = useSearchParams();
  const [response, setResponse] = useState<ServiceSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = parseSearchParams(searchParams);
      const result = await apiClient.searchServices(params);
      setResponse(result);
    } catch (err) {
      console.error('Search failed:', err);
      setResponse(null);
      setError('We could not load map results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    void load();
  }, [load]);

  const servicesWithLocation =
    response?.items.filter((service) => service.latitude && service.longitude) || [];

  const first = servicesWithLocation[0];
  const center: [number, number] =
    first?.latitude != null && first.longitude != null
      ? [first.latitude, first.longitude]
      : [51.505, -0.09];

  return (
    <div className="flex h-screen flex-col">
      <DiscoveryHeader />
      <div className="container mx-auto flex items-center gap-4 px-4 py-4 sm:px-6">
        <div className="flex-1">
          <SearchBar defaultValue={parseSearchParams(searchParams).q} />
        </div>
        <MapListToggle />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 pb-4 sm:px-6">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => void load()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : servicesWithLocation.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-muted/40 text-center">
              <p className="font-medium text-foreground">No mappable results</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try adjusting your search or switch back to the list view.
              </p>
            </div>
          ) : (
            <SearchMap services={servicesWithLocation} center={center} />
          )}
        </div>
      </div>
    </div>
  );
}
