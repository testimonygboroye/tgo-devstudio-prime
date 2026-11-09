const SW_VERSION = "tgo-offline-v6";
const APP_CACHE = `${SW_VERSION}-app`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json", "/favicon.png", "/logo.png", "/icons/icon-192x192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await Promise.all(PRECACHE_URLS.map(async (path) => { try { const response = await fetch(new Request(path, { cache: "reload" })); if (response.ok) await cache.put(path, response); } catch { /* Optional missing assets must not block offline installation. */ } }));
    try {
      const home = await fetch("/", { cache: "reload", credentials: "same-origin" });
      const type = home.headers.get("content-type") || "";
      if (home.ok && type.includes("text/html")) {
        const pages = await caches.open(PAGE_CACHE);
        await pages.put("/", home.clone());
      }
    } catch { /* Keep the offline fallback available if homepage prefetch fails. */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([APP_CACHE, ASSET_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("tgo-offline-") && !keep.has(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function isPrivatePath(pathname) {
  return /^\/(admin|api|auth|login|logout|register|account|member|members|portal|dashboard|checkout|payment|billing|settings)(\/|$)/i.test(pathname);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    // Do not replay cached HTML: it can reference deployment-specific chunks
    // that are no longer available, leaving users with an unstyled page.
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
