// Service worker de Topecripto.
// Criterio: la red manda siempre. La caché solo entra cuando no hay conexión,
// para que nadie vea nunca una versión antigua de la app ni precios caducados.
// Las llamadas a /api/ no se guardan nunca: son datos en vivo.

const CACHE = "topecripto-v1";
const SHELL = ["/", "/manifest.webmanifest", "/favicon.svg", "/icon.png", "/icon-symbol.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;   // CoinGecko y demás: directo a la red
  if (url.pathname.startsWith("/api/")) return;      // datos en vivo: nunca de la caché

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("/") : undefined))
      )
  );
});
