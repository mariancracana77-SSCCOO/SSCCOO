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

window.adjuntosHTML = (lista) => {
  if (!lista || !lista.length) return "";
  return `<div class="adjuntos">${lista.map(a => {
    const t = tipoArchivo(a.tipo, a.nombre), esImg = (a.tipo || "").startsWith("image/") && !/hei[cf]/.test(a.tipo);
    return `<a class="adjunto" href="${esc(a.url)}" target="_blank" rel="noopener">
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
window.fechasHTML = (publicado, actualizado) => {
  if (!publicado) return "";
  const editado = actualizado && (new Date(actualizado) - new Date(publicado)) > 120000;
  return `<span class="fechas">Publicado ${haceTxt(publicado)}${editado ? " · actualizado " + haceTxt(actualizado) : ""}</span>`;
};
const etqNuevo = (d) => esNuevo(d) ? `<span class="etq nuevo">${icono("nuevo", "p")}Nuevo</span>` : "";

// ---------- Avisos ----------
window.tarjetaAviso = (a, { corto = false, nuevo = false, resaltar = "" } = {}) => `
  <article class="panel aviso ${a.urgente ? "urgente" : ""} ${a.fijado ? "fijado" : ""} ${nuevo ? "nuevo" : ""}">
    <div class="cab">
      ${a.urgente ? `<span class="etq urgente">${icono("alerta", "p")}Urgente</span>` : ""}
      ${a.fijado ? `<span class="etq fijado">${icono("fijado", "p")}Fijado</span>` : ""}
      <span class="etq tipo ${claseTipo(a.categoria, "aviso")}">${esc(a.categoria)}</span>
      ${a.urgente ? "" : etqNuevo(a.fecha)}
    </div>
    <h3>${esc(a.titulo || "Sin título")}</h3>
    <div class="cuerpo ${corto ? "corto" : ""}">${textoHTML(a.contenido, resaltar)}</div>
    ${corto ? (a.adjuntos?.length ? `<div class="fecha-txt" style="margin-top:8px">${icono("clip", "p")} ${a.adjuntos.length} archivo(s) adjunto(s)</div>` : "") : adjuntosHTML(a.adjuntos)}
    <div class="pie-tarjeta">${fechasHTML(a.fecha, a.actualizado)}</div>
  </article>`;

// ---------- Calendario ----------
window.eventoHTML = (e, conCartel) => `<div class="evento">
  ${conCartel ? cartel(e.fecha, e.tipo, "evento") : ""}
  <div><span class="etq tipo ${claseTipo(e.tipo, "evento")}">${esc(e.tipo)}</span>
    <h4>${esc(e.titulo || "Sin título")}</h4>
    <div class="info">
      ${e.hora ? `<span>${icono("reloj", "p")}${esc(e.hora)}${e.hora_fin ? "–" + esc(e.hora_fin) : ""}</span>` : ""}
      ${e.lugar ? `<span>${icono("lugar", "p")}${esc(e.lugar)}</span>` : ""}
    </div>
    ${e.descripcion ? `<div>${textoHTML(e.descripcion)}</div>` : ""}</div></div>`;

// ---------- Convenio ----------
window.apartadoHTML = (s, qr = "", abierto = false) => `<details class="panel apartado" ${abierto ? "open" : ""}>
  <summary><div class="txt">
    <div class="meta"><span class="etq tipo ${claseTipo(s.categoria, "convenio")}">${esc(s.categoria)}</span>${s.articulo ? `<span class="etq">${esc(s.articulo)}</span>` : ""}</div>
    <h3>${esc(s.titulo || "Sin título")}</h3>${s.resumen ? `<div class="res">${esc(s.resumen)}</div>` : ""}</div>
    ${icono("abajo", "flecha")}</summary>
  <div class="contenido">${textoHTML(s.contenido, qr)}
    ${s.actualizado ? `<p class="fechas" style="margin-top:12px">Actualizado ${haceTxt(s.actualizado)}</p>` : ""}</div></details>`;

// ---------- Actas ----------
window.actaHTML = (a, qr = "") => `<article class="panel acta">
  ${a.fecha ? cartel(a.fecha, a.tipo, "acta") : ""}
  <div><div class="cab"><span class="etq tipo ${claseTipo(a.tipo, "acta")}">${esc(a.tipo)}</span>${etqNuevo(a.creado)}</div>
    <h3>${esc(a.titulo || "Sin título")}</h3>
    ${a.fecha ? `<div class="fecha-txt">Reunión del ${fechaLarga(a.fecha + "T12:00:00")}</div>` : ""}
    ${a.resumen ? `<div style="margin-top:8px">${textoHTML(a.resumen, qr)}</div>` : ""}
    ${a.acuerdos ? `<div class="acuerdos"><b>Acuerdos</b>${textoHTML(a.acuerdos, qr)}</div>` : ""}
    ${adjuntosHTML(a.adjuntos)}
    <div class="pie-tarjeta">${fechasHTML(a.creado, a.actualizado)}</div>
  </div></article>`;

// ---------- Documentos ----------
window.docHTML = (d) => {
  const t = tipoArchivo(d.tipo_archivo, d.nombre_archivo || d.url);
  return `<a class="panel documento" href="${esc(d.url || "#")}" target="_blank" rel="noopener">
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
