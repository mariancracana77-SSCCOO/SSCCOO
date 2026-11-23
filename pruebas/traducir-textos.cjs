// v177 (petición n.º 45): saca los textos de las herramientas nuevas de Zona Conductores con el MISMO código que la
// función «traducir» (el trozo «textosVista» de herramientas/funciones/traducir.ts) y comprueba que hay menos de 500
// por herramienta. Con «--json» los escribe (lo usa pruebas/traducir-navegador.cjs).
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
const ts = fs.readFileSync(path.join(raiz, "herramientas/funciones/traducir.ts"), "utf8");
const trozo = ts.slice(ts.indexOf("// --- textosVista (v177)"), ts.indexOf("// --- fin textosVista ---"));
const { textosVista, textosJS } = new Function(trozo + "\nreturn { textosVista, textosJS };")();
const GRUPOS = { finiquito: ["v-finiquito", "finiquito.js", "convenio-girona.js"], hora: ["v-hora", "hora.js", "convenio-girona.js"], diccionario: ["v-diccionario", "diccionario.js"], adr: ["v-adr", "adr.js"], carga: ["v-carga", "carga.js"], ejes: ["v-ejes", "ejes.js"], multas: ["v-multas", "multas.js"], sobresale: ["v-sobresale", "sobresale.js"], conversor: ["v-conversor", "conversor.js"], muelles: ["v-muelles", "muelles.js"], testigos: ["v-testigos", "testigos.js"] };
const html = fs.readFileSync(path.join(raiz, "index.html"), "utf8"), res = {};
let mal = 0;
for (const [g, [vista, ...js]] of Object.entries(GRUPOS)) {
  const lista = [];
  for (const s of [...textosVista(html, vista), ...js.flatMap(f => textosJS(fs.readFileSync(path.join(raiz, f), "utf8")))]) if (!lista.includes(s)) lista.push(s);
  res[g] = lista;
  const ok = lista.length > 10 && lista.length <= 500;
  if (!ok) mal++;
  console.log(`${ok ? "OK " : "MAL"} ${g}: ${lista.length} textos`);
}
if (process.argv.includes("--json")) fs.writeFileSync(process.argv[process.argv.indexOf("--json") + 1], JSON.stringify(res));
process.exit(mal ? 1 : 0);
