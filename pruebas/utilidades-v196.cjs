// v196 (peticiones n.º 64 y 65): cuentas de «Ferry y tren» (ferry.js), datos de la «Guía de testigos»
// (testigos.js), sin navegador. Uso: node pruebas/utilidades-v196.cjs
const fs = require("fs"), path = require("path");
global.window = {}; global.document = { getElementById: () => null };
for (const f of ["ferry.js", "testigos.js"]) new Function(fs.readFileSync(path.join(__dirname, "..", f), "utf8"))();
const T = window.TestigosDatos;
let mal = 0;
const ok = (c, t) => { if (!c) mal++; console.log((c ? "OK  " : "MAL ") + t); };
// Ferry: ahora en pruebas/ferry-v198.cjs (la herramienta se rehízo en la v198)
// Testigos
const daf = T.MARCAS.find(m => m.id === "daf");
ok(daf && daf.t.length >= 30, `DAF tiene ${daf.t.length} testigos`);
// v210: los del cuadro vienen del manual DAF del padre (número, página y texto); los demás siguen con el formato de antes
const cuadro = daf.t.filter(x => x.g === "cuadro"), otros = daf.t.filter(x => x.g !== "cuadro");
ok(cuadro.length >= 55, `${cuadro.length} testigos del cuadro del manual`);
ok(cuadro.every(x => x.n && x.i && Number.isInteger(x.num) && x.num >= 0 && x.num <= 39 && x.p >= 101 && x.p <= 109 && typeof x.m === "string"), "los del cuadro con nombre, dibujo, número y página del manual (101-109)");
ok(otros.every(x => x.g === "otros" && T.COLOR[x.c] && x.a && x.n && x.v && x.s && x.h), "los otros con color, pastilla, nombre, cómo se ve, qué significa y qué hacer");
global.window.TestigosIconos = {}; new Function(fs.readFileSync(path.join(__dirname, "..", "testigos-iconos.js"), "utf8"))();
ok(daf.t.every(x => window.TestigosIconos[x.i]), "todos tienen dibujo");
ok(new Set(daf.t.map(x => x.n)).size === daf.t.length, "sin nombres repetidos");
console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
process.exit(mal ? 1 : 0);
