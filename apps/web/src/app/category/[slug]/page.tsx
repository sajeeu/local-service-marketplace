import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { SearchPageClient } from '@/app/search/search-page-client';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const categories = await apiClient.listCategories();
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
      return {
        title: 'Category Not Found | Local Service Marketplace',
      };
    }

    return {
      title: `${category.name} Services | Local Service Marketplace`,
      description:
        category.description ||
        `Find trusted ${category.name.toLowerCase()} service providers in your area`,
    };
  } catch (error) {
    console.error('Failed to generate category metadata:', error);
    return {
      title: 'Category | Local Service Marketplace',
    };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  let categories = [];
  let category = null;

  try {
    categories = await apiClient.getCategoryTree();
    const allCategories = await apiClient.listCategories();
    category = allCategories.find((c) => c.slug === slug);

    if (!category) {
      notFound();
    }
  } catch (error) {
    console.error('Failed to load category:', error);
    notFound();
  }

  return <SearchPageClient initialCategories={categories} />;
}
