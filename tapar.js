// «Tapar datos privados» (Zona Conductores, v220; lo pidió el padre y lo aprobó Lorena el 26/11/2026, paso 1 del plan
// de la nómina en PDF). Tapa en negro el nombre, DNI/NIE, IBAN, n.º de afiliación, dirección, teléfono, email y código
// de trabajador de una nómina (o cualquier papel) para poder enseñarla o enviarla sin datos personales.
// TODO SE HACE EN EL MÓVIL: el archivo se lee en la memoria del navegador, no se sube a ningún sitio, no se guarda
// (ni localStorage ni caché) y no pasa por la IA. Al salir de la herramienta o elegir otro archivo, se borra.
//  - PDF con texto: pdf.js (lib/pdfjs, el mismo del panel) da cada trozo de texto con su sitio, y se buscan los datos
//    por su forma (DNI con letra, NIE, IBAN, cuenta de 20 cifras, afiliación de 12 cifras, email, teléfono) y por la
//    etiqueta que llevan delante («Nombre», «Domicilio», «NIF»…). No es infalible: la persona revisa y tapa a mano.
//  - Foto (JPG, PNG, WebP) o PDF escaneado: no se busca nada (no hay lector de fotos): se tapa a mano con el dedo.
//  - Lo que se descarga es una IMAGEN nueva (PNG) pintada en el móvil: el texto tapado no queda debajo, no hay capas
//    ni metadatos (una imagen hecha con canvas no lleva EXIF ni GPS).
(function () {
  // ---- Detección (sin pantalla; window.TAPAR para las pruebas de pruebas/tapar.cjs) ----
  const LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";
  const dniBueno = (n, l) => LETRAS[+n % 23] === l;
  const ibanBueno = (s) => {
    const t = s.replace(/\s/g, "").toUpperCase(); if (t.length < 15 || t.length > 34) return false;
    const r = (t.slice(4) + t.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
    let m = 0; for (const c of r) m = (m * 10 + +c) % 97; return m === 1;
  };
  // Cada dato: tipo (para el resumen) y su forma. Los números de dinero llevan coma y dos decimales: no encajan aquí.
  const FORMAS = [
    ["iban", /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g, (m) => ibanBueno(m) || /^ES/i.test(m)],
    ["cuenta", /\b\d{4}[ -]?\d{4}[ -]?\d{2}[ -]?\d{10}\b/g],
    ["dni", /\b[XYZ][ -]?\d{7}[ -]?[A-Z]\b/g],
    ["dni", /\b\d{8}[ -]?[A-Z]\b/g],
    ["afiliacion", /\b\d{2}[ /-]?\d{8}[ /-]?\d{2}\b/g],
    ["afiliacion", /\b\d{2}[ /-]\d{7,8}[ /-]\d{2}\b/g],
    ["email", /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g],
    ["telefono", /(?:\+34[ ]?)?\b[6789]\d{2}[ ]?\d{3}[ ]?\d{3}\b/g],
    ["telefono", /(?:\+34[ ]?)?\b[6789]\d{2}[ ]\d{2}[ ]\d{2}[ ]\d{2}\b/g],
  ];
  // Etiquetas. De nombre y dirección: se tapa lo que va detrás hasta un hueco grande (dos espacios: otra columna), otra
  // etiqueta o una palabra acabada en «:». De documento y número: solo la palabra siguiente si lleva cifras (por si la
  // forma de arriba no lo ha cogido). Nunca los importes de dinero.
  const ET_NOMBRE = /\b(?:nombre(?: y apellidos)?|apellidos|trabajador(?:a)?|empleado(?:a)?|domicilio|direcci[oó]n|poblaci[oó]n|localidad|c[oó]digo postal|c\.\s?p\.)(?=[\s:.]|$)\s*[:.]?/gi;
  const ET_NUMERO = /\b(?:n\.?\s?i\.?\s?f\.?|d\.?\s?n\.?\s?i\.?|n\.?\s?i\.?\s?e\.?|n\.?\s?a\.?\s?f\.?|(?:n[º°o.]\s*)?afiliaci[oó]n(?: s\.?\s?s\.?)?|iban|c\.?\s?c\.?\s?c\.?|n[º°]\s*(?:de\s+)?cuenta|cuenta(?: bancaria)?|c[oó]d(?:igo|\.)?\s*(?:de\s+)?(?:trabajador|empleado|personal)|n[º°]\s*(?:de\s+)?(?:trabajador|empleado)|tel[eé]fono|tel\.|m[oó]vil|e-?mail|correo)(?=[\s:.]|$)\s*[:.]?/gi;
  const DINERO = /^-?\d{1,3}(?:\.\d{3})*,\d{2}$|^-?\d+,\d{2}$|^\d{1,3}(?:,\d{1,2})?%$/;
  // Busca en el texto de una línea. Devuelve [{ini, fin, tipo}] (posiciones de letras dentro de la línea)
  function buscaEnLinea(t) {
    const out = [];
    for (const [tipo, re, vale] of FORMAS) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(t))) {
        if (vale && !vale(m[0])) continue;
        if (out.some((o) => m.index < o.fin && m.index + m[0].length > o.ini)) continue; // ya tapado por otra forma
        out.push({ ini: m.index, fin: m.index + m[0].length, tipo });
      }
    }
    const pon = (ini, fin) => { if (fin > ini && !out.some((o) => ini < o.fin && fin > o.ini)) out.push({ ini, fin, tipo: "etiqueta" }); };
    const etiquetas = [];
    for (const [re, clase] of [[ET_NOMBRE, "nombre"], [ET_NUMERO, "numero"]]) { re.lastIndex = 0; let e; while ((e = re.exec(t))) etiquetas.push({ ini: e.index, fin: e.index + e[0].length, clase }); }
    etiquetas.sort((x, y) => x.ini - y.ini);
    etiquetas.forEach((e, k) => {
      const sig = etiquetas.slice(k + 1).find((x) => x.ini >= e.fin), hueco = t.indexOf("  ", e.fin + 1);
      const tope = Math.min(sig ? sig.ini : t.length, hueco > e.fin ? hueco : t.length);
      const re = /\S+/g; re.lastIndex = e.fin; let w;
      while ((w = re.exec(t)) && w.index < tope) {
        if (DINERO.test(w[0])) { if (e.clase === "numero") break; continue; }
        if (w.index > e.fin && /:$/.test(w[0])) break; // otra etiqueta que no está en la lista
        if (!/[\p{L}\d]/u.test(w[0])) continue;
        if (e.clase === "numero") { if (/\d/.test(w[0])) pon(w.index, w.index + w[0].length); break; }
        pon(w.index, Math.min(w.index + w[0].length, tope));
      }
    });
    // Junta en un solo recuadro lo que va seguido (solo un espacio en medio): nombre y apellidos, dirección…
    out.sort((x, y) => x.ini - y.ini);
    const junto = [];
    for (const h of out) { const u = junto[junto.length - 1]; if (u && /^ ?$/.test(t.slice(u.fin, h.ini))) { u.fin = Math.max(u.fin, h.fin); if (u.tipo !== h.tipo && h.tipo !== "etiqueta") u.tipo = h.tipo; } else junto.push({ ...h }); }
    return junto;
  }
  // Junta los trozos de texto de pdf.js en líneas (misma altura) y las recorre. trozos: [{str, x1, y1, x2, y2}] en
  // coordenadas del dibujo (y hacia abajo). Devuelve recuadros [{x, y, w, h, tipo}].
  function buscaEnTrozos(trozos, mide) {
    // mide(texto) = ancho de ese texto en cualquier tamaño: sirve para saber dónde empieza cada palabra dentro del trozo
    const ancho = mide || ((x) => x.length);
    const ord = trozos.filter((t) => t.str && t.str.trim()).sort((a, b) => (a.y1 + a.y2) / 2 - (b.y1 + b.y2) / 2 || a.x1 - b.x1);
    const lineas = [];
    for (const t of ord) {
      const c = (t.y1 + t.y2) / 2, alto = t.y2 - t.y1, l = lineas[lineas.length - 1];
      if (l && Math.abs(l.c - c) < Math.max(alto, l.alto) * 0.5) l.trozos.push(t); else lineas.push({ c, alto, trozos: [t] });
    }
    const cajas = [];
    for (const l of lineas) {
      l.trozos.sort((a, b) => a.x1 - b.x1);
      let texto = ""; const pos = [];
      let antes = null;
      for (const t of l.trozos) { if (texto) texto += antes && t.x1 - antes.x2 > (t.y2 - t.y1) * 1.5 ? "  " : " "; pos.push(texto.length); texto += t.str; antes = t; }
      for (const h of buscaEnLinea(texto)) {
        l.trozos.forEach((t, k) => {
          const a = Math.max(h.ini, pos[k]), b = Math.min(h.fin, pos[k] + t.str.length);
          if (a >= b) return;
          const todo = ancho(t.str) || 1, w = t.x2 - t.x1, alto = t.y2 - t.y1, pad = Math.max(2, alto * 0.15), padX = Math.max(3, alto * 0.3);
          const x1 = t.x1 + w * ancho(t.str.slice(0, a - pos[k])) / todo, x2 = t.x1 + w * ancho(t.str.slice(0, b - pos[k])) / todo;
          cajas.push({ x: x1 - padX, y: t.y1 - pad, w: x2 - x1 + padX * 2, h: alto + pad * 2, tipo: h.tipo });
        });
      }
    }
    return cajas;
  }
  window.TAPAR = { buscaEnLinea, buscaEnTrozos, dniBueno, ibanBueno };

  // ---- Pantalla ----
  const vista = document.getElementById("v-tapar");
  if (!vista) return;
  const Z = window.ZonaIdioma ? ZonaIdioma("tapar", "v-tapar", () => pintaResumen()) : null;
  const T = Z ? Z.T : (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
  const $ = (id) => document.getElementById(id);
  const TIPOS = { /* textos */ dni: "DNI o NIE", iban: "IBAN", cuenta: "número de cuenta", afiliacion: "número de afiliación", email: "email", telefono: "teléfono", etiqueta: "dato detrás de «Nombre», «Domicilio», «NIF»…", mano: "tapado a mano" /* fin textos */ };
  const MAX_MB = 20, MAX_PAG = 6, ANCHO = 1400;
  let PAGS = [], LEIDO = false, TURNO = 0, nombre = "", aMano = false, PDFJS = null;
  // PAGS: [{cv (lo que se ve), base (la página sin tapar), cajas: [{x,y,w,h,tipo}]}]

  async function cargaPdfjs() {
    if (PDFJS) return PDFJS;
    PDFJS = await import("./lib/pdfjs/pdf.min.mjs");
    PDFJS.GlobalWorkerOptions.workerSrc = "lib/pdfjs/pdf.worker.min.mjs";
    return PDFJS;
  }
  let MEDIDOR = null;
  const mideLetra = (x) => { if (!MEDIDOR) { MEDIDOR = document.createElement("canvas").getContext("2d"); MEDIDOR.font = "40px Arial, Helvetica, sans-serif"; } return MEDIDOR.measureText(x).width; };
  const lienzo = (w, h) => { const c = document.createElement("canvas"); c.width = Math.round(w); c.height = Math.round(h); return c; };
  async function abrePdf(f) {
    const pj = await cargaPdfjs();
    const doc = await pj.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise;
    const out = [];
    for (let i = 1; i <= Math.min(doc.numPages, MAX_PAG); i++) {
      const p = await doc.getPage(i), v1 = p.getViewport({ scale: 1 }), vp = p.getViewport({ scale: ANCHO / v1.width });
      const base = lienzo(vp.width, vp.height), cx = base.getContext("2d");
      cx.fillStyle = "#fff"; cx.fillRect(0, 0, base.width, base.height);
      await p.render({ canvasContext: cx, viewport: vp }).promise;
      const tc = await p.getTextContent(), trozos = [];
      for (const it of tc.items) {
        if (!it.str) continue;
        const [a, b, c, d, e, f2] = it.transform, alto = Math.hypot(c, d) || it.height || 10;
        const r = vp.convertToViewportRectangle([e, f2 - alto * 0.22, e + (it.width || 0), f2 + alto * 0.85]);
        trozos.push({ str: it.str, x1: Math.min(r[0], r[2]), y1: Math.min(r[1], r[3]), x2: Math.max(r[0], r[2]), y2: Math.max(r[1], r[3]) });
        void a; void b;
      }
      out.push({ base, cajas: buscaEnTrozos(trozos, mideLetra), texto: trozos.length > 0 });
    }
    return { pags: out, total: doc.numPages };
  }
  async function abreFoto(f) {
    const url = URL.createObjectURL(f);
    try {
      const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = url; });
      const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
      const base = lienzo(img.naturalWidth * k, img.naturalHeight * k), cx = base.getContext("2d");
      cx.fillStyle = "#fff"; cx.fillRect(0, 0, base.width, base.height); cx.drawImage(img, 0, 0, base.width, base.height);
      return { pags: [{ base, cajas: [], texto: false }], total: 1 };
    } finally { URL.revokeObjectURL(url); }
  }

  function pinta(p) {
    const cx = p.cv.getContext("2d");
    cx.drawImage(p.base, 0, 0);
    cx.fillStyle = "#000";
    for (const c of p.cajas) cx.fillRect(c.x, c.y, c.w, c.h);
  }
  function cuenta() {
    const n = {}; for (const p of PAGS) for (const c of p.cajas) n[c.tipo] = (n[c.tipo] || 0) + 1;
    return n;
  }
  function pintaResumen() {
    const r = $("tap-resumen"); if (!r) return;
    if (!PAGS.length) { r.innerHTML = ""; return; }
    const n = cuenta(), total = Object.values(n).reduce((a, b) => a + b, 0), conTexto = PAGS.some((p) => p.texto);
    let h = "";
    if (!conTexto) h += `<p class="zc-aviso">${esc(T("En las fotos y en los PDF escaneados no se puede buscar nada solo: tápalo tú con el dedo. Con «Tapar a mano» encendido, arrastra el dedo por encima de lo que quieras tapar."))}</p>`;
    h += `<p><b>${esc(total ? T("Recuadros negros: {n}", { n: total }) : T("Todavía no hay nada tapado."))}</b></p>`;
    if (total) h += `<ul class="tap-lista">${Object.entries(n).map(([k, v]) => `<li>${esc(T(TIPOS[k] || k))}: ${v}</li>`).join("")}</ul>`;
    h += `<p class="zc-pista">${esc(T("Mira bien toda la hoja: puede quedar algo sin tapar (el nombre de la empresa no es privado, pero tu nombre, tu dirección o tu firma sí). Para quitar un recuadro, tócalo con «Tapar a mano» encendido."))}</p>`;
    r.innerHTML = h;
    $("tap-hecho").hidden = false;
  }
  function pintaPaginas() {
    const c = $("tap-paginas"); c.innerHTML = "";
    PAGS.forEach((p, i) => {
      p.cv = lienzo(p.base.width, p.base.height);
      p.cv.className = "tap-lienzo"; p.cv.setAttribute("role", "img");
      p.cv.setAttribute("aria-label", T("Página {n} con los datos tapados", { n: i + 1 }));
      p.cv.dataset.pag = i; pinta(p); c.appendChild(p.cv);
    });
    ponMano(aMano);
  }
  function borraTodo() {
    for (const p of PAGS) { for (const cv of [p.cv, p.base]) if (cv) { cv.width = 0; cv.height = 0; } }
    PAGS = []; LEIDO = false; nombre = ""; TURNO++;
    $("tap-paginas").innerHTML = ""; $("tap-resumen").innerHTML = ""; $("tap-hecho").hidden = true;
    $("tap-revisado").checked = false; $("tap-msg").textContent = ""; $("tap-msg").className = "msg";
    $("tap-archivo").value = ""; botones();
  }
  function botones() {
    const ok = PAGS.length > 0 && $("tap-revisado").checked;
    $("tap-bajar").disabled = !ok; $("tap-compartir").disabled = !ok;
    $("tap-compartir").hidden = !(navigator.canShare && navigator.share);
  }
  function ponMano(si) {
    aMano = si;
    const b = $("tap-mano"); b.setAttribute("aria-pressed", si ? "true" : "false"); b.classList.toggle("activa", si);
    $("tap-paginas").classList.toggle("a-mano", si);
  }

  $("tap-archivo").addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    const archivo = f;
    for (const p of PAGS) for (const cv of [p.cv, p.base]) if (cv) { cv.width = 0; cv.height = 0; }
    PAGS = []; $("tap-paginas").innerHTML = ""; $("tap-resumen").innerHTML = ""; $("tap-hecho").hidden = true; $("tap-revisado").checked = false; botones();
    const msg = $("tap-msg"); msg.className = "msg";
    if (!archivo) return;
    if (archivo.size > MAX_MB * 1048576) { msg.textContent = T("El archivo es demasiado grande (más de {n} MB).", { n: MAX_MB }); msg.className = "msg err"; return; }
    const esPdf = archivo.type === "application/pdf" || /\.pdf$/i.test(archivo.name);
    const esFoto = /^image\/(jpeg|png|webp)$/.test(archivo.type) || /\.(jpe?g|png|webp)$/i.test(archivo.name);
    if (!esPdf && !esFoto) { msg.textContent = T("Elige un PDF o una foto (JPG, PNG o WebP)."); msg.className = "msg err"; return; }
    msg.textContent = T("Abriendo el archivo en tu móvil…");
    const turno = ++TURNO; LEIDO = true; // si se elige otro archivo o se sale mientras se abre, esto se tira
    try {
      const r = esPdf ? await abrePdf(archivo) : await abreFoto(archivo);
      if (turno !== TURNO || !vista.classList.contains("activa")) { for (const p of r.pags) { p.base.width = 0; p.base.height = 0; } return; }
      PAGS = r.pags; LEIDO = true; nombre = (archivo.name || "documento").replace(/\.[^.]+$/, "");
      msg.textContent = r.total > MAX_PAG ? T("Solo se abren las {n} primeras páginas.", { n: MAX_PAG }) : "";
      aMano = !PAGS.some((p) => p.texto); pintaPaginas(); pintaResumen(); botones();
      $("tap-resumen").scrollIntoView({ block: "nearest" });
    } catch (_) {
      if (turno !== TURNO) return;
      PAGS = []; msg.textContent = T("No se ha podido abrir el archivo. Si es un PDF con contraseña, quítasela antes."); msg.className = "msg err";
    }
  });

  // Tapar a mano: arrastrar dibuja un recuadro; tocar un recuadro lo quita
  let arrastre = null;
  const punto = (cv, ev) => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * cv.width / r.width, y: (ev.clientY - r.top) * cv.height / r.height }; };
  const cont = $("tap-paginas");
  cont.addEventListener("pointerdown", (ev) => {
    const cv = ev.target.closest(".tap-lienzo"); if (!cv || !aMano) return;
    ev.preventDefault(); cv.setPointerCapture?.(ev.pointerId);
    arrastre = { cv, p: PAGS[+cv.dataset.pag], a: punto(cv, ev), b: null };
  });
  cont.addEventListener("pointermove", (ev) => {
    if (!arrastre) return;
    arrastre.b = punto(arrastre.cv, ev);
    const { p, a, b } = arrastre; pinta(p);
    const cx = p.cv.getContext("2d"); cx.fillStyle = "rgba(0,0,0,.6)";
    cx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  });
  const suelta = () => {
    if (!arrastre) return;
    const { p, a, b } = arrastre; arrastre = null;
    const min = p.cv.width / 120;
    if (b && Math.abs(a.x - b.x) > min && Math.abs(a.y - b.y) > min / 2) {
      p.cajas.push({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y), tipo: "mano" });
    } else {
      // un toque: quita el recuadro de encima (el último que lo cubre)
      for (let i = p.cajas.length - 1; i >= 0; i--) { const c = p.cajas[i]; if (a.x >= c.x && a.x <= c.x + c.w && a.y >= c.y && a.y <= c.y + c.h) { p.cajas.splice(i, 1); break; } }
    }
    pinta(p); $("tap-revisado").checked = false; botones(); pintaResumen();
  };
  cont.addEventListener("pointerup", suelta);
  cont.addEventListener("pointercancel", () => { if (arrastre) { pinta(arrastre.p); arrastre = null; } });
  $("tap-mano").addEventListener("click", () => ponMano(!aMano));
  $("tap-deshacer").addEventListener("click", () => {
    for (let i = PAGS.length - 1; i >= 0; i--) { const k = PAGS[i].cajas.map((c) => c.tipo).lastIndexOf("mano"); if (k >= 0) { PAGS[i].cajas.splice(k, 1); pinta(PAGS[i]); break; } }
    $("tap-revisado").checked = false; botones(); pintaResumen();
  });
  $("tap-revisado").addEventListener("change", botones);
  $("tap-otra").addEventListener("click", () => { borraTodo(); $("tap-archivo").focus(); });

  // Imagen final: todas las páginas, una debajo de otra, pintadas de nuevo (sin texto debajo ni datos del archivo)
  function imagenFinal() {
    const w = Math.max(...PAGS.map((p) => p.base.width)), sep = 16;
    let h = PAGS.reduce((s, p) => s + p.base.height * (w / p.base.width), 0) + sep * (PAGS.length - 1);
    const k = Math.min(1, 14000 / h), out = lienzo(w * k, h * k), cx = out.getContext("2d");
    cx.fillStyle = "#fff"; cx.fillRect(0, 0, out.width, out.height);
    let y = 0;
    for (const p of PAGS) {
      const ph = p.base.height * (w / p.base.width) * k;
      pinta(p); cx.drawImage(p.cv, 0, y, out.width, ph); y += ph + sep * k;
    }
    return new Promise((ok) => out.toBlob((b) => { out.width = 0; out.height = 0; ok(b); }, "image/png"));
  }
  const nombreFinal = () => (T("tapado") + "-" + (nombre || "documento")).replace(/[^\p{L}\d_-]+/gu, "-").slice(0, 60) + ".png";
  $("tap-bajar").addEventListener("click", async () => {
    if (!PAGS.length || !$("tap-revisado").checked) return;
    let b = null; try { b = await imagenFinal(); } catch (_) { b = null; }
    if (!b) { $("tap-msg").textContent = T("No se ha podido hacer la imagen: el móvil no tiene memoria suficiente. Prueba con menos páginas."); $("tap-msg").className = "msg err"; return; }
    const url = URL.createObjectURL(b), a = document.createElement("a");
    a.href = url; a.download = nombreFinal(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    $("tap-msg").textContent = T("Listo: la imagen tapada está en tus descargas."); $("tap-msg").className = "msg ok";
  });
  $("tap-compartir").addEventListener("click", async () => {
    if (!PAGS.length || !$("tap-revisado").checked) return;
    let b = null; try { b = await imagenFinal(); } catch (_) { b = null; }
    if (!b) { $("tap-msg").textContent = T("No se ha podido hacer la imagen: el móvil no tiene memoria suficiente. Prueba con menos páginas."); $("tap-msg").className = "msg err"; return; }
    const f = new File([b], nombreFinal(), { type: "image/png" });
    try { if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); } catch (_) { /* cancelado */ }
  });
  // Al salir de la herramienta se borra todo de la memoria
  new MutationObserver(() => { if (!vista.classList.contains("activa") && LEIDO) borraTodo(); }).observe(vista, { attributes: true, attributeFilter: ["class"] });
  botones();
})();
