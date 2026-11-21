// v199 (petición n.º 66): reglas de «Gálibos y túneles» (galibos.js) y sus datos (galibos-datos.js), sin navegador.
// Uso: node pruebas/galibos-v199.cjs
const fs = require("fs"), path = require("path");
global.window = global;
for (const f of ["galibos-datos.js", "galibos.js"]) new Function(fs.readFileSync(path.join(__dirname, "..", f), "utf8"))();
let mal = 0;
const ok = (c, t) => { console.log((c ? "OK  " : "MAL ") + t); if (!c) mal++; };
const G = window.GalibosCuentas, D = window.GalibosDatos;
const r = (cod, cat, cis, mucho) => (G.puede(cod, cat, cis, mucho) || {}).r;
// ADR 8.6.4: B prohíbe B-E, C prohíbe C-E, D prohíbe D-E, E prohíbe E
const tabla = { "(B)": "nnnn", "(C)": "snnn", "(D)": "ssnn", "(E)": "sssn" };
for (const [cod, fila] of Object.entries(tabla)) ["B", "C", "D", "E"].forEach((cat, i) => ok(r(cod, cat) === (fila[i] === "s" ? "si" : "no"), `${cod} en túnel ${cat}: ${fila[i] === "s" ? "SÍ" : "NO"}`));
for (const cod of ["(B)", "(C)", "(D)", "(E)", "(D/E)"]) ok(r(cod, "A") === "si", `${cod} pasa por A`);
// Caso de Lorena: (D/E) en cisterna pasa A, B, C; no D, E. Sin cisterna, pasa A-D, no E
["A", "B", "C"].forEach(c => ok(r("(D/E)", c, true) === "si", `(D/E) cisterna en ${c}: SÍ`));
["D", "E"].forEach(c => ok(r("(D/E)", c, true) === "no", `(D/E) cisterna en ${c}: NO`));
["A", "B", "C", "D"].forEach(c => ok(r("(D/E)", c, false) === "si", `(D/E) sin cisterna en ${c}: SÍ`));
ok(r("(D/E)", "E", false) === "no", "(D/E) sin cisterna en E: NO");
ok(r("(B/D)", "B", true) === "no" && r("(B/D)", "C", false) === "si" && r("(B/D)", "D", false) === "no", "(B/D)");
// Con cantidad: (B1000C) y (C5000D)
ok(r("(B1000C)", "A") === "si" && r("(B1000C)", "B") === "duda" && r("(B1000C)", "C") === "no", "(B1000C) sin saber el peso");
ok(r("(B1000C)", "B", false, true) === "no" && r("(B1000C)", "B", false, false) === "si", "(B1000C) sabiendo el peso");
ok(r("(C5000D)", "B") === "si" && r("(C5000D)", "C") === "duda" && r("(C5000D)", "D") === "no", "(C5000D)");
ok(r("(-)", "E") === "si" && r("sin", "E") === "si" && r("panel", "E") === "duda", "(-), sin ADR y sin panel");
ok(r("(D)", null) === "duda" && r("(D)", "tren") === "duda" && r("sin", "tren") === "si", "túnel sin dato y tren");
ok(G.puede("", "E") === null, "sin código no dice nada");
// Altura
const h = (a, c) => (G.cabe(a, c) || {}).r;
ok(h(4.30, 4.00) === "si" && h(4.30, 4.25) === "justo" && h(4.30, 4.31) === "no" && h(4.30, 4.30) === "justo" && h(null, 4) === "duda", "altura: sí, justo, no y sin dato");
ok(G.cabe(4, 0) === null && G.num("4,05") === 4.05, "altura vacía y coma decimal");
// Datos
ok(D.tuneles.length >= 24, `${D.tuneles.length} túneles`);
const ids = new Set(D.tuneles.map(t => t.id));
ok(ids.size === D.tuneles.length, "ids sin repetir");
ok(D.tuneles.every(t => !t.adr || "ABCDE".includes(t.adr) || t.adr === "tren"), "categorías válidas");
ok(D.tuneles.every(t => t.alto == null || (t.alto > 3 && t.alto < 6)), "alturas razonables");
ok(D.tuneles.every(t => D.zonas.some(z => z.id === t.zona)), "zonas válidas");
ok(!/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}]/u.test(JSON.stringify(D)), "sin emojis");
const mb = D.tuneles.find(t => t.id === "mont-blanc"), fr = D.tuneles.find(t => t.id === "frejus"), so = D.tuneles.find(t => t.id === "somport");
ok(mb.alto === 4.7 && mb.adr === "E" && mb.comp.alto && mb.comp.adr, "Mont Blanc 4,70 m y E, comprobado");
ok(fr.alto === 4.3 && fr.adr === "C" && fr.comp.alto && fr.comp.adr, "Fréjus 4,30 m y C, comprobado");
ok(so.alto === 4.3 && so.comp.alto, "Somport 4,30 m, comprobado");
ok(D.tuneles.every(t => Object.values(t.comp || {}).every(c => c.f && c.d)), "cada comprobado lleva fuente y fecha");
console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
process.exit(mal ? 1 : 0);
