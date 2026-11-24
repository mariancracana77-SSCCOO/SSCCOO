// Pruebas de «Mi jubilación» (v216, petición n.º 72), sin navegador: node pruebas/jubilacion.cjs
// Cada caso sale del texto del BOE (LGSS, texto consolidado, leído el 24/11/2026) o es un caso límite.
const J = require("../jubilacion.js");
const U = (y, m, d) => Date.UTC(y, m - 1, d), F = (t) => new Date(t).toISOString().slice(0, 10);
const HOY = U(2026, 11, 24);
let mal = 0, n = 0;
const ok = (nombre, cond, info) => { n++; if (!cond) { mal++; console.log("MAL  " + nombre, info ?? ""); } else console.log("OK   " + nombre); };
const c = (o) => J.calcula(Object.assign({ hoy: HOY, sigue: true, base: 2000, reg: "ajena", fam: "", despido: false }, o));
const cerca = (a, b) => Math.abs(a - b) < 0.006;

// Ejemplos del texto de la ley
ok("DT 9.ª: 2026, 36 años y 6 meses = 100 %", J.porcentaje(2026, 438) === 100);
ok("DT 9.ª: 2026, 36 años y 5 meses = 99,81 %", cerca(J.porcentaje(2026, 437), 99.81), J.porcentaje(2026, 437));
ok("DT 9.ª: 2027, 37 años = 100 %", J.porcentaje(2027, 444) === 100);
ok("DT 9.ª: 2027, 36 años y 11 meses = 99,82 %", cerca(J.porcentaje(2027, 443), 99.82), J.porcentaje(2027, 443));
ok("Art. 210: 15 años = 50 %", J.porcentaje(2027, 180) === 50);
ok("Art. 210: 2026, 15 años y 1 mes = 50,21 %", cerca(J.porcentaje(2026, 181), 50.21));
ok("Art. 210: 2027, 15 años y 1 mes = 50,19 %", cerca(J.porcentaje(2027, 181), 50.19));
ok("Art. 208.2: 24 meses, menos de 38a6m = 21 %", J.D.RED_VOL[23][0] === 21);
ok("Art. 208.2: 1 mes, 44a6m o más = 2,81 %", J.D.RED_VOL[0][3] === 2.81);
ok("Art. 207.2: 48 meses, menos de 38a6m = 30 %", J.D.RED_INV[47][0] === 30);
ok("Art. 207.2: 21 meses, 41a6m-44a6m = 11,38 % (el BOE pone 11,38 en el 207 y 11,43 en el 208)", J.D.RED_INV[20][2] === 11.38 && J.D.RED_VOL[20][2] === 11.43);
// DT 7.ª: 2027 con 38a6m → 65; con menos → 67
let r = c({ nac: U(1962, 3, 15), cot: 39 * 12 });
ok("DT 7.ª: nacido 15/03/1962 con 39 años cotizados → 65 años, 15/03/2027", F(r.ordinaria.t) === "2027-03-15" && r.ordinaria.edad === 780, F(r.ordinaria.t));
r = c({ nac: U(1962, 3, 15), cot: 30 * 12 });
ok("DT 7.ª: el mismo con 30 años → 67 años, 15/03/2029", F(r.ordinaria.t) === "2029-03-15" && r.ordinaria.edad === 804, F(r.ordinaria.t));
// 2026 con menos de 38a3m → 66a10m (nacido el 1/1/1960 → 1/11/2026)
r = c({ nac: U(1960, 1, 1), cot: 20 * 12, sigue: false });
ok("DT 7.ª: nacido 1/1/1960 con 20 años → 66 años y 10 meses (1/11/2026, ya pasada)", F(r.ordinaria.t) === "2026-11-01" && r.avisos.includes("ya"), F(r.ordinaria.t));
// Base reguladora con la misma base: base × 324 / 378
r = c({ nac: U(1962, 3, 15), cot: 39 * 12, base: 2100 });
ok("Art. 209: base 2.100 → base reguladora 1.800", cerca(r.br[1], 1800) && cerca(r.br[0], 1620), r.br);
ok("Pensión con 100 %: 1.620 a 1.800 al mes", cerca(r.ordinaria.pension[0], 1620) && cerca(r.ordinaria.pension[1], 1800), r.ordinaria.pension);

// 15 casos límite
r = c({ nac: U(1990, 1, 1), cot: 5 * 12, sigue: false });
ok("Límite 1: menos de 15 años y deja de cotizar → sin pensión contributiva", r.ordinaria.noCalc === "pocos" && r.ordinaria.pension === null);
r = c({ nac: U(1962, 3, 15), cot: 39 * 12, base: 9000 });
ok("Límite 2: base por encima de la máxima → se usa 5.101,20", r.base === 5101.2);
ok("Límite 3: pensión ordinaria nunca pasa de 3.359,60", r.ordinaria.pension[1] <= 3359.6 && r.ordinaria.tope);
ok("Límite 4: con la pensión por encima del tope, la anticipada voluntaria no se calcula (DT 34.ª)", r.vol.noCalc === "dt34");
r = c({ nac: U(1962, 3, 15), cot: 34 * 12, sigue: false });
ok("Límite 5: 34 años y no cotiza más → no llega a los 35 de la voluntaria", r.vol.falta === 420);
r = c({ nac: U(1962, 3, 15), cot: 39 * 12, reg: "auto", despido: true });
ok("Límite 6: autónomo → no hay anticipada por despido", r.inv === null);
r = c({ nac: U(1962, 3, 15), cot: 39 * 12, despido: true });
ok("Límite 7: lo más pronto no es antes de hoy", r.vol.t >= HOY && r.inv.t >= HOY);
ok("Límite 8: el adelanto nunca pasa de 24 (voluntaria) ni de 48 (despido)", r.vol.adel <= 24 && r.inv.adel <= 48);
r = c({ nac: U(1966, 6, 30), cot: 40 * 12, despido: true });
ok("Límite 9: lejos de la edad → voluntaria 24 meses antes y despido 48 meses antes", r.vol.adel === 24 && r.inv.adel === 48, [r.vol.adel, r.inv.adel]);
ok("Límite 10: despido con 48 meses: tope de pensión rebajado 0,5 % por trimestre (16 → 8 %)", r.inv.pension[1] <= 3359.6 * 0.92 + 1e-9);
r = c({ nac: U(1964, 6, 30), cot: 38 * 12, adelanto: 12 });
ok("Límite 11: adelanto elegido de 12 meses (con 40 años y algo: columna 38a6m-41a6m) → 5,25 %", r.vol.adel === 12 && r.vol.cot >= 462 && r.vol.cot < 498 && r.vol.red === 5.25, [r.vol.adel, r.vol.cot, r.vol.red]);
r = c({ nac: U(1964, 6, 30), cot: 40 * 12, adelanto: 99 });
ok("Límite 12: adelanto de 99 meses → se queda en 24", r.vol.adel === 24);
r = c({ nac: U(1962, 2, 29 - 1), cot: 39 * 12 });
ok("Límite 13: nacido el 28 de febrero → fecha correcta", F(r.ordinaria.t) === "2027-02-28", F(r.ordinaria.t));
r = c({ nac: U(1964, 2, 29), cot: 40 * 12 });
ok("Límite 14: nacido el 29 de febrero de 1964 → 28/02/2029 (2029 no es bisiesto)", F(r.ordinaria.t) === "2029-02-28", F(r.ordinaria.t));
r = c({ nac: U(1964, 6, 30), cot: 40 * 12, base: 600, fam: "carga" });
ok("Límite 15: pensión por debajo de la mínima con cónyuge a cargo → la voluntaria no se puede", r.vol.noCalc === "minima" && cerca(r.minima[0], 17592.4 / 14));
r = c({ nac: U(1962, 3, 15), cot: 38 * 12 + 2, sigue: false });
ok("Extra: 38a2m en 2027 sin cotizar más → 67 años", r.ordinaria.edad === 804);
r = c({ nac: U(1962, 3, 15), cot: 38 * 12 + 3, sigue: true });
ok("Extra: 38a3m cotizando 3 meses más (38a6m a los 65) → 65 años", r.ordinaria.edad === 780);
console.log(mal ? `\n${mal} de ${n} MAL` : `\nTodo bien (${n} casos)`);
process.exit(mal ? 1 : 0);
