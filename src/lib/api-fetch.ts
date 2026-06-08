/**
 * Authenticated fetch wrapper for client components.
 *
 * If an API call returns 401 (access token expired), this calls
 * /api/auth/refresh once, and if that succeeds, retries the original
 * request transparently. The user never sees a flash to /login while
 * the refresh cookie is still valid (7 days).
 *
 * Falls back to a soft redirect to /login if the refresh also fails.
 */

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(r => r.ok)
      .catch(() => false)
      .finally(() => {
        // Release the lock after a tick so other in-flight 401s can await it.
        setTimeout(() => { refreshPromise = null; }, 0);
      });
  }
  return refreshPromise;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const opts: RequestInit = { credentials: "include", ...init };

  let res = await fetch(input, opts);
  if (res.status !== 401) return res;

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    return res;
  }

  res = await fetch(input, opts);
  return res;
}
