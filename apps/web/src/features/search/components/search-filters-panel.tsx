'use client';

import { CategoryFilter } from './category-filter';
import { PriceFilter } from './price-filter';
import { RatingFilter } from './rating-filter';
import { DistanceFilter } from './distance-filter';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { CategoryTreeNodeDto } from '@local-service-marketplace/shared-types';
import type { SearchParams } from '../lib/search-params';

interface SearchFiltersPanelProps {
  categories: CategoryTreeNodeDto[];
  filters: SearchParams;
  onFilterChange: (updates: Partial<SearchParams>) => void;
}

export function SearchFiltersPanel({
  categories,
  filters,
  onFilterChange,
}: SearchFiltersPanelProps) {
  return (
    <div className="space-y-6 rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Filters</h3>

      <CategoryFilter
        categories={categories}
        value={filters.category}
        onChange={(category) => onFilterChange({ category })}
      />

      <div className="space-y-2">
        <Label>Location</Label>
        <Input
          type="text"
          placeholder="City"
          value={filters.city || ''}
          onChange={(e) => onFilterChange({ city: e.target.value || undefined })}
        />
      </div>

      <PriceFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onChange={(minPrice, maxPrice) => onFilterChange({ minPrice, maxPrice })}
      />

      <RatingFilter
        value={filters.minRating}
        onChange={(minRating) => onFilterChange({ minRating })}
      />

      <DistanceFilter value={filters.radius} onChange={(radius) => onFilterChange({ radius })} />

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.verifiedOnly || false}
            onChange={(e) => onFilterChange({ verifiedOnly: e.target.checked || undefined })}
            className="h-4 w-4"
          />
          Verified providers only
        </Label>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.instantBooking || false}
            onChange={(e) => onFilterChange({ instantBooking: e.target.checked || undefined })}
            className="h-4 w-4"
          />
          Instant booking
        </Label>
      </div>
    </div>
  );
}
