// Lector de nóminas en PDF (v221, paso 2 del plan de la nómina; lo pidió el padre y lo aprobó Lorena el 26/11/2026).
// Lo usan la «Comparadora de nóminas» (nomina.js) y el botón «Coger la base de una nómina» de «Mi jubilación» y
// «Mi baja médica». TODO EN EL MÓVIL: el PDF se lee en la memoria del navegador con pdf.js (lib/pdfjs, el mismo de
// «Tapar datos privados»), solo se sacan los importes y el mes, no se envía a ningún sitio y no pasa por la IA.
// Solo PDF con texto (el que da la empresa o la app de nóminas). Fotos y escaneados no: no hay lector de fotos (OCR).
// Cómo lee: junta el texto en líneas por su altura en la hoja, reconoce el concepto por la etiqueta (sin acentos ni
// mayúsculas, varias formas de cada una) y coge el importe de la derecha. Si la nómina tiene las columnas «DEVENGOS» y
// «DEDUCCIONES», usa su sitio para saber si un importe se cobra o se quita. Las bases que van en una tabla (los
// nombres en una línea y los importes debajo) se emparejan por columna. Nunca da nada por bueno: devuelve también lo
// que no ha reconocido y si las sumas cuadran, y la pantalla de confirmación deja cambiarlo todo antes de usarlo.
// ETIQUETAS: hechas con los formatos habituales (A3, Sage, Nominasol…) y nóminas inventadas. Cuando llegue la muestra
// tapada del formato de Calsina, ajustarlas aquí y añadirla (inventada, nunca la real) a pruebas/nomina-lector.cjs.
const LECTOR_NOMINA = (function () {
  const sin = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const IMPORTE = /^-?\d{1,3}(?:\.\d{3})*,\d{2}-?$|^-?\d+,\d{2}-?$/;
  const aNum = (t) => { const neg = /-/.test(t); const v = +t.replace(/-/g, "").replace(/\./g, "").replace(",", "."); return neg ? -v : v; };
  // [clave, forma de la etiqueta]. El orden importa: primero los totales y las bases, luego lo más concreto.
  const REGLAS = [
    ["liquido", /liquido|a percibir/],
    ["deducir", /total\s*(a\s*)?deduc|total deducciones|total descuentos/],
    ["devengado", /total\s*devengad|total devengos|total bruto/],
    ["basecc", /base.*(\bc\.?\s?c\.?(\b|$)|cont(ingencias|ing)?\.?\s*comunes|comunes|b\.?c\.?c\.?c)|b\.?\s?c\.?\s?c\.?\s?c/],
    ["baseat", /base.*(\ba\.?\s?t\.?(\b|$)|accidente|profesional|cont(ingencias)?\.?\s*prof|desempleo)/],
    ["baseirpf", /base.*(i\.?\s?r\.?\s?p\.?\s?f|retenc|sujeta)/],
    ["empresa", /aportacion.*empresa|empresa.*aporta|coste.*empresa|total.*empresa/],
    ["mei", /\bm\.?\s?e\.?\s?i\.?\b|equidad/],
    ["hxcot", /(cotiz|cot\.).*(horas?|h\.)\s*extra|h(oras?|\.)?\s*extras?\s*(f\.?\s?m\.?|fuerza|estruct|resto|normales)/],
    ["cc", /cont(ingencias|ing)?\.?\s*comunes|c\.\s?comunes|\bcc\b|comunes/],
    ["desempleo", /desempleo/],
    ["fp", /formacion\s*prof|form\.?\s*prof|\bf\.?\s?p\.?(\b|$)/],
    ["irpf", /i\.?\s?r\.?\s?p\.?\s?f|retencion|tributacion/],
    ["anticipo", /anticipo/],
    ["prorrata", /prorrat|\bp\.?\s?p\.?\s*(pagas?|extra|p\.?\s?e)|parte proporcional/],
    ["paga", /paga\s*(extra|de\s*)?(verano|navidad|marzo|beneficios|julio|diciembre|junio)?|gratificacion extra/],
    ["antig", /antig|trienio|quinquenio|cuatrienio|bienio/],
    ["hx", /(horas?|h\.)\s*extra/],
    ["noct", /noctur/],
    ["plus", /plus\s*(de\s*)?convenio|p\.\s?convenio/],
    ["base", /salario base|sueldo base|^base$/],
    ["dietas", /dieta/],
    ["km", /kilomet|\bkms?\b/],
    ["pluses", /\bplus\b|incentiv|complemento|disponibilidad|\badr\b|prima/],
  ];
  const TIPO = { base: "d", plus: "d", antig: "d", hx: "d", noct: "d", pluses: "d", prorrata: "d", paga: "d", dietas: "d", km: "d", otrosd: "d", cc: "q", desempleo: "q", fp: "q", mei: "q", hxcot: "q", irpf: "q", anticipo: "q", otrosq: "q" };
  const reconoce = (t) => { const s = sin(t).replace(/\s+/g, " ").trim(); for (const [k, re] of REGLAS) if (re.test(s)) return k; return null; };

  // Trozos de pdf.js → líneas. trozos: [{str, x1, y1, x2, y2}] (y hacia abajo). Cada línea: {texto, trozos}
  function lineas(trozos) {
    const ord = trozos.filter((t) => t.str && t.str.trim()).sort((a, b) => (a.y1 + a.y2) / 2 - (b.y1 + b.y2) / 2 || a.x1 - b.x1);
    const out = [];
    for (const t of ord) {
      const c = (t.y1 + t.y2) / 2, alto = t.y2 - t.y1, l = out[out.length - 1];
      if (l && Math.abs(l.c - c) < Math.max(alto, l.alto) * 0.5) l.trozos.push(t); else out.push({ c, alto, trozos: [t] });
    }
    for (const l of out) { l.trozos.sort((a, b) => a.x1 - b.x1); l.texto = l.trozos.map((t) => t.str).join(" ").replace(/\s+/g, " ").trim(); }
    return out;
  }
  // Partes de una línea: palabras sueltas con su x (pdf.js a veces da varias palabras en un trozo)
  function palabras(l) {
    const out = [];
    for (const t of l.trozos) {
      const n = t.str.length || 1, w = t.x2 - t.x1, re = /\S+/g; let m;
      while ((m = re.exec(t.str))) out.push({ s: m[0], x1: t.x1 + w * m.index / n, x2: t.x1 + w * (m.index + m[0].length) / n });
    }
    return out;
  }
  const centro = (p) => (p.x1 + p.x2) / 2;

  // Lee la nómina a partir de las líneas. Devuelve { valores: {clave: importe}, mes: "aaaa-mm"|null,
  // sinReconocer: [{texto, importe, tipo}], avisos: [{t, v}] (texto con huecos para traducir), leidas: n.º de líneas con importe }
  // Textos de los avisos (los traduce la función «traducir»: grupos nomina, jubilacion y baja, con «mas: nomina-lector.js»)
  const AV = { /* textos */
    nodev: "No he encontrado el «Total devengado».",
    sumad: "Lo que cobras suma {a} y el «Total devengado» dice {b}: falta o sobra alguna línea.",
    noded: "No he encontrado el «Total a deducir».",
    sumaq: "Lo que te quitan suma {a} y el «Total a deducir» dice {b}: falta o sobra alguna línea.",
    noliq: "No he encontrado el «Líquido a percibir».",
    liq: "El total devengado menos el total a deducir no da el líquido a percibir.",
    nobase: "No he encontrado la base de cotización por contingencias comunes.",
    nomes: "No he encontrado el mes de la nómina." /* fin textos */ };
  const r2 = (x) => Math.round(x * 100) / 100, cerca = (a, b) => Math.abs(a - b) < 0.02;
  // Comprobaciones: nunca calcular a ciegas. Sirve también para volver a mirar lo que la persona cambia a mano.
  // valores: {clave: número}; devuelve [{t, v}] (t es una clave de AV ya cambiada por su texto en español)
  function revisa(valores, mes) {
    const out = [], ap = (k, v) => out.push({ t: AV[k], v });
    const suma = (t) => r2(Object.entries(valores).filter(([k, v]) => TIPO[k] === t && v != null).reduce((s, [, v]) => s + v, 0));
    const d = suma("d"), q = suma("q");
    if (valores.devengado == null) ap("nodev"); else if (!cerca(d, valores.devengado)) ap("sumad", { a: d, b: valores.devengado });
    if (valores.deducir == null) ap("noded"); else if (!cerca(q, valores.deducir)) ap("sumaq", { a: q, b: valores.deducir });
    if (valores.liquido == null) ap("noliq");
    else if (valores.devengado != null && valores.deducir != null && !cerca(r2(valores.devengado - valores.deducir), valores.liquido)) ap("liq");
    if (valores.basecc == null) ap("nobase");
    if (mes !== undefined && !mes) ap("nomes");
    return out;
  }
  function lee(ls) {
    const valores = {}, sinReconocer = [], avisos = [];
    // Columnas «DEVENGOS» y «DEDUCCIONES» (si las hay)
    let colD = null, colQ = null;
    for (const l of ls) { // la cabecera de la tabla: las dos palabras en la misma línea y sin «total»
      if (/total/.test(sin(l.texto))) continue;
      let d = null, q = null;
      for (const p of palabras(l)) {
        const s = sin(p.s).replace(/[^a-z]/g, "");
        if (/^devengos?$/.test(s)) d = centro(p);
        if (/^(deducciones|descuentos)$/.test(s)) q = centro(p);
      }
      if (d != null && q != null) { colD = d; colQ = q; break; }
    }
    const columna = (x) => colD == null || colQ == null ? null : Math.abs(x - colD) < Math.abs(x - colQ) ? "d" : "q";
    const pon = (k, v) => { if (TIPO[k]) valores[k] = Math.round(((valores[k] || 0) + v) * 100) / 100; else if (valores[k] == null) valores[k] = v; };
    let cabecera = null; // tabla de bases: [{k, x}] de la línea de los nombres
    let leidas = 0;
    // Una línea puede llevar dos conceptos («TOTAL DEVENGADO 1.910,50  TOTAL A DEDUCIR 324,42»): se parte en
    // trozos «etiqueta + importes» cuando, tras un importe, vuelve a haber palabras que se reconocen
    const partes = [];
    for (const l of ls) {
      const ps = palabras(l), trozos = [[]];
      ps.forEach((p, i) => {
        const prev = ps[i - 1];
        if (prev && IMPORTE.test(prev.s) && !IMPORTE.test(p.s)) {
          const resto = ps.slice(i); const hasta = resto.findIndex((x) => IMPORTE.test(x.s));
          if (hasta > 0 && reconoce(resto.slice(0, hasta).map((x) => x.s).join(" "))) trozos.push([]);
        }
        trozos[trozos.length - 1].push(p);
      });
      if (trozos.length === 1) partes.push({ l, ps }); else for (const t of trozos) partes.push({ l: { trozos: t.map((p) => ({ str: p.s, x1: p.x1, x2: p.x2 })) }, ps: t });
    }
    for (const { l, ps } of partes) {
      const imps = ps.filter((p) => IMPORTE.test(p.s));
      const etiqueta = ps.filter((p) => !IMPORTE.test(p.s)).map((p) => p.s).join(" ");
      if (!imps.length) {
        // ¿Una fila de nombres de tabla (dos o más bases o totales en la misma línea)?
        const trozos = l.trozos.map((t) => ({ k: reconoce(t.str), x: (t.x1 + t.x2) / 2 })).filter((t) => t.k && !TIPO[t.k]);
        cabecera = trozos.length >= 2 ? trozos : null;
        continue;
      }
      if (cabecera && !reconoce(etiqueta)) { // los importes de debajo de la fila de nombres
        for (const p of imps) {
          const c = cabecera.reduce((m, h) => Math.abs(h.x - centro(p)) < Math.abs(m.x - centro(p)) ? h : m);
          if (valores[c.k] == null) valores[c.k] = aNum(p.s);
        }
        cabecera = null; leidas++; continue;
      }
      cabecera = null;
      let k = reconoce(etiqueta);
      // el importe que vale: el de la columna de devengos o deducciones; si no hay columnas, el de más a la derecha
      let imp = imps[imps.length - 1], col = null;
      if (colD != null && colQ != null) {
        const enCol = imps.filter((p) => Math.abs(centro(p) - (columna(centro(p)) === "d" ? colD : colQ)) < Math.abs(colQ - colD) * 0.45);
        if (enCol.length) { imp = enCol[enCol.length - 1]; col = columna(centro(imp)); }
      }
      const v = aNum(imp.s);
      leidas++;
      if (k && col && TIPO[k] && TIPO[k] !== col) k = k === "hx" ? "hxcot" : col === "d" ? "otrosd" : "otrosq"; // la columna manda
      if (!k) {
        if (!/[a-z]{3}/i.test(sin(etiqueta))) continue; // solo cifras (cantidades, precios…)
        const tipo = col || null;
        sinReconocer.push({ texto: etiqueta.slice(0, 60), importe: v, tipo });
        if (tipo) pon(tipo === "d" ? "otrosd" : "otrosq", v);
        continue;
      }
      pon(k, v);
    }
    // El mes
    const todo = sin(ls.map((l) => l.texto).join(" \n "));
    const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    let mes = null, m;
    if ((m = todo.match(/\d{1,2}[/.-](\d{1,2})[/.-](\d{2,4})\s*(?:a|al|hasta|-)\s*\d{1,2}[/.-](\d{1,2})[/.-](\d{2,4})/))) mes = [m[4], m[3]];
    else if ((m = todo.match(/\b(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-z]*\.?\s*(?:de\s*|')?(\d{2,4})/))) mes = [m[2], String(MESES.indexOf(m[1] === "set" ? "sep" : m[1]) + 1)];
    if (mes) { let a = +mes[0]; if (a < 100) a += 2000; const n = +mes[1]; mes = n >= 1 && n <= 12 && a > 2000 && a < 2100 ? `${a}-${String(n).padStart(2, "0")}` : null; }
    // Los descuentos a veces salen con un menos delante («-68,53»): todo en positivo
    for (const k in valores) valores[k] = Math.abs(valores[k]);
    for (const x of sinReconocer) x.importe = Math.abs(x.importe);
    avisos.push(...revisa(valores, mes));
    return { valores, mes, sinReconocer, avisos, leidas, columnas: colD != null && colQ != null };
  }

  // PDF → trozos de texto con su sitio (pdf.js, solo en el navegador). Hasta 4 páginas.
  let PDFJS = null;
  async function trozosPdf(archivo) {
    if (!PDFJS) { PDFJS = await import("./lib/pdfjs/pdf.min.mjs"); PDFJS.GlobalWorkerOptions.workerSrc = "lib/pdfjs/pdf.worker.min.mjs"; }
    const doc = await PDFJS.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()), isEvalSupported: false }).promise;
    const out = []; let y0 = 0;
    try {
      for (let i = 1; i <= Math.min(doc.numPages, 4); i++) {
        const p = await doc.getPage(i), vp = p.getViewport({ scale: 1 }), tc = await p.getTextContent();
        for (const it of tc.items) {
          if (!it.str || !it.str.trim()) continue;
          const [, , c, d, e, f] = it.transform, alto = Math.hypot(c, d) || it.height || 10;
          const r = vp.convertToViewportRectangle([e, f - alto * 0.2, e + (it.width || 0), f + alto * 0.8]);
          out.push({ str: it.str, x1: Math.min(r[0], r[2]), y1: y0 + Math.min(r[1], r[3]), x2: Math.max(r[0], r[2]), y2: y0 + Math.max(r[1], r[3]) });
        }
        y0 += vp.height + 50;
      }
    } finally { doc.destroy(); }
    return out;
  }
  // Para la pantalla: lee un archivo. Errores: "foto" (no es PDF), "vacio" (PDF sin texto: escaneado), "mal" (no se abre)
  // v221 (lo pidió Lorena: «que se permitan todo tipo de archivos»): además del PDF, Word (.docx), Excel (.xlsx),
  // OpenOffice/LibreOffice (.odt, .ods), texto (.txt, .csv) y página web (.html). Todos se pasan a «filas de celdas» y
  // se leen igual que el PDF. Fotos y escaneados no (no hay lector de fotos); .doc y .xls viejos tampoco (guardarlos
  // como PDF). Los ZIP de Office se abren con lib/jszip.min.js (el mismo del panel), que se carga solo al usarlo.
  // Filas de celdas → trozos como los de pdf.js: cada celda en su columna (x) y cada fila en su altura (y)
  function trozosDeFilas(filas) {
    const out = [];
    filas.forEach((celdas, y) => {
      let x = 0;
      celdas.forEach((c) => {
        const t = String(c.t ?? c).replace(/\s+/g, " ").trim(), col = c.col != null ? c.col : null;
        const x1 = col != null ? col * 140 : x;
        if (t) out.push({ str: t, x1, x2: x1 + Math.min(t.length * 6, 130), y1: y * 20, y2: y * 20 + 10 });
        x = x1 + 140;
      });
    });
    return out;
  }
  // Texto suelto (txt, csv): tabuladores, «;» o dos espacios separan celdas; si no, el sitio de cada palabra en la línea
  function filasDeTexto(txt) {
    return String(txt).split(/\r?\n/).map((l) => {
      if (/\t/.test(l)) return l.split("\t");
      if (/;/.test(l) && !/\d;\d/.test(l.replace(/\d+;\d{2}\b/, ""))) return l.split(";");
      const celdas = [], re = /\S+(?: \S+)*/g; let m;
      while ((m = re.exec(l))) celdas.push({ t: m[0], col: m.index / 23.3 });
      return celdas;
    });
  }
  // Un número de una celda de hoja de cálculo («1200.5») → «1.200,50», como sale en el papel
  const numHoja = (v) => /^-?\d+(\.\d+)?$/.test(v) && /\./.test(v) ? (+v).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
  const colLetra = (ref) => { const m = /^([A-Z]+)/.exec(ref || ""); if (!m) return null; let n = 0; for (const c of m[1]) n = n * 26 + c.charCodeAt(0) - 64; return n - 1; };
  const xml = (t) => new DOMParser().parseFromString(t, "application/xml");
  const hijos = (el, nombre) => [...el.children].filter((c) => c.localName === nombre);
  const texto = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  // Word / OpenOffice texto / HTML: párrafos sueltos = una fila; tablas = una fila por fila de la tabla
  function filasDeDocumento(raiz, fila, celda, parrafo) {
    const filas = [], celdas = [].concat(celda);
    // los tabuladores de Word (w:tab) y OpenOffice (text:tab) separan columnas: se cambian por «\t» antes de leer
    raiz.querySelectorAll("*").forEach((c) => { if (c.localName === "tab" && !c.children.length) c.textContent = "\t"; else if (c.localName === "s" && c.namespaceURI && /opendocument/.test(c.namespaceURI)) c.textContent = "  "; else if (c.localName === "p" || c.localName === "br") c.append(" "); });
    const recorre = (el) => {
      for (const c of el.children) {
        if (c.localName === fila) { filas.push([...c.children].filter((x) => celdas.includes(x.localName)).flatMap((x) => { const n = +(x.getAttribute("table:number-columns-repeated") || x.getAttribute("colspan") || 1); const t = texto(x); return [t, ...Array(Math.min(n, 20) - 1).fill("")]; })); continue; }
        if (parrafo.includes(c.localName) && ![...c.querySelectorAll("*")].some((x) => x.localName === fila)) {
          const partes = (c.textContent || "").split(/\t|\s{2,}/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
          if (partes.length) filas.push(partes); continue;
        }
        recorre(c);
      }
    };
    recorre(raiz);
    return filas;
  }
  let ZIP = null;
  async function abreZip(archivo) {
    if (!window.JSZip) {
      ZIP = ZIP || new Promise((ok, mal) => { const sc = document.createElement("script"); sc.src = "lib/jszip.min.js" + (typeof VERSION_WEB !== "undefined" ? "?v=" + VERSION_WEB : ""); sc.onload = ok; sc.onerror = () => { ZIP = null; mal(new Error("zip")); }; document.head.appendChild(sc); });
      await ZIP;
    }
    const z = await window.JSZip.loadAsync(await archivo.arrayBuffer());
    // un ZIP que al abrirlo ocupa muchísimo (más de 60 MB) no se lee: colgaría el móvil
    let total = 0; z.forEach((_, f) => { total += (f._data && f._data.uncompressedSize) || 0; });
    if (total > 60 * 1048576) throw new Error("grande");
    return z;
  }
  async function filasDocx(archivo) {
    const z = await abreZip(archivo), f = z.file("word/document.xml"); if (!f) throw new Error("docx");
    const d = xml(await f.async("string"));
    return filasDeDocumento(d.documentElement, "tr", "tc", ["p"]);
  }
  async function filasOdf(archivo) {
    const z = await abreZip(archivo), f = z.file("content.xml"); if (!f) throw new Error("odf");
    const d = xml(await f.async("string"));
    // en las hojas (.ods) el número va en office:value
    d.querySelectorAll("*").forEach((c) => { const v = c.getAttribute && c.getAttribute("office:value"); if (c.localName === "table-cell" && v != null) c.textContent = numHoja(v); });
    return filasDeDocumento(d.documentElement, "table-row", "table-cell", ["p", "h"]);
  }
  async function filasXlsx(archivo) {
    const z = await abreZip(archivo), comp = [];
    const ss = z.file("xl/sharedStrings.xml");
    if (ss) for (const si of hijos(xml(await ss.async("string")).documentElement, "si")) comp.push(texto(si));
    const hojas = Object.keys(z.files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort().slice(0, 4);
    if (!hojas.length) throw new Error("xlsx");
    const filas = [];
    for (const h of hojas) {
      const d = xml(await z.file(h).async("string"));
      for (const row of d.getElementsByTagNameNS("*", "row")) {
        const celdas = [];
        for (const c of hijos(row, "c")) {
          const tipo = c.getAttribute("t"), v = hijos(c, "v")[0], is = hijos(c, "is")[0];
          let t = tipo === "s" && v ? comp[+v.textContent] : tipo === "inlineStr" && is ? texto(is) : v ? numHoja(v.textContent) : "";
          if (t) celdas.push({ t, col: colLetra(c.getAttribute("r")) ?? celdas.length });
        }
        if (celdas.length) filas.push(celdas);
      }
      filas.push([]);
    }
    return filas;
  }
  // Para la pantalla: lee un archivo. Errores: "foto" (imagen), "viejo" (.doc/.xls), "tipo" (otro), "vacio" (sin texto),
  // "mal" (no se abre), "grande" (más de 20 MB)
  async function leeArchivo(archivo) {
    const nom = (archivo.name || "").toLowerCase(), tipo = archivo.type || "";
    const ext = (/\.([a-z0-9]+)$/.exec(nom) || [])[1] || "";
    if (archivo.size > 20 * 1048576) return { error: "grande" };
    let tz;
    try {
      if (ext === "pdf" || tipo === "application/pdf") tz = await trozosPdf(archivo);
      else if (/^image\//.test(tipo) || /^(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/.test(ext)) return { error: "foto" };
      else if (ext === "doc" || ext === "xls") return { error: "viejo" };
      else if (ext === "docx") tz = trozosDeFilas(await filasDocx(archivo));
      else if (ext === "xlsx" || ext === "xlsm") tz = trozosDeFilas(await filasXlsx(archivo));
      else if (ext === "odt" || ext === "ods") tz = trozosDeFilas(await filasOdf(archivo));
      else if (/^html?$/.test(ext) || tipo === "text/html") {
        const d = new DOMParser().parseFromString(await archivo.text(), "text/html");
        d.querySelectorAll("script, style, noscript, template").forEach((x) => x.remove());
        tz = trozosDeFilas(filasDeDocumento(d.body || d.documentElement, "tr", ["td", "th"], ["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "pre"]));
      } else if (/^(txt|csv|tsv|text)$/.test(ext) || /^text\//.test(tipo)) tz = trozosDeFilas(filasDeTexto(await archivo.text()));
      else return { error: "tipo" };
    } catch (_) { return { error: "mal" }; }
    if (tz.length < 5) return { error: "vacio" };
    try { return lee(lineas(tz)); } catch (_) { return { error: "mal" }; }
  }

  // Errores al leer un archivo, para la pantalla
  const ERR = { /* textos */
    foto: "Es una foto. Las fotos no se pueden leer: copia los importes a mano (o tapa tus datos con «Tapar datos privados»).",
    viejo: "Es un Word o un Excel antiguo (.doc o .xls). Guárdalo como PDF o como .docx/.xlsx y vuelve a elegirlo.",
    tipo: "Este tipo de archivo no lo sé leer. Valen PDF, Word, Excel, OpenOffice, texto o página web.",
    vacio: "Este archivo no tiene texto que se pueda leer (parece escaneado o una foto): copia los importes a mano.",
    mal: "No he podido abrir este archivo. Puede que esté dañado o tenga contraseña.",
    grande: "El archivo es demasiado grande (más de 20 MB)." /* fin textos */ };
  const MESES_TXT = { /* textos */ m1: "Enero", m2: "Febrero", m3: "Marzo", m4: "Abril", m5: "Mayo", m6: "Junio", m7: "Julio", m8: "Agosto", m9: "Septiembre", m10: "Octubre", m11: "Noviembre", m12: "Diciembre" /* fin textos */ };
  const nombreMes = (mes, T) => { if (!mes) return ""; const [a, m] = mes.split("-"); return T(MESES_TXT["m" + +m]) + " " + a; };
  const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const coma = (n) => n.toFixed(2).replace(".", ",");

  // Botón «Coger la base de una nómina» (Mi jubilación y Mi baja médica). opts: { input, clave: () => "basecc"|"baseat",
  // T: la función de textos de esa herramienta, T0 si no hay }. El PDF se lee en la memoria y se olvida; no se guarda nada.
  function cogerBase(opts) {
    const T = opts.T || ((x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m));
    const inp = opts.input; if (!inp) return;
    const pista = inp.nextElementSibling && inp.nextElementSibling.classList.contains("zc-pista") ? inp.nextElementSibling : inp;
    const caja = document.createElement("div"); caja.className = "nl-coger";
    caja.innerHTML = `<button type="button" class="btn sec nl-coger-btn"><svg class="icono p" aria-hidden="true"><use href="#i-pdf"/></svg><span>${esc(T("Coger la base de una nómina"))}</span></button>
      <input type="file" hidden tabindex="-1" aria-hidden="true">
      <div class="nl-coger-out" aria-live="polite"></div>`;
    pista.after(caja);
    const btn = caja.querySelector("button"), file = caja.querySelector("input"), out = caja.querySelector(".nl-coger-out");
    let turno = 0;
    btn.addEventListener("click", () => file.click());
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0]; file.value = ""; if (!f) return;
      const yo = ++turno;
      out.innerHTML = `<p class="zc-pista">${esc(T("Leyendo la nómina en tu móvil…"))}</p>`;
      const r = await leeArchivo(f);
      if (yo !== turno) return;
      if (r.error) { out.innerHTML = `<div class="zc-aviso">${esc(T(ERR[r.error]))}</div>`; return; }
      const k = opts.clave(), v = r.valores[k];
      const nom = k === "baseat" ? T("base de accidentes de trabajo y enfermedades profesionales") : T("base de contingencias comunes");
      if (v == null || !(v > 0)) { out.innerHTML = `<div class="zc-aviso">${esc(T("No he encontrado la {n} en esta nómina. Cópiala a mano.", { n: nom }))}</div>`; return; }
      const mes = nombreMes(r.mes, T);
      const raro = r.avisos.some((a) => a.t !== AV.nomes && a.t !== AV.nobase);
      out.innerHTML = `<div class="zc-aviso nl-pregunta"><p>${esc(mes ? T("En la nómina de {m} pone:", { m: mes }) : T("En la nómina pone:"))} ${esc(nom)}: <b>${esc(eur(v))}</b>.</p>
        ${raro ? `<p>${esc(T("Ojo: las sumas de esta nómina no me cuadran del todo. Comprueba el importe con el papel."))}</p>` : ""}
        <p>${esc(T("¿Es lo que pone en tu nómina?"))}</p>
        <div class="nl-botones"><button type="button" class="btn" data-nl="si">${esc(T("Sí, ponerla"))}</button><button type="button" class="btn sec" data-nl="no">${esc(T("No, la copio yo"))}</button></div></div>`;
      out.querySelector("[data-nl=si]").addEventListener("click", () => {
        inp.value = coma(v); inp.dispatchEvent(new Event("input", { bubbles: true }));
        out.innerHTML = `<p class="zc-pista">${esc(T("Puesta. El PDF no se ha guardado."))}</p>`; inp.focus();
      });
      out.querySelector("[data-nl=no]").addEventListener("click", () => { out.innerHTML = ""; inp.focus(); });
    });
  }
  return { lee, lineas, reconoce, leeArchivo, revisa, trozosDeFilas, filasDeTexto, cogerBase, nombreMes, ERR, TIPO };
})();
if (typeof window !== "undefined") window.LECTOR_NOMINA = LECTOR_NOMINA;
