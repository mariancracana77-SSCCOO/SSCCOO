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
console.log(fallos ? `\n${fallos} FALLOS` : "\nTodo bien");
process.exit(fallos ? 1 : 0);
