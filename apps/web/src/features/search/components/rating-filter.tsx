'use client';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface RatingFilterProps {
  value?: number;
  onChange: (value?: number) => void;
}

export function RatingFilter({ value, onChange }: RatingFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="rating-filter">Minimum rating</Label>
      <Select
        id="rating-filter"
        value={value?.toString() || 'all'}
        onChange={(event) =>
          onChange(event.target.value === 'all' ? undefined : parseFloat(event.target.value))
        }
      >
        <option value="all">Any rating</option>
        <option value="4.5">4.5+ stars</option>
        <option value="4">4.0+ stars</option>
        <option value="3.5">3.5+ stars</option>
        <option value="3">3.0+ stars</option>
      </Select>
    </div>
  );
}
