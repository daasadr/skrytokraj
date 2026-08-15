// Skrytokraj — service worker: PWA + offline.
// Strategie:
//  - navigace (stránky): network-first → offline fallback z cache
//  - statické buildy Next.js (immutable, hashované): cache-first
//  - mapové dlaždice/styl/fonty (MapTiler, OpenFreeMap): cache-first s limitem
//    → kraj, který si projdeš online, funguje pak offline
//  - /api/* (kromě navigace): vždy síť (mutace/dynamika) — necachujeme
// Poloha (GPS) funguje offline sama, service worker k tomu netřeba.

const VERSION = "v2";
const APP_CACHE = `skrytokraj-app-${VERSION}`;
const TILE_CACHE = `skrytokraj-tiles-${VERSION}`;
const TILE_MAX = 800; // strop počtu uložených dlaždic

const PRECACHE = ["/", "/manifest.webmanifest", "/icon.svg"];

function isTileHost(hostname) {
  return (
    hostname === "api.maptiler.com" ||
    hostname.endsWith(".maptiler.com") ||
    hostname.endsWith("openfreemap.org")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== APP_CACHE && k !== TILE_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  for (let i = 0; i < keys.length - max; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      cache.put(request, res.clone());
      if (max) trimCache(cacheName, max);
    }
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    return cached || (await cache.match("/")) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Mapové dlaždice / styl / fonty (cizí původ) — cache-first
  if (isTileHost(url.hostname)) {
    event.respondWith(cacheFirst(request, TILE_CACHE, TILE_MAX));
    return;
  }

  // Dál řešíme jen náš vlastní původ
  if (url.origin !== self.location.origin) return;

  // API necachujeme (kromě navigace níže) — mutace i dynamická data vždy ze sítě
  if (url.pathname.startsWith("/api/")) return;

  // Statické buildy Next.js + ikony + manifest — cache-first (immutable)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request, APP_CACHE));
    return;
  }

  // Navigace (stránky) — network-first, offline z cache
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, APP_CACHE));
  }
});
