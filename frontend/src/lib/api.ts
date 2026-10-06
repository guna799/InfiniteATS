// Browser client for the Spring API (/api/v1), authenticated by the HttpOnly ic_access cookie.

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      // Required by the backend for cookie-authenticated writes (CSRF protection)
      'X-Requested-With': 'InfiniteCareers',
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.errors?.[0];
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    throw new ApiError(res.status, err?.code ?? `HTTP_${res.status}`, err?.message ?? 'Request failed', err?.details);
  }
  return body?.data as T;
}
