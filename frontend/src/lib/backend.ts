// Server-side calls from Next route handlers to the Spring API.
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export interface BackendResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function backendFetch<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<BackendResult<T>> {
  const { token, headers, ...rest } = init;
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...rest,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: body?.data, error: body?.errors?.[0]?.message };
  } catch {
    return { ok: false, status: 503, error: 'Backend unavailable' };
  }
}
