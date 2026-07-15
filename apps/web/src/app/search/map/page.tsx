'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { DiscoveryHeader } from '@/features/search/components/discovery-header';
import { SearchBar } from '@/features/search/components/search-bar';
import { MapListToggle } from '@/features/search/components/map-list-toggle';
import { parseSearchParams } from '@/features/search/lib/search-params';
import type { ServiceSearchResponse } from '@local-service-marketplace/shared-types';

const SearchMap = dynamic(
  () => import('@/features/search/components/search-map').then((mod) => mod.SearchMap),
  { ssr: false },
);

export default function SearchMapPage() {
  const searchParams = useSearchParams();
  const [response, setResponse] = useState<ServiceSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const params = parseSearchParams(searchParams);
        const result = await apiClient.searchServices(params);
        setResponse(result);
      } catch (error) {
        console.error('Search failed:', error);
        setResponse({ items: [], meta: { page: 1, limit: 20, total: 0 } });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

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
      <div className="container mx-auto flex items-center gap-4 px-4 py-4">
        <div className="flex-1">
          <SearchBar defaultValue={parseSearchParams(searchParams).q} />
        </div>
        <MapListToggle />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 pb-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center rounded-lg border bg-muted">
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          ) : (
            <SearchMap services={servicesWithLocation} center={center} />
          )}
        </div>
      </div>
    </div>
  );
}
