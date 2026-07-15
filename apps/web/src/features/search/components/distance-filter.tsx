'use client';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface DistanceFilterProps {
  value?: number;
  onChange: (value?: number) => void;
}

export function DistanceFilter({ value, onChange }: DistanceFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="distance-filter">Distance</Label>
      <Select
        id="distance-filter"
        value={value?.toString() || 'all'}
        onChange={(event) =>
          onChange(event.target.value === 'all' ? undefined : parseFloat(event.target.value))
        }
      >
        <option value="all">Any distance</option>
        <option value="5">Within 5 km</option>
        <option value="10">Within 10 km</option>
        <option value="25">Within 25 km</option>
        <option value="50">Within 50 km</option>
        <option value="100">Within 100 km</option>
      </Select>
    </div>
  );
}
