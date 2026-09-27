// Minimal app-shell service worker.
// It only caches same-origin static assets and page shells, so the app can
// still open when offline. It never caches Supabase API responses — those
// are handled by the app's own offline queue (see src/lib/offlineQueue.ts),
// which is the actual source of truth for pending financial data.

const CACHE_NAME = "finance-tracker-shell-v1";
const APP_SHELL = ["/", "/dashboard", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept cross-origin requests (Supabase, etc.) — let the app's
  // own online/offline + queue logic handle those.
  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match("/dashboard");
          if (fallback) return fallback;
        }
        return Response.error();
      })
  );
});
