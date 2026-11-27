// Prueba sin navegador del lector de nóminas (nomina-lector.js). Nóminas INVENTADAS: nunca datos reales.
// node pruebas/nomina-lector.cjs
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "nomina-lector.js"), "utf8") + "\nwindow.L = LECTOR_NOMINA;", ctx);
const L = ctx.window.L;
let fallos = 0;
const ok = (c, txt) => { if (!c) { fallos++; console.log("FALLA:", txt); } else console.log("ok:", txt); };

// Monta trozos como los daría pdf.js: cada fila es [y, [x, texto], [x, texto]…]; ancho ~6 px por letra, alto 10
const hoja = (filas) => filas.flatMap(([y, ...celdas]) => celdas.map(([x, s]) => ({ str: s, x1: x, x2: x + s.length * 6, y1: y, y2: y + 10 })));

// Formato 1: columnas DEVENGOS / DEDUCCIONES (como A3 o Sage)
const f1 = hoja([
  [20, [40, "EMPRESA INVENTADA SL"], [400, "PERIODO 01/03/2026 a 31/03/2026"]],
  [40, [40, "Trabajador: [tapado]"], [300, "NIF: [tapado]"]],
  [80, [40, "CONCEPTO"], [250, "CANTIDAD"], [330, "PRECIO"], [420, "DEVENGOS"], [520, "DEDUCCIONES"]],
  [100, [40, "SALARIO BASE"], [250, "30,00"], [330, "40,00"], [420, "1.200,00"]],
  [115, [40, "PLUS CONVENIO"], [420, "150,00"]],
  [130, [40, "ANTIGUEDAD"], [420, "60,00"]],
  [145, [40, "HORAS EXTRA"], [250, "5,00"], [330, "15,00"], [420, "75,00"]],
  [160, [40, "PLUS NOCTURNIDAD"], [420, "45,50"]],
  [175, [40, "DIETAS"], [420, "120,00"]],
  [190, [40, "PRORRATA PAGAS EXTRA"], [420, "250,00"]],
  [205, [40, "CONCEPTO RARO INVENTADO"], [420, "10,00"]],
  [220, [40, "CONTINGENCIAS COMUNES"], [250, "4,70"], [520, "82,51"]],
  [235, [40, "DESEMPLEO"], [250, "1,55"], [520, "27,21"]],
  [250, [40, "FORMACION PROFESIONAL"], [250, "0,10"], [520, "1,76"]],
  [265, [40, "M.E.I."], [250, "0,13"], [520, "2,28"]],
  [280, [40, "TRIBUTACION I.R.P.F."], [250, "12,00"], [520, "210,66"]],
  [300, [40, "TOTAL DEVENGADO"], [420, "1.910,50"], [500, "TOTAL A DEDUCIR"], [600, "324,42"]],
  [330, [40, "BASE CONT. COMUNES"], [200, "BASE A.T. Y DESEMPLEO"], [370, "BASE I.R.P.F."]],
  [345, [40, "1.755,50"], [200, "1.755,50"], [370, "1.790,50"]],
  [380, [40, "LIQUIDO A PERCIBIR"], [420, "1.586,08"]],
]);
const r1 = L.lee(L.lineas(f1));
ok(r1.columnas, "formato 1: ve las columnas");
ok(r1.valores.base === 1200, "base 1200 (no coge la cantidad ni el precio): " + r1.valores.base);
ok(r1.valores.plus === 150 && r1.valores.antig === 60 && r1.valores.hx === 75 && r1.valores.noct === 45.5, "plus, antigüedad, horas extra y nocturnidad");
ok(r1.valores.dietas === 120 && r1.valores.prorrata === 250, "dietas y prorrata");
ok(r1.valores.otrosd === 10 && r1.sinReconocer.length === 1 && r1.sinReconocer[0].tipo === "d", "línea desconocida va a otros cobros y se avisa");
ok(r1.valores.cc === 82.51 && r1.valores.desempleo === 27.21 && r1.valores.fp === 1.76 && r1.valores.mei === 2.28 && r1.valores.irpf === 210.66, "descuentos (no coge el %)");
ok(r1.valores.devengado === 1910.5 && r1.valores.deducir === 324.42 && r1.valores.liquido === 1586.08, "totales");
ok(r1.valores.basecc === 1755.5 && r1.valores.baseat === 1755.5 && r1.valores.baseirpf === 1790.5, "bases en tabla: " + JSON.stringify([r1.valores.basecc, r1.valores.baseat, r1.valores.baseirpf]));
ok(r1.mes === "2026-03", "mes 2026-03: " + r1.mes);
ok(r1.avisos.length === 0, "sin avisos: " + JSON.stringify(r1.avisos));

// Formato 2: todo en una columna «concepto ... importe», descuentos con guion, mes con nombre, sin columnas
const f2 = hoja([
  [20, [40, "Nómina de Octubre 2026"]],
  [60, [40, "Sueldo base"], [400, "1.300,00"]],
  [75, [40, "Plus de convenio"], [400, "120,00"]],
  [90, [40, "Trienios"], [400, "40,00"]],
  [105, [40, "Paga extra de Navidad"], [400, "0,00"]],
  [120, [40, "Kilometraje"], [400, "33,40"]],
  [150, [40, "Total devengos"], [400, "1.493,40"]],
  [170, [40, "Cotización contingencias comunes"], [400, "-68,53"]],
  [185, [40, "Cotización desempleo"], [400, "-22,60"]],
  [200, [40, "Cotización formación profesional"], [400, "-1,46"]],
  [215, [40, "Retención IRPF"], [400, "-150,00"]],
  [230, [40, "Anticipo"], [400, "-100,00"]],
  [250, [40, "Total deducciones"], [400, "342,59"]],
  [270, [40, "Base de cotización contingencias comunes"], [400, "1.460,00"]],
  [290, [40, "Líquido a percibir"], [400, "1.150,81"]],
]);
const r2 = L.lee(L.lineas(f2));
ok(!r2.columnas, "formato 2: sin columnas");
ok(r2.valores.base === 1300 && r2.valores.plus === 120 && r2.valores.antig === 40 && r2.valores.km === 33.4, "cobros");
ok(r2.valores.paga === 0, "paga extra a 0");
ok(r2.valores.cc === 68.53 && r2.valores.anticipo === 100, "el guion de los descuentos se quita: " + r2.valores.cc);
ok(r2.valores.basecc === 1460 && r2.valores.cc != null, "base cc no se confunde con la cotización cc");
ok(r2.mes === "2026-10", "mes con nombre: " + r2.mes);
ok(r2.avisos.length === 0, "formato 2 cuadra: " + JSON.stringify(r2.avisos));
// Si se cambia un importe a mano, vuelve a mirar las sumas
const v2 = Object.assign({}, r2.valores, { irpf: 140 });
ok(L.revisa(v2).some((a) => /quitan/.test(a.t)), "avisa si los descuentos ya no cuadran");

// Reconoce etiquetas sueltas
const casos = { "SALARIO BASE": "base", "Plus convenio": "plus", "B.C.C.C.": "basecc", "Base IRPF": "baseirpf", "Líquido total a percibir": "liquido", "H. extras fuerza mayor": "hxcot", "Aportación empresa": "empresa", "Incentivos": "pluses", "Dieta nacional": "dietas" };
for (const [t, k] of Object.entries(casos)) ok(L.reconoce(t) === k, `«${t}» → ${k} (da ${L.reconoce(t)})`);

// Falta el total: avisa
const r3 = L.lee(L.lineas(hoja([[10, [40, "Salario base"], [400, "1.000,00"]]])));
ok(r3.avisos.some((a) => /Total devengado/.test(a.t)) && r3.avisos.some((a) => /mes/.test(a.t)), "avisa de lo que falta");


// Texto suelto (.txt) con columnas hechas con espacios, como lo copian algunas apps
const TXT = ["Nomina de Octubre 2026", "CONCEPTO                 DEVENGOS    DEDUCCIONES", "Salario base             1.200,00", "Plus convenio              150,00", "Contingencias comunes                   70,50", "Retencion IRPF                         100,00", "Total devengado          1.350,00", "Total a deducir                        170,50", "Liquido a percibir       1.179,50", "Base cont. comunes       1.350,00"].join("\n");
const r4 = L.lee(L.lineas(L.trozosDeFilas(L.filasDeTexto(TXT))));
ok(r4.valores.base === 1200 && r4.valores.cc === 70.5 && r4.valores.irpf === 100 && r4.valores.liquido === 1179.5 && r4.avisos.length === 0, "texto con espacios: " + JSON.stringify(r4.valores) + JSON.stringify(r4.avisos));

// v225: la fecha de antigüedad («02 ABR 07») no es el mes de la nómina: vale la más reciente
const r5 = L.lee(L.lineas(L.trozosDeFilas(L.filasDeTexto(["TRANSPORTES EJEMPLO", "Fecha antigüedad 02 ABR 07", "Periodo MENS 01 ENE 25 a 31 ENE 25", "Salario base 1.000,00", "Total devengado 1.000,00"].join("\n")))));
ok(r5.mes === "2025-01", "mes con antigüedad delante: " + r5.mes);
const r6 = L.lee(L.lineas(L.trozosDeFilas(L.filasDeTexto(["Antigüedad: 01/04/2007", "Del 01/03/2025 al 31/03/2025", "Salario base 1.000,00"].join("\n")))));
ok(r6.mes === "2025-03", "mes con fechas en cifras: " + r6.mes);
// v227: formato de Calsina, INVENTADO con la misma forma (nunca la nómina real): CUANTÍA | PRECIO | código | CONCEPTO |
// DEVENGOS | DEDUCCIONES; «*» salarial y «-» no salarial; fila de totales con los importes debajo; líquido debajo;
// coste empresa; bloque de la aportación de la empresa abajo; mes en «FECHA 30 SEPTIEMBRE 2026» y antigüedad de 2007.
const calsina = (o = {}) => hoja([
  [20, [40, "EMPRESA INVENTADA SA"], [400, "ANTIG. 02 ABR 07"]],
  [40, [40, "TRABAJADOR: [tapado]"], [300, "CATEGORIA: CONDUCTOR"]],
  [80, [40, "CUANTIA"], [110, "PRECIO"], [220, "CONCEPTO"], [430, "DEVENGOS"], [520, "DEDUCCIONES"]],
  [100, [40, "30,00"], [110, "40,00"], [180, "1"], [220, "*SALARIO BASE"], [430, "1.200,00"]],
  [115, [40, "30,00"], [110, "5,00"], [180, "2"], [220, "*PLUS CONVENIO"], [430, "150,00"]],
  [130, [180, "4"], [220, "*ANTIGUEDAD"], [430, "120,00"]],
  ...(o.sinNoct ? [] : [[145, [40, "12,00"], [110, "1,50"], [180, "31"], [220, "*NOCTURNITAT"], [430, "18,00"]]]),
  [160, [40, "3.000,00"], [110, "0,0950"], [180, "156"], [220, "*INCENTIVO A LA CONDUCCION"], [430, "285,00"]],
  [175, [40, "40,00"], [110, "4,00"], [180, "157"], [220, "*PRODUCTIVIDAD"], [430, "160,00"]],
  [190, [180, "604"], [220, "-DIETES"], [430, "350,00"]],
  [205, [180, "710"], [220, "BESTRETA INCENTIVO"], [520, "200,00"]],
  [220, [180, "711"], [220, "BESTRETA PRODUCTIVIDAD"], [520, "100,00"]],
  [235, [180, "712"], [220, "BESTRETA DIETES"], [520, "300,00"]],
  [250, [40, "4,70"], [110, "2.300,50"], [180, "995"], [220, "COTIZACION CONT.COMU"], [520, "108,12"]],
  [265, [40, "0,15"], [110, "2.300,50"], [180, "994"], [220, "COTIZACION MEI"], [520, "3,45"]],
  [280, [40, "0,10"], [110, "2.300,50"], [180, "996"], [220, "COTIZACION FORMACION"], [520, "2,30"]],
  [295, [40, "1,55"], [110, "2.300,50"], [180, "997"], [220, "COTIZACION DESEMPLEO"], [520, "35,66"]],
  [310, [40, "12,00"], [110, "1.933,00"], [180, "999"], [220, "TRIBUTACION I.R.P.F."], [520, "231,96"]],
  [340, [40, "REM. TOTAL"], [120, "P.P.EXTRAS"], [200, "BASE S.S."], [280, "BASE A.T. Y DES."], [400, "BASE I.R.P.F."], [500, "T. DEVENGADO"], [590, "T. A DEDUCIR"]],
  [355, [40, "1.933,00"], [120, "367,50"], [200, "2.300,50"], [280, "2.300,50"], [400, "1.933,00"], [500, "2.283,00"], [590, o.malDeducir || "981,49"]],
  [380, [40, "COSTE EMPRESA"], [180, "3.142,23"], [400, "LIQUIDO A PERCIBIR"]],
  [395, [430, "1.301,51"]],
  [420, [40, "DETERMINACION DE LAS B. DE COTIZACION A LA S.S. Y CONCEPTOS DE RECAUDACION CONJUNTA Y DE LA APORTACION DE LA EMPRESA"]],
  [435, [40, "CONCEPTO"], [250, "BASE"], [340, "TIPO"], [430, "APORTACION EMPRESA"]],
  [450, [40, "1. Contingencias comunes"], [250, "2.300,50"], [340, "23,60"], [430, "542,92"]],
  [465, [40, "MEI"], [250, "2.300,50"], [340, "0,75"], [430, "17,25"]],
  [480, [40, "2. AT y EP"], [250, "2.300,50"], [340, "6,70"], [430, "154,13"]],
  [495, [40, "3. Desempleo"], [250, "2.300,50"], [340, "5,50"], [430, "126,53"]],
  [510, [40, "Formacion Profesional"], [250, "2.300,50"], [340, "0,60"], [430, "13,80"]],
  [525, [40, "Fondo Garantia Salarial"], [250, "2.300,50"], [340, "0,20"], [430, "4,60"]],
  [550, [40, o.fecha || "FECHA 30 SEPTIEMBRE 2026"], [300, "RECIBI"]],
]);
const rc = L.lee(L.lineas(calsina()));
const vc = rc.valores;
ok(rc.mes === "2026-09", "Calsina: mes de «FECHA 30 SEPTIEMBRE 2026», no la antigüedad: " + rc.mes);
ok(vc.base === 1200 && vc.plus === 150 && vc.antig === 120 && vc.noct === 18 && vc.pluses === 445 && vc.dietas === 350, "Calsina: cobros (incentivo + productividad en pluses): " + JSON.stringify(vc));
ok(vc.anticipo === 600 && vc.cc === 108.12 && vc.mei === 3.45 && vc.fp === 2.3 && vc.desempleo === 35.66 && vc.irpf === 231.96, "Calsina: descuentos (bestretas = anticipos)");
ok(!vc.otrosq && !vc.otrosd && rc.sinReconocer.length === 0, "Calsina: ninguna línea sin reconocer ni en «Otros»: " + JSON.stringify(rc.sinReconocer));
ok(vc.devengado === 2283 && vc.deducir === 981.49 && vc.liquido === 1301.51, "Calsina: totales de la fila de cabecera y el líquido de debajo");
ok(vc.remtotal === 1933 && vc.ppextras === 367.5 && vc.basecc === 2300.5 && vc.baseat === 2300.5 && vc.baseirpf === 1933, "Calsina: REM. TOTAL, P.P.EXTRAS y bases");
ok(vc.coste === 3142.23 && vc.empresa === 859.23 && rc.bloque.length === 6, "Calsina: coste empresa y aportación de la empresa aparte: " + vc.coste + " " + vc.empresa + " " + rc.bloque.length);
ok(rc.bloque.find(x => x.k === "fogasa").tipo === 0.2 && rc.bloque.find(x => x.k === "cc").base === 2300.5, "Calsina: el bloque de la empresa con base y tipo");
ok(rc.avisos.length === 0 && rc.lectura.length === 0, "Calsina: sin avisos falsos: " + JSON.stringify(rc.avisos) + JSON.stringify(rc.lectura));
const inc = rc.detalle.find(x => /incentivo a la conduccion/i.test(x.texto));
ok(inc && inc.cuantia === 3000 && Math.abs(inc.precio - 0.095) < 1e-9 && inc.codigo === "156" && rc.detalle.some(x => x.texto === "BESTRETA DIETES" && x.k === "anticipo"), "Calsina: detalle con cuantía, precio y código: " + JSON.stringify(inc));
// variantes: sin nocturnidad, mes en catalán, T. A DEDUCIR que no cuadra, otro espaciado
const rc2 = L.lee(L.lineas(calsina({ sinNoct: true, fecha: "DATA 30 SETEMBRE 2026" })));
ok(rc2.mes === "2026-09" && rc2.valores.noct == null, "Calsina: mes en catalán y sin nocturnidad");
ok(rc2.avisos.some(a => /Total devengado/.test(a.t)), "Calsina: sin una línea, avisa de que no suma el devengado");
const rc3 = L.lee(L.lineas(calsina({ malDeducir: "990,00" })));
ok(rc3.avisos.some(a => /Total a deducir/.test(a.t)) && !rc3.valores.otrosq, "Calsina: si el total a deducir no cuadra, avisa y no se inventa «Otros descuentos»");
const rc4 = L.lee(L.lineas(calsina({ fecha: "TOTAL C/D SEPTIEMBRE" })));
ok(rc4.mes && rc4.mes.endsWith("-09"), "Calsina: mes de «TOTAL C/D SEPTIEMBRE»: " + rc4.mes);
const ancho = L.lee(L.lineas(calsina().map(t => ({ ...t, x1: t.x1 * 1.3 + 5, x2: t.x2 * 1.3 + 5, y1: t.y1 * 1.2, y2: t.y1 * 1.2 + 11 }))));
ok(ancho.valores.liquido === 1301.51 && ancho.valores.deducir === 981.49 && ancho.mes === "2026-09" && ancho.sinReconocer.length === 0 && ancho.avisos.length === 0, "Calsina: con otro tamaño de hoja sale igual");
// una cotización mal calculada: avisa
const malCc = L.lee(L.lineas(calsina().map(t => t.str === "108,12" ? { ...t, str: "118,12" } : t.str === "981,49" ? { ...t, str: "991,49" } : t.str === "1.301,51" ? { ...t, str: "1.291,51" } : t)));
ok(malCc.lectura.some(a => /CONT\.COMU|COTIZACION/.test(a.v.n)), "Calsina: avisa si una cotización no es base × % : " + JSON.stringify(malCc.lectura));

console.log(fallos ? `\n${fallos} FALLOS` : "\nTodo bien");
process.exit(fallos ? 1 : 0);
