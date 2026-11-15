/* Only the public offline page is cached. Never store authenticated HTML,
 * Next.js/RSC responses, APIs, documents or mutations on this device. */
const CACHE = "dossier-offline-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.add(new Request(OFFLINE, { cache: "reload", credentials: "omit" }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith("dossier-offline-") && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || request.mode !== "navigate" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      return (await caches.match(OFFLINE, { cacheName: CACHE })) ?? Response.error();
    }
  })());
});
