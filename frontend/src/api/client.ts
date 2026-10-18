import { siteConfig } from '@/config';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function send(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${siteConfig.apiUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'X-Requested-With': 'sr-web', // required by the backend for every non-GET request
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshing ??= send('/api/auth/refresh', { method: 'POST' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** JSON fetch wrapper. On a 401 it renews the admin session once and retries the request. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await send(path, init);
  if (res.status === 401 && !path.startsWith('/api/auth/') && (await refreshSession())) {
    res = await send(path, init);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; details?: Record<string, string[]> };
    const first = body.details ? Object.values(body.details).flat()[0] : undefined;
    throw new ApiError(res.status, first ? `${body.error ?? 'Error'}: ${first}` : (body.error ?? res.statusText));
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
