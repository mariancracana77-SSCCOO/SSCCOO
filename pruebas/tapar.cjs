// Prueba de la búsqueda de datos de «Tapar datos privados» (tapar.js), sin navegador: node pruebas/tapar.cjs
// Datos de prueba inventados (DNI y IBAN de ejemplo con la letra y el control correctos), nunca datos reales.
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = { window: {}, document: { getElementById: () => null }, console };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "tapar.js"), "utf8"), ctx);
const { buscaEnLinea, buscaEnTrozos, dniBueno, ibanBueno } = ctx.window.TAPAR;
let mal = 0;
const tapado = (t) => buscaEnLinea(t).map((h) => t.slice(h.ini, h.fin));
function debe(t, quiere, noQuiere = []) {
  const v = tapado(t).join(" | ");
  for (const q of quiere) if (!v.includes(q)) { mal++; console.log("FALTA tapar «" + q + "» en: " + t + "  →  " + v); }
  for (const q of noQuiere) if (v.includes(q)) { mal++; console.log("NO debía tapar «" + q + "» en: " + t + "  →  " + v); }
}
if (!dniBueno("12345678", "Z") || dniBueno("12345678", "A")) { mal++; console.log("letra del DNI"); }
if (!ibanBueno("ES91 2100 0418 4502 0005 1332") || ibanBueno("ES00 2100 0418 4502 0005 1332")) { mal++; console.log("control del IBAN"); }
debe("NIF: 12345678Z", ["12345678Z"]);
debe("DNI 12345678-Z  Categoría: Conductor", ["12345678-Z"], ["Conductor"]);
debe("NIE X1234567L", ["X1234567L"]);
debe("IBAN ES91 2100 0418 4502 0005 1332", ["ES91 2100 0418 4502 0005 1332"]);
debe("Cuenta 2100 0418 45 0200051332", ["2100 0418 45 0200051332"]);
debe("Nº Afiliación S.S. 08/12345678/90", ["08/12345678/90"]);
debe("N.A.F. 081234567890", ["081234567890"]);
debe("Teléfono 612 345 678", ["612 345 678"]);
debe("Correo: nombre.apellido@ejemplo.com", ["nombre.apellido@ejemplo.com"]);
debe("Trabajador: PEREZ GARCIA, JUAN", ["PEREZ", "GARCIA,", "JUAN"]);
debe("Domicilio: C/ Mayor 12, 2º 1ª", ["Mayor", "12,"]);
// lo que NO es privado: importes, fechas de periodo, conceptos y la empresa
debe("Salario base 1.234,56", [], ["1.234,56"]);
debe("Plus convenio 245,10  Antigüedad 61,73", [], ["245,10", "61,73"]);
debe("Periodo 01/10/2026 a 31/10/2026  Días 30", [], ["01/10/2026", "31/10/2026"]);
debe("Contingencias comunes 4,70 % 1.580,00 74,26", [], ["4,70", "1.580,00", "74,26"]);
debe("Total devengado 2.010,45  Líquido a percibir 1.650,20", [], ["2.010,45", "1.650,20"]);
// trozos de pdf.js en dos columnas de la misma línea: el recuadro va solo sobre el dato
const cajas = buscaEnTrozos([
  { str: "NIF:", x1: 10, y1: 100, x2: 40, y2: 112 }, { str: "12345678Z", x1: 45, y1: 100, x2: 120, y2: 112 },
  { str: "Salario base", x1: 10, y1: 140, x2: 90, y2: 152 }, { str: "1.234,56", x1: 300, y1: 140, x2: 360, y2: 152 },
]);
if (cajas.length !== 1 || cajas[0].x > 45 || cajas[0].x + cajas[0].w < 120 || cajas[0].y > 100) { mal++; console.log("recuadros:", JSON.stringify(cajas)); }
console.log(mal ? "MAL: " + mal : "OK: tapar");
process.exit(mal ? 1 : 0);
