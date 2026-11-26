// v177 (petición n.º 45): comprueba en el navegador que en Mi finiquito, Mi hora ordinaria, Diccionario y Test de ADR
// TODO el texto que se ve sale de la lista que saca la función «traducir» (la misma que pruebas/traducir-textos.cjs).
// Traducción falsa: «ZZ » + el texto. Al elegir un idioma todo lo que se ve tiene que empezar por «ZZ»; al volver al
// español no puede quedar ningún «ZZ». Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/traducir-navegador.cjs
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const BASE = process.env.BASE || "http://localhost:8765/";
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
const tmp = path.join(require("os").tmpdir(), "textos-zona.json");
execFileSync("node", [path.join(__dirname, "traducir-textos.cjs"), "--json", tmp], { stdio: "inherit" });
const TEXTOS = JSON.parse(fs.readFileSync(tmp, "utf8"));
// Lo que se mira en la página: la misma forma de partir el texto que zona-idioma.js
const MIRA = `(() => {
  const EN = { B: "**", STRONG: "**", I: "", EM: "" }, SALTA = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, TEMPLATE: 1, svg: 1, SVG: 1 };
  const L = /\\p{L}/u, j = (s) => s.replace(/\\s+/g, " ").trim(), out = [];
  const bloque = (el) => { let l = false; for (const n of el.childNodes) { if (n.nodeType === 3) { if (L.test(n.data)) l = true; continue; } if (n.nodeType === 8) continue; if (n.nodeType !== 1 || !(n.tagName in EN) || [...n.childNodes].some(m => m.nodeType !== 3)) return false; if (L.test(n.textContent)) l = true; } return l; };
  const marca = (el) => j([...el.childNodes].map(n => n.nodeType === 3 ? n.data : n.nodeType === 1 ? EN[n.tagName] + n.textContent + EN[n.tagName] : "").join(""));
  const r = (el) => { if (SALTA[el.tagName] || el.getAttribute("translate") === "no" || el.hidden || el.closest("[hidden]")) return;
    for (const a of ["placeholder", "aria-label", "title"]) { const v = el.getAttribute(a); if (v && L.test(v)) out.push("@" + j(v)); }
    if (bloque(el)) { out.push(marca(el)); return; }
    for (const n of el.childNodes) { if (n.nodeType === 1) r(n); else if (n.nodeType === 3 && L.test(n.data)) out.push(j(n.data)); } };
  r(document.querySelector(".vista.activa")); return out; })()`;
const PERMITIDOS = [/^[\d.,\s]+ h$/, /^\*\*ZZ /, /^X?\d+$/, /^[\d.]+ kg$/]; // «147,2 h» (cifra con unidad), una negrita ya traducida y la placa «X338» y los kilos de «Peso por ejes» («12.750 kg»)
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 412, height: 900 } });
  await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
  const p = await ctx.newPage(), errores = [];
  p.on("pageerror", e => errores.push(String(e))); p.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
  let mal = 0;
  const comprueba = async (nombre, debe) => {
    const vistos = await p.evaluate(MIRA);
    const fallan = vistos.filter(t => { const s = t.replace(/^@/, ""); return debe ? !s.startsWith("ZZ") && !PERMITIDOS.some(x => x.test(s)) : s.includes("ZZ"); });
    if (fallan.length) { mal++; console.log(`MAL ${nombre}: ${fallan.length} textos ${debe ? "sin traducir" : "sin volver al español"}:`, fallan.slice(0, 8)); }
    else console.log(`OK  ${nombre} (${vistos.length} textos)`);
  };
  for (const [g, hash] of [["finiquito", "finiquito"], ["hora", "hora"], ["diccionario", "diccionario"], ["adr", "adr"], ["carga", "carga"], ["ejes", "ejes"], ["sobresale", "sobresale"], ["conversor", "conversor"], ["muelles", "muelles"], ["testigos", "testigos"], ["nomina", "nomina"], ["tapar", "tapar"]]) {
    await p.goto(BASE + "#" + hash); await p.waitForTimeout(700);
    await p.evaluate(([g, lista]) => {
      try { localStorage.removeItem("ccoo-mi-idioma"); localStorage.removeItem("ccoo-textos-" + g); } catch (_) {}
      const o = sb.functions.invoke.bind(sb.functions);
      sb.functions.invoke = async (n, op) => n === "traducir" && op?.body?.modo === "textos" && op.body.grupo === g
        ? { data: { textos: Object.fromEntries(lista.map(s => [s, "ZZ " + s])) }, error: null } : o(n, op);
    }, [g, TEXTOS[g]]);
    const sel = `#v-${g} .zc-idioma select`;
    if (g === "finiquito") { await p.fill("#fin-alta", "2015-03-01"); await p.fill("#fin-baja", "2026-10-20"); }
    if (g === "hora") await p.fill("#ho-hx", "10");
    if (g === "carga") { await p.evaluate(() => { try { localStorage.removeItem("ccoo-remolque"); } catch (_) {} }); await p.reload(); await p.waitForTimeout(700); await p.evaluate(([g, lista]) => { const o = sb.functions.invoke.bind(sb.functions); sb.functions.invoke = async (n, op) => n === "traducir" && op?.body?.modo === "textos" && op.body.grupo === g ? { data: { textos: Object.fromEntries(lista.map(s => [s, "ZZ " + s])) }, error: null } : o(n, op); }, [g, TEXTOS[g]]); await p.fill("#cg-0-q", "10"); await p.fill("#cg-0-w", "500"); await p.click("#v-carga .cg-ajustes summary"); await p.fill("#cg-pay", "4000"); }
    await p.selectOption(sel, "en"); await p.waitForTimeout(500);
    await comprueba(g + " en inglés", true);
    if (g === "finiquito") { await p.selectOption("#fin-tipo", "dis"); await p.waitForTimeout(300); await comprueba("finiquito disciplinario", true); await p.selectOption("#fin-cat", "man"); await p.waitForTimeout(300); await comprueba("finiquito importes a mano", true); }
    if (g === "hora") { await p.fill("#ho-hx", "20"); await p.waitForTimeout(300); await comprueba("hora extra por encima", true); }
    if (g === "diccionario") { await p.click("#dic-chips .zc-chip:nth-child(2)"); await p.waitForTimeout(300); await comprueba("diccionario filtro", true); await p.fill("#dic-q", "zzzzzz-nada"); await p.waitForTimeout(300); await comprueba("diccionario sin resultados", true); await p.fill("#dic-q", ""); }
    if (g === "adr") {
      await p.click("#adr-vista .zc-opc"); await p.waitForTimeout(300); await comprueba("adr respondida", true);
      await p.click("[data-adr-tab='1']"); await p.fill("#adr-k", "X338"); await p.waitForTimeout(300); await comprueba("adr placa", true);
      await p.click("[data-adr-tab='2']"); await p.waitForTimeout(300); await comprueba("adr carnet", true);
      await p.click("[data-adr-tab='0']"); await p.waitForTimeout(300);
    }
    // v183: «Peso por ejes» en los tres estados (correcto, al límite y exceso) y con «Uniforme»
    // v185: «Cargas que sobresalen» pasándose de los límites y con carga ancha; «Conversor» con un número y otra conversión
    if (g === "sobresale") { await p.fill("#so-det", "3.5"); await p.waitForTimeout(300); await comprueba("sobresale exceso", true); await p.selectOption("#so-tipo", "ancha"); await p.fill("#so-ancho", "2.2"); await p.fill("#so-izq", "0.1"); await p.waitForTimeout(300); await comprueba("sobresale ancha", true); }
    // v211: Guía de testigos: la carpeta DAF entera (avisos rojos, cuadro y otros), un filtro y una búsqueda
    if (g === "testigos") { await p.click("#te-marcas [data-m='daf']"); await p.waitForTimeout(400); await comprueba("testigos carpeta DAF", true); await p.click("#te-colores [data-c='rojo']"); await p.waitForTimeout(300); await comprueba("testigos avisos rojos", true); await p.fill("#te-busca", "zzzzzz-nada"); await p.waitForTimeout(300); await comprueba("testigos sin resultados", true); await p.fill("#te-busca", ""); await p.click("#te-colores [data-c='']"); await p.waitForTimeout(300); }
    // v219: Comparadora de nóminas con dos nóminas distintas (sube el sueldo y una retención), «Convenio» y «Conceptos»
    if (g === "nomina") {
      await p.evaluate(() => { const d = document.getElementById("nom-mano"); if (d) d.open = true; }); // v224: copiar a mano va plegado
      const ks = await p.$$eval("#nom-filas input[data-nom='a']", l => l.slice(0, 2).map(i => i.dataset.k));
      await p.fill(`#nom-a-${ks[0]}`, "1500"); await p.fill(`#nom-b-${ks[0]}`, "1600"); await p.fill(`#nom-a-${ks[1]}`, "100");
      const q = await p.$$eval("#nom-filas input[data-nom='a']", l => l.filter(i => i.closest(".nom-fila, div")).map(i => i.dataset.k).pop());
      await p.fill(`#nom-a-${q}`, "200"); await p.fill(`#nom-b-${q}`, "250"); await p.waitForTimeout(300); await comprueba("nomina comparada", true);
      await p.click("[data-nom-tab='convenio']"); await p.waitForTimeout(300); await comprueba("nomina convenio", true);
      await p.click("[data-nom-tab='conceptos']"); await p.waitForTimeout(300); await comprueba("nomina conceptos", true);
      await p.click("[data-nom-tab='dos']"); await p.waitForTimeout(300);
    }
    if (g === "conversor") { await p.fill("#cv-a", "8"); await p.click("#cv-chips [data-i='6']"); await p.fill("#cv-a", "20"); await p.waitForTimeout(300); await comprueba("conversor temperatura", true); }
    if (g === "ejes") { await p.fill("#ej-kg", "12000"); await p.click("#ej-pos [data-v='centro']"); await p.waitForTimeout(300); await comprueba("ejes correcto", true); await p.fill("#ej-kg", "24500"); await p.click("#ej-pos [data-v='uniforme']"); await p.waitForTimeout(300); await comprueba("ejes al límite o exceso", true); await p.click("#ej-pos [data-v='cabina']"); await p.click("[data-paso='-0.1']"); await p.waitForTimeout(300); await comprueba("ejes exceso delante", true); }
    if (g === "carga") { await p.click("#cg-add"); await p.selectOption("#cg-1-t", "ind"); await p.fill("#cg-1-q", "3"); await p.waitForTimeout(300); await comprueba("carga dos recogidas", true); await p.click("#cg-cero"); await p.waitForTimeout(200); await comprueba("carga borrar", true); await p.click("#cg-no"); await p.fill("#cg-0-q", "40"); await p.waitForTimeout(300); await comprueba("carga no cabe", true); }
    await p.selectOption(sel, ""); await p.waitForTimeout(500);
    await comprueba(g + " vuelta al español", false);
  }
  if (errores.length) { mal++; console.log("MAL errores de consola:", errores.slice(0, 5)); }
  await b.close(); console.log(mal ? `FALLAN ${mal}` : "TODO OK"); process.exit(mal ? 1 : 0);
})();
