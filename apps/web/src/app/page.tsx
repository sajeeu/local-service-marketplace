import Link from 'next/link';
import { BadgeCheck, Lock, Star } from 'lucide-react';
import type {
  CategoryTreeNodeDto,
  PopularSearchDto,
} from '@local-service-marketplace/shared-types';
import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/page-background';
import { DiscoveryHeader } from '@/features/search/components/discovery-header';
import { SearchBar } from '@/features/search/components/search-bar';
import { apiClient } from '@/lib/api-client';

export default async function HomePage() {
  let categories: CategoryTreeNodeDto[] = [];
  let popularSearches: PopularSearchDto[] = [];
  let loadError = false;

  try {
    categories = await apiClient.getCategoryTree();
    const popularResponse = await apiClient.popularSearches(6);
    popularSearches = popularResponse.items;
  } catch (error) {
    console.error('Failed to load home page data:', error);
    loadError = true;
  }

  const topCategories = categories.slice(0, 6);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <PageBackground withGrid />

      <div className="relative">
        <DiscoveryHeader showSearchLink />

        <section className="container mx-auto px-4 py-20 text-center sm:px-6 sm:py-24">
          <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
            Local Service Marketplace
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Find trusted local services
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Connect with verified professionals in your area. Search, compare, and book with
            confidence.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <SearchBar placeholder="Search for services (e.g. plumbing, cleaning...)" />
          </div>

          {popularSearches.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {popularSearches.map((search) => (
                <Link
                  key={search.query}
                  href={`/search?q=${encodeURIComponent(search.query)}`}
                  className="text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {search.query}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        {loadError ? (
          <section className="container mx-auto px-4 pb-16 sm:px-6">
            <p className="text-center text-sm text-muted-foreground">
              Categories are temporarily unavailable. You can still{' '}
              <Link href="/search" className="font-medium text-primary hover:underline">
                browse all services
              </Link>
              .
            </p>
          </section>
        ) : null}

        {topCategories.length > 0 ? (
          <section className="container mx-auto px-4 py-16 sm:px-6">
            <h2 className="mb-8 text-center font-display text-3xl font-semibold">
              Browse by category
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {topCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group flex flex-col items-center rounded-lg border border-border bg-card/80 p-5 transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {category.icon ? (
                    <div className="mb-3 text-3xl" aria-hidden>
                      {category.icon}
                    </div>
                  ) : null}
                  <h3 className="text-center text-sm font-semibold group-hover:text-primary">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button asChild variant="outline">
                <Link href="/search">View all services</Link>
              </Button>
            </div>
          </section>
        ) : null}

        <section className="container mx-auto px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BadgeCheck className="size-6" aria-hidden />
              </div>
              <h3 className="mb-2 font-semibold">Verified providers</h3>
              <p className="text-sm text-muted-foreground">
                All service providers go through our verification process
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Star className="size-6" aria-hidden />
              </div>
              <h3 className="mb-2 font-semibold">Trusted reviews</h3>
              <p className="text-sm text-muted-foreground">Real reviews from verified customers</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="size-6" aria-hidden />
              </div>
              <h3 className="mb-2 font-semibold">Secure transactions</h3>
              <p className="text-sm text-muted-foreground">Safe and secure payment processing</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
