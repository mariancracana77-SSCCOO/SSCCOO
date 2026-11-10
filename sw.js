// Service worker: permite instalar la web como app, abrirla sin conexión
// y recibir notificaciones aunque la app esté cerrada.
const VERSION = "168"; // súbelo en cada actualización
const CACHE = "ccoo-v" + VERSION;
const BASE = ["./", "index.html", "logo.png", "icon-192.png", "camion.webp", "icon-512.png", "badge-96.png", "manifest.json", "fuentes/atkinson-hyperlegible-latin-400-normal.woff2", "fuentes/atkinson-hyperlegible-latin-700-normal.woff2", "fuentes/barlow-condensed-latin-700-normal.woff2", ...["styles.css", "fuentes.css", "lectura.js", "lib/supabase.js", "config.js", "iconos.js", "render.js", "app.js", "descansos.js", "ganancias.js", "aparcar.js", "lib/leaflet.js", "lib/leaflet.css"].map(f => f + "?v=" + VERSION)];
// cache: "reload": se piden a internet, no a la caché normal del navegador (GitHub Pages la guarda 10 minutos y
// se podría quedar con una portada de la versión anterior junto a los archivos de la nueva)
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE.map(u => new Request(u, { cache: "reload" }))))); self.skipWaiting(); });
// Solo se borran las cachés viejas de ESTA web (ccoo-v…): la web del Comité está en la misma dirección
// (mariancracana77-ssccoo.github.io) y sus cachés (comite-v…) son suyas
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("ccoo-v") && k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // los datos van siempre en directo
  const pagina = e.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  // Solo se guarda lo que ha llegado bien (un error no debe sustituir a la copia buena)
  const guarda = (r) => { if (r.ok && r.type === "basic") { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; };
  // Archivos con número de versión (?v=N): no cambian nunca, así que salen del móvil al instante.
  // Cuando hay versión nueva, la página pide otro ?v= y ese sí se descarga.
  if (!pagina && url.searchParams.has("v")) {
    e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(guarda)));
    return;
  }
  // Páginas, logo, fuentes…: primero internet (para tener lo último) y, sin conexión, lo guardado
  const red = fetch(pagina ? new Request(e.request, { cache: "no-store" }) : e.request).then(guarda);
  // Sin conexión: los enlaces compartidos llegan con añadidos (?fbclid=…) que no están guardados; se busca sin ellos
  const copia = () => pagina
    ? caches.match(e.request, { ignoreSearch: true }).then(r => r || (/\/(index\.html)?$/.test(url.pathname) ? caches.match("index.html") : r))
    : caches.match(e.request);
  if (e.request.mode !== "navigate") { e.respondWith(red.catch(copia)); return; }
  // Al abrir la web con poca cobertura, internet puede tardar mucho en contestar: si en 4 segundos no llega, se enseña
  // lo guardado (si lo hay) y la descarga sigue por detrás para dejar la copia al día
  e.waitUntil(red.catch(() => {}));
  const tope = new Promise((_, no) => setTimeout(() => no(new Error("tarda")), 4000));
  e.respondWith(Promise.race([red, tope]).catch(() => copia().then(r => r || red)));
});

// Notificación recibida
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { titulo: "Sección Sindical CCOO", cuerpo: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Sección Sindical CCOO", {
    body: d.cuerpo || "", icon: "icon-192.png", badge: "badge-96.png", tag: d.etiqueta || undefined,
    data: { url: d.url || "./" }, vibrate: [120, 60, 120],
  }));
});
// Al tocar la notificación: abre la web en la sección correspondiente
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const destino = e.notification.data && e.notification.data.url || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if (w.url.startsWith(self.registration.scope)) { w.navigate(destino); return w.focus(); }
    return clients.openWindow(destino);
  }));
});
