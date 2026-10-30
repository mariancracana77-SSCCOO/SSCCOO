// Conexión con Supabase. Esta clave es pública: solo permite LEER.
// Para publicar hace falta iniciar sesión con la cuenta de admin.
window.SUPABASE_URL = "https://kdfedwcskymaitvpryvg.supabase.co";
window.SUPABASE_KEY = "sb_publishable_RLt0HuAMskXkKl2hxhUF2w_sCexGznp";
window.sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
window.VERSION_WEB = "101"; // cambiar junto con ?v= en los HTML y VERSION en sw.js
window.WEB_URL = "https://mariancracana77-ssccoo.github.io/SSCCOO/";
// Clave pública de las notificaciones (la privada solo está en el servidor)
window.VAPID_PUBLICA = "BMMdZjehtNipsScHJ__kzOIn9XCgIpya3UDDRlexxOAWJU-J6ZICDlf72ItPOebzl-SfzoU234pd82Chp87Vm1w";

// ---- Listas editables (categorías y tipos) ----
// Se guardan en la tabla "opciones" y se editan desde Ajustes en el panel.
// Estas de aquí solo se usan si no se puede leer la base de datos.
window.OPC = {
  aviso: [["General", "gris"], ["Asamblea", "rojo"], ["Convenio", "azul"], ["Nóminas", "verde"]],
  evento: [["Asamblea", "rojo"], ["Reunión", "azul"], ["Negociación", "ambar"], ["Elecciones", "morado"], ["Festivo", "verde"], ["Otro", "gris"]],
  acta: [["Comité de empresa", "azul"], ["Asamblea", "rojo"], ["Negociación", "ambar"], ["Otra", "gris"]],
  convenio: [["General", "gris"], ["Jornada", "azul"], ["Vacaciones", "ambar"], ["Permisos", "verde"], ["Salario", "rojo"]],
  documento: [["Convenio", "azul"], ["Otros", "gris"]],
  pregunta: [["General", "gris"]],
};
window.COLORES = { rojo: "Rojo", azul: "Azul", ambar: "Ámbar", verde: "Verde", morado: "Morado", turquesa: "Turquesa", rosa: "Rosa", gris: "Gris" };
window.cargarOpciones = async () => {
  const { data, error } = await sb.from("opciones").select("*").order("orden").order("id");
  if (error || !data?.length) return;
  const n = {}; data.forEach(o => (n[o.lista] ||= []).push([o.nombre, o.color, o.id]));
  Object.keys(OPC).forEach(k => OPC[k] = n[k] || []);
  window.OPC_FILAS = data;
};
window.nombres = (lista) => (OPC[lista] || []).map(o => o[0]);
const colorDe = (t) => { for (const l of ["evento", "acta", "aviso", "convenio", "documento", "pregunta"]) { const o = (OPC[l] || []).find(x => x[0] === t); if (o) return o[1]; } return "gris"; };

// ---- Utilidades ----
window.esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Convierte texto sencillo en HTML: párrafos, listas con "- ", **negrita** y enlaces.
window.textoHTML = (s, resaltar) => {
  const linea = (t) => {
    let h = esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    if (resaltar) {
      const r = resaltar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      h = h.replace(new RegExp(`(?![^<]*>)(${r})`, "gi"), "<mark>$1</mark>");
    }
    return h;
  };
  // Agrupa las líneas: las que empiezan por "- " forman listas; el resto, párrafos.
  const esLista = (l) => /^\s*[-•*]\s+/.test(l);
  return String(s ?? "").trim().split(/\n\s*\n/).map(bloque => {
    const out = []; let lista = [], texto = [];
    const cerrarTexto = () => { if (texto.length) out.push("<p>" + texto.map(linea).join("<br>") + "</p>"); texto = []; };
    const cerrarLista = () => { if (lista.length) out.push("<ul>" + lista.map(l => "<li>" + linea(l.replace(/^\s*[-•*]\s+/, "")) + "</li>").join("") + "</ul>"); lista = []; };
    bloque.split("\n").forEach(l => { if (esLista(l)) { cerrarTexto(); lista.push(l); } else { cerrarLista(); texto.push(l); } });
    cerrarTexto(); cerrarLista();
    return out.join("");
  }).join("");
};

window.fechaLarga = (d) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
window.fechaDia = (iso) => new Date(iso + "T12:00:00");
window.hoyISO = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
window.claseTipo = (t, lista) => {
  const o = lista && (OPC[lista] || []).find(x => x[0] === t);
  return "c-" + (o ? o[1] : colorDe(t));
};
window.cartel = (iso, tipo, lista) => {
  const d = fechaDia(iso);
  return `<div class="cartel ${claseTipo(tipo, lista)}"><b>${d.getDate()}</b><span>${d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")}</span></div>`;
};

// ---- Compartir y calendario ----
const limpioTxt = (t, n) => { t = String(t || "").replace(/\*\*/g, "").trim(); return n && t.length > n ? t.slice(0, n - 1) + "…" : t; };
window.textoCompartir = (titulo, cuerpo, ancla) => `*${limpioTxt(titulo)}*\n\n${limpioTxt(cuerpo, 500)}\n\nMás información: ${WEB_URL}${ancla ? "#" + ancla : ""}`;
window.enlaceWhatsApp = (texto) => "https://wa.me/?text=" + encodeURIComponent(texto);
window.compartir = async (titulo, texto) => {
  if (navigator.share) { try { await navigator.share({ title: titulo, text: texto }); return; } catch (e) { if (e.name === "AbortError") return; } }
  window.open(enlaceWhatsApp(texto), "_blank");
};
// Archivo .ics para añadir una fecha al calendario del móvil
window.descargarICS = (e) => {
  const d = e.fecha.replace(/-/g, ""), ahora = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const hm = (h) => (h || "").replace(":", "").padEnd(4, "0") + "00";
  const escI = (t) => String(t || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  let ini, fin;
  if (e.hora && !window.esTodoElDia?.(e)) { ini = `DTSTART;TZID=Europe/Madrid:${d}T${hm(e.hora)}`; fin = `DTEND;TZID=Europe/Madrid:${d}T${hm(e.hora_fin || (String(+e.hora.slice(0, 2) + 1).padStart(2, "0") + e.hora.slice(2)))}`; }
  else { const sig = new Date(fechaDia(e.fecha).getTime() + 86400000); ini = `DTSTART;VALUE=DATE:${d}`; fin = `DTEND;VALUE=DATE:${sig.getFullYear()}${String(sig.getMonth() + 1).padStart(2, "0")}${String(sig.getDate()).padStart(2, "0")}`; }
  // Avisos del calendario del móvil: el día antes y 2 horas antes (si es de todo el día, la tarde anterior a las 18:00)
  const alarma = (t, txt) => ["BEGIN:VALARM", "TRIGGER:" + t, "ACTION:DISPLAY", "DESCRIPTION:" + escI(txt), "END:VALARM"];
  const alarmas = ini.includes("VALUE=DATE") ? alarma("-PT6H", "Mañana: " + e.titulo) : [...alarma("-P1D", "Mañana: " + e.titulo), ...alarma("-PT2H", e.titulo)];
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CCOO Calsina Carre//ES", "BEGIN:VEVENT", `UID:evento-${e.id || d}@ccoo-calsina`, `DTSTAMP:${ahora}`, ini, fin,
    `SUMMARY:${escI(e.titulo)}`, e.lugar ? `LOCATION:${escI(e.lugar)}` : "", `DESCRIPTION:${escI((e.descripcion || "") + "\nSección Sindical CCOO Calsina Carré")}`,
    ...alarmas, "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = (e.titulo || "evento").replace(/[^\wáéíóúñ ]+/gi, "").slice(0, 40) + ".ics";
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
};

// ---- Ajustes de lectura (botón Aa): se guardan solo en este móvil ----
window.LECTURA = (() => { try { return JSON.parse(localStorage.getItem("ccoo-lectura") || "{}"); } catch (_) { return {}; } })();
window.aplicarLectura = () => {
  const h = document.documentElement, L = window.LECTURA;
  L.letra && L.letra !== "normal" ? h.setAttribute("data-letra", L.letra) : h.removeAttribute("data-letra");
  L.contraste === "alto" ? h.setAttribute("data-contraste", "alto") : h.removeAttribute("data-contraste");
  L.tema && L.tema !== "auto" ? h.setAttribute("data-theme", L.tema) : h.removeAttribute("data-theme");
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = "#c4122f";
};
window.abrirLectura = () => {
  const L = window.LECTURA, op = (grupo, val, txt, muestra) => `<button data-g="${grupo}" data-v="${val}" class="${(L[grupo] || (grupo === "letra" ? "normal" : grupo === "tema" ? "auto" : "normal")) === val ? "activa" : ""}">${muestra || ""}<span>${txt}</span></button>`;
  const v = document.createElement("div"); v.className = "modal-velo";
  v.innerHTML = `<div class="modal lectura" role="dialog" aria-modal="true" aria-label="Ajustes de lectura"><h2>Ajustes de lectura</h2>
    <p class="fecha-txt" style="margin:0">Solo cambian en este móvil u ordenador.</p>
    <h3>Tamaño de letra</h3><div class="opciones-lectura">
      ${op("letra", "normal", "Normal", '<span class="muestra" style="font-size:1.1rem">Aa</span>')}
      ${op("letra", "grande", "Grande", '<span class="muestra" style="font-size:1.45rem">Aa</span>')}
      ${op("letra", "muy-grande", "Muy grande", '<span class="muestra" style="font-size:1.8rem">Aa</span>')}</div>
    <h3>Contraste</h3><div class="opciones-lectura" style="grid-template-columns:1fr 1fr">
      ${op("contraste", "normal", "Normal")}${op("contraste", "alto", "Alto")}</div>
    <h3>Colores</h3><div class="opciones-lectura">
      ${op("tema", "auto", "Automático")}${op("tema", "light", "Claro")}${op("tema", "dark", "Oscuro")}</div>
    <div class="botones"><button class="btn" data-cerrar>Listo</button></div></div>`;
  v.onclick = (e) => {
    const b = e.target.closest("[data-g]");
    if (b) { L[b.dataset.g] = b.dataset.v; try { localStorage.setItem("ccoo-lectura", JSON.stringify(L)); } catch (_) {}
      // Al cambiar los colores, el nuevo se extiende en círculo desde el botón (si el navegador lo permite y no se ha pedido reducir movimiento)
      if (b.dataset.g === "tema" && document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const r = b.getBoundingClientRect(), h = document.documentElement;
        h.style.setProperty("--vt-x", (r.left + r.width / 2) + "px"); h.style.setProperty("--vt-y", (r.top + r.height / 2) + "px");
        document.startViewTransition(() => aplicarLectura());
      } else aplicarLectura();
      v.querySelectorAll(`[data-g="${b.dataset.g}"]`).forEach(x => x.classList.toggle("activa", x === b)); return; }
    if (e.target === v || e.target.closest("[data-cerrar]")) v.remove();
  };
  document.body.appendChild(v); v.querySelector(".activa")?.focus();
};
aplicarLectura();

// Botón «Aa» (tamaño de letra y colores)
document.addEventListener("click", (e) => { if (e.target.closest?.("[data-aa]")) abrirLectura(); });

// ---- PDF sencillo hecho aquí mismo (sin librerías ni servidores): copias de «Mis descansos» y «Mis incentivos» ----
// lineas = [texto, tamaño, negrita, sangría]. «marca» va en una línea de comentario que los lectores de PDF no enseñan
// (ahí van los datos para recuperarlos). Letra Helvetica en Windows-1252: solo alfabeto latino.
// Semana del año (ISO 8601: de lunes a domingo; la semana 1 es la que tiene el primer jueves). Es la numeración de los
// calendarios de pared, los tacógrafos y las empresas de transporte (v84, lo pidió el padre: «estamos en la 44»).
// Devuelve { n: número de semana, a: año al que pertenece (una semana de enero puede ser la 52/53 del año anterior) }.
window.semanaISO = (d) => {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), dia = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - dia); // al jueves de esa semana
  const a = x.getUTCFullYear(), n = Math.ceil(((x - Date.UTC(a, 0, 1)) / 864e5 + 1) / 7);
  return { n, a };
};
// Lunes (hora local, a mediodía) de la semana n del año a (ISO)
window.lunesSemanaISO = (a, n) => {
  const j4 = new Date(a, 0, 4, 12), lunes1 = new Date(j4); lunes1.setDate(j4.getDate() - ((j4.getDay() + 6) % 7));
  lunes1.setDate(lunes1.getDate() + (n - 1) * 7); return lunes1;
};
// Cuántas semanas ISO tiene un año (52 o 53)
window.semanasDelAnio = (a) => semanaISO(new Date(a, 11, 28)).n;

// v88: el logo como JPEG con fondo blanco (192 px) para ponerlo en los PDF; se prepara una vez y se guarda
let LOGO_PDF = null;
window.logoParaPDF = () => LOGO_PDF || (LOGO_PDF = new Promise(res => {
  const im = new Image();
  im.onload = () => { try { const c = document.createElement("canvas"); c.width = c.height = 192; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 192, 192); g.drawImage(im, 0, 0, 192, 192); res({ jpeg: atob(c.toDataURL("image/jpeg", .9).split(",")[1]), w: 192, h: 192 }); } catch (_) { res(null); } };
  im.onerror = () => res(null); im.src = "logo.png";
}));
// op.logo = { jpeg, w, h } (de logoParaPDF): sale en la primera página arriba a la izquierda, 58 pt; las primeras líneas deben llevar x = 70 para no pisarlo
window.pdfSencillo = (lineas, marca, op = {}) => {
  // Partir en renglones que quepan (Helvetica ~0,5 em por letra) y en páginas A4
  // v88: cada línea puede llevar color (5.º valor, [r, g, b] de 0 a 1; sin él, negro) y hay bandas de color con letra blanca: { banda: "texto", color, tam }
  const ANCHO = 515, renglones = [], rgb = (c) => (c || [0, 0, 0]).map(v => (+v).toFixed(3)).join(" ");
  lineas.forEach((ln) => {
    if (ln && !Array.isArray(ln) && ln.banda != null) { renglones.push({ banda: String(ln.banda), color: ln.color, tam: ln.tam || 14, x: ln.x || 0 }); return; }
    const [t, tam = 10, neg = false, x = 0, color = null] = ln;
    const max = Math.floor((ANCHO - x) / (tam * 0.5)); let resto = String(t);
    if (!resto) { renglones.push(["", tam, neg, x, color]); return; }
    while (resto.length > max) { let i = resto.lastIndexOf(" ", max); if (i < max * 0.5) i = max; renglones.push([resto.slice(0, i), tam, neg, x, color]); resto = resto.slice(i).trimStart(); }
    renglones.push([resto, tam, neg, x, color]);
  });
  const paginas = [[]]; let y = 800;
  renglones.forEach(r => { const alto = r.banda ? r.tam * 2.2 : r[1] * 1.45; if (y - alto < 50) { paginas.push([]); y = 800; } y -= alto; paginas[paginas.length - 1].push(r.banda ? { ...r, y } : [...r, y]); });
  // Texto en Windows-1252 (letras con tilde, ñ, «») y escapado para el PDF
  const cp = (t) => [...t].map(ch => { const n = ch.charCodeAt(0); return n < 256 ? ch : ({ "–": "\x96", "—": "\x97", "‘": "'", "’": "'", "“": '"', "”": '"', "€": "\x80", "…": "..." }[ch] || "?"); }).join("").replace(/[\\()]/g, m => "\\" + m);
  const objs = [], pag = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  const logo = op.logo && op.logo.jpeg ? op.logo : null, base = logo ? 6 : 5;
  if (logo) objs[5] = `<< /Type /XObject /Subtype /Image /Width ${logo.w} /Height ${logo.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.jpeg.length} >>\nstream\n${logo.jpeg}\nendstream`;
  paginas.forEach((ls, i) => {
    const n = base + i * 2, cont = (logo && i === 0 ? "q 58 0 0 58 40 744 cm /Im1 Do Q\n" : "") + ls.map(r => {
      if (r.banda) return `q ${rgb(r.color)} rg ${40 + r.x} ${(r.y - r.tam * 0.55).toFixed(1)} ${ANCHO - r.x} ${(r.tam * 2).toFixed(1)} re f Q BT /F2 ${r.tam} Tf 1 1 1 rg ${50 + r.x} ${(r.y + r.tam * 0.1).toFixed(1)} Td (${cp(r.banda)}) Tj ET`;
      const [t, tam, neg, x, color, yy] = r; return t ? `BT /${neg ? "F2" : "F1"} ${tam} Tf ${rgb(color)} rg ${40 + x} ${yy.toFixed(1)} Td (${cp(t)}) Tj ET` : "";
    }).filter(Boolean).join("\n")
      + `\nBT /F1 8 Tf 40 30 Td (${cp("Página " + (i + 1) + " de " + paginas.length)}) Tj ET`;
    objs[n] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${logo ? " /XObject << /Im1 5 0 R >>" : ""} >> /Contents ${n + 1} 0 R >>`;
    objs[n + 1] = `<< /Length ${cont.length} >>\nstream\n${cont}\nendstream`;
    pag.push(`${n} 0 R`);
  });
  objs[2] = `<< /Type /Pages /Kids [${pag.join(" ")}] /Count ${pag.length} >>`;
  let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n" + (marca ? marca + "\n" : "");
  const pos = [];
  for (let i = 1; i < objs.length; i++) { pos[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + pos.slice(1).map(p => String(p).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([Uint8Array.from(out, ch => ch.charCodeAt(0) & 255)], { type: "application/pdf" });
};
// Lee los datos guardados en la «marca» de un PDF hecho con pdfSencillo (o un .json antiguo)
window.leePDFSencillo = (txt, marca) => {
  if (!txt.startsWith("%PDF")) return JSON.parse(txt);
  const i = txt.indexOf(marca); if (i < 0) throw 0;
  return JSON.parse(decodeURIComponent(escape(atob(txt.slice(i + marca.length, txt.indexOf("\n", i)).trim()))));
};

// Solo enlaces web, email o teléfono (nunca «javascript:» ni otros esquemas)
window.urlSegura = (u) => { u = String(u || "").trim(); return /^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : "#"; };

// ---------- Buscar perdonando faltas (v52) ----------
// «bacasiones» encuentra «vacaciones», «nomina» encuentra «nómina», «asanblea» encuentra «asamblea».
// Primero se busca tal cual; si no, por cómo suena (b/v, c/z/s, ll/y, h muda, g/j…) y con una o dos letras de diferencia.
window.fonetico = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/ch/g, "7").replace(/ll/g, "y").replace(/qu/g, "k").replace(/c([ei])/g, "s$1").replace(/z/g, "s").replace(/c/g, "k")
  .replace(/g([ei])/g, "j$1").replace(/[vw]/g, "b").replace(/h/g, "").replace(/x/g, "ks").replace(/7/g, "ch").replace(/m([bp])/g, "n$1").replace(/(.)\1+/g, "$1");
const distancia = (a, b, max) => { // letras de diferencia (Levenshtein), parando en cuanto pasa de «max»
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let menor = i;
    for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); menor = Math.min(menor, cur[j]); }
    if (menor > max) return max + 1; prev = cur;
  }
  return prev[b.length];
};
const CACHE_FON = new Map();
window.coincide = (texto, q) => {
  const sin = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const Q = sin(q).trim(); if (!Q) return true;
  const T = sin(texto); if (T.includes(Q)) return true;
  let f = CACHE_FON.get(T);
  if (!f) { const tf = fonetico(T); f = { tf, palabras: [...new Set(tf.split(/[^a-z0-9ñ]+/).filter(p => p.length > 2))] }; if (CACHE_FON.size > 3000) CACHE_FON.clear(); CACHE_FON.set(T, f); }
  return fonetico(Q).split(/[^a-z0-9ñ]+/).filter(Boolean).every(w => {
    if (f.tf.includes(w)) return true;
    if (w.length < 4 || !/[a-z]/.test(w)) return false;
    const max = w.length >= 7 ? 2 : 1;
    return f.palabras.some(p => distancia(w, p, max) <= max || (p.length > w.length && distancia(w, p.slice(0, w.length), max) <= max));
  });
};

// Ventanas (.modal-velo), en la web y en el panel: el foco entra en la ventana (el lector de pantalla lee su título),
// Tab no se sale de ella, Escape la cierra como «Cancelar» y, al cerrarse, el foco vuelve a donde estaba.
(function () {
  let n = 0;
  const FOCO = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
  const ultima = () => { const vs = document.querySelectorAll(".modal-velo"); return vs[vs.length - 1] || null; };
  const preparar = (v) => {
    const m = v.querySelector("[role=dialog], .modal"); if (!m) return;
    v._antes = document.activeElement;
    m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const h = m.querySelector("h2, h3");
    if (h && !m.hasAttribute("aria-labelledby")) { h.id = h.id || "ventana-tit-" + (++n); m.setAttribute("aria-labelledby", h.id); }
    if (!m.hasAttribute("tabindex")) m.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => { if (v.isConnected && !m.contains(document.activeElement)) m.focus({ preventScroll: true }); });
  };
  new MutationObserver((ms) => ms.forEach(r => {
    r.addedNodes.forEach(el => { if (el.nodeType === 1 && el.classList.contains("modal-velo")) preparar(el); });
    r.removedNodes.forEach(el => {
      if (el.nodeType !== 1 || !el.classList.contains("modal-velo")) return;
      const a = el._antes; if (a && a.isConnected && !ultima() && (document.activeElement === document.body || !document.activeElement)) a.focus({ preventScroll: true });
    });
  })).observe(document.body, { childList: true });
  document.addEventListener("keydown", (e) => {
    const v = ultima(); if (!v) return;
    if (e.key === "Escape") {
      const no = v.querySelector("[data-no], [data-r='no'], [data-r='volver'], [data-cerrar]");
      if (no) no.click(); else v.click(); // tocar fuera de la ventana también la cierra
      e.preventDefault(); e.stopPropagation();
    } else if (e.key === "Tab") {
      const fs = [...v.querySelectorAll(FOCO)].filter(x => x.offsetParent !== null); if (!fs.length) return e.preventDefault();
      const i = fs.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); fs[fs.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === fs.length - 1)) { e.preventDefault(); fs[0].focus(); }
    }
  }, true);
})();

// Versión nueva: cuando el service worker nuevo toma el control (se publicó otra versión), se avisa con una banda
// «Actualizar». Sin esto, la app instalada que se reanuda (Android la deja abierta en segundo plano) seguía enseñando
// la versión vieja. Al volver a la app se pregunta si hay versión nueva.
(function () {
  if (!("serviceWorker" in navigator)) return;
  const habia = !!navigator.serviceWorker.controller; // la primera vez que se instala no hay que avisar de nada
  const comprobar = () => navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {});
  document.addEventListener("visibilitychange", () => { if (!document.hidden) comprobar(); });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!habia || document.getElementById("banda-version")) return;
    const b = document.createElement("div");
    b.id = "banda-version"; b.className = "banda-version"; b.setAttribute("role", "status");
    b.innerHTML = `<span>Hay una versión nueva.</span><button type="button" class="btn">Actualizar</button>`;
    b.querySelector("button").addEventListener("click", () => location.reload());
    document.body.appendChild(b);
  });
})();

// v95: botón «Ir» de las guías rápidas: baja hasta el sitio y lo resalta un momento (espera a que se pinte si tarda)
window.irAGuia = (sel) => {
  let n = 0;
  document.querySelectorAll(".guia-destaca").forEach(x => x.classList.remove("guia-destaca"));
  const busca = () => {
    const el = typeof sel === "function" ? sel() : document.querySelector(sel);
    if (!el || !el.offsetParent) { if (n++ < 20) setTimeout(busca, 100); return; }
    el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    document.querySelectorAll(".guia-destaca").forEach(x => x.classList.remove("guia-destaca")); void el.offsetWidth; el.classList.add("guia-destaca");
    clearTimeout(irAGuia.t); irAGuia.t = setTimeout(() => el.classList.remove("guia-destaca"), 2600);
  };
  setTimeout(busca, 60);
};
// tx = { ir, irA(t) }: los textos del botón, ya traducidos por cada sección (tienen que estar escritos como T("…") en su archivo para que se traduzcan)
window.guiaPasosHTML = (pasos, tx) => `<ol class="desc-guia-pasos">${pasos.map(([t, d, ir], i) => `<li><b>${esc(t)}</b><span>${esc(d)}</span>${ir ? `<button type="button" class="guia-ir" data-guia-ir="${i}" aria-label="${esc(tx.irA(t))}">${esc(tx.ir)}<svg class="icono p" aria-hidden="true"><use href="#i-der"/></svg></button>` : ""}</li>`).join("")}</ol>`;
