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
const cuadro = daf.t.filter(x => x.g === "cuadro"), rojo = daf.t.filter(x => x.g === "rojo"), amarillo = daf.t.filter(x => x.g === "amarillo"), otros = daf.t.filter(x => x.g === "otros");
ok(rojo.length >= 25 && rojo.every(x => x.n && x.i && x.m && x.p >= 70 && x.p <= 75), `${rojo.length} avisos rojos del manual (págs. 70-75) con nombre, dibujo y texto`);
// v212 (parte C): avisos amarillos (págs. 75-94); algunos solo tienen nombre en el manual
ok(amarillo.length >= 90 && amarillo.every(x => x.n && x.i && x.p >= 75 && x.p <= 94 && (x.m == null || typeof x.m === "string")), `${amarillo.length} avisos amarillos del manual (págs. 75-94) con nombre y dibujo`);
ok(T.AMARILLO && T.AMARILLO.h && T.AMARILLO.pre && T.GRUPOS.amarillo, "texto general de los amarillos y su grupo");
ok(cuadro.length + rojo.length + amarillo.length + otros.length === daf.t.length, "todos en un grupo (rojo, amarillo, cuadro u otros)");
ok(cuadro.length >= 55, `${cuadro.length} testigos del cuadro del manual`);
ok(cuadro.every(x => x.n && x.i && Number.isInteger(x.num) && x.num >= 0 && x.num <= 39 && x.p >= 101 && x.p <= 109 && typeof x.m === "string"), "los del cuadro con nombre, dibujo, número y página del manual (101-109)");
ok(otros.every(x => T.COLOR[x.c] && x.a && x.n && x.v && x.s && x.h), "los otros con color, pastilla, nombre, cómo se ve, qué significa y qué hacer");
global.window.TestigosIconos = {}; new Function(fs.readFileSync(path.join(__dirname, "..", "testigos-iconos.js"), "utf8"))();
ok(daf.t.every(x => window.TestigosIconos[x.i]), "todos tienen dibujo");
// v212: el manual repite nombres entre rojos y amarillos (p. ej. «Fallo del motor»): sin repetir dentro de cada grupo
ok(Object.keys(T.GRUPOS).every(g => { const l = daf.t.filter(x => x.g === g); return new Set(l.map(x => x.n)).size === l.length; }), "sin nombres repetidos en cada grupo");
console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
process.exit(mal ? 1 : 0);
