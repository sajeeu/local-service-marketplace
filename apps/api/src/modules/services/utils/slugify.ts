export function slugify(input: string, maxLength = 80): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);

  return base.length > 0 ? base : 'item';
}
