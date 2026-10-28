// Cortes, obras e incidencias oficiales para «Aparcamientos en mi ruta» (Zona Conductores). Lo pidió el padre:
// «como Bison Futé en Francia, también Alemania, Italia, Inglaterra…». Fuentes abiertas, gratis y sin registro:
// - España: DGT (DATEX2 v3.7, toda España menos Cataluña y País Vasco) y Servei Català de Trànsit (DATEX II), por el punto de acceso nacional.
// - Alemania: Autobahn GmbH (verkehr.autobahn.de), cortes y avisos de cada autopista.
// (Francia: las autopistas de peaje necesitan registro en Bison Futé; pendiente.)
// La llama la tarea programada «cortes» con su secreto (como «notificar»). Guarda en la tabla «cortes» (lectura pública).
const URL_SB = Deno.env.get("SUPABASE_URL")!, CLAVE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UA = "CCOO-Calsina-Carre-web/1.0 (seccion sindical; cortes para camioneros)";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
const rest = (ruta: string, init: RequestInit = {}) => fetch(`${URL_SB}/rest/v1/${ruta}`, { ...init, headers: { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, "Content-Type": "application/json", ...(init.headers || {}) } });

type Corte = { id: string; pais: string; fuente: string; tipo: string; via: string | null; lat: number; lon: number; lat2: number | null; lon2: number | null;
  rumbo: number | null; texto: string; inicio: string | null; fin: string | null; actualizado: string };

// ---------- DATEX II (DGT y Cataluña) ----------
const RUMBOS: Record<string, number> = { northBound: 0, northEastBound: 45, eastBound: 90, southEastBound: 135, southBound: 180, southWestBound: 225, westBound: 270, northWestBound: 315 };
const CARRIL = ["laneClosures", "narrowLanes", "singleAlternateLineTraffic", "intermittentShortTermClosures", "lanesDeviated", "doNotUseSpecifiedLanesOrCarriageways", "useOfSpecifiedLanesOrCarriagewaysAllowed", "newRoadworksLayout", "contraflow"];
const CARRILES: Record<string, string> = { rightLane: "carril derecho", leftLane: "carril izquierdo", middleLane: "carril central", hardShoulder: "arcén", allLanesCompleteCarriageway: "todos los carriles" };
const VEHICULO: Record<string, string> = { vehicleStuck: "vehículo detenido", brokenDownVehicle: "vehículo averiado", vehicleOnFire: "vehículo en llamas", vehicleWithOverwideLoad: "transporte especial" };
function datex(xml: string, pais: string, fuente: string, ahora: string): Corte[] {
  const res: Corte[] = [];
  const re = /<([A-Za-z0-9_]*:?)situationRecord\b([^>]*)>([\s\S]*?)<\/\1situationRecord>/g;
  for (const m of xml.matchAll(re)) {
    const attrs = m[2], r = m[3];
    const get = (t: string) => r.match(new RegExp(`<[A-Za-z0-9_]*:?${t}>([^<]*)<`))?.[1]?.trim() || "";
    if (get("validityStatus") && get("validityStatus") !== "active") continue;
    const fin = get("overallEndTime") || null;
    if (fin && Date.parse(fin) < Date.now()) continue;
    const coords = [...r.matchAll(/<[A-Za-z0-9_]*:?latitude>([-\d.]+)<\/[A-Za-z0-9_]*:?latitude>\s*<[A-Za-z0-9_]*:?longitude>([-\d.]+)</g)].map(c => [+c[1], +c[2]]);
    if (!coords.length || !coords.every(c => Number.isFinite(c[0]) && Number.isFinite(c[1]))) continue;
    const tipoX = attrs.match(/type="[A-Za-z0-9_]*:?([A-Za-z]+)"/)?.[1] || "", id = attrs.match(/\bid="([^"]+)"/)?.[1] || "";
    if (!id) continue;
    const man = get("roadOrCarriagewayOrLaneManagementType"), causa = get("causeType");
    const tipo = man === "roadClosed" ? "cortada" : man === "carriagewayClosures" ? "sentido"
      : (causa === "accident" || tipoX === "Accident") ? "accidente" : man === "weightRestrictionInOperation" ? "restriccion"
      : CARRIL.includes(man) ? "carril" : (/bstruction/.test(tipoX) || /bstruction/.test(causa)) ? "obstaculo"
      : tipoX === "AbnormalTraffic" ? "retencion" : (tipoX === "MaintenanceWorks" || causa === "roadMaintenance") ? "obras" : "aviso";
    const via = get("roadName") || get("roadNumber") || r.match(/<[A-Za-z0-9_]*:?value>([^<]+)<\/[A-Za-z0-9_]*:?value>\s*<\/[A-Za-z0-9_]*:?descriptor>\s*<[A-Za-z0-9_]*:?tpegDescriptorType>linkName/)?.[1]?.trim() || null;
    const kms = [...r.matchAll(/<[A-Za-z0-9_]*:?kilometerPoint>([\d.]+)</g)].map(k => (+k[1]).toLocaleString("es-ES", { maximumFractionDigits: 1 }));
    const lugar = get("municipality") || r.match(/<[A-Za-z0-9_]*:?value>([^<]+)<\/[A-Za-z0-9_]*:?value>\s*<\/[A-Za-z0-9_]*:?descriptor>\s*<[A-Za-z0-9_]*:?tpegDescriptorType>townName/)?.[1]?.trim() || "";
    const extra = [CARRILES[get("laneUsage")] && tipo === "carril" ? CARRILES[get("laneUsage")] : "", VEHICULO[get("vehicleObstructionType")] || "",
      causa === "roadMaintenance" && tipo !== "obras" ? "por obras" : "", kms.length ? "km " + [...new Set(kms)].join("–") : "", lugar ? lugar.charAt(0) + lugar.slice(1).toLowerCase() : ""].filter(Boolean);
    const [a, z] = [coords[coords.length - 1], coords[0]]; // DATEX pone primero «to» y luego «from»
    res.push({ id: `${fuente}:${id}`, pais, fuente, tipo, via, lat: a[0], lon: a[1], lat2: coords.length > 1 ? z[0] : null, lon2: coords.length > 1 ? z[1] : null,
      rumbo: RUMBOS[get("tpegDirection")] ?? null, texto: extra.join(" · ").slice(0, 300), inicio: get("overallStartTime") || null, fin, actualizado: ahora });
  }
  return res;
}

// ---------- Autobahn GmbH (Alemania) ----------
// Fechas «29.10.26 20:00 bis zum 30.10.26 05:00» (hora de Alemania)
function horaBerlin(d: string, mo: string, a: string, h: string, mi: string): string | null {
  const utc = Date.UTC(2000 + +a, +mo - 1, +d, +h, +mi);
  if (!Number.isFinite(utc)) return null;
  const off = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", timeZoneName: "shortOffset" }).formatToParts(new Date(utc)).find(p => p.type === "timeZoneName")?.value || "GMT+1";
  const hh = +(off.match(/GMT([+-]\d+)/)?.[1] || 1);
  return new Date(utc - hh * 3600000).toISOString();
}
function autobahn(lista: any[], servicio: string, ahora: string): Corte[] {
  const res: Corte[] = [];
  for (const x of lista || []) {
    const lat = +x?.coordinate?.lat, lon = +x?.coordinate?.long;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !x.identifier) continue;
    const desc = (x.description || []).join(" "), titulo = String(x.title || ""), via = titulo.split("|")[0].trim() || null;
    const f = desc.match(/(\d\d)\.(\d\d)\.(\d\d) (\d\d):(\d\d) bis (?:zum )?(\d\d)\.(\d\d)\.(\d\d) (\d\d):(\d\d)/);
    const inicio = f ? horaBerlin(f[1], f[2], f[3], f[4], f[5]) : null, fin = f ? horaBerlin(f[6], f[7], f[8], f[9], f[10]) : null;
    if (fin && Date.parse(fin) < Date.now()) continue;
    if (inicio && Date.parse(inicio) > Date.now() + 36 * 3600000) continue; // lo de más adelante, cuando falte poco
    const simbolos: string[] = x.impact?.symbols || [];
    const t = (titulo + " " + desc).toLowerCase();
    const tipo = servicio === "closure"
      ? (x.isBlocked === "true" || x.isBlocked === true || /vollsperrung/.test(t) ? "cortada" : simbolos.includes("CLOSED") ? "carril" : "obras")
      : /unfall/.test(t) ? "accidente" : /vollsperrung|gesperrt/.test(t) ? "cortada" : /stau|stockender verkehr/.test(t) ? "retencion" : "aviso";
    const ext = String(x.extent || "").split(",").map(Number);
    res.push({ id: `de:${x.identifier}`, pais: "DE", fuente: "autobahn", tipo, via, lat, lon,
      lat2: ext.length === 4 && ext.every(Number.isFinite) ? ext[2] : null, lon2: ext.length === 4 && ext.every(Number.isFinite) ? ext[3] : null, rumbo: null,
      texto: [titulo.split("|").slice(1).join("|").trim(), String(x.subtitle || "").trim()].filter(Boolean).join(" · ").slice(0, 300), inicio, fin, actualizado: ahora });
  }
  return res;
}
async function conLimite<T>(tareas: (() => Promise<T>)[], n: number): Promise<T[]> {
  const res: T[] = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < tareas.length) { const k = i++; res[k] = await tareas[k](); } }));
  return res;
}

async function guarda(fuente: string, filas: Corte[], ahora: string) {
  const unicas = [...new Map(filas.map(f => [f.id, f])).values()];
  for (let i = 0; i < unicas.length; i += 500) {
    const r = await rest("cortes", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(unicas.slice(i, i + 500)) });
    if (!r.ok) throw new Error(`${fuente} guardar ${r.status} ${(await r.text()).slice(0, 200)}`);
  }
  // Lo que ya no viene en la fuente, fuera (solo si la fuente ha contestado bien)
  await rest(`cortes?fuente=eq.${fuente}&actualizado=lt.${encodeURIComponent(ahora)}`, { method: "DELETE" });
  return unicas.length;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const cfg = await rest("config_privada?select=valor&clave=eq.cron_secreto").then(r => r.json()).catch(() => []);
  if (!cfg?.[0]?.valor || req.headers.get("x-cron-secret") !== cfg[0].valor) return json({ error: "No autorizado" }, 401);
  const ahora = new Date().toISOString(), hecho: Record<string, unknown> = {};
  const trae = (u: string) => fetch(u, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
  await Promise.all([
    (async () => { try { const r = await trae("https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v37.xml"); if (!r.ok) throw new Error("dgt " + r.status);
      hecho.dgt = await guarda("dgt", datex(await r.text(), "ES", "dgt", ahora), ahora); } catch (e) { hecho.dgt = String(e).slice(0, 200); } })(),
    (async () => { try { const r = await trae("https://nap.dgt.es/datex2/sct/SituationPublication/all/content.xml"); if (!r.ok) throw new Error("sct " + r.status);
      hecho.sct = await guarda("sct", datex(await r.text(), "ES", "sct", ahora), ahora); } catch (e) { hecho.sct = String(e).slice(0, 200); } })(),
    (async () => { try {
      const vias: string[] = (await trae("https://verkehr.autobahn.de/o/autobahn/").then(r => r.json())).roads || [];
      if (!vias.length) throw new Error("autobahn sin vías");
      const partes = await conLimite(vias.flatMap(v => ["closure", "warning"].map(s => async () => {
        try { const r = await trae(`https://verkehr.autobahn.de/o/autobahn/${encodeURIComponent(v.trim())}/services/${s}`); return r.ok ? autobahn((await r.json())[s], s, ahora) : null; } catch { return null; }
      })), 8);
      if (partes.filter(p => p === null).length > partes.length / 2) throw new Error("autobahn: fallan demasiadas vías");
      hecho.autobahn = await guarda("autobahn", partes.flatMap(p => p || []), ahora);
    } catch (e) { hecho.autobahn = String(e).slice(0, 200); } })(),
  ]);
  return json({ ok: true, ...hecho });
});
