import { describe, expect, it } from 'vitest';
import { parseSearchParams, serializeSearchParams } from './search-params';

describe('search-params', () => {
  it('parses common discovery filters from URLSearchParams', () => {
    const params = new URLSearchParams(
      'q=plumbing&page=2&minPrice=50&maxPrice=200&verifiedOnly=true&sort=price_asc',
    );
    const parsed = parseSearchParams(params);
    expect(parsed.q).toBe('plumbing');
    expect(parsed.page).toBe(2);
    expect(parsed.minPrice).toBe(50);
    expect(parsed.maxPrice).toBe(200);
    expect(parsed.verifiedOnly).toBe(true);
    expect(parsed.sort).toBe('price_asc');
  });

  it('serializes params while omitting empty values', () => {
    const query = serializeSearchParams({
      q: 'cleaning',
      page: 1,
      city: 'Austin',
      verifiedOnly: false,
      sort: 'relevance',
    });
    const params = new URLSearchParams(query);
    expect(params.get('q')).toBe('cleaning');
    expect(params.get('city')).toBe('Austin');
    expect(params.get('verifiedOnly')).toBeNull();
    expect(params.get('sort')).toBe('relevance');
  });
});
