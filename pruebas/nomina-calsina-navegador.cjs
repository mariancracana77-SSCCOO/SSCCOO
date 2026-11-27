// v227: la Comparadora con dos nóminas en PDF con la FORMA de la de Calsina, INVENTADAS aquí mismo (ningún dato real):
// CUANTÍA | PRECIO | código | CONCEPTO | DEVENGOS | DEDUCCIONES, «*» salarial y «-» no salarial, fila de totales con los
// importes debajo, líquido debajo, coste empresa, bloque de la aportación de la empresa y «FECHA 30 SEPTIEMBRE 2026».
// Los importes se calculan aquí para que todo cuadre. Comprueba que se lee sin líneas sin reconocer y sin avisos, el
// mes bueno (nunca la antigüedad de 2007), «Línea por línea», lo que paga la empresa y el informe con sus datos.
// Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/nomina-calsina-navegador.cjs [carpeta-capturas]
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os");
const BASE = process.env.BASE || "http://localhost:8765/";
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
const CAP = process.argv[2];
const r2 = (x) => Math.round(x * 100) / 100;
const f = (x, d = 2) => x.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: true }).replace(/^(\d)(\d{3}),/, "$1.$2,");
// Una nómina inventada: o = {fecha, km, precioKm, ops, precioOp, horasNoct, dietas, bestretas: [inc, prod, diet], irpf}
function calsina(o) {
  const base = 1200, plus = 150, antig = 120;
  const noct = o.horasNoct ? r2(o.horasNoct * 1.5) : 0, inc = r2(o.km * o.precioKm), prod = r2(o.ops * o.precioOp);
  const rem = r2(base + plus + antig + noct + inc + prod), pp = r2(3 * (base + plus + antig) / 12), bss = r2(rem + pp);
  const cot = [["995", "COTIZACION CONT.COMU", 4.7], ["994", "COTIZACION MEI", 0.15], ["996", "COTIZACION FORMACION", 0.1], ["997", "COTIZACION DESEMPLEO", 1.55]].map(([c, n, p]) => [c, n, p, r2(bss * p / 100)]);
  const irpf = r2(rem * o.irpf / 100), [b1, b2, b3] = o.bestretas;
  const dev = r2(rem + o.dietas), ded = r2(b1 + b2 + b3 + cot.reduce((t, x) => t + x[3], 0) + irpf), liq = r2(dev - ded);
  const emp = [["1. Contingencias comunes", 23.6], ["MEI", 0.75], ["2. AT y EP", 6.7], ["3. Desempleo", 5.5], ["Formacion Profesional", 0.6], ["Fondo Garantia Salarial", 0.2]].map(([n, p]) => [n, p, r2(bss * p / 100)]);
  const coste = r2(dev + emp.reduce((t, x) => t + x[2], 0));
  const filas = [
    ["30,00", "40,00", "1", "*SALARIO BASE", f(base)], ["30,00", "5,00", "2", "*PLUS CONVENIO", f(plus)], ["", "", "4", "*ANTIGUEDAD", f(antig)],
    ...(noct ? [[f(o.horasNoct), "1,50", "31", "*NOCTURNITAT", f(noct)]] : []),
    [f(o.km), f(o.precioKm, 4), "156", "*INCENTIVO A LA CONDUCCION", f(inc)], [f(o.ops), f(o.precioOp), "157", "*PRODUCTIVIDAD", f(prod)],
    ["", "", "604", "-DIETES", f(o.dietas)],
    ["", "", "710", "BESTRETA INCENTIVO", "", f(b1)], ["", "", "711", "BESTRETA PRODUCTIVIDAD", "", f(b2)], ["", "", "712", "BESTRETA DIETES", "", f(b3)],
    ...cot.map(([c, n, p, v]) => [f(p), f(bss), c, n, "", f(v)]), [f(o.irpf), f(rem), "999", "TRIBUTACION I.R.P.F.", "", f(irpf)],
  ];
  const X = [40, 110, 190, 240, 470, 570], el = (x, y, t, b) => t ? `<div style="position:absolute;left:${x}px;top:${y}px${b ? ";font-weight:bold" : ""}">${t}</div>` : "";
  let y = 150, h = el(40, 40, "EMPRESA INVENTADA SA", 1) + el(430, 40, "ANTIG. 02 ABR 07") + el(40, 60, "TRABAJADOR: [tapado]") + el(430, 60, "CATEGORIA: CONDUCTOR");
  h += ["CUANTIA", "PRECIO", "", "CONCEPTO", "DEVENGOS", "DEDUCCIONES"].map((t, i) => el(X[i], 120, t, 1)).join("");
  for (const fi of filas) { h += fi.map((t, i) => el(X[i], y, t)).join(""); y += 20; }
  y += 20;
  const TX = [40, 130, 220, 310, 430, 540, 640];
  h += ["REM. TOTAL", "P.P.EXTRAS", "BASE S.S.", "BASE A.T. Y DES.", "BASE I.R.P.F.", "T. DEVENGADO", "T. A DEDUCIR"].map((t, i) => el(TX[i], y, t, 1)).join(""); y += 18;
  h += [rem, pp, bss, bss, rem, dev, ded].map((v, i) => el(TX[i], y, f(v))).join(""); y += 40;
  h += el(40, y, "COSTE EMPRESA", 1) + el(200, y, f(coste)) + el(470, y, "LIQUIDO A PERCIBIR", 1); y += 20;
  h += el(480, y, f(liq), 1); y += 50;
  h += el(40, y, "DETERMINACION DE LAS B. DE COTIZACION A LA S.S. Y DE LA APORTACION DE LA EMPRESA", 1); y += 20;
  h += el(40, y, "CONCEPTO", 1) + el(300, y, "BASE", 1) + el(420, y, "TIPO", 1) + el(520, y, "APORTACION EMPRESA", 1); y += 20;
  for (const [n, p, v] of emp) { h += el(40, y, n) + el(300, y, f(bss)) + el(420, y, f(p)) + el(520, y, f(v)); y += 18; }
  y += 30; h += el(40, y, o.fecha) + el(430, y, "RECIBI");
  return { html: `<html><body style="font:10px Arial;margin:0;position:relative">${h}</body></html>`, liq, coste, dev, ded };
}
const SEP = calsina({ fecha: "FECHA 30 SEPTIEMBRE 2026", km: 3000, precioKm: 0.095, ops: 40, precioOp: 4, horasNoct: 12, dietas: 350, bestretas: [200, 100, 300], irpf: 12 });
const OCT = calsina({ fecha: "DATA 31 OCTUBRE 2026", km: 2500, precioKm: 0.095, ops: 30, precioOp: 4, horasNoct: 0, dietas: 300, bestretas: [250, 150, 300], irpf: 12 });
(async () => {
  const b = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ncalsina-"));
  const hazPdf = async (html, nom) => { const q = await b.newPage(); await q.setContent(html); const fi = path.join(tmp, nom); await q.pdf({ path: fi, format: "A4" }); await q.close(); return fi; };
  const P1 = await hazPdf(SEP.html, "sep.pdf"), P2 = await hazPdf(OCT.html, "oct.pdf");
  let mal = 0; const ok = (c, t) => { if (c) console.log("OK  " + t); else { mal++; console.log("MAL " + t); } };
  for (const [ancho, oscuro] of [[360, false], [412, true], [1280, false]]) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: 900 }, colorScheme: oscuro ? "dark" : "light", hasTouch: ancho < 500, deviceScaleFactor: CAP ? 2 : 1 });
    await ctx.addInitScript(() => { try { localStorage.setItem("ccoo-aviso-privacidad", "1"); localStorage.setItem("ccoo-bienvenida", String(Date.now())); } catch (e) {} });
    await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
    const p = await ctx.newPage(), errores = [];
    p.on("pageerror", e => errores.push(String(e))); p.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
    const tag = `${ancho}${oscuro ? " oscuro" : ""}`;
    await p.goto(BASE + "#nomina"); await p.waitForTimeout(1500);
    await p.setInputFiles("#nom-slots [data-file='a']", P1); await p.waitForSelector("[data-slot-ok='a']", { timeout: 15000 });
    await p.setInputFiles("#nom-slots [data-file='b']", P2); await p.waitForSelector("[data-slot-ok='b']", { timeout: 15000 });
    const ta = await p.textContent("[data-slot='a']"), tb = await p.textContent("[data-slot='b']");
    ok(/Septiembre 2026/.test(ta) && /Octubre 2026/.test(tb) && !/2007/.test(ta + tb), `${tag}: el mes de «FECHA…» (también en catalán), nunca la antigüedad`);
    ok(!/no he reconocido/i.test(ta + tb), `${tag}: ninguna línea sin reconocer`);
    ok(await p.locator("[data-slot='a'] [data-avisos] .zc-ok").count() === 1 && await p.locator("[data-slot='b'] [data-avisos] .zc-ok").count() === 1, `${tag}: las sumas cuadran, sin avisos falsos`);
    ok(/Coste empresa/.test(ta) && ta.includes(SEP.coste.toLocaleString("es-ES", { minimumFractionDigits: 2 }).replace(/^(\d)(\d{3}),/, "$1.$2,")), `${tag}: coste empresa`);
    ok(/Línea por línea/.test(ta) && /156 · INCENTIVO A LA CONDUCCION/.test(ta) && /3\.000 × 0,095/.test(ta), `${tag}: línea por línea con código, km y precio`);
    ok(/Lo que paga la empresa por ti/.test(ta) && /Fondo Garantia Salarial/.test(ta), `${tag}: lo que paga la empresa, aparte`);
    ok(/bestretas/i.test(ta), `${tag}: explica las bestretas`);
    if (CAP && ancho === 360) { await p.locator("[data-slot='a'] .nl-lineas").first().evaluate(d => d.open = true); await p.locator("[data-slot='a'] .nl-lineas").nth(1).evaluate(d => d.open = true); await p.waitForTimeout(200); await p.locator("[data-slot='a']").screenshot({ path: path.join(CAP, `calsina-leida-${ancho}.png`) }); }
    await p.check("[data-slot-ok='a']"); await p.check("[data-slot-ok='b']"); await p.waitForTimeout(300);
    const inf = await p.textContent("#nom-out");
    ok(/Coste empresa/.test(inf) && /Lo que paga la empresa a la Seguridad Social/.test(inf), `${tag}: el informe con coste empresa y lo que paga la empresa`);
    ok(/3\.000 km a 0,095 €\/km/.test(inf) && /2\.500 km/.test(inf), `${tag}: el informe con los km del incentivo`);
    ok(/no lleva nocturnidad/.test(inf) && /de cada 100 €/.test(inf) && /IRPF es del 12 %/.test(inf), `${tag}: nocturnidad, lo que se va en SS e IRPF y el % de IRPF`);
    ok(/INCENTIVO A LA CONDUCCION/.test(inf) && /Total anticipos/.test(inf), `${tag}: concepto por concepto con los nombres de la nómina y los anticipos`);
    if (CAP) { await p.addStyleTag({ content: "header{position:static!important} .barra-fija{display:none!important}" }); await p.locator("#nom-out").screenshot({ path: path.join(CAP, `calsina-informe-${ancho}${oscuro ? "-oscuro" : ""}.png`) }); }
    const anchoDoc = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(anchoDoc <= ancho, `${tag}: sin scroll lateral (${anchoDoc})`);
    ok(!errores.length, `${tag}: sin errores de consola ${errores.join(" | ")}`);
    await ctx.close();
  }
  await b.close();
  console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
  process.exit(mal ? 1 : 0);
})();
