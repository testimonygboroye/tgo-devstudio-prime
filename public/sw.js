self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through only — no caching, since this site is highly dynamic (CMS content,
  // admin data). This service worker exists solely to satisfy PWA installability
  // requirements, not to provide offline functionality.
});
