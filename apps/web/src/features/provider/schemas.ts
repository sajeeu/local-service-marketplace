import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .url('Enter a valid URL including https://')
  .or(z.literal(''))
  .optional();

export const qualificationSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    issuer: z.string().trim().min(2).max(200),
    issueDate: z.string().min(1, 'Issue date is required'),
    expiryDate: z.string().optional().or(z.literal('')),
    documentUrl: optionalUrl,
  })
  .superRefine((value, ctx) => {
    if (value.expiryDate && value.expiryDate < value.issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expiry must be on or after issue date',
        path: ['expiryDate'],
      });
    }
  });

export const certificationSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    issuer: z.string().trim().min(2).max(200),
    issueDate: z.string().optional().or(z.literal('')),
    expiryDate: z.string().optional().or(z.literal('')),
    credentialId: z.string().trim().max(100).optional().or(z.literal('')),
    documentUrl: optionalUrl,
  })
  .superRefine((value, ctx) => {
    if (value.issueDate && value.expiryDate && value.expiryDate < value.issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expiry must be on or after issue date',
        path: ['expiryDate'],
      });
    }
  });

export const languageSchema = z.object({
  code: z.string().trim().min(2).max(16),
  label: z.string().trim().min(2).max(100),
  proficiency: z.string().trim().max(50).optional().or(z.literal('')),
});

export const providerProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(100),
  bio: z.string().trim().max(2000).optional().or(z.literal('')),
  profilePhoto: optionalUrl,
  yearsOfExperience: z.coerce.number().int().min(0).max(80),
  qualifications: z.array(qualificationSchema).max(50),
  certifications: z.array(certificationSchema).max(50),
  languages: z
    .array(languageSchema)
    .max(30)
    .superRefine((langs, ctx) => {
      const seen = new Set<string>();
      langs.forEach((lang, index) => {
        const code = lang.code.toLowerCase();
        if (seen.has(code)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate language code',
            path: [index, 'code'],
          });
        }
        seen.add(code);
      });
    }),
});

export type ProviderProfileFormValues = z.infer<typeof providerProfileSchema>;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilitySchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, 'Use HH:mm format'),
    endTime: z.string().regex(timeRegex, 'Use HH:mm format'),
    timezone: z.string().trim().min(2).max(64),
  })
  .superRefine((value, ctx) => {
    if (value.startTime >= value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start time must be before end time',
        path: ['endTime'],
      });
    }
  });

export type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export const verificationSubmitSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(3).max(100),
  sizeBytes: z.coerce.number().min(1).max(20_000_000),
  url: optionalUrl,
});

export type VerificationSubmitFormValues = z.infer<typeof verificationSubmitSchema>;

export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'zh', label: 'Chinese' },
] as const;
