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
ok(daf.t.every(x => T.COLOR[x.c] && x.a && x.n && x.v && x.s && x.h), "todos con color, pastilla, nombre, cómo se ve, qué significa y qué hacer");
ok(new Set(daf.t.map(x => x.n)).size === daf.t.length, "sin nombres repetidos");
console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
process.exit(mal ? 1 : 0);
