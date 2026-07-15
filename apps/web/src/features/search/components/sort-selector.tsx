'use client';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { SearchSortOption } from '@local-service-marketplace/shared-types';

interface SortSelectorProps {
  value?: SearchSortOption;
  onChange: (value: SearchSortOption) => void;
}

export function SortSelector({ value = 'relevance', onChange }: SortSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="sort">Sort by</Label>
      <Select
        id="sort"
        value={value}
        onChange={(event) => onChange(event.target.value as SearchSortOption)}
      >
        <option value="relevance">Relevance</option>
        <option value="newest">Newest first</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="rating_desc">Highest rated</option>
        <option value="jobs_desc">Most jobs completed</option>
        <option value="distance">Nearest first</option>
      </Select>
    </div>
  );
}
