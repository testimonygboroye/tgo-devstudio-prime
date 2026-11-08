const SW_VERSION = "tgo-offline-v1";
const APP_CACHE = `${SW_VERSION}-app`;
const PAGE_CACHE = `${SW_VERSION}-public-pages`;
const ASSET_CACHE = `${SW_VERSION}-public-assets`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json", "/favicon.png", "/icons/icon-192x192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await cache.addAll(PRECACHE_URLS.map((path) => new Request(path, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([APP_CACHE, PAGE_CACHE, ASSET_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("tgo-offline-") && !keep.has(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function isPrivatePath(pathname) {
  return /^\/(admin|api|auth|login|logout|register|account|member|members|portal|dashboard|checkout|payment|billing|settings)(\/|$)/i.test(pathname);
}

function isCacheablePublicPage(url, request, response) {
  if (request.method !== "GET" || request.mode !== "navigate") return false;
  if (url.origin !== self.location.origin || isPrivatePath(url.pathname)) return false;
  if (!response || !response.ok || response.type === "opaque") return false;
  const type = response.headers.get("content-type") || "";
  const cacheControl = response.headers.get("cache-control") || "";
  return type.includes("text/html") && !/private|no-store/i.test(cacheControl) && !response.headers.has("set-cookie");
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
    if (isCacheablePublicPage(url, request, response)) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
      await trimCache(PAGE_CACHE, 40);
    }
    return response;
  } catch {
    if (!isPrivatePath(url.pathname)) {
      const cachedPage = await caches.match(request, { cacheName: PAGE_CACHE, ignoreSearch: true });
      if (cachedPage) return cachedPage;
    }
    const offline = await caches.match(OFFLINE_URL, { cacheName: APP_CACHE });
    if (offline) {
      const fallbackUrl = new URL(OFFLINE_URL, self.location.origin);
      fallbackUrl.searchParams.set("requested", url.pathname + url.search + url.hash);
      return fetch(OFFLINE_URL).catch(() => caches.match(OFFLINE_URL, { cacheName: APP_CACHE })).then((response) => {
        if (!response) return offline;
        const headers = new Headers(response.headers);
        headers.set("X-TGO-Offline", "1");
        return new Response(response.body, { status: 200, headers });
      });
    }
    return Response.error();
  }
}

async function handlePublicAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (response && (response.ok || response.type === "opaque")) {
      await cache.put(request, response.clone());
      await trimCache(ASSET_CACHE, 100);
    }
    return response;
  });
  if (cached) {
    // Refresh quietly while keeping the cached resource immediately available.
    void refresh.catch(() => {});
    return cached;
  }
  try { return await refresh; } catch { return cached || Response.error(); }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Never store or replay private/admin pages, even when offline.
    if (isPrivatePath(url.pathname)) return;
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
  if (event.data && event.data.type === "TGO_LIST_OFFLINE_PAGES") {
    event.waitUntil((async () => {
      const cache = await caches.open(PAGE_CACHE);
      const requests = await cache.keys();
      const pages = requests.map((request) => {
        const url = new URL(request.url);
        return { url: url.pathname + url.search, title: url.pathname === "/" ? "Home" : url.pathname.split("/").filter(Boolean).pop().replace(/[-_]/g, " ") };
      });
      event.source?.postMessage({ type: "TGO_OFFLINE_PAGES", pages });
    })());
  }
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
