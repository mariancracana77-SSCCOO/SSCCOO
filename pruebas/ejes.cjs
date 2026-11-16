// v181 (petición n.º 50): comprueba las cuentas de «Peso por ejes y estiba» (ejes.js). Sin navegador: node pruebas/ejes.cjs
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = { window: {}, document: { getElementById: () => null } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "carga.js"), "utf8"), ctx);
ctx.CargaCuentas = ctx.window.CargaCuentas;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "ejes.js"), "utf8"), ctx);
const E = ctx.window.EjesCuentas, C = E.CAMION;
let mal = 0;
const igual = (nombre, v, esperado) => { const ok = JSON.stringify(v) === JSON.stringify(esperado); if (!ok) mal++; console.log((ok ? "OK  " : "MAL ") + nombre + ": " + JSON.stringify(v) + (ok ? "" : " (se esperaba " + JSON.stringify(esperado) + ")")); };
const t = (x) => Math.round(x / 100) / 10; // toneladas con un decimal
// Estiba: el ejemplo de la guía IRU (2 cinchas por encima, μ 0,45, 55°, STF 400 daN): 10,9 t de lado y 1,4 t hacia delante
igual("IRU: 2 cinchas sujetan 10,9 t de lado", t(E.sujeta(2, 0.45, 55, 400, "lado")), 10.9);
igual("IRU: 2 cinchas sujetan 1,4 t hacia delante", t(E.sujeta(2, 0.45, 55, 400, "delante")), 1.4);
igual("10,9 t con μ 0,45, 55° y 400 daN: 2 de lado", E.cinchas(10900, 0.45, 55, 400).lado, 2);
igual("1.000 kg, μ 0,45, 85°, 400 daN: lado 1, atrás 1, delante 2", [E.cinchas(1000, 0.45, 85, 400).lado, E.cinchas(1000, 0.45, 85, 400).atras, E.cinchas(1000, 0.45, 85, 400).delante], [1, 1, 2]);
igual("con alfombrilla (0,6) de lado y atrás no hacen falta", [E.cinchas(5000, 0.6, 70, 400).lado, E.cinchas(5000, 0.6, 70, 400).atras], [0, 0]);
// Ejes: el peso no se pierde ni se inventa
const sin = E.reparto(C, [], "1/2");
igual("vacío con medio depósito: los pesos en vacío", [sin.del, sin.mot, sin.tri], [C.del, C.mot, C.tri]);
const r = E.reparto(C, [{ kg: 12750, x: 6.8 }], "1/2");
igual("12.750 kg repartidos: total = vacío + carga", Math.round(r.tot), C.del + C.mot + C.tri + 12750);
igual("la carga del centro va casi toda al trídem y al motriz", [Math.round(r.del), Math.round(r.mot), Math.round(r.tri)], [6242, 7551, 13607]);
const lleno = E.reparto(C, [], "lleno");
igual("depósito lleno: +294 kg (350 L × 0,84)", Math.round(lleno.tot - sin.tot), 294);
const atras = E.reparto(C, [{ kg: 24000, x: 12.4 }], "1/2"), alante = E.reparto(C, [{ kg: 24000, x: 1.2 }], "1/2");
igual("carga atrás: el trídem pasa de 24 t", atras.tri > C.mTri, true);
igual("carga pegada a la cabina: el motriz pasa de 11,5 t", alante.mot > C.mMot, true);
// Simulador: 34 europalets de 400 kg (13.600 kg) repartidos por todo el remolque: el centro en 6,8 m
const sim = E.cargaSimulador({ recs: [{ t: "eu", q: 34, s: false, kg: 13600 }], len: 13.6, wid: 2.4 });
igual("simulador: 34 palets, 13.600 kg, centro 6,8 m", [sim.palets, Math.round(sim.kg), Math.round(sim.centro * 10) / 10], [34, 13600, 6.8]);
const sim2 = E.cargaSimulador({ recs: [{ t: "eu", q: 10, s: true, kg: 5000 }, { t: "ind", q: 3, kg: 900 }], len: 13.6, wid: 2.4 });
igual("simulador con apilados: cuenta los 13 palets y el peso", [sim2.palets, Math.round(sim2.kg)], [13, 5900]);
igual("simulador vacío: nada", E.cargaSimulador({ recs: [{ t: "eu", q: 0, kg: 0 }] }), null);
igual("datos del simulador estropeados: nada", E.cargaSimulador({ recs: "x" }), null);
console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
process.exit(mal ? 1 : 0);
