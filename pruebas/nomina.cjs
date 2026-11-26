// Cuentas de la Comparadora de nóminas (v218, petición n.º 74): node pruebas/nomina.cjs
const fs = require("fs"), path = require("path"), vm = require("vm");
vm.runInThisContext(fs.readFileSync(path.join(__dirname, "../convenio-girona.js"), "utf8").replace("const CONVENIO_GIRONA", "globalThis.CONVENIO_GIRONA"));
const N = require("../nomina.js");
let mal = 0; const ok = (c, t) => { console.log((c ? "bien " : "MAL  ") + t); if (!c) mal++; };
const cerca = (a, b) => Math.abs(a - b) < 0.006;
// Dos nóminas
const r = N.compara({ base: 1082.4, plus: 184.58, hx: 100, cc: 60, irpf: 150, dietas: 300 }, { base: 1082.4, plus: 184.58, hx: 160, cc: 63, irpf: 170, dietas: 250 });
ok(cerca(r.ta.d, 1666.98) && cerca(r.ta.q, 210) && cerca(r.ta.l, 1456.98), "totales de la 1.ª nómina");
ok(cerca(r.tb.d, 1676.98) && cerca(r.tb.q, 233) && cerca(r.tb.l, 1443.98), "totales de la 2.ª nómina");
ok(cerca(r.filas.find(f => f.k === "hx").dif, 60) && cerca(r.filas.find(f => f.k === "dietas").dif, -50), "diferencias por línea");
ok(!r.filas.some(f => f.k === "noct"), "sin las líneas vacías");
ok(!r.filas.some(f => f.t === "i"), "los totales informativos no suman");
// Convenio: conductor 2026, 10 años (20 %)
const m = N.minimos("c", 1, 10);
ok(m.base === 1082.40 && m.plus === 184.58 && m.hx === 11.83, "tabla del conductor 2026");
ok(m.pct === 20 && cerca(m.antig, 216.48), "antigüedad 20 % a los 10 años");
ok(cerca(m.prorrata, (1082.40 + 184.58 + 216.48) / 4), "prorrata = una cuarta parte de paga al mes (3 pagas / 12)");
ok(N.minimos("cm", 2, 3).antig === 0, "sin antigüedad antes de 4 años");
// Todos los conceptos con explicación
ok(N.CONCEPTOS.every(c => c[1] && c[3] && c[3].length > 20 && "dqi".includes(c[2])), "cada concepto tiene nombre, tipo y explicación");
ok(new Set(N.CONCEPTOS.map(c => c[0])).size === N.CONCEPTOS.length, "claves sin repetir");
console.log(mal ? `FALLAN ${mal}` : "Todo bien"); process.exit(mal ? 1 : 0);
