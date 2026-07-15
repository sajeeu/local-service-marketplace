'use client';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { CategoryTreeNodeDto } from '@local-service-marketplace/shared-types';

interface CategoryFilterProps {
  categories: CategoryTreeNodeDto[];
  value?: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  const flatCategories: Array<CategoryTreeNodeDto & { depth: number }> = [];

  const flatten = (nodes: CategoryTreeNodeDto[], depth = 0) => {
    nodes.forEach((node) => {
      flatCategories.push({ ...node, depth });
      if (node.children.length > 0) {
        flatten(node.children, depth + 1);
      }
    });
  };

  flatten(categories);

  return (
    <div className="space-y-2">
      <Label htmlFor="category-filter">Category</Label>
      <Select
        id="category-filter"
        value={value || 'all'}
        onChange={(event) => onChange(event.target.value === 'all' ? '' : event.target.value)}
      >
        <option value="all">All categories</option>
        {flatCategories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {'—'.repeat(cat.depth)}
            {cat.depth > 0 ? ' ' : ''}
            {cat.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
