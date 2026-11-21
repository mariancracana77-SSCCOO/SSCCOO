// v196 (peticiones n.º 64 y 65): cuentas de «Ferry y tren» (ferry.js), datos de la «Guía de testigos»
// (testigos.js), sin navegador. Uso: node pruebas/utilidades-v196.cjs
const fs = require("fs"), path = require("path");
global.window = {}; global.document = { getElementById: () => null };
for (const f of ["ferry.js", "testigos.js"]) new Function(fs.readFileSync(path.join(__dirname, "..", f), "utf8"))();
const F = window.FerryCuentas, T = window.TestigosDatos;
let mal = 0;
const ok = (c, t) => { if (!c) mal++; console.log((c ? "OK  " : "MAL ") + t); };
// Ferry: 561/2006 art. 9
const d = (o) => F.calcula(Object.assign({ tipo: "diario", litera: "camarote", m1: 30, m2: 30 }, o));
let r = d({ ini: "2026-11-21T20:00", fin: "2026-11-22T08:00", emb: "2026-11-21T20:30", des: "2026-11-22T07:00" });
ok(r.ok && r.cortes.length === 2 && r.descanso === 660 && r.enCortes === 60, "12 h con 2 cortes de 30 min: 11 h que cuentan, vale");
ok(new Date(r.vuelve).getHours() === 8, "puede volver a conducir a las 8:00 (11 h + 1 h de cortes)");
r = d({ ini: "2026-11-21T20:00", fin: "2026-11-22T08:00", emb: "2026-11-21T20:30", des: "2026-11-22T07:00", m1: 40, m2: 40 });
ok(!r.ok && r.fallos.some(f => f.includes("1 hora")), "cortes de 80 min: se pasa de 1 hora");
r = d({ ini: "2026-11-21T20:00", fin: "2026-11-22T08:00", emb: "2026-11-21T20:30", des: "2026-11-22T07:00", litera: "no" });
ok(!r.ok && r.fallos.some(f => f.includes("litera")), "sin litera ni camarote: no vale");
r = d({ tipo: "reducido", ini: "2026-11-21T20:00", fin: "2026-11-22T06:00", emb: "2026-11-21T20:30", des: "2026-11-22T05:30" });
ok(!r.ok && r.fallos.some(f => f.includes("no se puede cortar")), "diario reducido cortado: no vale");
r = d({ tipo: "reducido", ini: "2026-11-21T20:00", fin: "2026-11-22T05:00", emb: "2026-11-21T19:00", des: "2026-11-22T06:00" });
ok(r.ok && r.cortes.length === 0, "diario reducido entero a bordo, sin cortes: vale");
r = d({ tipo: "semanal", litera: "litera", ini: "2026-11-21T08:00", fin: "2026-11-23T06:00", emb: "2026-11-21T07:00", des: "2026-11-21T20:00" });
ok(!r.ok && r.fallos.some(f => f.includes("camarote")), "semanal normal con litera: necesita camarote");
r = d({ tipo: "semanal", ini: "2026-11-21T08:00", fin: "2026-11-23T06:00", emb: "2026-11-21T07:00", des: "2026-11-21T13:00" });
ok(!r.ok && r.fallos.some(f => f.includes("8 h")), "semanal normal con viaje de 6 h: no vale");
r = d({ tipo: "semanal", ini: "2026-11-21T08:00", fin: "2026-11-23T06:30", emb: "2026-11-21T07:00", des: "2026-11-21T20:00" });
ok(r.ok, "semanal normal, viaje de 13 h y camarote, 46,5 h con 1 corte: vale");
r = d({ ini: "2026-11-21T20:00", fin: "2026-11-22T06:00", emb: "2026-11-21T19:00", des: "2026-11-22T07:00" });
ok(!r.ok && r.fallos[0].includes("Te faltan"), "10 h: faltan horas");
ok(d({ ini: "", fin: "", emb: "", des: "" }).falta, "sin horas: pide los datos");
ok(!!d({ ini: "2026-11-22T08:00", fin: "2026-11-21T20:00", emb: "2026-11-21T20:00", des: "2026-11-22T07:00" }).mal, "fin antes que inicio: avisa");
ok(F.hm(90) === "1 h 30 min" && F.hm(60) === "1 h" && F.hm(5) === "5 min", "horas y minutos bien escritos");
// Testigos
const daf = T.MARCAS.find(m => m.id === "daf");
ok(daf && daf.t.length >= 30, `DAF tiene ${daf.t.length} testigos`);
ok(daf.t.every(x => T.COLOR[x.c] && x.a && x.n && x.v && x.s && x.h), "todos con color, pastilla, nombre, cómo se ve, qué significa y qué hacer");
ok(new Set(daf.t.map(x => x.n)).size === daf.t.length, "sin nombres repetidos");
console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
process.exit(mal ? 1 : 0);
