// Pruebas que humo.cjs no hace: (1) .ics con horas HH:MM:SS (como las devuelve Postgres),
// (2) fecha de hoy en otra zona horaria, (3) service worker real: precache y arranque sin conexión.
// Uso: python3 -m http.server 8765 &   y luego   BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/navegador.cjs
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:8765/";
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
const fallos = [];
(async () => {
  const nav = await chromium.launch();
  // ---- 1 y 2: ICS y zona horaria (SW bloqueado para poder usar el mock)
  const ctx = await nav.newContext({ timezoneId: "America/New_York", serviceWorkers: "block" });
  await ctx.addInitScript(() => localStorage.setItem("ccoo-aviso-privacidad", "1"));
  await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
  const p = await ctx.newPage(); await p.goto(BASE + "index.html"); await p.waitForTimeout(800);
  const ics = async (e) => { const [d] = await Promise.all([p.waitForEvent("download"), p.evaluate(e => descargarICS(e), e)]); return fs.readFileSync(await d.path(), "utf8"); };
  for (const [hora, fin] of [["10:00", null], ["10:00:00", null], ["10:00:00", "11:30:00"], ["23:30:00", null]]) {
    const t = await ics({ id: 1, titulo: "Prueba", fecha: "2026-12-01", hora, hora_fin: fin });
    const ini = t.match(/DTSTART;TZID=Europe\/Madrid:(\S+)/)?.[1], f = t.match(/DTEND;TZID=Europe\/Madrid:(\S+)/)?.[1];
    const ok = (x) => /^\d{8}T([01]\d|2[0-3])[0-5]\d00$/.test(x || "");
    if (!ok(ini) || !ok(f)) fallos.push(`ICS hora=${hora} fin=${fin}: DTSTART=${ini} DTEND=${f} (formato inválido)`);
  }
  // hoyISO con la hora local del móvil a las 23:30 del 31-dic en Nueva York = 1-ene en UTC
  const hoy = await p.evaluate(() => { const R = Date; const fijo = new R("2026-12-31T23:30:00-05:00").getTime(); window.Date = class extends R { constructor(...a) { super(...(a.length ? a : [fijo])); } static now() { return fijo; } }; const x = hoyISO(); window.Date = R; return x; });
  if (hoy !== "2026-12-31") fallos.push("hoyISO en Nueva York a las 23:30: " + hoy);
  await ctx.close();
  // ---- 3: service worker real, sin conexión
  const c2 = await nav.newContext({ serviceWorkers: "allow" });
  await c2.addInitScript(() => localStorage.setItem("ccoo-aviso-privacidad", "1"));
  const q = await c2.newPage(); await q.goto(BASE + "index.html", { waitUntil: "load" });
  await q.evaluate(() => navigator.serviceWorker.ready); await q.waitForTimeout(1500);
  await q.reload({ waitUntil: "load" }); await q.waitForTimeout(1500); // segunda carga: ya controlado por el SW
  const cache = await q.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks[0]); return { ks, urls: (await c.keys()).map(r => r.url.replace(location.origin, "")) }; });
  const V = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8").match(/VERSION = "(\d+)"/)[1];
  if (cache.ks.length !== 1 || cache.ks[0] !== "ccoo-v" + V) fallos.push("cachés: " + cache.ks);
  for (const f of ["aparcar.js?v=" + V, "app.js?v=" + V, "index.html"]) if (!cache.urls.some(u => u.endsWith(f))) fallos.push("no está en la caché tras 2 cargas: " + f);
  const antes = Date.now(); await c2.setOffline(true);
  const r = await q.goto(BASE + "index.html?fbclid=abc", { waitUntil: "load" }).catch(e => null);
  const titulo = await q.title().catch(() => "");
  if (!/CCOO/.test(titulo)) fallos.push("sin conexión no abre la portada: " + titulo);
  const nodos = await q.evaluate(() => document.querySelectorAll("#v-inicio *").length).catch(() => 0);
  if (nodos < 20) fallos.push("sin conexión la portada sale casi vacía (" + nodos + " nodos)");
  console.log("Caché:", cache.urls.length, "archivos; offline ok en", Date.now() - antes, "ms");
  await nav.close();
  console.log(fallos.length ? "FALLOS:\n- " + fallos.join("\n- ") : "Todo bien");
  process.exit(fallos.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
