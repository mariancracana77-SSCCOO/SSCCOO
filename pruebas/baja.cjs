// Pruebas de «Mi baja médica» (v216, petición n.º 72), sin navegador: node pruebas/baja.cjs
// Ejemplos del BOE (LGSS arts. 169, 171 y 173, Decreto 3158/1966 art. 2, RD 53/1980) y del art. 24 del convenio de Girona.
const B = require("../baja.js");
let mal = 0, n = 0;
const ok = (nombre, cond, info) => { n++; if (!cond) { mal++; console.log("MAL  " + nombre, info ?? ""); } else console.log("OK   " + nombre); };
const c = (o) => B.calcula(Object.assign({ tipo: "comun", base: 1500, dias: 30, hosp: false, veces: false }, o));
const cerca = (a, b) => Math.abs(a - b) < 0.006;
const tramo = (r, dia) => r.filas.find(f => f.a <= dia && dia <= f.b);

// Ejemplos de la ley y del convenio
let r = c({});
ok("Art. 171: base 1.500 → 50 € al día", cerca(r.diario, 50));
ok("Art. 173: enfermedad, días 1-3 sin nada", tramo(r, 2).tot === 0 && tramo(r, 2).ss === 0);
ok("RD 53/1980: día 4-20 al 60 % de la Seguridad Social", tramo(r, 4).ss === 60 && tramo(r, 20).ss === 60);
ok("Art. 173: días 4-15 los paga la empresa", tramo(r, 10).quien === "empresa" && tramo(r, 16).quien === "inss");
ok("Decreto 3158/1966: desde el día 21 al 75 %", tramo(r, 21).ss === 75);
ok("Convenio art. 24: del día 4 al 60, hasta el 80 %", tramo(r, 4).tot === 80 && tramo(r, 30).tot === 80);
ok("30 días de enfermedad con base 1.500 = 27 × 40 = 1.080 €", cerca(r.total, 1080), r.total);
r = c({ dias: 90 });
ok("Convenio art. 24: desde el día 61, el 100 %", tramo(r, 61).tot === 100 && cerca(r.total, 1080 + 30 * 40 + 30 * 50), r.total);
r = c({ tipo: "at", dias: 30 });
ok("Art. 173: accidente de trabajo, día 1 salario entero de la empresa", tramo(r, 1).ss === 100 && tramo(r, 1).quien === "empresa");
ok("Decreto 3158/1966: accidente de trabajo al 75 % desde el día 2; convenio hasta el 100 %", tramo(r, 2).ss === 75 && tramo(r, 2).tot === 100 && cerca(r.total, 1500));
r = c({ hosp: true, dias: 10 });
ok("Convenio art. 24: hospitalización, 100 % desde el primer día", tramo(r, 1).tot === 100 && cerca(r.total, 500));

// 15 casos límite
ok("Límite 1: 0 días → 0 €", c({ dias: 0 }).total === 0 && c({ dias: 0 }).filas.length === 0);
ok("Límite 2: 1 día de enfermedad → 0 €", c({ dias: 1 }).total === 0);
ok("Límite 3: 3 días de enfermedad → 0 €", c({ dias: 3 }).total === 0);
ok("Límite 4: 4 días → 1 día al 80 % (40 €)", cerca(c({ dias: 4 }).total, 40));
ok("Límite 5: día 60 todavía al 80 %, día 61 al 100 %", tramo(c({ dias: 61 }), 60).tot === 80 && tramo(c({ dias: 61 }), 61).tot === 100);
r = c({ dias: 90, veces: true });
ok("Límite 6: ya tuvo 2 este año → desde el día 61 solo el 75 % de la Seguridad Social", tramo(r, 61).tot === 75);
r = c({ tipo: "anl", dias: 30 });
ok("Límite 7: accidente fuera del trabajo → solo la Seguridad Social (convenio no lo nombra)", tramo(r, 10).tot === 60 && tramo(r, 25).tot === 75 && cerca(r.total, 17 * 30 + 10 * 37.5));
r = c({ tipo: "anl", dias: 30, hosp: true });
ok("Límite 8: la hospitalización del convenio no cuenta en un accidente fuera del trabajo", tramo(r, 1).tot === 0);
r = c({ tipo: "ep", dias: 30 });
ok("Límite 9: enfermedad profesional → 75 % desde el día 2, sin complemento", tramo(r, 2).tot === 75);
r = c({ tipo: "at", dias: 400 });
ok("Límite 10: accidente de trabajo, día 360 al 100 % y día 361 al 75 %", tramo(r, 360).tot === 100 && tramo(r, 361).tot === 75);
r = c({ dias: 600 });
ok("Límite 11: más de 545 días → se cuentan 545", r.dias === 545 && r.cortado);
ok("Límite 12: base 0 → 0 €", c({ base: 0 }).total === 0);
ok("Límite 13: base negativa → 0 €", c({ base: -500 }).total === 0);
ok("Límite 14: días con decimales → se cuentan los días enteros", c({ dias: 4.7 }).dias === 4);
r = c({ dias: 545 });
ok("Límite 15: lo cobrado nunca pasa del 100 % ni baja de lo de la Seguridad Social", r.filas.every(f => f.tot <= 100 && f.tot >= f.ss) && r.total <= r.entero + 1e-9);
console.log(mal ? `\n${mal} de ${n} MAL` : `\nTodo bien (${n} casos)`);
process.exit(mal ? 1 : 0);
