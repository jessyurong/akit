/* Anti-Stress Playground service worker — hand written, no build step. */
const VERSION = "v1.3.0";
const CORE = `sr-core-${VERSION}`;
const ASSETS = `sr-assets-${VERSION}`;
const MEDIA = `sr-media-${VERSION}`;

const PRECACHE = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
  "/audio/island-song.mp3",
  "/audio/calm.wav",
  "/audio/focus.wav",
  "/audio/sleep.wav",
  "/audio/playful.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE).then(async (cache) => {
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" }))));
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => ![CORE, ASSETS, MEDIA].includes(key)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Audio: cache the whole file. Range requests go straight to the network,
  // because partial responses are a classic Safari + service worker trap.
  if (url.pathname.startsWith("/audio/")) {
    if (req.headers.has("range")) return;
    event.respondWith(cacheFirst(req, MEDIA));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(css|js|png|svg|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(req, ASSETS));
    return;
  }

  if (req.mode === "navigate" || url.searchParams.has("_rsc")) {
    event.respondWith(networkFirst(req, CORE));
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  if (cached) {
    void network;
    return cached;
  }
  const res = await network;
  return res || new Response("", { status: 504, statusText: "Offline" });
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    if (req.mode === "navigate") {
      const offline = await caches.match("/offline");
      if (offline) return offline;
    }
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
