// v185 (petición n.º 55): cuentas de «Cargas que sobresalen» (sobresale.js) y del «Conversor rápido» (conversor.js),
// sin navegador. Uso: node pruebas/sobresale.cjs
const fs = require("fs"), path = require("path");
global.window = {}; global.document = { getElementById: () => null };
for (const f of ["sobresale.js", "conversor.js"]) new Function(fs.readFileSync(path.join(__dirname, "..", f), "utf8"))();
const S = window.SobresaleCuentas, C = window.ConversorCuentas;
let mal = 0;
const ok = (c, t) => { if (!c) mal++; console.log((c ? "OK  " : "MAL ") + t); };
const casi = (a, b, t) => ok(Math.abs(a - b) < 0.005, `${t}: ${a.toFixed(4)} (esperado ${b})`);
// Art. 15 RGC
let r = S.calcula({ largo: "16.5", ancho: "2.55", tipo: "larga", del: "0", det: "2" });
ok(r.ok && r.lim.del === 2 && r.lim.det === 3, "16,5 m: 2 m delante y 3 m detrás; 2 m detrás está dentro");
r = S.calcula({ largo: "16,5", ancho: "2,55", tipo: "larga", del: "2", det: "3" }); ok(r.ok, "justo en el límite (2 y 3 m, con coma) está dentro");
r = S.calcula({ largo: "16.5", ancho: "2.55", tipo: "larga", del: "2.01", det: "3.01" }); ok(!r.ok && r.fallos.length === 2, "2,01 y 3,01 m: se pasa por los dos lados");
r = S.calcula({ largo: "4.5", ancho: "2", tipo: "larga", del: "1.5", det: "1.6" }); ok(r.lim.corto && Math.abs(r.lim.del - 1.5) < 1e-9 && !r.ok && r.fallos[0].q === "det", "4,5 m: un tercio (1,5 m) por extremo; 1,6 detrás se pasa");
r = S.calcula({ largo: "5", ancho: "2", tipo: "larga", del: "0", det: "2" }); ok(r.lim.corto && !r.ok, "5 m justos: cuenta como corto (un tercio = 1,67 m)");
r = S.calcula({ largo: "5.01", ancho: "2", tipo: "larga", del: "0", det: "2" }); ok(!r.lim.corto && r.ok, "5,01 m: ya son 2 y 3 m");
r = S.calcula({ largo: "12", ancho: "2.2", tipo: "ancha", izq: "0.15", der: "0.15" }); ok(r.ok && Math.abs(r.total - 2.5) < 1e-9, "2,20 m + 0,15 + 0,15 = 2,50: dentro");
r = S.calcula({ largo: "12", ancho: "2.2", tipo: "ancha", izq: "0.2", der: "0.2" }); ok(!r.ok && r.fallos.some(f => f.q === "total"), "2,20 m + 0,20 + 0,20 = 2,60: se pasa del ancho total");
r = S.calcula({ largo: "12", ancho: "1.6", tipo: "ancha", izq: "0.45", der: "0" }); ok(!r.ok && r.fallos[0].q === "izq", "0,45 m por un lado: se pasa de 0,40");
r = S.calcula({ largo: "12", ancho: "2.55", tipo: "ancha", izq: "0.01", der: "0" }); ok(!r.ok && r.lim.lado === 0, "con 2,55 m de ancho no puede sobresalir por los lados");
r = S.calcula({ largo: "12", ancho: "2.55", tipo: "ancha", izq: "0", der: "0" }); ok(r.ok, "carga ancha que no sobresale: dentro");
r = S.calcula({ largo: "", ancho: "2.55", tipo: "larga" }); ok(r.falta, "sin largo: pide los datos");
r = S.calcula({ largo: "16.5", ancho: "2.55", tipo: "larga", del: "-3", det: "abc" }); ok(r.ok && r.del === 0 && r.det === 0, "negativos y letras cuentan como 0");
// Conversor (los casos que pidió Lorena)
const c = (id) => C.C.find(x => x.id === id);
casi(C.aB(c("presion"), 8), 116.03, "8 bar en PSI"); ok(C.formato(C.aB(c("presion"), 8)) === "116,03", "8 bar = 116,03 PSI en pantalla");
casi(C.aB(c("distancia"), 100), 62.14, "100 km en millas");
casi(C.aB(c("velocidad"), 90), 55.92, "90 km/h en mph");
casi(C.aB(c("peso"), 1000), 2204.62, "1000 kg en libras");
casi(C.aB(c("galuk"), 100), 22.0, "100 L en galones UK");
casi(C.aB(c("galus"), 100), 26.42, "100 L en galones US");
casi(C.aB(c("temp"), 0), 32, "0 °C en °F"); casi(C.aB(c("temp"), -18), -0.4, "-18 °C en °F"); casi(C.bA(c("temp"), 212), 100, "212 °F en °C");
casi(C.aB(c("pies"), 4), 13.12, "4 m en pies"); casi(C.aB(c("pies"), 13.6), 44.62, "13,6 m en pies");
casi(C.bA(c("pulgadas"), 22.5), 57.15, "22,5 pulgadas en cm");
for (const x of C.C) for (const v of [-18, 0, 1, 22.5, 1000]) { const y = x.temp ? v : v; casi(C.bA(x, C.aB(x, y)), y, `ida y vuelta ${x.id} ${y}`); }
ok(C.lee("22,5") === 22.5 && C.lee("22.5") === 22.5 && C.lee(" 8 ") === 8 && C.lee("-4") === -4, "lee coma, punto, espacios y negativos");
ok(C.lee("") === null && C.lee("abc") === null && C.lee("8a") === null && C.lee("-") === null && C.lee("1,2,3") === null, "lee: vacío y letras no dan número");
ok(C.formato(1609.344) === "1609,3" && C.formato(0.004) === "0" && C.formato(-0.001) === "0", "formato: miles con un decimal y sin «-0»");
console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
process.exit(mal ? 1 : 0);
