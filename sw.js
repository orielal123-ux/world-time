// Service worker: lets the app open and work with no internet connection.
// Bump the version whenever you change the site, so phones pick up the new files.
const CACHE = "world-time-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/countries-and-timezones@3.6.0/dist/index.min.js",
];

// On install: download and store everything the app needs.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

// On activate: delete caches from older versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// On every request: answer from the cache right away if we can, and refresh
// the cache from the network in the background. Flags get cached as they're seen.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok || response.type === "opaque") {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      if (cached) return cached;
      const fresh = await network;
      if (fresh) return fresh;
      // Offline and never seen before: page requests fall back to the app itself.
      if (event.request.mode === "navigate") return cache.match("./index.html");
      return Response.error();
    })
  );
});
