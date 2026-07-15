import type { SearchSortOption } from '@local-service-marketplace/shared-types';

export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  category?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  instantBooking?: boolean;
  tags?: string[];
  sort?: SearchSortOption;
}

export function parseSearchParams(searchParams: URLSearchParams): SearchParams {
  const params: SearchParams = {};

  const q = searchParams.get('q');
  if (q) params.q = q;

  const page = searchParams.get('page');
  if (page) params.page = parseInt(page, 10);

  const limit = searchParams.get('limit');
  if (limit) params.limit = parseInt(limit, 10);

  const category = searchParams.get('category');
  if (category) params.category = category;

  const city = searchParams.get('city');
  if (city) params.city = city;

  const state = searchParams.get('state');
  if (state) params.state = state;

  const country = searchParams.get('country');
  if (country) params.country = country;

  const latitude = searchParams.get('latitude');
  if (latitude) params.latitude = parseFloat(latitude);

  const longitude = searchParams.get('longitude');
  if (longitude) params.longitude = parseFloat(longitude);

  const radius = searchParams.get('radius');
  if (radius) params.radius = parseFloat(radius);

  const minPrice = searchParams.get('minPrice');
  if (minPrice) params.minPrice = parseFloat(minPrice);

  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) params.maxPrice = parseFloat(maxPrice);

  const minRating = searchParams.get('minRating');
  if (minRating) params.minRating = parseFloat(minRating);

  const verifiedOnly = searchParams.get('verifiedOnly');
  if (verifiedOnly) params.verifiedOnly = verifiedOnly === 'true';

  const instantBooking = searchParams.get('instantBooking');
  if (instantBooking) params.instantBooking = instantBooking === 'true';

  const tags = searchParams.get('tags');
  if (tags) params.tags = tags.split(',');

  const sort = searchParams.get('sort') as SearchSortOption | null;
  if (sort) params.sort = sort;

  return params;
}

export function serializeSearchParams(params: SearchParams): string {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set('q', params.q);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.category) searchParams.set('category', params.category);
  if (params.city) searchParams.set('city', params.city);
  if (params.state) searchParams.set('state', params.state);
  if (params.country) searchParams.set('country', params.country);
  if (params.latitude) searchParams.set('latitude', params.latitude.toString());
  if (params.longitude) searchParams.set('longitude', params.longitude.toString());
  if (params.radius) searchParams.set('radius', params.radius.toString());
  if (params.minPrice) searchParams.set('minPrice', params.minPrice.toString());
  if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
  if (params.minRating) searchParams.set('minRating', params.minRating.toString());
  if (params.verifiedOnly) searchParams.set('verifiedOnly', 'true');
  if (params.instantBooking) searchParams.set('instantBooking', 'true');
  if (params.tags && params.tags.length > 0) searchParams.set('tags', params.tags.join(','));
  if (params.sort) searchParams.set('sort', params.sort);

  return searchParams.toString();
}
