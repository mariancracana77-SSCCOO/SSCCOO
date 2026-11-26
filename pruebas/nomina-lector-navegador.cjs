// v221: «Leer nóminas en PDF» en el navegador, con dos nóminas INVENTADAS hechas aquí mismo en PDF (ningún dato real).
// Comprueba: Comparadora (lee 2 PDF, «He leído esto», no compara sin marcarlo, rellena A y B, por defecto no guarda nada,
// con la casilla guarda solo mes e importes, otra ventana se entera, «Borrar todo»), una foto da aviso, y «Coger la
// base de una nómina» en Mi jubilación y Mi baja médica. Ninguna petición que no sea GET.
// Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/nomina-lector-navegador.cjs [carpeta-capturas]
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os");
const BASE = process.env.BASE || "http://localhost:8765/";
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
const CAP = process.argv[2];
const nomina = (periodo, filas, totD, totQ, base, liq) => `<html><body style="font:13px Arial;margin:36px">
<h3>TRANSPORTES EJEMPLO, S.L.</h3>
<p>Trabajador: PEREZ GARCIA, JUAN &nbsp;&nbsp; NIF: 12345678Z &nbsp;&nbsp; IBAN ES91 2100 0418 4502 0005 1332</p>
<p>PERIODO ${periodo}</p>
<table style="width:100%" cellpadding="3"><tr><th style="text-align:left">CONCEPTO</th><th style="text-align:right">DEVENGOS</th><th style="text-align:right">DEDUCCIONES</th></tr>
${filas.map(([c, d, q]) => `<tr><td>${c}</td><td style="text-align:right">${d || ""}</td><td style="text-align:right">${q || ""}</td></tr>`).join("")}
</table>
<p>TOTAL DEVENGADO ${totD} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; TOTAL A DEDUCIR ${totQ}</p>
<p>BASE CONT. COMUNES ${base} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BASE A.T. Y E.P. ${base}</p>
<p>LIQUIDO A PERCIBIR ${liq}</p></body></html>`;
const N1 = nomina("01/09/2026 a 30/09/2026", [["SALARIO BASE", "1.200,00"], ["PLUS CONVENIO", "150,00"], ["ANTIGUEDAD", "60,00"], ["PRORRATA PAGAS EXTRA", "250,00"], ["CONTINGENCIAS COMUNES", "", "78,02"], ["DESEMPLEO", "", "25,73"], ["FORMACION PROFESIONAL", "", "1,66"], ["TRIBUTACION I.R.P.F.", "", "199,20"]], "1.660,00", "304,61", "1.660,00", "1.355,39");
const N2 = nomina("01/10/2026 a 31/10/2026", [["SALARIO BASE", "1.200,00"], ["PLUS CONVENIO", "150,00"], ["ANTIGUEDAD", "60,00"], ["HORAS EXTRA", "90,00"], ["PRORRATA PAGAS EXTRA", "250,00"], ["CONTINGENCIAS COMUNES", "", "82,25"], ["DESEMPLEO", "", "27,12"], ["FORMACION PROFESIONAL", "", "1,75"], ["TRIBUTACION I.R.P.F.", "", "210,00"]], "1.750,00", "321,12", "1.750,00", "1.428,88");
(async () => {
  const b = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nlector-"));
  const hazPdf = async (html, nom) => { const q = await b.newPage(); await q.setContent(html); const f = path.join(tmp, nom); await q.pdf({ path: f, format: "A4" }); await q.close(); return f; };
  const P1 = await hazPdf(N1, "nomina-sept.pdf"), P2 = await hazPdf(N2, "nomina-oct.pdf");
  const FOTO = path.join(tmp, "foto.png"); { const q = await b.newPage(); await q.setContent(N1); await q.screenshot({ path: FOTO }); await q.close(); }

  // Los otros formatos (v221: «todo tipo de archivos»), con la misma nómina inventada de octubre
  const JSZip = require(path.join(__dirname, "..", "lib", "jszip.min.js"));
  const FILAS = [["CONCEPTO", "DEVENGOS", "DEDUCCIONES"], ["SALARIO BASE", "1.200,00", ""], ["PLUS CONVENIO", "150,00", ""], ["ANTIGUEDAD", "60,00", ""], ["HORAS EXTRA", "90,00", ""], ["PRORRATA PAGAS EXTRA", "250,00", ""], ["CONTINGENCIAS COMUNES", "", "82,25"], ["DESEMPLEO", "", "27,12"], ["FORMACION PROFESIONAL", "", "1,75"], ["TRIBUTACION I.R.P.F.", "", "210,00"]];
  const PIE = [["TOTAL DEVENGADO", "1.750,00"], ["TOTAL A DEDUCIR", "321,12"], ["BASE CONT. COMUNES", "1.750,00"], ["LIQUIDO A PERCIBIR", "1.428,88"]];
  const x = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const FORMATOS = {};
  { // Word: párrafos con tabulador y una tabla
    const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
    const par = (a, b) => `<w:p><w:r><w:t>${x(a)}</w:t></w:r>${b ? `<w:r><w:tab/><w:t>${x(b)}</w:t></w:r>` : ""}</w:p>`;
    const tabla = `<w:tbl>${FILAS.map(f => `<w:tr>${f.map(c => `<w:tc><w:p><w:r><w:t>${x(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>`;
    const z = new JSZip(); z.file("[Content_Types].xml", "<Types/>");
    z.file("word/document.xml", `<?xml version="1.0"?><w:document ${W}><w:body>${par("Trabajador: PEREZ GARCIA, JUAN")}${par("PERIODO 01/10/2026 a 31/10/2026")}${tabla}${PIE.map(([a, b]) => par(a, b)).join("")}</w:body></w:document>`);
    FORMATOS["nomina.docx"] = await z.generateAsync({ type: "nodebuffer" });
  }
  { // Excel: textos compartidos y números de verdad
    const todas = [["PERIODO 01/10/2026 a 31/10/2026"], ...FILAS, ...PIE.map(([a, b]) => [a, b])];
    const textos = []; const idx = (t) => { let i = textos.indexOf(t); if (i < 0) { i = textos.length; textos.push(t); } return i; };
    const filasX = todas.map((f, r) => `<row r="${r + 1}">${f.map((c, i) => { const ref = "ABC"[i] + (r + 1); if (!c) return ""; return /^[\d.]+,\d\d$/.test(c) ? `<c r="${ref}"><v>${c.replace(/\./g, "").replace(",", ".")}</v></c>` : `<c r="${ref}" t="s"><v>${idx(c)}</v></c>`; }).join("")}</row>`).join("");
    const z = new JSZip();
    z.file("xl/sharedStrings.xml", `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${textos.map(t => `<si><t>${x(t)}</t></si>`).join("")}</sst>`);
    z.file("xl/worksheets/sheet1.xml", `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${filasX}</sheetData></worksheet>`);
    FORMATOS["nomina.xlsx"] = await z.generateAsync({ type: "nodebuffer" });
  }
  { // OpenOffice texto: una tabla
    const N = 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"';
    const filasO = [...FILAS, ...PIE.map(([a, b]) => [a, b, ""])].map(f => `<table:table-row>${f.map(c => `<table:table-cell><text:p>${x(c)}</text:p></table:table-cell>`).join("")}</table:table-row>`).join("");
    const z = new JSZip(); z.file("mimetype", "application/vnd.oasis.opendocument.text");
    z.file("content.xml", `<?xml version="1.0"?><office:document-content ${N}><office:body><office:text><text:p>PERIODO 01/10/2026 a 31/10/2026</text:p><table:table>${filasO}</table:table></office:text></office:body></office:document-content>`);
    FORMATOS["nomina.odt"] = await z.generateAsync({ type: "nodebuffer" });
  }
  FORMATOS["nomina.html"] = Buffer.from(`<html><body><p>PERIODO 01/10/2026 a 31/10/2026</p><table><tr>${FILAS[0].map(c => `<th>${c}</th>`).join("")}</tr>${FILAS.slice(1).map(f => `<tr>${f.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>${PIE.map(([a, b]) => `<p>${a}  ${b}</p>`).join("")}<script>alert(1)</script></body></html>`);
  FORMATOS["nomina.csv"] = Buffer.from(["PERIODO 01/10/2026 a 31/10/2026", ...FILAS.map(f => f.join(";")), ...PIE.map(f => f.join(";"))].join("\r\n"));
  FORMATOS["vieja.doc"] = Buffer.from("no es de verdad");
  FORMATOS["cosa.zip"] = Buffer.from("PK no es de verdad");
  const RUTAS = {}; for (const [n, d] of Object.entries(FORMATOS)) { RUTAS[n] = path.join(tmp, n); fs.writeFileSync(RUTAS[n], d); }
  let mal = 0; const ok = (c, t) => { if (c) console.log("OK  " + t); else { mal++; console.log("MAL " + t); } };
  for (const [ancho, oscuro] of [[360, false], [412, true], [1280, false]]) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: 900 }, colorScheme: oscuro ? "dark" : "light", hasTouch: ancho < 500 });
    await ctx.addInitScript(() => { try { localStorage.setItem("ccoo-aviso-privacidad", "1"); localStorage.setItem("ccoo-bienvenida", String(Date.now())); } catch (e) {} });
    await ctx.route("**/lib/supabase.js*", r => r.fulfill({ contentType: "application/javascript", body: MOCK }));
    const p = await ctx.newPage(), errores = [], pedidas = [];
    p.on("pageerror", e => errores.push(String(e))); p.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
    p.on("request", r => { if (r.method() !== "GET") pedidas.push(r.method() + " " + r.url()); });
    const tag = `${ancho}${oscuro ? " oscuro" : ""}`;
    await p.goto(BASE + "#nomina"); await p.waitForTimeout(1500);
    await p.setInputFiles("#nom-pdf", [P2, P1]);
    await p.waitForSelector(".nl-tarjeta", { timeout: 15000 });
    ok(await p.locator(".nl-tarjeta").count() === 2, `${tag}: dos nóminas leídas`);
    const v = await p.evaluate(() => [...document.querySelectorAll("[data-rev='1']")].reduce((o, i) => (o[i.dataset.k] = i.value, o), {}));
    ok(v.base === "1200,00" && v.cc === "78,02" && v.basecc === "1660,00" && v.liquido === "1355,39", `${tag}: importes leídos ${JSON.stringify(v)}`);
    ok(await p.locator(".nl-tarjeta .zc-ok").count() === 2, `${tag}: las sumas cuadran en las dos`);
    const txt = await p.textContent("#nom-rev");
    ok(!/PEREZ|12345678Z|ES91/.test(txt), `${tag}: no enseña nombre, DNI ni IBAN`);
    ok(/Septiembre 2026/.test(txt) && /Octubre 2026/.test(txt), `${tag}: mes de cada nómina`);
    if (CAP) { await p.evaluate(() => document.querySelector(".nl-tarjeta").scrollIntoView()); await p.evaluate(() => scrollBy(0, -230)); await p.waitForTimeout(300); await p.screenshot({ path: path.join(CAP, `lector-revisa-${ancho}${oscuro ? "-oscuro" : ""}.png`) }); }
    // sin marcar, no compara
    await p.click("#nom-usar");
    ok(/marca/.test(await p.textContent("#nom-usar-msg")), `${tag}: sin «He leído esto» no compara`);
    // cambiar un importe a mano: avisa de que no cuadra y quita la marca
    await p.check("[data-rev-ok='0']"); await p.check("[data-rev-ok='1']");
    await p.fill("[data-rev='0'][data-k='irpf']", "100");
    ok(await p.locator("[data-avisos='0'] .zc-aviso").count() === 1 && !(await p.isChecked("[data-rev-ok='0']")), `${tag}: al cambiar un importe vuelve a mirar las sumas y quita la marca`);
    await p.fill("[data-rev='0'][data-k='irpf']", "210,00"); await p.check("[data-rev-ok='0']");
    await p.click("#nom-usar"); await p.waitForTimeout(300);
    const ab = await p.evaluate(() => [document.getElementById("nom-a-base").value, document.getElementById("nom-b-hx").value, document.getElementById("nom-n1").value, document.getElementById("nom-n2").value]);
    ok(ab[0] === "1200,00" && ab[1] === "90,00" && ab[2] === "Septiembre 2026" && ab[3] === "Octubre 2026", `${tag}: rellena la 1.ª (septiembre) y la 2.ª (octubre) ${JSON.stringify(ab)}`);
    ok(/Líquido a percibir/.test(await p.textContent("#nom-out")), `${tag}: compara`);
    if (CAP) { await p.evaluate(() => document.getElementById("nom-out").scrollIntoView()); await p.screenshot({ path: path.join(CAP, `lector-compara-${ancho}${oscuro ? "-oscuro" : ""}.png`) }); }
    ok(await p.evaluate(() => localStorage.getItem("ccoo-nominas")) === null, `${tag}: sin la casilla no guarda nada`);
    // ahora guardando
    await p.setInputFiles("#nom-pdf", [P1, P2]); await p.waitForSelector(".nl-tarjeta");
    await p.check("[data-rev-ok='0']"); await p.check("[data-rev-ok='1']"); await p.check("#nom-guardar"); await p.click("#nom-usar"); await p.waitForTimeout(300);
    const g = await p.evaluate(() => localStorage.getItem("ccoo-nominas"));
    ok(g && JSON.parse(g).lista.length === 2 && !/PEREZ|12345678Z|ES91|nomina-/.test(g), `${tag}: guarda solo mes e importes (${g && g.length} letras)`);
    // otra ventana se entera
    const p2 = await ctx.newPage(); await p2.goto(BASE + "#nomina"); await p2.waitForTimeout(500);
    ok(/\(2\)/.test(await p2.textContent("#nom-guardadas")), `${tag}: otra ventana ve las guardadas`);
    await p2.evaluate(() => { document.querySelector(".nl-guardadas").open = true; });
    await p2.click("#nom-g-borrar"); await p2.click("#nom-g-si"); await p.waitForTimeout(400);
    ok(await p.evaluate(() => localStorage.getItem("ccoo-nominas") === null && localStorage.getItem("ccoo-nominas-copia") === null), `${tag}: «Borrar todo» lo borra`);
    ok((await p.textContent("#nom-guardadas")).trim() === "", `${tag}: la primera ventana se entera del borrado`);
    await p2.close();
    // v223 (aviso del padre: «pones una y ya no puedes hacer nada»): de una en una, A y luego B, y archivos sin extensión
    await p.click("#nom-bt"); await p.click("#nom-bt-si");
    await p.setInputFiles("#nom-pdf", P1); await p.waitForSelector("#nom-usar-b");
    ok(await p.isVisible("#nom-usar") && await p.isVisible("#nom-usar-b"), `${tag}: con una nómina deja elegir 1.ª o 2.ª`);
    await p.check("[data-rev-ok='0']"); await p.click("#nom-usar"); await p.waitForTimeout(300);
    ok(await p.inputValue("#nom-a-base") === "1200,00" && await p.inputValue("#nom-b-base") === "", `${tag}: la primera va a la 1.ª`);
    await p.setInputFiles("#nom-pdf", { name: "nomina", mimeType: "application/octet-stream", buffer: fs.readFileSync(P2) }); await p.waitForSelector("#nom-usar-b");
    ok(await p.getAttribute("#nom-usar-b", "class") === "btn", `${tag}: si la 1.ª ya está, resalta «Poner como 2.ª»`);
    if (CAP) { await p.evaluate(() => document.querySelector(".nl-usar").scrollIntoView({ block: "center" })); await p.waitForTimeout(300); await p.screenshot({ path: path.join(CAP, `una-a-una-${ancho}${oscuro ? "-oscuro" : ""}.png`) }); }
    ok(/Octubre 2026/.test(await p.textContent("#nom-rev")), `${tag}: lee un PDF sin extensión (como lo da Android)`);
    await p.check("[data-rev-ok='0']"); await p.click("#nom-usar-b"); await p.waitForTimeout(300);
    ok(await p.inputValue("#nom-a-base") === "1200,00" && await p.inputValue("#nom-b-hx") === "90,00" && /Líquido a percibir/.test(await p.textContent("#nom-out")), `${tag}: de una en una compara las dos`);
    // se van sumando: una y luego otra, salen las dos listas
    await p.setInputFiles("#nom-pdf", P1); await p.waitForSelector("#nom-usar-b");
    await p.setInputFiles("#nom-pdf", P2); await p.waitForSelector("#nom-ua");
    ok(await p.locator(".nl-tarjeta").count() === 2, `${tag}: la segunda se suma a la primera`);
    await p.click("#nom-rev-quitar");
    if (ancho === 360) {
      await p.setInputFiles("#nom-pdf", { name: "documento", mimeType: "", buffer: fs.readFileSync(RUTAS["nomina.docx"]) }); await p.waitForSelector(".nl-tarjeta", { timeout: 15000 });
      ok(await p.locator("#nom-usar-b").count() === 1, `${tag}: lee un Word sin extensión`);
      await p.click("#nom-rev-quitar");
    }
    // un archivo que no se puede leer: se puede quitar y seguir
    await p.setInputFiles("#nom-pdf", { name: "cosa", mimeType: "application/octet-stream", buffer: Buffer.from("hola que tal esto no es nada") }); await p.waitForSelector(".nl-tarjeta");
    ok(await p.isVisible("#nom-rev-quitar"), `${tag}: con un archivo que no se lee sale «Quitar lo leído»`);
    await p.click("#nom-rev-quitar"); await p.fill("#nom-a-plus", "10");
    ok(await p.locator(".nl-tarjeta").count() === 0 && await p.inputValue("#nom-a-plus") === "10", `${tag}: y se puede seguir escribiendo`);
    // una foto
    await p.setInputFiles("#nom-pdf", FOTO); await p.waitForSelector(".nl-tarjeta");
    ok(/Es una foto/.test(await p.textContent("#nom-rev")), `${tag}: una foto da aviso`);
    // v222: «Borrar todo» de arriba deja la herramienta como recién abierta (y otra ventana se entera)
    await p.setInputFiles("#nom-pdf", [P1, P2]); await p.waitForSelector("[data-rev-ok='1']");
    await p.check("[data-rev-ok='0']"); await p.check("[data-rev-ok='1']"); await p.check("#nom-guardar"); await p.click("#nom-usar"); await p.waitForTimeout(300);
    await p.setInputFiles("#nom-pdf", [P1, P2]); await p.waitForSelector(".nl-tarjeta");
    await p.click("[data-nom-tab='convenio']"); await p.fill("#nc-base", "1000"); await p.check("#nc-pro"); await p.fill("#nc-prorrata", "50");
    await p.click("[data-nom-tab='conceptos']"); await p.fill("#nom-q", "irpf");
    const p3 = await ctx.newPage(); await p3.goto(BASE + "#nomina"); await p3.waitForTimeout(500);
    ok(/\(2\)/.test(await p3.textContent("#nom-guardadas")), `${tag}: hay guardadas antes de borrar`);
    ok(await p.isVisible("#nom-bt"), `${tag}: el botón «Borrar todo» se ve arriba`);
    await p.click("#nom-bt");
    ok(await p.isVisible("#nom-bt-confirma") && /No se puede deshacer/.test(await p.textContent("#nom-bt-confirma")), `${tag}: pide confirmación en la página`);
    await p.click("#nom-bt-no");
    ok(await p.evaluate(() => localStorage.getItem("ccoo-nominas") !== null) && await p.locator(".nl-tarjeta").count() > 0, `${tag}: «No» no borra nada`);
    if (CAP) { await p.click("#nom-bt"); await p.evaluate(() => document.getElementById("v-nomina").scrollIntoView()); await p.waitForTimeout(300); await p.screenshot({ path: path.join(CAP, `borrar-confirma-${ancho}${oscuro ? "-oscuro" : ""}.png`) }); await p.click("#nom-bt-no"); }
    await p.click("#nom-bt"); await p.click("#nom-bt-si"); await p.waitForTimeout(400);
    const limpio = await p.evaluate(() => {
      const $ = (i) => document.getElementById(i);
      return { ls: localStorage.getItem("ccoo-nominas") === null && localStorage.getItem("ccoo-nominas-copia") === null,
        rev: $("nom-rev").textContent.trim() === "", guar: $("nom-guardadas").textContent.trim() === "",
        casillas: [...document.querySelectorAll("#nom-filas input, #nom-n1, #nom-n2, #nc-base, #nc-prorrata, #nom-q")].every(i => i.value === ""),
        pro: !$("nc-pro").checked && $("nc-pro-caja").hidden, ant: $("nc-ant").value === "0",
        out: !/Líquido a percibir/.test($("nom-out").textContent), tab: !$("nom-dos").hidden,
        msg: !$("nom-bt-msg").hidden && /Todo borrado/.test($("nom-bt-msg").textContent) };
    });
    ok(Object.values(limpio).every(Boolean), `${tag}: «Borrar todo» lo deja limpio ${JSON.stringify(limpio)}`);
    await p3.waitForTimeout(300);
    ok((await p3.textContent("#nom-guardadas")).trim() === "", `${tag}: la otra ventana se entera del «Borrar todo»`);
    if (CAP) { await p.evaluate(() => document.getElementById("v-nomina").scrollIntoView()); await p.waitForTimeout(300); await p.screenshot({ path: path.join(CAP, `borrar-hecho-${ancho}${oscuro ? "-oscuro" : ""}.png`) }); }
    await p3.close();
    // sin nada guardado también sale y borra lo de la pantalla
    await p.fill("#nom-a-base", "500"); await p.click("#nom-bt"); await p.click("#nom-bt-si");
    ok(await p.inputValue("#nom-a-base") === "", `${tag}: sin nada guardado también borra lo escrito`);

    if (ancho === 360) for (const n of ["nomina.docx", "nomina.xlsx", "nomina.odt", "nomina.html", "nomina.csv"]) {
      await p.evaluate(() => document.getElementById("nom-rev-quitar")?.click());
      await p.setInputFiles("#nom-pdf", RUTAS[n]); await p.waitForSelector("[data-rev='0'], #nom-rev .zc-aviso", { timeout: 15000 }); await p.waitForTimeout(200);
      const vv = await p.evaluate(() => [...document.querySelectorAll("[data-rev='0']")].reduce((o, i) => (o[i.dataset.k] = i.value, o), {}));
      const cuadra = await p.locator("#nom-rev .nl-tarjeta .zc-ok").count() === 1;
      ok(vv.base === "1200,00" && vv.hx === "90,00" && vv.irpf === "210,00" && vv.liquido === "1428,88" && vv.basecc === "1750,00" && cuadra && /Octubre 2026/.test(await p.textContent("#nom-rev")), `${tag}: lee ${n} ${cuadra ? "(cuadra)" : "(NO cuadra)"} ${JSON.stringify(vv)}`);
    }
    if (ancho === 360) {
      await p.evaluate(() => document.getElementById("nom-rev-quitar")?.click());
      await p.setInputFiles("#nom-pdf", RUTAS["vieja.doc"]); await p.waitForSelector(".nl-tarjeta");
      ok(/antiguo/.test(await p.textContent("#nom-rev")), `${tag}: un .doc viejo da aviso`);
      await p.evaluate(() => document.getElementById("nom-rev-quitar")?.click());
      await p.setInputFiles("#nom-pdf", RUTAS["cosa.zip"]); await p.waitForSelector(".nl-tarjeta");
      ok(/no lo sé leer/.test(await p.textContent("#nom-rev")), `${tag}: un tipo raro da aviso`);
    }
    // Mi jubilación y Mi baja médica
    await p.goto(BASE + "#jubilacion"); await p.waitForTimeout(500);
    await p.setInputFiles("#v-jubilacion .nl-coger input[type=file]", P2); await p.waitForSelector("#v-jubilacion [data-nl=si]", { timeout: 15000 });
    if (CAP && ancho === 360) { await p.evaluate(() => document.querySelector("#v-jubilacion .nl-coger").scrollIntoView({ block: "center" })); await p.waitForTimeout(200); } if (CAP && ancho === 360) await p.screenshot({ path: path.join(CAP, `lector-jubilacion-${ancho}.png`) });
    await p.click("#v-jubilacion [data-nl=si]");
    ok(await p.inputValue("#ju-base") === "1750,00", `${tag}: jubilación coge la base 1750,00`);
    await p.goto(BASE + "#baja"); await p.waitForTimeout(500);
    await p.selectOption("#ba-tipo", "at");
    await p.setInputFiles("#v-baja .nl-coger input[type=file]", P1); await p.waitForSelector("#v-baja [data-nl=si]", { timeout: 15000 });
    ok(/accidentes de trabajo/.test(await p.textContent("#v-baja .nl-coger-out")), `${tag}: baja por accidente coge la base de AT`);
    await p.click("#v-baja [data-nl=si]");
    ok(await p.inputValue("#ba-base") === "1660,00", `${tag}: baja coge la base 1660,00`);
    const scroll = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    ok(!scroll, `${tag}: sin scroll lateral`);
    ok(!errores.length, `${tag}: sin errores ${errores.join(" | ")}`);
    ok(!pedidas.length, `${tag}: no se envía nada ${pedidas.join(" | ")}`);
    await ctx.close();
  }
  await b.close();
  console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
  process.exit(mal ? 1 : 0);
})();
