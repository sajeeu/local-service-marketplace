'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SearchParams } from '../lib/search-params';

interface ActiveFiltersProps {
  filters: SearchParams;
  onRemoveFilter: (key: keyof SearchParams) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemoveFilter, onClearAll }: ActiveFiltersProps) {
  const activeFilters: Array<{ key: keyof SearchParams; label: string }> = [];

  if (filters.category)
    activeFilters.push({ key: 'category', label: `Category: ${filters.category}` });
  if (filters.city) activeFilters.push({ key: 'city', label: `City: ${filters.city}` });
  if (filters.minPrice) activeFilters.push({ key: 'minPrice', label: `Min: ${filters.minPrice}` });
  if (filters.maxPrice) activeFilters.push({ key: 'maxPrice', label: `Max: ${filters.maxPrice}` });
  if (filters.minRating)
    activeFilters.push({ key: 'minRating', label: `Rating: ${filters.minRating}+` });
  if (filters.verifiedOnly) activeFilters.push({ key: 'verifiedOnly', label: 'Verified only' });
  if (filters.instantBooking)
    activeFilters.push({ key: 'instantBooking', label: 'Instant booking' });
  if (filters.radius) activeFilters.push({ key: 'radius', label: `Within ${filters.radius} km` });

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="gap-1">
          {filter.label}
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className="ml-1 rounded-full hover:bg-muted"
            aria-label={`Remove ${filter.label} filter`}
          >
            ×
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
