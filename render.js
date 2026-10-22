// Piezas de la web que usan tanto la página pública como la vista previa del panel.

// ---------- Archivos ----------
const EXT_MIME = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", heic: "image/heic", heif: "image/heif",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text", ods: "application/vnd.oasis.opendocument.spreadsheet", txt: "text/plain", csv: "text/csv",
};
window.ACEPTA_ARCHIVOS = Object.keys(EXT_MIME).map(e => "." + e).join(",") + ",application/pdf,image/*";
window.extDe = (nombre) => (String(nombre || "").split(".").pop() || "").toLowerCase();
window.mimeDe = (file) => (file.type && Object.values(EXT_MIME).includes(file.type)) ? file.type : EXT_MIME[extDe(file.name)] || "";
window.tipoArchivo = (tipo, nombre) => {
  const t = tipo || EXT_MIME[extDe(nombre)] || "", e = extDe(nombre);
  if (t.startsWith("image/")) return { ic: "imagen", txt: "Imagen" };
  if (t === "application/pdf") return { ic: "pdf", txt: "PDF" };
  if (/word|opendocument\.text/.test(t)) return { ic: "word", txt: "Word" };
  if (/excel|spreadsheet|csv/.test(t)) return { ic: "hoja", txt: "Excel" };
  if (/powerpoint|presentation/.test(t)) return { ic: "archivo", txt: "PowerPoint" };
  return { ic: "archivo", txt: (e || "archivo").toUpperCase() };
};
window.tamanoTxt = (b) => !b ? "" : b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1048576).toFixed(1).replace(".", ",") + " MB";

window.esImagen = (a) => (a.tipo || "").startsWith("image/") && !/hei[cf]/.test(a.tipo);
window.fotoSrc = (u) => /^blob:/.test(u || "") ? u : urlSegura(u); // blob: solo en la vista previa del panel
window.galeriaHTML = (fotos) => !fotos.length ? "" : `<div class="galeria ${fotos.length === 1 ? "una" : ""}">${fotos.map(f => `<a href="${esc(fotoSrc(f.url))}" target="_blank" rel="noopener" aria-label="Ver la foto ${esc(f.nombre || "")} en grande"><img src="${esc(fotoSrc(f.url))}" alt="" loading="lazy"></a>`).join("")}</div>`;
window.adjuntosHTML = (lista) => {
  if (!lista || !lista.length) return "";
  return `<div class="adjuntos">${lista.map(a => {
    const t = tipoArchivo(a.tipo, a.nombre), esImg = (a.tipo || "").startsWith("image/") && !/hei[cf]/.test(a.tipo);
    return `<a class="adjunto" href="${esc(urlSegura(a.url))}" target="_blank" rel="noopener">
      ${esImg ? `<img src="${esc(a.url)}" alt="" loading="lazy">` : `<span class="ic">${icono(t.ic, "p")}</span>`}
      <span class="txt"><b>${esc(a.nombre || "Archivo")}</b><small>${t.txt}${a.tamano ? " · " + tamanoTxt(a.tamano) : ""}</small></span></a>`;
  }).join("")}</div>`;
};

// ---------- Fechas ----------
window.haceTxt = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "ahora mismo";
  if (s < 3600) return "hace " + Math.round(s / 60) + " min";
  if (s < 86400) return "hace " + Math.round(s / 3600) + " h";
  if (s < 86400 * 2) return "ayer";
  if (s < 86400 * 7) return "hace " + Math.round(s / 86400) + " días";
  return "el " + fechaLarga(d);
};
window.esNuevo = (d) => d && (Date.now() - new Date(d)) < 7 * 86400000;
window.fechasHTML = (publicado, actualizado, palabra = "Publicado") => {
  if (!publicado) return "";
  const editado = actualizado && (new Date(actualizado) - new Date(publicado)) > 120000;
  return `<span class="fechas">${palabra} ${haceTxt(publicado)}${editado ? " · actualizado " + haceTxt(actualizado) : ""}</span>`;
};
const etqNuevo = (d) => esNuevo(d) ? `<span class="etq nuevo">${icono("nuevo", "p")}Nuevo</span>` : "";

// ---------- Avisos ----------
// La primera foto de un aviso sale grande arriba; las demás, en galería; los documentos, en lista
window.tarjetaAviso = (a, { corto = false, nuevo = false, resaltar = "" } = {}) => {
  const adj = a.adjuntos || [], fotos = adj.filter(esImagen), docs = adj.filter(x => !esImagen(x));
  return `
  <article class="panel aviso ${a.urgente ? "urgente" : ""} ${a.fijado ? "fijado" : ""} ${nuevo ? "nuevo" : ""}" id="aviso-${a.id}" data-reg="comunicados:${a.id}" data-lectura="comunicados:${a.id}">
    <div class="cab">
      ${a.urgente ? `<span class="etq urgente">${icono("alerta", "p")}Urgente</span>` : ""}
      ${a.fijado ? `<span class="etq fijado">${icono("fijado", "p")}Fijado</span>` : ""}
      <span class="etq tipo ${claseTipo(a.categoria, "aviso")}">${esc(a.categoria)}</span>
      ${a.urgente ? "" : etqNuevo(a.fecha)}
    </div>
    ${!corto && fotos.length ? `<a class="aviso-foto" href="${esc(fotoSrc(fotos[0].url))}" target="_blank" rel="noopener" aria-label="Ver la foto en grande"><img src="${esc(fotoSrc(fotos[0].url))}" alt="" loading="lazy"></a>` : ""}
    <h3 data-campo="titulo">${esc(a.titulo || "Sin título")}</h3>
    <div class="cuerpo ${corto ? "corto" : ""}" data-campo="contenido">${textoHTML(a.contenido, resaltar)}</div>
    ${corto ? (adj.length ? `<div class="fecha-txt" style="margin-top:8px">${icono("clip", "p")} ${adj.length} archivo(s) adjunto(s)</div>` : "") : galeriaHTML(fotos.slice(1)) + adjuntosHTML(docs)}
    <div class="pie-tarjeta">${fechasHTML(a.fecha, a.actualizado)}
      ${corto ? "" : `<span class="acciones-tarjeta">
        <a class="accion wa" href="${enlaceWhatsApp(textoCompartir(a.titulo, a.contenido, "aviso-" + a.id))}" target="_blank" rel="noopener">${icono("whatsapp", "p")}WhatsApp</a>
        <button class="accion" data-compartir="aviso" data-id="${a.id}">${icono("compartir", "p")}Compartir</button>
        ${botonTraducir()}</span>`}</div>
  </article>`;
};

// ---------- Calendario ----------
// Hora de un evento en texto: "Todo el día" si va de 00:00 a 23:59 (festivos)
window.esTodoElDia = (e) => !!e.hora && e.hora.slice(0, 5) === "00:00" && (!e.hora_fin || e.hora_fin.slice(0, 5) >= "23:59");
window.horaEvento = (e) => !e.hora ? "" : esTodoElDia(e) ? "Todo el día" : e.hora.slice(0, 5) + (e.hora_fin ? "–" + e.hora_fin.slice(0, 5) : "");
window.eventoHTML = (e, conCartel) => `<div class="evento">
  ${conCartel ? cartel(e.fecha, e.tipo, "evento") : ""}
  <div><span class="etq tipo ${claseTipo(e.tipo, "evento")}">${esc(e.tipo)}</span>
    <h4>${esc(e.titulo || "Sin título")}</h4>
    <div class="info">
      ${e.hora ? `<span>${icono("reloj", "p")}${esc(horaEvento(e))}</span>` : ""}
      ${e.lugar ? `<span>${icono("lugar", "p")}${esc(e.lugar)}</span>` : ""}
    </div>
    ${e.descripcion ? `<div>${textoHTML(e.descripcion)}</div>` : ""}
    <div class="acciones-tarjeta acciones-evento">
      <button class="accion" data-ics="${e.id}">${icono("calendario", "p")}Añadir a mi calendario</button>
      <a class="accion wa" href="${enlaceWhatsApp(textoCompartir(e.titulo, fechaDia(e.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) + (e.hora ? ", " + horaEvento(e).toLowerCase() : "") + (e.lugar ? " · " + e.lugar : ""), "calendario"))}" target="_blank" rel="noopener">${icono("whatsapp", "p")}WhatsApp</a>
    </div></div></div>`;

// ---------- Convenio ----------
window.apartadoHTML = (s, qr = "", abierto = false) => `<details class="panel apartado" ${abierto ? "open" : ""} data-reg="convenio_secciones:${s.id}">
  <summary><div class="txt">
    <div class="meta"><span class="etq tipo ${claseTipo(s.categoria, "convenio")}">${esc(s.categoria)}</span>${s.articulo ? `<span class="etq">${esc(s.articulo)}</span>` : ""}</div>
    <h3 data-campo="titulo">${esc(s.titulo || "Sin título")}</h3>${s.resumen ? `<div class="res" data-campo="resumen" data-plano>${esc(s.resumen)}</div>` : ""}</div>
    ${icono("abajo", "flecha")}</summary>
  <div class="contenido"><div data-campo="contenido">${textoHTML(s.contenido, qr)}</div>
    ${adjuntosHTML(s.adjuntos)}
    <div class="pie-tarjeta" style="margin-top:12px">${s.actualizado ? `<span class="fechas">Actualizado ${haceTxt(s.actualizado)}</span>` : "<span></span>"}<span class="acciones-tarjeta">${botonTraducir()}</span></div></div></details>`;

// ---------- Actas ----------
window.actaHTML = (a, qr = "") => `<article class="panel acta" data-reg="actas:${a.id}" data-lectura="actas:${a.id}">
  ${a.fecha ? cartel(a.fecha, a.tipo, "acta") : ""}
  <div><div class="cab"><span class="etq tipo ${claseTipo(a.tipo, "acta")}">${esc(a.tipo)}</span>${etqNuevo(a.creado)}</div>
    <h3 data-campo="titulo">${esc(a.titulo || "Sin título")}</h3>
    ${a.fecha ? `<div class="fecha-txt">Reunión del ${fechaLarga(a.fecha + "T12:00:00")}</div>` : ""}
    ${a.resumen ? `<div style="margin-top:8px" data-campo="resumen">${textoHTML(a.resumen, qr)}</div>` : ""}
    ${a.acuerdos ? `<div class="acuerdos"><b>Acuerdos</b><div data-campo="acuerdos">${textoHTML(a.acuerdos, qr)}</div></div>` : ""}
    ${adjuntosHTML(a.adjuntos)}
    <div class="pie-tarjeta">${fechasHTML(a.creado, a.actualizado)}<span class="acciones-tarjeta">${botonTraducir()}</span></div>
  </div></article>`;

// ---------- Documentos ----------
window.docHTML = (d) => {
  const t = tipoArchivo(d.tipo_archivo, d.nombre_archivo || d.url);
  return `<a class="panel documento" href="${esc(urlSegura(d.url || "#"))}" target="_blank" rel="noopener" data-abre="documentos:${d.id}">
    <span class="ic ${t.ic}">${icono(t.ic)}</span>
    <span class="txt">
      <span class="cab"><span class="etq tipo ${claseTipo(d.categoria, "documento")}">${esc(d.categoria)}</span>${etqNuevo(d.fecha)}</span>
      <b>${esc(d.titulo || "Sin título")}</b>
      ${d.descripcion ? `<span class="desc">${esc(d.descripcion)}</span>` : ""}
      <small>${t.txt}${d.tamano ? " · " + tamanoTxt(d.tamano) : ""} · Subido ${haceTxt(d.fecha)}</small>
    </span>
    <span class="abrir">${icono("pdf", "p")}<span>Abrir</span></span>
  </a>`;
};

// ---------- Apartados (Comité de empresa, etc.) ----------
// Una publicación: fecha, título, texto, galería de fotos y documentos
window.publicacionHTML = (x, qr = "") => {
  const adj = x.adjuntos || [], fotos = adj.filter(esImagen), docs = adj.filter(a => !esImagen(a));
  const d = x.fecha ? fechaDia(x.fecha) : null;
  return `<article class="panel publicacion" id="pub-${x.id}" data-lectura="publicaciones:${x.id}">
    ${d ? `<div class="pub-fecha"><b>${d.getDate()}</b>${MESES[d.getMonth()].slice(0, 3)}</div>` : ""}
    <div class="pub-cuerpo">
      <h3>${esc(x.titulo || "Sin título")}</h3>
      ${d ? `<div class="fecha-txt">${fechaLarga(x.fecha + "T12:00:00")}</div>` : ""}
      ${x.contenido ? `<div class="pub-texto">${textoHTML(x.contenido, qr)}</div>` : ""}
      ${galeriaHTML(fotos)}
      ${adjuntosHTML(docs)}
    </div></article>`;
};

// ---------- Calculadoras del convenio ----------
window.numTxt = (n) => Number(n || 0).toLocaleString("es-ES", { maximumFractionDigits: 1 });
window.eurosTxt = (n) => Number(n || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
// Resultado del asistente de permisos: cuánto te corresponde y por qué
window.resultadoPermisoHTML = (p, conExtra) => {
  const tiempo = p.unidad === "tiempo necesario";
  const total = Number(p.dias || 0) + (conExtra ? Number(p.dias_extra || 0) : 0);
  return `<div class="resultado-calc">
    <span class="rc-tit">${esc(p.nombre || "Permiso")}</span>
    <span class="rc-num">${tiempo ? "El tiempo necesario" : `${numTxt(total)} <small>${esc(p.unidad)}</small>`}</span>
    ${conExtra && Number(p.dias_extra) ? `<span class="rc-sub">${numTxt(p.dias)} + ${numTxt(p.dias_extra)} por desplazamiento</span>` : ""}
    ${p.detalle ? `<p>${esc(p.detalle)}</p>` : ""}
    ${p.articulo ? `<span class="rc-sub">${esc(p.articulo)}</span>` : ""}
  </div>`;
};

// ---------- Preguntas frecuentes ----------
window.preguntaHTML = (p, qr = "", abierta = false) => `<details class="panel apartado pregunta" ${abierta ? "open" : ""} data-reg="preguntas:${p.id}">
  <summary><div class="txt">
    <div class="meta"><span class="etq tipo ${claseTipo(p.categoria, "pregunta")}">${esc(p.categoria)}</span></div>
    <h3 data-campo="pregunta">${esc(p.pregunta || "Sin pregunta")}</h3></div>
    ${icono("abajo", "flecha")}</summary>
  <div class="contenido"><div data-campo="respuesta">${textoHTML(p.respuesta, qr)}</div>
    <div class="pie-tarjeta" style="margin-top:12px">${p.actualizado ? `<span class="fechas">Actualizado ${haceTxt(p.actualizado)}</span>` : "<span></span>"}<span class="acciones-tarjeta">${botonTraducir()}</span></div></div></details>`;

// ---------- Traducir ----------
window.IDIOMAS = { ca: "Català", en: "English", ro: "Română", ar: "العربية", fr: "Français", pt: "Português", de: "Deutsch", pl: "Polski", sr: "Српски" };
window.botonTraducir = () => `<span class="traducir"><button class="accion" data-traducir aria-haspopup="true">${icono("idioma", "p")}Traducir</button></span>`;

// ---------- Fechas para buscar ----------
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
window.MESES = MESES;
window.textoFecha = (iso) => {
  if (!iso) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? fechaDia(iso) : new Date(iso);
  const dd = d.getDate(), mm = d.getMonth() + 1, yy = d.getFullYear(), p = (n) => String(n).padStart(2, "0");
  return [`${dd}/${mm}/${yy}`, `${p(dd)}/${p(mm)}/${yy}`, `${dd}/${mm}`, `${p(dd)}/${p(mm)}`, `${dd}-${mm}-${yy}`, `${p(dd)}-${p(mm)}-${yy}`,
    `${dd} de ${MESES[mm - 1]} de ${yy}`, `${dd} de ${MESES[mm - 1]}`, `${MESES[mm - 1]} ${yy}`, `${MESES[mm - 1]} de ${yy}`].join(" ");
};
// Partes de una fecha (año, mes, día) en hora de Madrid
window.partesFecha = (iso) => {
  if (!iso) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? fechaDia(iso) : new Date(iso);
  return { a: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` };
};

// ---------- Delegados y enlaces ----------
const soloNum = (t) => String(t || "").replace(/[^\d+]/g, "");
const iniciales = (n) => String(n || "").trim().split(/\s+/).slice(0, 2).map(p => p[0] || "").join("").toUpperCase();
window.delegadoHTML = (d) => {
  const tel = soloNum(d.telefono), wa = tel ? tel.replace(/^\+/, "").replace(/^(?!34)(\d{9})$/, "34$1") : "";
  return `<div class="panel delegado">
    <span class="avatar">${esc(iniciales(d.nombre))}</span>
    <div class="txt"><b>${esc(d.nombre || "Sin nombre")}</b><span class="cargo">${esc(d.cargo || "")}</span>${d.detalle ? `<small>${esc(d.detalle)}</small>` : ""}
      ${tel || d.email ? `<div class="acciones-tarjeta">
        ${tel ? `<a class="accion" href="tel:${esc(tel)}">${icono("movil", "p")}Llamar</a><a class="accion wa" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">${icono("whatsapp", "p")}WhatsApp</a>` : ""}
        ${d.email ? `<a class="accion" href="mailto:${esc(d.email)}">${icono("correo", "p")}Email</a>` : ""}</div>` : ""}
    </div></div>`;
};
// Un país de «Restricciones para camiones» (Zona Conductores). Lo usan la web y la vista previa del panel.
// Siempre abre la página oficial (siempre al día). Si no está en español, se avisa de que el navegador del móvil
// la traduce: el traductor de Google por enlace (translate.goog) lo bloquean algunas webs oficiales (BALM, v31).
window.restrTraducida = (r) => !!String(r.idioma || "").trim() && !/espa[nñ]ol|castellano/i.test(r.idioma);
window.restriccionHTML = (r) => {
  let dom = ""; try { dom = new URL(r.url).hostname.replace(/^www\./, ""); } catch (_) {}
  const trad = restrTraducida(r);
  return `<a class="panel enlace-util" href="${esc(urlSegura(r.url))}" target="_blank" rel="noopener">
    <span class="ic">${icono(trad ? "idioma" : "lugar", "p")}</span><span class="txt"><b>${esc(r.pais || "País")}</b>${r.fuente ? `<small>${esc(r.fuente)}</small>` : ""}<span class="dom">${[r.idioma, dom].filter(Boolean).map(esc).join(" · ")}</span>${trad ? `<span class="restr-trad">Al abrirla, tu móvil te ofrece traducirla al español.</span>` : ""}</span>${icono("der", "p")}</a>`;
};
window.enlaceHTML = (e) => {
  let dom = ""; try { dom = new URL(e.url).hostname.replace(/^www\./, ""); } catch (_) {}
  return `<a class="panel enlace-util" href="${esc(urlSegura(e.url))}" target="_blank" rel="noopener">
    <span class="ic">${icono("idioma", "p")}</span><span class="txt"><b>${esc(e.titulo || "Enlace")}</b>${e.descripcion ? `<small>${esc(e.descripcion)}</small>` : ""}<span class="dom">${esc(dom)}</span></span>${icono("der", "p")}</a>`;
};
