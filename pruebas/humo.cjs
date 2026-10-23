// Prueba rápida de la web y el panel con datos de prueba (sin conectarse a Supabase).
// Uso, desde la carpeta del proyecto:
//   python3 -m http.server 8765 &        (servidor local)
//   NODE_PATH=$(npm root -g) node pruebas/humo.cjs
// Recorre todas las pestañas en móvil (320 y 412 px) y PC, en claro y oscuro y con letra «muy grande»,
// y falla si hay errores en la consola o de la política de seguridad (CSP), o si la página se sale de lado.
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:8765/";
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
const VISTAS = ["inicio", "avisos", "calendario", "convenio", "actas", "documentos", "preguntas", "info", "calcula", "descansos", "buscar", "ap-comite", "ap-zona-conductores"];
const CASOS = [
  { nombre: "móvil 320 claro", w: 320, h: 640, tema: "light" },
  { nombre: "móvil 412 oscuro", w: 412, h: 860, tema: "dark" },
  { nombre: "móvil 360 letra muy grande", w: 360, h: 740, tema: "light", letra: "muy-grande" },
  { nombre: "PC oscuro", w: 1366, h: 800, tema: "dark" },
];

(async () => {
  const nav = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const fallos = [];
  for (const c of CASOS) {
    const ctx = await nav.newContext({ viewport: { width: c.w, height: c.h }, colorScheme: c.tema, hasTouch: c.w < 800, serviceWorkers: "block" });
    await ctx.addInitScript(([letra]) => {
      localStorage.setItem("ccoo-aviso-privacidad", "1");
      if (letra) localStorage.setItem("ccoo-lectura", JSON.stringify({ letra }));
    }, [c.letra || ""]);
    await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
    const p = await ctx.newPage(), errores = [];
    p.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
    p.on("pageerror", e => errores.push(e.message));
    await p.goto(BASE + "index.html", { waitUntil: "load" });
    await p.waitForTimeout(800);
    await p.locator("#bienvenida").click({ timeout: 2000 }).catch(() => {});
    await p.waitForTimeout(1500);
    for (const v of VISTAS) {
      await p.evaluate(h => { location.hash = h; }, v);
      await p.waitForTimeout(250);
      const ancho = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ancho > 1) fallos.push(`${c.nombre} · #${v}: la página se sale ${ancho} px de lado`);
    }
    // Ventana: entra el foco y se cierra con Escape
    await p.evaluate(() => modal("Prueba", "<p>Hola</p>"));
    await p.waitForTimeout(100);
    const foco = await p.evaluate(() => !!document.activeElement.closest(".modal"));
    await p.keyboard.press("Escape");
    const sigue = await p.locator(".modal-velo").count();
    if (!foco) fallos.push(`${c.nombre}: la ventana no recibe el foco`);
    if (sigue) fallos.push(`${c.nombre}: Escape no cierra la ventana`);
    // Volver a la web al momento no debe recargarlo todo
    const antes = await p.evaluate(() => __LLAMADAS.length);
    await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await p.waitForTimeout(300);
    if (await p.evaluate(() => __LLAMADAS.length) !== antes) fallos.push(`${c.nombre}: recarga al volver aunque se cargó hace nada`);
    // Panel: pantalla de entrar
    const pa = await ctx.newPage();
    pa.on("console", m => { if (m.type() === "error") errores.push("panel: " + m.text()); });
    pa.on("pageerror", e => errores.push("panel: " + e.message));
    await pa.goto(BASE + "admin.html", { waitUntil: "load" });
    await pa.waitForTimeout(800);
    errores.filter(e => !/favicon|ERR_|Failed to load resource/.test(e)).forEach(e => fallos.push(`${c.nombre}: ${e}`));
    await ctx.close();
    console.log("Hecho:", c.nombre);
  }
  await nav.close();
  if (fallos.length) { console.error("\nFALLOS:\n- " + fallos.join("\n- ")); process.exit(1); }
  console.log("\nTodo bien.");
})();
