// v198 (petición n.º 64, arreglo «no da resultado de nada»): cuentas de «Ferry y tren» (ferry.js) sin navegador.
// Reg. (CE) 561/2006 art. 9.1 cambiado por el (UE) 2020/1054. Uso: node pruebas/ferry-v198.cjs
const fs = require("fs"), path = require("path");
global.window = {}; global.document = { getElementById: () => null };
new Function(fs.readFileSync(path.join(__dirname, "..", "ferry.js"), "utf8"))();
const F = window.FerryCuentas;
let mal = 0;
const ok = (c, t) => { if (!c) mal++; console.log((c ? "OK  " : "MAL ") + t); };
const d = (o) => F.calcula(Object.assign({ tipo: "diario", litera: "camarote" }, F.DEF, o));
const H = (h, m = 0, dia = 0) => dia * 1440 + h * 60 + m;
let r;
// Con los valores que trae al abrir SIEMPRE hay resultado
r = d({});
ok(r.ok && !r.falta, "valores por defecto: hay resultado y vale");
ok(r.vuelve === H(7, 35, 1) && F.hora(r.vuelve) === "7:35 (al día siguiente)", "por defecto: vuelve a conducir a las 7:35 del día siguiente");
ok(r.enCortes === 35 && r.cortes === 2 && r.descanso === 660, "por defecto: 2 interrupciones de 35 min y 11 h de descanso");
// Interrupciones
ok(d({ m1: 30, m2: 30 }).ok, "interrupciones de justo 1 h: vale");
r = d({ m1: 31, m2: 30 }); ok(!r.ok && r.fallos.some(f => f.includes("1 hora")), "61 min de interrupciones: no vale");
r = d({ m1: 40, m2: 40 }); ok(!r.ok && r.fallos.some(f => f.includes("1 h 20 min")), "80 min: dice cuánto suman");
ok(d({ m1: 0, m2: 0 }).cortes === 0, "sin minutos de trámite no hay interrupciones");
// Lo que hay a bordo
r = d({ litera: "no" }); ok(!r.ok && r.fallos.some(f => f.includes("asiento")), "solo asiento: no vale");
ok(d({ litera: "litera" }).ok, "diario normal con litera: vale");
// Diario reducido
r = d({ tipo: "reducido" }); ok(!r.ok && r.fallos.some(f => f.includes("no se puede interrumpir")), "reducido interrumpido: no vale");
r = d({ tipo: "reducido", antes: 0, viaje: 600 }); ok(r.ok && r.cortes === 0, "reducido entero a bordo (viaje de 10 h): vale");
ok(r.vuelve === H(5, 20, 1) && r.baja === H(6, 20, 1), "reducido a bordo: acaba a las 5:20 y baja a las 6:20");
r = d({ tipo: "reducido", antes: 0, viaje: 300 }); ok(!r.ok, "reducido a bordo de 5 h que sigue en tierra: lo corta el desembarque, no vale");
// Semanal normal (45 h)
r = d({ tipo: "semanal", antes: 0, viaje: 1200 }); ok(r.ok && r.cortes === 1, "semanal normal, viaje de 20 h con camarote: vale");
r = d({ tipo: "semanal", antes: 0, viaje: 90 }); ok(!r.ok && r.fallos.some(f => f.includes("8 h")), "semanal normal con viaje de 1 h 30: no vale");
ok(d({ tipo: "semanal", antes: 0, viaje: 480 }).ok, "semanal normal con viaje de justo 8 h: vale");
ok(!d({ tipo: "semanal", antes: 0, viaje: 475 }).ok, "semanal normal con viaje de 7 h 55: no vale");
r = d({ tipo: "semanal", antes: 0, viaje: 1200, litera: "litera" }); ok(!r.ok && r.fallos.some(f => f.includes("camarote")), "semanal normal con litera: necesita camarote");
// Semanal reducido (24 h)
ok(d({ tipo: "sem-red", antes: 60, viaje: 1200 }).ok, "semanal reducido con 2 interrupciones: vale");
ok(!d({ tipo: "sem-red", litera: "no" }).ok, "semanal reducido solo con asiento: no vale");
// En dos partes
r = d({ tipo: "partido" }); ok(r.ok && r.dudas.length === 1, "diario en dos partes: vale, con aviso de comprobarlo");
// Travesías de ejemplo
const ej = (id) => F.EJEMPLOS.find(x => x.id === id).viaje;
r = d({ viaje: ej("civita") }); ok(r.ok && r.cortes === 1 && r.vuelve === H(7, 20, 1), "Barcelona–Civitavecchia: acaba a bordo a las 7:20, una interrupción");
ok(d({ viaje: ej("calais") }).ok, "Calais–Dover con camarote o litera: vale");
ok(!d({ viaje: ej("calais"), litera: "no" }).ok, "Calais–Dover solo con asiento: no vale");
ok(d({ viaje: ej("eurotunel"), litera: "litera" }).ok && !d({ viaje: ej("eurotunel"), litera: "no" }).ok, "Eurotúnel: vale con litera, no solo con asiento");
ok(d({ viaje: ej("tanger") }).ok, "Algeciras–Tánger Med: vale con camarote");
// Descanso que acaba antes de embarcar
r = d({ antes: 700 }); ok(r.ok && r.sinBarco, "descansa 11 h antes de embarcar: el barco no corta nada");
// Medianoche y horas
ok(d({ ini: "23:30" }).vuelve === H(11, 5, 1), "empezando a las 23:30 vuelve a las 11:05 del día siguiente");
ok(d({ ini: "06:00" }).vuelve === H(17, 35), "empezando a las 6:00 vuelve a las 17:35 del mismo día");
ok(F.hora(H(8, 5, 2)) === "8:05 (2 días después)", "hora a dos días vista");
// Datos que faltan: siempre un mensaje claro, nunca vacío
ok(d({ ini: "" }).falta.includes("empiezas a descansar"), "sin hora de empezar: lo dice");
ok(d({ ini: "25:00" }).falta, "hora imposible: lo dice");
ok(d({ viaje: "" }).falta.includes("viaje") && d({ viaje: 0 }).falta, "sin duración del viaje: lo dice");
ok(d({ antes: "" }).falta.includes("pon 0"), "sin descanso en tierra: dice que ponga 0");
ok(d({ m1: "hola" }).falta.includes("embarcar"), "minutos mal escritos: lo dice");
ok(d({ m1: -10 }).falta, "minutos negativos: lo dice");
ok(d({ viaje: "90,4" }).ok, "acepta coma decimal");
// Cuentas
ok(F.hm(90) === "1 h 30 min" && F.hm(60) === "1 h" && F.hm(5) === "5 min", "horas y minutos bien escritos");
ok(F.TIPOS.every(t => { const x = d({ tipo: t.id, antes: 0, viaje: 3000 }); return !x.falta && x.pasos.length > 0; }), "todos los tipos dan resultado");
console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
process.exit(mal ? 1 : 0);
