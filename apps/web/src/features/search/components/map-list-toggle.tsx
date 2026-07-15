'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function MapListToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMapView = pathname.includes('/map');

  const baseUrl = isMapView ? '/search' : '/search/map';
  const params = searchParams.toString();
  const href = params ? `${baseUrl}?${params}` : baseUrl;

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>{isMapView ? 'Show list' : 'Show map'}</Link>
    </Button>
  );
}
