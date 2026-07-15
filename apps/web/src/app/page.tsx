import Link from 'next/link';
import type {
  CategoryTreeNodeDto,
  PopularSearchDto,
} from '@local-service-marketplace/shared-types';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/features/search/components/search-bar';
import { apiClient } from '@/lib/api-client';

export default async function HomePage() {
  let categories: CategoryTreeNodeDto[] = [];
  let popularSearches: PopularSearchDto[] = [];

  try {
    categories = await apiClient.getCategoryTree();
    const popularResponse = await apiClient.popularSearches(6);
    popularSearches = popularResponse.items;
  } catch (error) {
    console.error('Failed to load home page data:', error);
  }

  const topCategories = categories.slice(0, 6);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(199_89%_90%)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_left,_hsl(174_42%_90%)_0%,_transparent_50%),linear-gradient(180deg,_hsl(40_33%_98%)_0%,_hsl(200_20%_96%)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(hsl(210_24%_12%_/_0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(210_24%_12%_/_0.04)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative">
        <header className="container mx-auto flex items-center justify-between px-6 py-6">
          <Link href="/" className="font-display text-xl font-semibold text-primary">
            Marketplace
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </nav>
        </header>

        <section className="container mx-auto px-6 py-24 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-5xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
            Find trusted local services
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Connect with verified professionals in your area. Search, compare, and book with
            confidence.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <SearchBar placeholder="Search for services (e.g. plumbing, cleaning...)" />
          </div>

          {popularSearches.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {popularSearches.map((search) => (
                <Link
                  key={search.query}
                  href={`/search?q=${encodeURIComponent(search.query)}`}
                  className="rounded-full border bg-background/60 px-3 py-1 text-sm hover:border-primary"
                >
                  {search.query}
                </Link>
              ))}
            </div>
          )}
        </section>

        {topCategories.length > 0 && (
          <section className="container mx-auto px-6 py-16">
            <h2 className="mb-8 text-center font-display text-3xl font-semibold">
              Browse by category
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {topCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group flex flex-col items-center rounded-lg border bg-card p-6 transition-colors hover:border-primary"
                >
                  {category.icon && <div className="mb-3 text-4xl">{category.icon}</div>}
                  <h3 className="text-center font-semibold group-hover:text-primary">
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
        )}

        <section className="container mx-auto px-6 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 text-4xl">✓</div>
              <h3 className="mb-2 font-semibold">Verified providers</h3>
              <p className="text-sm text-muted-foreground">
                All service providers go through our verification process
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl">⭐</div>
              <h3 className="mb-2 font-semibold">Trusted reviews</h3>
              <p className="text-sm text-muted-foreground">Real reviews from verified customers</p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl">🔒</div>
              <h3 className="mb-2 font-semibold">Secure transactions</h3>
              <p className="text-sm text-muted-foreground">Safe and secure payment processing</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
