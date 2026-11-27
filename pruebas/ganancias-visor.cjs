// v228: «Mis incentivos» > Semana > hoja de trabajo: la foto entera, el visor en grande (zoom, girar, páginas, Cerrar, Atrás, Esc)
// y «Ver la hoja en PDF» en pantalla. La hoja es un dibujo INVENTADO hecho aquí (ningún dato real).
// Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/ganancias-visor.cjs [carpeta-capturas]
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os");
const BASE = process.env.BASE || "http://localhost:8765/";
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
const CAP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ganvisor-"));
  // Hoja inventada: una tabla a mano, alta y estrecha (como una foto de móvil), y otra apaisada
  const hazFoto = async (ancho, alto, nom) => { const q = await b.newPage({ viewport: { width: ancho, height: alto } });
    await q.setContent(`<body style="margin:0;background:#fffdf5;font:22px 'Comic Sans MS',cursive"><div style="padding:30px"><h2>PARTE SEMANAL (inventado)</h2>
      <table border="1" cellpadding="10" style="border-collapse:collapse;width:100%">${["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(d => `<tr><td>${d}</td><td>Taller</td><td>8 h</td><td>Asuntos sindicales</td></tr>`).join("")}<tr><td colspan="2"><b>TOTAL</b></td><td>40 h</td><td></td></tr></table></div></body>`);
    const fi = path.join(tmp, nom); await q.screenshot({ path: fi, type: "jpeg" }); await q.close(); return fi; };
  const F1 = await hazFoto(900, 1500, "hoja1.jpg"), F2 = await hazFoto(1400, 900, "hoja2.jpg");
  let mal = 0; const ok = (c, t) => { if (c) console.log("OK  " + t); else { mal++; console.log("MAL " + t); } };
  for (const [ancho, oscuro] of [[320, false], [412, true], [1280, false]]) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: ancho < 500 ? 800 : 900 }, colorScheme: oscuro ? "dark" : "light", hasTouch: ancho < 500, deviceScaleFactor: CAP ? 2 : 1 });
    await ctx.addInitScript(() => { try { localStorage.setItem("ccoo-aviso-privacidad", "1"); localStorage.setItem("ccoo-bienvenida", String(Date.now())); localStorage.setItem("ccoo-ganancias", JSON.stringify({ dias: {}, libres: {}, tab: "semana" })); } catch (e) {} });
    await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
    const p = await ctx.newPage(), errores = [];
    p.on("pageerror", e => errores.push(String(e))); p.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
    const tag = `${ancho}${oscuro ? " oscuro" : ""}`;
    await p.goto(BASE + "#ganancias"); await p.waitForTimeout(1200);
    await p.click("#v-ganancias [data-gtab='semana']"); await p.waitForSelector("#gan-hoja-gal", { state: "attached" });
    await p.setInputFiles("#gan-hoja-gal", [F1, F2]); await p.waitForSelector("[data-hoja-ver='1']", { timeout: 10000 });
    // (b) la miniatura entera: la imagen se ve completa (alto natural, no recortada)
    const mini = await p.evaluate(() => { const i = document.querySelector("[data-hoja-ver='0'] img"); const r = i.getBoundingClientRect(); return { w: r.width, h: r.height, nw: i.naturalWidth, nh: i.naturalHeight, fit: getComputedStyle(i).objectFit }; });
    ok(mini.w >= Math.min(260, ancho - 60) && mini.fit === "contain" && Math.abs(mini.w / mini.h - mini.nw / mini.nh) < 0.05 || mini.h >= 300, `${tag}: la foto se ve entera y más grande (${Math.round(mini.w)}×${Math.round(mini.h)})`);
    if (CAP && ancho !== 1280) await p.locator("#gan-hoja").screenshot({ path: path.join(CAP, `hoja-${ancho}${oscuro ? "-oscuro" : ""}.png`) });
    // (a) visor
    await p.click("[data-hoja-ver='0']"); await p.waitForSelector(".gan-visor");
    ok(await p.locator(".gan-visor[role=dialog] #gan-visor-img").count() === 1, `${tag}: al tocar la foto se abre en grande`);
    ok(/Página 1 de 2/.test(await p.textContent("#gan-visor-tit")), `${tag}: dice la página`);
    await p.click("[data-v='mas']"); await p.click("[data-v='mas']");
    ok(/scale\(2\.2/.test(await p.getAttribute("#gan-visor-img", "style")), `${tag}: «+» acerca`);
    await p.click("[data-v='girar']");
    ok(/rotate\(90deg\)/.test(await p.getAttribute("#gan-visor-img", "style")), `${tag}: gira`);
    await p.click("[data-v='sig']");
    ok(/Página 2 de 2/.test(await p.textContent("#gan-visor-tit")) && /scale\(1\)/.test(await p.getAttribute("#gan-visor-img", "style")), `${tag}: pasa a la página 2 sin zoom`);
    if (CAP) { await p.click("[data-v='ant']"); await p.waitForTimeout(300); await p.screenshot({ path: path.join(CAP, `visor-${ancho}${oscuro ? "-oscuro" : ""}.png`) }); }
    const hash = await p.evaluate(() => location.hash);
    await p.goBack(); await p.waitForTimeout(300);
    ok(await p.locator(".gan-visor").count() === 0 && await p.evaluate(() => location.hash) === hash, `${tag}: Atrás cierra el visor y se queda en Mis incentivos`);
    await p.click("[data-hoja-ver='1']"); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    ok(await p.locator(".gan-visor").count() === 0, `${tag}: Esc cierra`);
    await p.click("[data-hoja-ver='0']"); await p.click(".gan-visor [data-v='cerrar']"); await p.waitForTimeout(300);
    ok(await p.locator(".gan-visor").count() === 0 && await p.evaluate(() => location.hash) === hash, `${tag}: «Cerrar» cierra`);
    // (c) el PDF en pantalla
    await p.click("#gan-hoja-verpdf"); await p.waitForSelector(".gan-visor.pdf");
    ok(await p.locator(".gan-visor .gan-a4").count() === 2 && await p.locator(".gan-visor .gan-a4.apaisada").count() === 1, `${tag}: «Ver la hoja en PDF» enseña las 2 hojas A4 (una apaisada)`);
    const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 8000 }).catch(() => null), p.click(".gan-visor [data-v='descargar']")]);
    ok(dl && /hoja-de-trabajo-semana-\d+-\d+\.pdf/.test(dl.suggestedFilename()), `${tag}: desde ahí se descarga el PDF`);
    if (CAP) await p.screenshot({ path: path.join(CAP, `pdf-${ancho}${oscuro ? "-oscuro" : ""}.png`) });
    await p.click(".gan-visor [data-v='cerrar']"); await p.waitForTimeout(300);
    ok(await p.locator(".gan-visor").count() === 0 && !(await p.evaluate(() => document.body.classList.contains("gan-visor-abierto"))), `${tag}: se cierra y la página vuelve a moverse`);
    // Lo guardado sigue igual: las 2 fotos en IndexedDB
    ok(await p.locator("[data-hoja-ver]").count() === 2, `${tag}: las fotos guardadas siguen ahí`);
    const anchoDoc = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(anchoDoc <= ancho, `${tag}: sin scroll lateral (${anchoDoc})`);
    ok(!errores.length, `${tag}: sin errores de consola ${errores.join(" | ")}`);
    await ctx.close();
  }
  await b.close();
  console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
  process.exit(mal ? 1 : 0);
})();
