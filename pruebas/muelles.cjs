// v190 (petición n.º 58): «Accesos y muelles» (muelles.js) sin navegador: limpiar fichas, pasar la libreta a otro
// móvil (exporta/importa), buscar y el enlace del mapa. Uso: node pruebas/muelles.cjs
const fs = require("fs"), path = require("path");
global.window = global; global.document = { getElementById: () => null };
new Function(fs.readFileSync(path.join(__dirname, "..", "muelles.js"), "utf8"))();
const M = window.MuellesCuentas;
let mal = 0;
const ok = (c, t) => { console.log((c ? "OK  " : "MAL ") + t); if (!c) mal++; };
ok(M.limpia({ nombre: "", truco: "x" }) === null, "sin nombre no vale");
ok(M.limpia({ nombre: "A", truco: "  " }) === null, "sin truco no vale");
const f = M.limpia({ nombre: "  Nave 3  ", truco: "Entra por detrás", nivel: "raro", maniobra: "otra", lat: "41,98", lon: "2.82", extra: "<script>" });
ok(f && f.nombre === "Nave 3" && f.nivel === "cuidado" && f.maniobra === "" && f.lat === 41.98 && f.lon === 2.82 && !("extra" in f), "limpia recorta, valida opciones y coordenadas");
ok(M.limpia({ nombre: "A", truco: "b", lat: "200", lon: "2" }).lat === undefined, "coordenadas imposibles fuera");
ok(M.limpia({ nombre: "x".repeat(500), truco: "b" }).nombre.length === 80, "nombre como mucho 80");
ok(M.mapa(f) === "https://www.google.com/maps/search/?api=1&query=41.98,2.82" && M.mapa({}) === "", "enlace del mapa solo con coordenadas");
const l = [f, M.limpia({ nombre: "Almacén Sur", lugar: "Lleida", truco: "Puerta 4", nivel: "dificil" })];
ok(M.busca(l, "almacen", "").length === 1 && M.busca(l, "", "dificil").length === 1 && M.busca(l, "nave lleida", "").length === 0, "buscar sin acentos y por nivel");
const t = M.exporta(l);
ok(t.startsWith(M.PREFIJO), "exporta con su prefijo");
let r = M.importa("Mira esto:\n" + t, []);
ok(r.nuevas === 2 && r.lista.length === 2, "importa en un móvil vacío");
r = M.importa(t, l);
ok(r.nuevas === 0 && r.repes === 2 && r.lista.length === 2, "lo repetido no se duplica");
ok(M.importa("hola", l).error === "codigo" && M.importa(M.PREFIJO + "{mal", l).error === "codigo", "texto que no es una libreta");
r = M.importa(M.PREFIJO + JSON.stringify([{ id: f.id, nombre: "Otro", truco: "Otro truco" }]), l);
ok(r.nuevas === 1 && new Set(r.lista.map(x => x.id)).size === 3, "id repetido con otra ficha: se le da otro id y no se pisa nada");
// v197: el caso del padre (3 clientes; se cambia uno y se pega varias veces una copia vieja)
{
  let mia = M.importa(M.exporta([{ id: "aaaa1", nombre: "Brotte SA", truco: "Entrar por detrás" }, { id: "bbbb2", nombre: "Max Plastic", truco: "Marcha atrás" }, { id: "cccc3", nombre: "Faca", truco: "Fácil" }]), []).lista;
  const vieja = M.exporta(mia);
  mia = mia.map(x => x.id === "aaaa1" ? { ...x, truco: "Entrar por detrás, puerta 2" } : x);
  for (let i = 0; i < 15; i++) { const q = M.importa(vieja, mia); mia = q.lista; ok(q.nuevas === 0, `copia vieja pegada (vez ${i + 1}): no añade nada`); if (q.nuevas) break; }
  ok(mia.length === 3 && mia.find(x => x.id === "aaaa1").truco === "Entrar por detrás, puerta 2", "siguen 3 clientes y se queda lo cambiado en este móvil");
  const q = M.importa(M.PREFIJO + JSON.stringify([{ id: "zzzz9", nombre: "  brotte sa ", truco: "ENTRAR por   detrás, puerta 2" }]), mia);
  ok(q.nuevas === 0 && q.repes === 1, "espacios y mayúsculas no hacen una ficha nueva");
  const rep = [{ id: "r1", nombre: "A", truco: "x", cambiado: "2026-11-01" }, { id: "r2", nombre: "a ", truco: "X", cambiado: "2026-11-05" }, { id: "r3", nombre: "A", truco: "x", cambiado: "2026-11-02" }, { id: "r4", nombre: "B", truco: "y" }];
  ok(JSON.stringify(M.repetidas(rep).sort()) === '["r1","r3"]', "repetidas: se queda la más reciente (r2)");
  ok(JSON.stringify(M.repetidas(rep, new Set(["r3"])).sort()) === '["r1","r2"]', "repetidas: se queda la que tiene foto (r3)");
  ok(M.repetidas(rep.slice(3)).length === 0, "sin repetidas no sobra nada");
}
// v199 (petición n.º 67): horario de cada cliente
{
  const h = M.limpiaHor({ b: [{ d: [1, 2, 3, 4, 5], t: [[360, 840], [900, 1200]] }, { d: [6], t: [[360, 720]] }] });
  ok(M.horTexto(h) === "L–V 6:00–14:00 y 15:00–20:00 · S 6:00–12:00", "horario escrito en corto");
  const E = (s) => M.estado(h, new Date(s));
  ok(E("2026-11-23T07:00").abierto && E("2026-11-23T07:00").cierra.m === 840, "lunes 7:00: abierto, cierra a las 14:00");
  ok(!E("2026-11-23T14:30").abierto && E("2026-11-23T14:30").abre.m === 900 && E("2026-11-23T14:30").abre.dentro === 0, "lunes 14:30: cerrado, abre hoy a las 15:00");
  ok(E("2026-11-23T21:00").abre.dentro === 1 && E("2026-11-23T21:00").abre.m === 360, "lunes 21:00: abre mañana a las 6:00");
  ok(E("2026-11-21T13:00").abre.dentro === 2 && E("2026-11-21T13:00").abre.dia === 1, "sábado 13:00: abre el lunes");
  ok(!E("2026-11-23T20:00").abierto && E("2026-11-23T19:59").abierto, "a las 20:00 ya está cerrado; a las 19:59 aún abierto");
  const n = M.limpiaHor({ b: [{ d: [5], t: [[1320, 360]] }] });
  ok(M.estado(n, new Date("2026-11-21T03:00")).abierto && M.estado(n, new Date("2026-11-20T23:00")).cierra.dentro === 1, "turno de noche (viernes 22:00–6:00) pasa la medianoche");
  ok(M.estado({ h24: true }, new Date()).abierto && M.horTexto({ h24: true }) === "24 h", "24 horas");
  ok(M.estado(null, new Date()) === null && M.horTexto(null) === "", "sin horario no dice nada");
  ok(M.limpiaHor({ b: [{ d: [9, "x"], t: [[10, 10]] }] }) === null && M.limpiaHor("hola") === null, "horario mal escrito: fuera");
  ok(M.limpiaHor({ b: [{ d: [1, 1, 3], t: [[60, 120], [200, 300], [400, 500]] }] }).b[0].t.length === 2, "como mucho 2 turnos y días sin repetir");
  const f = M.limpia({ id: "hhhh1", nombre: "A", truco: "b", epis: "Casco y chaleco", hor: h });
  ok(f.epis === "Casco y chaleco" && f.hor.b.length === 2, "lo que había en EPIs se queda (nota) y el horario se guarda");
  const ida = M.importa(M.exporta([f]), []).lista[0];
  ok(JSON.stringify(ida.hor) === JSON.stringify(f.hor), "el horario pasa al otro móvil con la libreta");
  ok(!("hor" in M.limpia({ nombre: "A", truco: "b" })), "ficha sin horario: no se añade nada");
}
const muchas = Array.from({ length: M.TOPE }, (_, i) => M.limpia({ nombre: "C" + i, truco: "t" }));
r = M.importa(M.exporta([M.limpia({ nombre: "Nueva", truco: "t" })]), muchas);
ok(r.nuevas === 0 && r.sobran === 1, "con la libreta llena no se añade más");
const r2 = M.rutas(f);
ok(r2 && r2.google === "https://www.google.com/maps/dir/?api=1&destination=41.98,2.82&travelmode=driving" && r2.waze === "https://waze.com/ul?ll=41.98,2.82&navigate=yes" && r2.osm.startsWith("https://www.openstreetmap.org/directions?to=41.98%2C2.82"), "«Ir allí»: Google Maps, Waze y OpenStreetMap con https");
ok(M.rutas({ nombre: "A", truco: "b" }) === null, "sin posición no hay «Ir allí»");
process.exit(mal ? 1 : 0);
