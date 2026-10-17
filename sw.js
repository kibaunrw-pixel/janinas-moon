/* Janinas Moon – Offline-Speicher. Ausbau-Fundament 1 */
const CACHE = "janinas-moon-chronik-1";
const FILES = ["./", "index.html", "jm-data.js", "jm-ausbau.js", "jm-stadt.js", "jm-post.js", "jm-ereignisse.js", "jm-dorf.js", "jm-romantik.js", "jm-tiere.js", "jm-cafe.js", "jm-magie.js", "jm-ziele.js", "jm-chronik.js", "jm-art.js", "jm-art3.js", "jm-art5.js", "jm-game.js", "jm-3d.js", "three.module.min.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
// Kein skipWaiting: ein laufender Hof wird bei einem späteren Update nicht zwangsweise übernommen.
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Netz zuerst, damit Updates ankommen; offline aus dem Speicher
    e.respondWith(fetch(req, { cache: "no-cache" }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  } else if (url.host.includes("fonts.googleapis.com") || url.host.includes("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; })));
  }
});
