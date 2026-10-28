// Ruta para camión de «Aparcamientos en mi ruta» (Zona Conductores). Pública (como «traducir» y «calendario»), gratis y sin claves:
// - lugares con Photon (komoot, OpenStreetMap) y, de reserva, Nominatim; rutas con el perfil de camión de Valhalla (FOSSGIS, OpenStreetMap).
// No se guarda nada: ni origen, ni destino, ni quién lo pide. Esos servicios solo ven la dirección de este servidor.
// v5: además devuelve «fina» (la ruta simplificada a ~8 m, para saber en el móvil a qué lado de la autopista queda cada aparcamiento)
// y «autopista» (tramos [km inicio, km fin] por autopista: ahí no se puede cruzar al otro sentido).
// v6: código postal opcional y, si hay varios pueblos con el mismo nombre, devuelve «elegir» con las opciones (el móvil
// vuelve a pedir con las coordenadas de la elegida). Con la web nueva («elegir: true»), hasta 2 rutas alternativas en «alternativas».
// v9: «peajes» (tramos de peaje en km) para el precio aproximado de los peajes.
const UA = "CCOO-Calsina-Carre-web/1.0 (seccion sindical; rutas para camion)";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const num = (v: unknown, min: number, max: number, def: number) => { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) && n >= min && n <= max ? n : def; };

type Lugar = { nombre: string; lat: number; lon: number; detalle?: string; cp?: string; tipo?: string };
const sinAcentos = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
async function photon(t: string): Promise<Lugar[]> {
  const u = new URL("https://photon.komoot.io/api/");
  u.search = new URLSearchParams({ q: t, limit: "8" }).toString();
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("photon " + r.status);
  return ((await r.json())?.features || []).map((f: any) => {
    const p = f.properties || {}, [lon, lat] = f.geometry.coordinates;
    const detalle = [p.postcode, p.county && p.county !== p.name ? p.county : "", p.state, p.country].filter(Boolean).join(", ").slice(0, 120);
    return { nombre: String(p.name || t).slice(0, 80), lat, lon, detalle, cp: String(p.postcode || ""), tipo: String(p.osm_value || "") };
  });
}
async function nominatim(t: string): Promise<Lugar[]> {
  const u = new URL("https://nominatim.openstreetmap.org/search");
  u.search = new URLSearchParams({ q: t, format: "jsonv2", limit: "5", "accept-language": "es", addressdetails: "1" }).toString();
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("nominatim " + r.status);
  const d = await r.json();
  if (!Array.isArray(d)) return [];
  return d.map((x: any) => { const a = x.address || {}; return { nombre: String(x.name || String(x.display_name || t).split(",")[0]).slice(0, 80), lat: +x.lat, lon: +x.lon,
    detalle: [a.postcode, a.county, a.state, a.country].filter(Boolean).join(", ").slice(0, 120), cp: String(a.postcode || "") }; });
}
// Devuelve el sitio y, si hay otros con el mismo nombre en sitios distintos, las opciones para elegir
async function busca(q: unknown, cpPedido: unknown): Promise<{ lugar: Lugar | null; opciones?: Lugar[] }> {
  if (q && typeof q === "object" && Number.isFinite((q as any).lat) && Number.isFinite((q as any).lon)) {
    const { lat, lon, nombre } = q as any; return { lugar: { nombre: String(nombre || "Tu ubicación").slice(0, 80), lat, lon } };
  }
  const t = String(q || "").trim().slice(0, 120), cp = String(cpPedido || "").replace(/\s+/g, "").toUpperCase().slice(0, 10);
  if (t.length < 2 && !cp) return { lugar: null };
  const texto = [cp, t].filter(Boolean).join(" ");
  let l: Lugar[] = [];
  try { l = await photon(texto); } catch (e) { console.error("ruta", String(e)); }
  if (!l.length) try { l = await nominatim(texto); } catch (e) { console.error("ruta", String(e)); }
  if (cp) { const c = l.filter(x => x.cp.replace(/\s+/g, "").toUpperCase().startsWith(cp)); if (c.length) l = c; }
  // Solo Europa (los aparcamientos son de Europa): así «Milano» no pregunta por uno de Texas
  const eu = l.filter(x => x.lat >= 34 && x.lat <= 72 && x.lon >= -25 && x.lon <= 45); if (eu.length) l = eu;
  if (!l.length) return { lugar: null };
  // Mismo nombre que el primero y a más de 15 km: hay que preguntar cuál
  const n0 = sinAcentos(l[0].nombre), iguales: Lugar[] = [];
  for (const x of l) if (sinAcentos(x.nombre) === n0 && iguales.every(y => dist([y.lat, y.lon], [x.lat, x.lon]) > 15)) iguales.push(x);
  const nombreDe = (x: Lugar) => [x.nombre, x.detalle?.split(", ").slice(-1)[0]].filter(Boolean).join(", ").slice(0, 80);
  // Si el primero es una ciudad y los demás son pueblos pequeños, es la ciudad: no se pregunta
  const grande = (x: Lugar) => x.tipo === "city";
  if (grande(iguales[0]) && iguales.slice(1).every(x => !grande(x))) iguales.length = 1;
  if (iguales.length > 1 && !cp) return { lugar: null, opciones: iguales.slice(0, 5).map(({ tipo: _t, ...x }) => ({ ...x, nombre: nombreDe(x) })) };
  const { tipo: _t, ...primero } = l[0];
  return { lugar: { ...primero, nombre: nombreDe(primero) } };
}

// Polilínea de Valhalla (6 decimales)
function decodifica(s: string): [number, number][] {
  const p: [number, number][] = []; let i = 0, lat = 0, lon = 0;
  while (i < s.length) {
    for (const k of [0, 1]) {
      let b, sh = 0, r = 0;
      do { b = s.charCodeAt(i++) - 63; r |= (b & 0x1f) << sh; sh += 5; } while (b >= 0x20);
      const d = r & 1 ? ~(r >> 1) : r >> 1;
      if (k === 0) lat += d; else lon += d;
    }
    p.push([lat / 1e6, lon / 1e6]);
  }
  return p;
}
const dist = (a: [number, number], b: [number, number]) => { const R = 6371, r = Math.PI / 180, x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
// Simplifica la ruta (Douglas-Peucker, en metros) para mandarla al móvil sin perder las curvas
function simplifica(p: [number, number][], tol: number): [number, number][] {
  if (p.length < 3) return p;
  const k = Math.cos(p[0][0] * Math.PI / 180) * 111320, m = 110540;
  const xy = p.map(([la, lo]) => [lo * k, la * m]);
  const deja = new Uint8Array(p.length); deja[0] = deja[p.length - 1] = 1;
  const pila: [number, number][] = [[0, p.length - 1]];
  while (pila.length) {
    const [a, z] = pila.pop()!; let peor = -1, idx = -1;
    const [ax, ay] = xy[a], [zx, zy] = xy[z], dx = zx - ax, dy = zy - ay, l2 = dx * dx + dy * dy;
    for (let i = a + 1; i < z; i++) {
      const [px, py] = xy[i]; let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - ax - t * dx, py - ay - t * dy); if (d > peor) { peor = d; idx = i; }
    }
    if (peor > tol) { deja[idx] = 1; pila.push([a, idx], [idx, z]); }
  }
  return p.filter((_, i) => deja[i]);
}
const esVia = (n: string) => /^(?:[A-Z]{1,3}[- ]?\d{1,4}[a-z]?|E[- ]?\d{1,3})$/.test(n.trim());
const esEuropea = (n: string) => /^E[- ]?\d/.test(n.trim());
// La de las señales del país (AP-7, A9) antes que la europea (E 15); «A 9» se escribe «A9»
const viaDe = (ns: string[]) => (ns.find(n => esVia(n) && !esEuropea(n)) || ns.find(esVia) || "").trim().replace(/^([A-Z]{1,3}) (\d)/, "$1$2");

// Una ruta de Valhalla, lista para el móvil
function prepara(trip: any) {
  const leg = trip.legs[0], pts = decodifica(leg.shape);
  // Minutos desde la salida en cada punto: el tiempo de cada maniobra repartido a lo largo de su tramo
  const acumKm: number[] = [0]; for (let i = 1; i < pts.length; i++) acumKm.push(acumKm[i - 1] + dist(pts[i - 1], pts[i]));
  const acumMin: number[] = new Array(pts.length).fill(0); let t0 = 0;
  for (const m of leg.maneuvers) {
    const a = m.begin_shape_index, z = Math.max(a, m.end_shape_index), largo = acumKm[z] - acumKm[a] || 1;
    for (let i = a; i <= z; i++) acumMin[i] = t0 + (m.time / 60) * ((acumKm[i] - acumKm[a]) / largo);
    t0 += m.time / 60;
  }
  // Puntos cada ~1,5 km: [lat, lon, km, minutos]
  const puntos: number[][] = []; let ult = -99;
  pts.forEach((p, i) => { if (acumKm[i] - ult >= 1.5 || i === pts.length - 1) { puntos.push([+p[0].toFixed(5), +p[1].toFixed(5), +acumKm[i].toFixed(1), Math.round(acumMin[i])]); ult = acumKm[i]; } });
  const fina = simplifica(pts, 8).map(([la, lo]) => [+la.toFixed(5), +lo.toFixed(5)]);
  // Tramos por autopista («highway» de Valhalla) y de peaje («toll»), en km [inicio, fin], juntando los seguidos
  const tramosDe = (campo: string) => {
    const r: number[][] = [];
    for (const m of leg.maneuvers) {
      if (!m[campo]) continue;
      const a = acumKm[m.begin_shape_index], z = acumKm[Math.max(m.begin_shape_index, m.end_shape_index)], u = r[r.length - 1];
      if (u && a - u[1] < 0.5) u[1] = +z.toFixed(1); else r.push([+a.toFixed(1), +z.toFixed(1)]);
    }
    return r;
  };
  const autopista = tramosDe("highway"), peajes = tramosDe("toll");
  // Lista de carreteras: tramos seguidos por la misma vía, con hacia dónde
  const tramos: { via: string; km: number; hacia: string }[] = [];
  for (const m of leg.maneuvers) {
    const via = viaDe([...(m.street_names || []), ...(m.begin_street_names || [])]);
    const hacia = (m.sign?.exit_toward_elements || m.sign?.exit_branch_elements || []).map((x: any) => x.text).filter(Boolean).slice(0, 2).join(" / ");
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && (ultimo.via === via || (!via && m.length < 3))) { ultimo.km += m.length; if (hacia && !ultimo.hacia) ultimo.hacia = hacia; }
    else tramos.push({ via, km: m.length, hacia });
  }
  const limpios = tramos.filter(x => x.via || x.km >= 3).map(x => ({ ...x, km: Math.round(x.km) }));
  const s = trip.summary;
  return { km: Math.round(s.length), min: Math.round(s.time / 60), peaje: !!s.has_toll, ferry: !!s.has_ferry, tramos: limpios, puntos, fina, autopista, peajes };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: "Petición mal hecha" }, 400); }
  try {
    const [bd, bh] = await Promise.all([busca(b.desde, b.cp_desde), busca(b.hasta, b.cp_hasta)]);
    // Solo la web nueva (v90, manda «elegir: true») sabe preguntar; la publicada antes se queda con el primero, como siempre
    if ((bd.opciones || bh.opciones) && b.elegir === true) return json({ elegir: { desde: bd.opciones, hasta: bh.opciones } });
    const desde = bd.lugar || bd.opciones?.[0] || null, hasta = bh.lugar || bh.opciones?.[0] || null;
    if (!desde) return json({ error: "No encuentro el sitio de salida. Escribe la ciudad y el país, por ejemplo «Girona, España», o pon el código postal." }, 422);
    if (!hasta) return json({ error: "No encuentro el destino. Escribe la ciudad y el país, por ejemplo «Milán, Italia», o pon el código postal." }, 422);
    const c = b.camion || {};
    const camion = { height: num(c.alto, 2, 5, 4), width: num(c.ancho, 2, 3.5, 2.55), length: num(c.largo, 5, 30, 16.5), weight: num(c.peso, 3.5, 60, 40), axle_load: num(c.eje, 1, 20, 11.5), hazmat: !!c.adr };
    const r = await fetch("https://valhalla1.openstreetmap.de/route", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({ locations: [{ lat: desde.lat, lon: desde.lon }, { lat: hasta.lat, lon: hasta.lon }], costing: "truck", costing_options: { truck: camion },
        ...(b.elegir === true ? { alternates: 2 } : {}), directions_options: { language: "es-ES", units: "kilometers" } }) });
    const d = await r.json().catch(() => null);
    if (!r.ok || !d?.trip) { console.error("ruta valhalla", r.status, JSON.stringify(d).slice(0, 200)); return json({ error: d?.error ? "No hay ruta para camión entre esos dos sitios (" + String(d.error).slice(0, 80) + ")." : "El servidor de rutas no contesta. Prueba dentro de un rato." }, 502); }
    const principal = prepara(d.trip), alternativas = (d.alternates || []).slice(0, 2).map((a: any) => prepara(a.trip));
    return json({ desde, hasta, camion, ...principal, alternativas });
  } catch (e) {
    console.error("ruta", String(e).slice(0, 200));
    return json({ error: "No se ha podido calcular la ruta ahora. Prueba dentro de un rato." }, 502);
  }
});
