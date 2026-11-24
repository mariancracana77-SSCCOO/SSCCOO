// v216: «Mi jubilación» y «Mi baja médica» como las ve el conductor (lecciones del vault):
// 320/360/412 px y PC, claro/oscuro, letra muy grande; lo que se esconde en sus dos estados;
// nada de NaN/undefined/Infinity; números con coma y con punto de miles; campos vacíos;
// nada sale de la pantalla (tampoco la tabla); el buscador las encuentra.
// Uso: NODE_PATH=$(npm root -g) node pruebas/jub-baja-pantalla.cjs  (servidor en 8765; BASE= para otro)
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
const BASE = process.env.BASE || "http://localhost:8765/";
const mal = []; let n = 0;
const ok = (c, t) => { n++; if (!c) mal.push(t); };
async function texto(p, id) { return p.$eval("#" + id, e => e.innerText); }
async function visible(p, id) { return p.$eval("#" + id, e => !!(e.offsetWidth || e.offsetHeight) && getComputedStyle(e).visibility !== "hidden"); }
async function sale(p, sel) { return p.$$eval(sel + " *", els => els.filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).map(e => e.tagName + "." + e.className).slice(0, 3)); }
const raro = s => /NaN|undefined|Infinity|null|\{\w+\}/.test(s);
(async () => {
  const b = await chromium.launch();
  for (const [w, h, dark, letra] of [[320, 700, false, "muy-grande"], [320, 700, true, "muy-grande"], [360, 780, true, null], [412, 900, false, "grande"], [1280, 900, true, null]]) {
    const nom = `${w}${dark ? " oscuro" : ""}${letra ? " letra " + letra : ""}`;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: dark ? "dark" : "light", locale: "es-ES" });
    await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
    await ctx.addInitScript(l => { try { localStorage.setItem("ccoo-aviso-privacidad", "1"); localStorage.setItem("ccoo-bienvenida", String(Date.now())); if (l) localStorage.setItem("ccoo-lectura", JSON.stringify({ letra: l })); } catch (e) {} }, letra);
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    // JUBILACIÓN
    await p.goto(BASE + "index.html#jubilacion"); await p.waitForTimeout(1200);
    if (letra) ok(await p.evaluate(() => document.documentElement.getAttribute("data-letra")) === letra, nom + ": la letra no se aplica");
    let t = await texto(p, "ju-out"); ok(!raro(t), nom + ": jubilación al abrir con texto raro: " + t.slice(0, 120));
    await p.fill("#ju-nac", ""); await p.fill("#ju-base", ""); await p.fill("#ju-anios", ""); await p.waitForTimeout(150);
    t = await texto(p, "ju-out"); ok(!raro(t), nom + ": jubilación con todo vacío: " + t.slice(0, 120));
    await p.fill("#ju-nac", "1962-03-15"); await p.fill("#ju-anios", "39"); await p.fill("#ju-base", "2100"); await p.check("#ju-desp"); await p.waitForTimeout(150);
    t = await texto(p, "ju-out"); ok(/1620,00/.test(t) && !raro(t), nom + ": jubilación base 2100: " + t.slice(0, 160));
    await p.fill("#ju-base", "2.100"); await p.waitForTimeout(150);
    ok(/1620,00/.test(await texto(p, "ju-out")), nom + ": «2.100» (punto de miles) no se lee como 2100");
    for (const v of ["2.100,00", "2100,00", "2100 €"]) { await p.fill("#ju-base", v); await p.waitForTimeout(120);
      ok(/1620,00/.test(await texto(p, "ju-out")), nom + `: «${v}» no se lee como 2100`); }
    await p.fill("#ju-base", "abc"); await p.waitForTimeout(120); ok(!raro(await texto(p, "ju-out")), nom + ": base «abc» da texto raro");
    await p.fill("#ju-base", "2100");
    ok(await visible(p, "ju-desp-caja"), nom + ": con nómina no se ve lo del despido");
    await p.selectOption("#ju-reg", { index: 1 }); await p.waitForTimeout(150);
    ok(!(await visible(p, "ju-desp-caja")), nom + ": autónomo y se ve lo del despido");
    t = await texto(p, "ju-out"); ok(!/despido o cierre/i.test(t.split("Cómo se calcula")[0]) && !raro(t), nom + ": autónomo y sale la anticipada por despido");
    await p.selectOption("#ju-reg", { index: 0 }); await p.waitForTimeout(150);
    ok(await visible(p, "ju-desp-caja"), nom + ": vuelve a nómina y no reaparece lo del despido");
    for (const [a, adel] of [["10", ""], ["50", "99"], ["36", "12"]]) { await p.fill("#ju-anios", a); await p.fill("#ju-adel", adel); await p.waitForTimeout(120); ok(!raro(await texto(p, "ju-out")), nom + `: ${a} años, adelanto ${adel}: texto raro`); }
    let s = await sale(p, "#v-jubilacion"); ok(!s.length, nom + ": jubilación sale de la pantalla: " + s.join(", "));
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), nom + ": jubilación con scroll lateral");
    // BAJA
    await p.goto(BASE + "index.html#baja"); await p.waitForTimeout(1000);
    t = await texto(p, "ba-out"); ok(!raro(t), nom + ": baja al abrir: " + t.slice(0, 120));
    await p.fill("#ba-base", ""); await p.fill("#ba-dias", ""); await p.waitForTimeout(150); ok(!raro(await texto(p, "ba-out")), nom + ": baja vacía");
    await p.fill("#ba-base", "1.500"); await p.fill("#ba-dias", "30"); await p.waitForTimeout(150);
    ok(/1080,00/.test(await texto(p, "ba-out")), nom + ": «1.500» (punto de miles) no se lee como 1500");
    await p.fill("#ba-base", "1500"); await p.waitForTimeout(150);
    ok(/1080,00/.test(await texto(p, "ba-out")), nom + ": 30 días con 1500 no da 1080");
    ok(await visible(p, "ba-comun-caja"), nom + ": enfermedad común sin sus casillas");
    const tipos = await p.$$eval("#ba-tipo option", o => o.map(x => x.value));
    for (const tp of tipos) { await p.selectOption("#ba-tipo", tp); await p.waitForTimeout(120);
      ok((await visible(p, "ba-comun-caja")) === (tp === "comun"), nom + `: tipo ${tp}: casillas de enfermedad común mal`);
      ok(!raro(await texto(p, "ba-out")), nom + `: tipo ${tp}: texto raro`); }
    await p.selectOption("#ba-tipo", "comun"); await p.fill("#ba-dias", "600"); await p.waitForTimeout(150); ok(!raro(await texto(p, "ba-out")), nom + ": 600 días");
    s = await sale(p, "#v-baja"); ok(!s.length, nom + ": baja sale de la pantalla: " + s.join(", "));
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), nom + ": baja con scroll lateral");
    ok(!errs.length, nom + ": errores de consola: " + errs.join(" | "));
    await ctx.close();
  }
  // buscador
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 } });
  await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
  const p = await ctx.newPage(); await p.goto(BASE + "index.html#buscar"); await p.waitForTimeout(1200);
  for (const [q, h] of [["jubilación", "#jubilacion"], ["pensión", "#jubilacion"], ["baja médica", "#baja"], ["incapacidad", "#baja"]]) {
    await p.fill("#buscar-todo", q); await p.waitForTimeout(500);
    ok(await p.$(`main a[href='${h}']`) !== null, `buscador: «${q}» no lleva a ${h}`); }
  await b.close();
  console.log(mal.length ? "FALLA:\n- " + mal.join("\n- ") : `Todo bien (${n} comprobaciones).`); process.exit(mal.length ? 1 : 0);
})();
