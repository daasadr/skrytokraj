// Skrytokraj — jednoduchý service worker (fáze 1).
// Účel: umožnit instalaci PWA na plochu telefonu a základní offline shell.
// Plná offline strategie (kešování mapových dlaždic apod.) přijde později.

const CACHE = "skrytokraj-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

// Network-first pro navigaci (ať uživatel vidí aktuální obsah), s fallbackem
// na cache, když je offline. Ostatní požadavky (API, dlaždice) neřešíme.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/").then((r) => r || Response.error())),
    );
  }
});
