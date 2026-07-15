import type { Metadata } from 'next';
import type { CategoryTreeNodeDto } from '@local-service-marketplace/shared-types';
import { apiClient } from '@/lib/api-client';
import { SearchPageClient } from './search-page-client';

export const metadata: Metadata = {
  title: 'Search Services | Local Service Marketplace',
  description: 'Find trusted local service providers in your area',
};

export default async function SearchPage() {
  let categories: CategoryTreeNodeDto[] = [];

  try {
    categories = await apiClient.getCategoryTree();
  } catch (error) {
    console.error('Failed to load categories:', error);
  }

  return <SearchPageClient initialCategories={categories} />;
}
