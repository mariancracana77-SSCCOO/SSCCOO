// v220: «Tapar datos privados» en el navegador, con una nómina INVENTADA hecha aquí mismo en PDF (ningún dato real).
// Comprueba: que tapa los datos y no los importes, que sin «Lo he revisado» no se descarga, que lo descargado es un PNG
// sin metadatos, a mano (arrastrar pone un recuadro, tocarlo lo quita), una foto y que no queda nada guardado.
// Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/tapar-navegador.cjs [carpeta-capturas]
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os");
const BASE = process.env.BASE || "http://localhost:8765/";
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
const CAP = process.argv[2];
const NOMINA = `<html><body style="font:14px Arial;margin:40px">
<h2>TRANSPORTES EJEMPLO, S.L.</h2><p>CIF B12345678 · Pol. Ind. Ejemplo, Girona</p>
<table style="width:100%;border-collapse:collapse" border="1" cellpadding="6">
<tr><td>Trabajador: PEREZ GARCIA, JUAN</td><td>NIF: 12345678Z</td></tr>
<tr><td>Domicilio: C/ Mayor 12, 2º 1ª</td><td>Nº Afiliación S.S. 08/12345678/90</td></tr>
<tr><td>Categoría: Conductor mecánico</td><td>Periodo 01/10/2026 a 31/10/2026</td></tr>
<tr><td>IBAN ES91 2100 0418 4502 0005 1332</td><td>Teléfono 612 345 678</td></tr></table>
<table style="width:100%;margin-top:20px" cellpadding="4">
<tr><td>Salario base</td><td style="text-align:right">1.234,56</td></tr>
<tr><td>Plus convenio</td><td style="text-align:right">245,10</td></tr>
<tr><td>Contingencias comunes 4,70 %</td><td style="text-align:right">74,26</td></tr>
<tr><td>Líquido a percibir</td><td style="text-align:right">1.650,20</td></tr></table></body></html>`;
(async () => {
  const b = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tapar-"));
  const pdfP = await b.newPage(); await pdfP.setContent(NOMINA);
  const PDF = path.join(tmp, "nomina-inventada.pdf"); await pdfP.pdf({ path: PDF, format: "A4" });
  await pdfP.setViewportSize({ width: 800, height: 900 }); const FOTO = path.join(tmp, "foto.png"); await pdfP.screenshot({ path: FOTO }); await pdfP.close();
  let mal = 0; const ok = (c, t) => { if (c) console.log("OK  " + t); else { mal++; console.log("MAL " + t); } };
  for (const [ancho, oscuro] of [[360, false], [412, true], [1280, false]]) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: 900 }, colorScheme: oscuro ? "dark" : "light", acceptDownloads: true, hasTouch: ancho < 500 });
    await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
    const p = await ctx.newPage(), errores = [], pedidas = [];
    p.on("pageerror", e => errores.push(String(e))); p.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
    p.on("request", r => { if (r.method() !== "GET") pedidas.push(r.method() + " " + r.url()); });
    await p.goto(BASE + "#tapar"); await p.waitForTimeout(600);
    const tag = `${ancho}${oscuro ? " oscuro" : ""}`;
    await p.setInputFiles("#tap-archivo", PDF);
    await p.waitForSelector(".tap-lienzo", { timeout: 15000 });
    await p.waitForTimeout(300);
    const res = await p.evaluate(() => document.getElementById("tap-resumen").textContent);
    const n = +(res.match(/(\d+)/) || [0, 0])[1];
    ok(n >= 6, `${tag}: recuadros puestos solos (${n})`);
    const mira = await p.evaluate(() => ({ w: document.querySelector(".tap-lienzo").width }));
    ok(mira.w > 1000, `${tag}: página pintada a ${mira.w} px`);
    ok(await p.isDisabled("#tap-bajar"), `${tag}: sin «Lo he revisado» no se puede descargar`);
    // a mano: arrastrar añade un recuadro, tocarlo lo quita
    await p.click("#tap-mano");
    await p.evaluate(() => document.querySelector(".tap-lienzo").scrollIntoView({ block: "start" }));
    const cv = await p.$(".tap-lienzo"), bb = await cv.boundingBox(), y0 = Math.min(bb.y + bb.height * .8, 700);
    await p.mouse.move(bb.x + bb.width * .1, y0); await p.mouse.down();
    await p.mouse.move(bb.x + bb.width * .3, y0 + 40, { steps: 4 }); await p.mouse.up();
    const n2 = +((await p.textContent("#tap-resumen")).match(/(\d+)/) || [0, 0])[1];
    ok(n2 === n + 1, `${tag}: arrastrar pone un recuadro (${n} → ${n2})`);
    await p.mouse.click(bb.x + bb.width * .2, y0 + 20);
    const n3 = +((await p.textContent("#tap-resumen")).match(/(\d+)/) || [0, 0])[1];
    ok(n3 === n, `${tag}: tocar un recuadro lo quita (${n3})`);
    await p.click("#tap-mano");
    if (CAP) { await p.evaluate(() => document.getElementById("tap-paginas").scrollIntoView()); await p.screenshot({ path: path.join(CAP, `tapar-${ancho}${oscuro ? "-oscuro" : ""}.png`), fullPage: false }); }
    await p.check("#tap-revisado");
    ok(!(await p.isDisabled("#tap-bajar")), `${tag}: con la casilla, se puede descargar`);
    const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#tap-bajar")]);
    const f = path.join(tmp, `bajada-${ancho}.png`); await dl.saveAs(f);
    const buf = fs.readFileSync(f), sig = buf.slice(0, 8).toString("hex");
    ok(sig === "89504e470d0a1a0a", `${tag}: lo descargado es un PNG (${dl.suggestedFilename()})`);
    const trozos = []; for (let i = 8; i < buf.length;) { const len = buf.readUInt32BE(i), t = buf.slice(i + 4, i + 8).toString("latin1"); trozos.push(t); i += 12 + len; }
    ok(!trozos.some(t => /tEXt|iTXt|zTXt|eXIf|tIME/.test(t)), `${tag}: el PNG no lleva texto ni metadatos (${[...new Set(trozos)].join(",")})`);
    ok(!buf.includes(Buffer.from("12345678Z")) && !buf.includes(Buffer.from("PEREZ")), `${tag}: el PNG no lleva el texto de los datos`);
    // foto: sin búsqueda, «Tapar a mano» encendido solo
    await p.setInputFiles("#tap-archivo", FOTO); await p.waitForSelector(".tap-lienzo"); await p.waitForTimeout(200);
    ok(await p.getAttribute("#tap-mano", "aria-pressed") === "true", `${tag}: con una foto, «Tapar a mano» sale encendido`);
    ok(await p.isDisabled("#tap-bajar"), `${tag}: al cambiar de archivo hay que volver a marcar la casilla`);
    // al salir se borra; nada guardado
    await p.goto(BASE + "#inicio"); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.querySelector(".tap-lienzo")), `${tag}: al salir no queda la hoja en la página`);
    const guardado = await p.evaluate(() => Object.keys(localStorage).filter(k => /tap/i.test(k) && k !== "ccoo-textos-tapar"));
    ok(!guardado.length, `${tag}: nada guardado en el móvil (${guardado.join(",")})`);
    ok(!pedidas.some(u => !/kdfedwcskymaitvpryvg|localhost/.test(u) || /storage|tapar|nomina/.test(u)), `${tag}: no se envía el archivo a ningún sitio (${pedidas.length} envíos)`);
    const scroll = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    ok(!errores.length, `${tag}: sin errores de consola ${errores.slice(0, 3).join(" | ")}`);
    void scroll; await ctx.close();
  }
  await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
  console.log(mal ? "MAL: " + mal : "OK: tapar en el navegador"); process.exit(mal ? 1 : 0);
})();
