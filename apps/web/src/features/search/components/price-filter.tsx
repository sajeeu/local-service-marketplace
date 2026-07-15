'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PriceFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onChange: (min?: number, max?: number) => void;
}

export function PriceFilter({ minPrice, maxPrice, onChange }: PriceFilterProps) {
  return (
    <div className="space-y-2">
      <Label>Price Range</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={minPrice ?? ''}
          onChange={(e) => {
            const val = e.target.value ? parseFloat(e.target.value) : undefined;
            onChange(val, maxPrice);
          }}
          min={0}
          step={1}
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="number"
          placeholder="Max"
          value={maxPrice ?? ''}
          onChange={(e) => {
            const val = e.target.value ? parseFloat(e.target.value) : undefined;
            onChange(minPrice, val);
          }}
          min={0}
          step={1}
        />
      </div>
    </div>
  );
}
