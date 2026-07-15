'use client';

import type { CategoryTreeNodeDto } from '@local-service-marketplace/shared-types';
import { Label } from '@/components/ui/label';

interface CategorySelectorProps {
  categories: CategoryTreeNodeDto[];
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
  disabled?: boolean;
}

function flattenOptions(
  nodes: CategoryTreeNodeDto[],
  depth = 0,
): Array<{ id: string; label: string }> {
  const rows: Array<{ id: string; label: string }> = [];
  for (const node of nodes) {
    const prefix = depth > 0 ? `${'—'.repeat(depth)} ` : '';
    rows.push({ id: node.id, label: `${prefix}${node.name}` });
    rows.push(...flattenOptions(node.children, depth + 1));
  }
  return rows;
}

export function CategorySelector({
  categories,
  value,
  onChange,
  error,
  disabled,
}: CategorySelectorProps): React.JSX.Element {
  const options = flattenOptions(categories);

  return (
    <div className="space-y-2">
      <Label htmlFor="categoryId">Category</Label>
      <select
        id="categoryId"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      >
        <option value="">Select a category</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
