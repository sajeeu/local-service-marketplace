import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal(''));

export const pricingModelSchema = z.enum(['FIXED', 'HOURLY', 'DAILY', 'QUOTE_REQUIRED']);
export const locationTypeSchema = z.enum([
  'REMOTE',
  'ON_SITE',
  'CUSTOMER_LOCATION',
  'PROVIDER_LOCATION',
]);
export const mediaTypeSchema = z.enum(['IMAGE', 'VIDEO']);

export const mediaItemSchema = z.object({
  type: mediaTypeSchema,
  url: z.string().trim().url('Enter a valid URL including https://'),
  altText: optionalText,
  sortOrder: z.coerce.number().int().min(0).max(100).optional(),
});

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}, z.number().optional()) as z.ZodType<number | undefined, z.ZodTypeDef, unknown>;

export const locationItemSchema = z
  .object({
    type: locationTypeSchema,
    city: optionalText,
    state: optionalText,
    country: optionalText,
    latitude: optionalNumber.refine(
      (value) => value === undefined || (value >= -90 && value <= 90),
      'Invalid latitude',
    ),
    longitude: optionalNumber.refine(
      (value) => value === undefined || (value >= -180 && value <= 180),
      'Invalid longitude',
    ),
    serviceRadius: optionalNumber.refine(
      (value) => value === undefined || (value >= 0 && value <= 500),
      'Invalid radius',
    ),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'REMOTE') {
      return;
    }
    const hasPlace = Boolean(value.city?.trim() || value.country?.trim());
    const hasCoords = value.latitude !== undefined && value.longitude !== undefined;
    if (!hasPlace && !hasCoords) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide city/country or coordinates for non-remote locations',
        path: ['city'],
      });
    }
  });

export const faqItemSchema = z.object({
  question: z.string().trim().min(2).max(500),
  answer: z.string().trim().min(2).max(5000),
  sortOrder: z.coerce.number().int().min(0).max(100).optional(),
});

export const requirementItemSchema = z.object({
  description: z.string().trim().min(2).max(500),
  isRequired: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(100).optional(),
});

export const serviceFormSchema = z
  .object({
    categoryId: z.string().uuid('Select a category'),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160),
    shortDescription: z.string().trim().max(300).optional().or(z.literal('')),
    description: z.string().trim().max(20000).optional().or(z.literal('')),
    pricingModel: pricingModelSchema,
    basePrice: optionalNumber.refine(
      (value) => value === undefined || (value >= 0 && value <= 1_000_000),
      'Invalid price',
    ),
    currency: z.string().trim().length(3),
    duration: optionalNumber.refine(
      (value) => value === undefined || (Number.isInteger(value) && value >= 1 && value <= 10080),
      'Invalid duration',
    ),
    cancellationPolicy: z.string().trim().max(2000).optional().or(z.literal('')),
    instantBookingEnabled: z.boolean(),
    featured: z.boolean(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20),
    locations: z.array(locationItemSchema).max(10),
    faqs: z.array(faqItemSchema).max(30),
    requirements: z.array(requirementItemSchema).max(30),
    media: z.array(mediaItemSchema).max(20),
  })
  .superRefine((value, ctx) => {
    if (value.pricingModel !== 'QUOTE_REQUIRED') {
      if (value.basePrice === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Base price is required for this pricing model',
          path: ['basePrice'],
        });
      }
    }
  });

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export function emptyServiceFormValues(): ServiceFormValues {
  return {
    categoryId: '',
    title: '',
    shortDescription: '',
    description: '',
    pricingModel: 'FIXED',
    basePrice: undefined,
    currency: 'USD',
    duration: undefined,
    cancellationPolicy: '',
    instantBookingEnabled: false,
    featured: false,
    tags: [],
    locations: [],
    faqs: [],
    requirements: [],
    media: [],
  };
}
