import { describe, expect, it } from 'vitest';
import { emptyServiceFormValues, serviceFormSchema } from './schemas';

describe('serviceFormSchema', () => {
  it('accepts a valid fixed-price service', () => {
    const result = serviceFormSchema.safeParse({
      ...emptyServiceFormValues(),
      categoryId: '11111111-1111-4111-8111-111111111111',
      title: 'Kitchen Cleaning',
      pricingModel: 'FIXED',
      basePrice: 120,
      duration: 90,
      locations: [
        {
          type: 'ON_SITE',
          city: 'Austin',
          state: 'TX',
          country: 'US',
          latitude: '',
          longitude: '',
          serviceRadius: '',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('requires base price unless quote is required', () => {
    const result = serviceFormSchema.safeParse({
      ...emptyServiceFormValues(),
      categoryId: '11111111-1111-4111-8111-111111111111',
      title: 'Custom Work',
      pricingModel: 'HOURLY',
      basePrice: undefined,
    });

    expect(result.success).toBe(false);
  });

  it('allows quote-required without base price', () => {
    const result = serviceFormSchema.safeParse({
      ...emptyServiceFormValues(),
      categoryId: '11111111-1111-4111-8111-111111111111',
      title: 'Custom Remodel Quote',
      pricingModel: 'QUOTE_REQUIRED',
      basePrice: undefined,
      locations: [
        {
          type: 'REMOTE',
          city: '',
          state: '',
          country: '',
          latitude: undefined,
          longitude: undefined,
          serviceRadius: undefined,
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
