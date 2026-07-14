import { z } from 'zod';

export const organizationSchema = z.object({
  legalName: z.string().min(2, 'Legal name is required').max(200),
  displayName: z.string().min(2, 'Display name is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  phone: z.string().max(32).optional().or(z.literal('')),
  website: z
    .string()
    .url('Enter a valid URL including https://')
    .max(500)
    .optional()
    .or(z.literal('')),
  logo: z.string().max(500).optional().or(z.literal('')),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;
