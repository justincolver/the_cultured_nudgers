const CACHE_NAME = "cultured-nudgers-v190";
const ASSETS = [
  "./index.html",
  "./login.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./assets/icons/app-logo.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/images/homepage-logo.png",
  "./assets/images/tours/2016-morocco.jpg",
  "./assets/images/tours/2017-monte-rei.jpg",
  "./assets/images/tours/2018-laranjal.webp",
  "./assets/images/tours/2019-vilamoura.jpg",
  "./assets/images/tours/2021-st-mellion-burnham-berrow.webp",
  "./assets/images/tours/2022-carnoustie.jpg",
  "./assets/images/tours/2023-woodhall-spa.jpg",
  "./assets/images/tours/2024-hardelot-le-touquet.jpg",
  "./assets/images/tours/2025-bruges-damme.jpg",
  "./assets/images/tours/2026-aberdovey.webp",
  "./assets/images/trophies/bill-splitter-trophy-lite.png",
  "./assets/images/headshots/bander-pyke.png",
  "./assets/images/headshots/brian-crotty.png",
  "./assets/images/headshots/eamonn-sheehy.png",
  "./assets/images/headshots/edmund-northcott.png",
  "./assets/images/headshots/george-holman.png",
  "./assets/images/headshots/greg-smith.png",
  "./assets/images/headshots/harry-rowlinson.png",
  "./assets/images/headshots/henry-rudkin.png",
  "./assets/images/headshots/james-barrie.png",
  "./assets/images/headshots/james-rowlinson.png",
  "./assets/images/headshots/joe-barnett.png",
  "./assets/images/headshots/johnny-griffiths.png",
  "./assets/images/headshots/justin-colver.png",
  "./assets/images/headshots/luka-syplywczak.png",
  "./assets/images/headshots/matt-neely.png",
  "./assets/images/headshots/nick-gubbins.png",
  "./assets/images/headshots/patch-foster.png",
  "./assets/images/headshots/peter-crocombe.png",
  "./assets/images/headshots/raff-mckenzie.png",
  "./assets/images/headshots/rob-moore.png",
  "./assets/images/headshots/sam-foster.png",
  "./assets/images/headshots/simon-collings.png",
  "./assets/images/headshots/simon-hicks.png",
  "./assets/images/headshots/tom-smith.png",
  "./assets/images/headshots/tom-tynan.png",
  "./assets/images/headshots/tom-wigglesworth.png",
  "./assets/images/headshots/will-gubbins.png",
  "./assets/images/headshots/will-major.png",
  "./assets/images/headshots/will-macpherson.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) return response;
          return caches.match("./index.html").then((cached) => cached || fetch("/"));
        })
        .catch(() => caches.match("./index.html").then((cached) => cached || fetch("/")))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
