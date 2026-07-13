import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

async function loadHealth() {
  try {
    const data = await apiClient.getHealth();
    return { data, error: null as string | null };
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : 'Unable to reach the API. Is the backend running?';
    return { data: null, error: message };
  }
}

export default async function ApiStatusPage() {
  const { data, error } = await loadHealth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Local Service Marketplace
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">API status</h1>
        <p className="mt-3 text-muted-foreground">
          Foundation health check against PostgreSQL and Redis.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-4 rounded-md border border-border bg-card p-6">
          <p className="text-sm">
            Overall status: <span className="font-semibold text-foreground">{data.status}</span>
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>App: {data.checks.app.status}</li>
            <li>
              Database: {data.checks.database.status}
              {data.checks.database.latencyMs !== undefined
                ? ` (${data.checks.database.latencyMs}ms)`
                : ''}
            </li>
            <li>
              Redis: {data.checks.redis.status}
              {data.checks.redis.latencyMs !== undefined
                ? ` (${data.checks.redis.latencyMs}ms)`
                : ''}
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">{data.timestamp}</p>
        </div>
      ) : null}

      <Button asChild variant="secondary">
        <Link href="/">Back home</Link>
      </Button>
    </main>
  );
}
