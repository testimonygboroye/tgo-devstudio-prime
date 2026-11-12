const SW_VERSION = "tgo-offline-v9";
const APP_CACHE = `${SW_VERSION}-app`;
const ASSET_CACHE = `${SW_VERSION}-public-assets`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json", "/favicon.png", "/logo.png", "/icons/icon-192x192.png", "/images/illustrations/offline-signal.svg", "/images/illustrations/error-recovery.svg", "/images/illustrations/not-found.svg", "/images/illustrations/brand-fallback.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await Promise.all(PRECACHE_URLS.map(async (path) => { try { const response = await fetch(new Request(path, { cache: "reload" })); if (response.ok) await cache.put(path, response); } catch { /* Optional missing assets must not block offline installation. */ } }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([APP_CACHE, ASSET_CACHE]);
    const names = await caches.keys();
    // Preserve the last-known-good offline homepage when rotating cache versions.
    const previousApp = names.filter((name) => /^tgo-offline-v[0-9]+-app$/.test(name) && name !== APP_CACHE).sort().reverse()[0];
    if (previousApp) {
      const previous = await caches.open(previousApp);
      const cachedHome = await previous.match("/");
      if (cachedHome) { const current = await caches.open(APP_CACHE); await current.put("/", cachedHome); }
    }
    await Promise.all(names.filter((name) => name.startsWith("tgo-offline-") && !keep.has(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function isPrivatePath(pathname) {
  return /^\/(admin|api|auth|login|logout|register|account|member|members|client|portal|dashboard|checkout|payment|billing|settings|workspaces|workforce)(\/|$)/i.test(pathname);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function handleNavigation(request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    // Keep a last-known-good copy of the public homepage only.
    if (response.ok && url.pathname === "/" && !url.search) {
      const cache = await caches.open(APP_CACHE);
      await cache.put("/", response.clone());
    }
    return response;
  } catch {
    // The public homepage is intentionally available offline once visited.
    if (url.pathname === "/" && !url.search) {
      const cachedHome = await caches.match("/", { cacheName: APP_CACHE });
      if (cachedHome) {
        const headers = new Headers(cachedHome.headers);
        headers.set("X-TGO-Offline", "1");
        headers.set("Cache-Control", "no-store");
        return new Response(cachedHome.body, { status: 200, headers });
      }
    }
    const offline = await caches.match(OFFLINE_URL, { cacheName: APP_CACHE });
    if (offline) {
      const headers = new Headers(offline.headers);
      headers.set("X-TGO-Offline", "1");
      headers.set("Cache-Control", "no-store");
      return new Response(offline.body, { status: 200, headers });
    }
    return Response.error();
  }
}

async function handlePublicAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (response && (response.ok || response.type === "opaque")) {
      await cache.put(request, response.clone());
      await trimCache(ASSET_CACHE, 150);
    }
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }
  if (isPrivatePath(url.pathname)) return;
  if (["image", "style", "script", "font"].includes(request.destination)) {
    event.respondWith(handlePublicAsset(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TGO_SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { title: "TGO DevStudio", body: event.data ? event.data.text() : "" }; }
  const title = typeof payload.title === "string" ? payload.title : "TGO DevStudio";
  const body = typeof payload.body === "string" ? payload.body : "You have a new admin notification.";
  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/admin";
  const tag = typeof payload.tag === "string" ? payload.tag : "tgo-admin-notification";
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: "/icons/icon-192x192.png", badge: "/icons/icon-192x192.png",
    tag, data: { url }, renotify: false,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/admin", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        if ("navigate" in client) client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
  }));
});
