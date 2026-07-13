import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .default('http://localhost:3001/api/v1'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type WebEnv = z.infer<typeof envSchema>;

function createEnv(): WebEnv {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid web environment configuration: ${details}`);
  }

  return parsed.data;
}

export const env = createEnv();
