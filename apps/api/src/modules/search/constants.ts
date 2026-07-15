export const SEARCH_EVENTS = {
  SERVICE_UPSERT: 'search.service.upsert',
  SERVICE_REMOVE: 'search.service.remove',
  PROVIDER_UPSERT: 'search.provider.upsert',
  CATEGORY_UPDATED: 'search.category.updated',
} as const;

export const SERVICES_INDEX = 'services';
export const PROVIDERS_INDEX = 'providers';

export const POPULAR_SEARCHES_CACHE_KEY = 'search:popular';
export const POPULAR_SEARCHES_CACHE_TTL_SECONDS = 120;
