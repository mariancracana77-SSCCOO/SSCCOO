// ===== Web pública: Sección Sindical CCOO Calsina Carré =====
const $ = (id) => document.getElementById(id);
const D = { avisos: [], eventos: [], convenio: [], docs: [], actas: [], preguntas: [], delegados: [], enlaces: [], paginas: {} };
const estado = { catAviso: "Todos", catConv: "Todos", tipoActa: "Todos", catDoc: "Todos", catPreg: "Todos", archivo: false, mes: new Date(), diaSel: hoyISO(),
  fechas: { avisos: {}, actas: {}, docs: {} } };

// ---------- Iconos fijos ----------
document.querySelectorAll("[data-i]").forEach(el => el.outerHTML = icono(el.dataset.i));
document.querySelectorAll("[data-ic]").forEach(el => el.innerHTML = icono(el.dataset.ic));
$("cal-ant").innerHTML = icono("izq", "p"); $("cal-sig").innerHTML = icono("der", "p");
$("version-web").textContent = "Versión " + VERSION_WEB;
document.querySelector(".contacto-btn").innerHTML = icono("correo", "p") + "Escribir a la Sección Sindical";

// ---------- Navegación ----------
const VISTAS = ["inicio", "avisos", "calendario", "convenio", "actas", "documentos", "preguntas", "info", "buscar"];
function irA() {
  const h = location.hash.slice(1), avisoDirecto = /^aviso-\d+$/.test(h) ? h : null;
  const v = avisoDirecto ? "avisos" : (VISTAS.includes(h) ? h : "inicio");
  if (avisoDirecto) setTimeout(() => { const el = $(avisoDirecto); if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("nuevo"); } }, 300);
  document.querySelectorAll(".vista").forEach(s => s.classList.toggle("activa", s.id === "v-" + v));
  document.querySelectorAll(".pestanas-web a").forEach(b => {
    const on = b.dataset.v === v; b.classList.toggle("activa", on); on ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current");
    if (on) b.scrollIntoView({ inline: "center", block: "nearest" });
  });
  if (!avisoDirecto) window.scrollTo(0, 0);
  if (v === "buscar") setTimeout(() => $("buscar-todo").focus(), 100);
}

window.addEventListener("hashchange", irA);
irA();

// ---------- Utilidades ----------
const vacio = (ic, t) => `<div class="panel vacio">${icono(ic)}${t}</div>`;
const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
function pintaFiltros(id, opciones, actual, alElegir) {
  $(id).innerHTML = opciones.length < 2 ? "" : ["Todos", ...opciones].map(o =>
    `<button class="filtro ${o === actual ? "activo" : ""}" data-o="${esc(o)}">${esc(o)}</button>`).join("");
  $(id).querySelectorAll("button").forEach(b => b.onclick = () => alElegir(b.dataset.o));
}
// Filtro por año / mes / día
function pintaFechas(id, clave, items, isoDe, repintar) {
  const f = estado.fechas[clave], anyos = [...new Set(items.map(x => partesFecha(isoDe(x))?.a).filter(Boolean))].sort((a, b) => b - a);
  if (!items.length) { $(id).innerHTML = ""; return; }
  const activo = f.a || f.m || f.d;
  $(id).innerHTML = `<span class="ff-ic">${icono("calendario", "p")}</span>
    <select data-f="a" aria-label="Año"><option value="">Cualquier año</option>${anyos.map(a => `<option ${f.a == a ? "selected" : ""}>${a}</option>`).join("")}</select>
    <select data-f="m" aria-label="Mes"><option value="">Cualquier mes</option>${MESES.map((m, i) => `<option value="${i + 1}" ${f.m == i + 1 ? "selected" : ""}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>`).join("")}</select>
    <input type="date" data-f="d" value="${f.d || ""}" aria-label="Día exacto" title="Día exacto">
    ${activo ? `<button class="filtro" data-f-quitar>${icono("cerrar", "p")}Quitar fecha</button>` : ""}`;
  $(id).querySelectorAll("[data-f]").forEach(el => el.onchange = () => {
    f[el.dataset.f] = el.value;
    if (el.dataset.f === "d" && el.value) { f.a = ""; f.m = ""; }
    if (el.dataset.f !== "d" && el.value) f.d = "";
    repintar();
  });
  const q = $(id).querySelector("[data-f-quitar]"); if (q) q.onclick = () => { estado.fechas[clave] = {}; repintar(); };
}
function pasaFecha(clave, iso) {
  const f = estado.fechas[clave], p = partesFecha(iso);
  if (!f.a && !f.m && !f.d) return true;
  if (!p) return false;
  if (f.d) return p.iso === f.d;
  return (!f.a || p.a == f.a) && (!f.m || p.m == f.m);
}
const hayFecha = (clave) => { const f = estado.fechas[clave]; return !!(f.a || f.m || f.d); };
const usadas = (lista, items, campo) => [...new Set([...nombres(lista), ...items.map(x => x[campo])])].filter(c => items.some(x => x[campo] === c));
const ordenAvisos = (l) => [...l].sort((a, b) => (b.fijado - a.fijado) || (new Date(b.fecha) - new Date(a.fecha)));

// ---------- Inicio ----------
function pintaInicio() {
  $("txt-inicio").textContent = D.paginas.inicio || "";
  const hoy = hoyISO(), ahora = Date.now(), DIA = 86400000;
  // Urgente (de los últimos 14 días) arriba del todo, en rojo
  const urg = ordenAvisos(D.avisos).find(a => a.urgente && ahora - new Date(a.fecha) < 14 * DIA);
  $("inicio-destacado").innerHTML = urg ? `<a class="tarjeta-urgente" href="#aviso-${urg.id}">
      <span class="etq-urg">${icono("alerta", "p")}Urgente · ${haceTxt(urg.fecha)}</span>
      <span class="tit">${esc(urg.titulo)}</span>
      <span class="txt">${esc(String(urg.contenido || "").replace(/\*\*/g, "").replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, "").replace(/\s+/g, " ").slice(0, 140))}${(urg.contenido || "").length > 140 ? "…" : ""}</span>
    </a>` : "";
  // Todo junto, por fecha de publicación
  const ICONOS = { aviso: ["avisos", "c-verde"], fecha: ["calendario", "c-azul"], acta: ["actas", "c-ambar"], doc: ["carpeta", "c-rojo"], conv: ["convenio", "c-morado"], preg: ["pregunta", "c-gris"] };
  const diaTxt = (iso) => fechaDia(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric" });
  const items = [
    ...D.avisos.filter(a => a !== urg).map(a => ({ f: a.fecha, k: "aviso", que: "Aviso" + (a.fijado ? " · fijado" : ""), t: a.titulo, s: String(a.contenido || "").replace(/\*\*/g, "").replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, "").replace(/\s+/g, " ").slice(0, 90), h: "#aviso-" + a.id, adj: (a.adjuntos || []).length })),
    ...D.eventos.filter(e => e.fecha >= hoy).map(e => ({ f: e.creado, k: "fecha", que: "Fecha · " + diaTxt(e.fecha) + (e.hora ? ", " + e.hora : ""), t: e.titulo, s: e.lugar || "", h: "#calendario", dia: e.fecha })),
    ...D.actas.map(a => ({ f: a.creado, k: "acta", que: "Acta" + (a.fecha ? " · " + fechaDia(a.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : ""), t: a.titulo, s: a.acuerdos ? (a.acuerdos.split("\n").filter(l => l.trim()).length + " acuerdo(s)") : (a.resumen || "").slice(0, 90), h: "#actas" })),
    ...D.docs.map(d => ({ f: d.fecha, k: "doc", que: "Documento · " + tipoArchivo(d.tipo_archivo, d.nombre_archivo).txt, t: d.titulo, s: d.descripcion || "", url: d.url })),
    ...D.convenio.filter(c => ahora - new Date(c.actualizado) < 30 * DIA).map(c => ({ f: c.actualizado, k: "conv", que: "Convenio · actualizado", t: c.titulo, s: c.resumen || "", h: "#convenio" })),
    ...D.preguntas.filter(q => ahora - new Date(q.creado) < 30 * DIA).map(q => ({ f: q.creado, k: "preg", que: "Pregunta frecuente", t: q.pregunta, s: "", h: "#preguntas" })),
  ].filter(x => x.f).sort((a, b) => new Date(b.f) - new Date(a.f));
  const grupo = (f) => { const d = (ahora - new Date(f)) / DIA; return d < 1 && partesFecha(f).iso === hoy ? "Hoy" : d < 7 ? "Esta semana" : d < 31 ? "Este mes" : "Antes"; };
  const max = estado.feedMax || 25;
  let html = "", g = null;
  items.slice(0, max).forEach(x => {
    const gr = grupo(x.f);
    if (gr !== g) { html += `<h2 class="grupo-tablon">${gr}</h2>`; g = gr; }
    const [ic, cl] = ICONOS[x.k];
    const attrs = x.url ? `href="${esc(x.url)}" target="_blank" rel="noopener"` : `href="${x.h}"${x.dia ? ` data-dia="${x.dia}"` : ""}`;
    html += `<a class="item-tablon" ${attrs}>
      <span class="ic ${cl}">${icono(ic, "p")}</span>
      <span class="txt"><small>${esc(x.que)} · ${haceTxt(x.f)}${esNuevo(x.f) ? ' <span class="punto-nuevo" title="Nuevo"></span>' : ""}</small>
        <b>${esc(x.t || "Sin título")}</b>${x.s ? `<span class="res">${esc(x.s)}</span>` : ""}${x.adj ? `<span class="res">${icono("clip", "p")} ${x.adj} archivo(s)</span>` : ""}</span>
    </a>`;
  });
  if (items.length > max) html += `<button class="btn sec ver-mas" id="ver-mas">Ver más</button>`;
  $("inicio-feed").innerHTML = items.length ? html : vacio("avisos", "Todavía no hay nada publicado.");
  $("inicio-feed").querySelectorAll("[data-dia]").forEach(l => l.onclick = () => { const d = fechaDia(l.dataset.dia); estado.mes = new Date(d.getFullYear(), d.getMonth(), 1); estado.diaSel = l.dataset.dia; pintaCalendario(); });
  if ($("ver-mas")) $("ver-mas").onclick = () => { estado.feedMax = max + 25; pintaInicio(); };
}

// ---------- Avisos (actuales y archivo) ----------
const mesesArchivo = () => { const n = parseInt(D.paginas.archivo_meses ?? "3", 10); return isNaN(n) ? 3 : n; };
const archivado = (a) => { const n = mesesArchivo(); if (!n || a.fijado) return false; const lim = new Date(); lim.setMonth(lim.getMonth() - n); return new Date(a.fecha) < lim; };
function pintaAvisos(idNuevo) {
  pintaFiltros("filtros-avisos", usadas("aviso", D.avisos, "categoria"), estado.catAviso, o => { estado.catAviso = o; pintaAvisos(); });
  pintaFechas("fechas-avisos", "avisos", D.avisos, a => a.fecha, () => pintaAvisos());
  const qr = $("buscar-avisos").value.trim(), q = normal(qr), buscando = !!q || hayFecha("avisos");
  const nArch = D.avisos.filter(archivado).length;
  $("archivo-avisos").innerHTML = (nArch && !buscando) ? `<button class="filtro ${!estado.archivo ? "activo" : ""}" data-arch="0">Actuales</button>
      <button class="filtro ${estado.archivo ? "activo" : ""}" data-arch="1">${icono("archivo2", "p")}Archivo (${nArch})</button>` : "";
  $("archivo-avisos").querySelectorAll("[data-arch]").forEach(b => b.onclick = () => { estado.archivo = b.dataset.arch === "1"; pintaAvisos(); });
  const l = ordenAvisos(D.avisos).filter(a => (estado.catAviso === "Todos" || a.categoria === estado.catAviso) &&
    pasaFecha("avisos", a.fecha) &&
    (buscando || !nArch || archivado(a) === estado.archivo) &&
    (!q || normal(a.titulo + " " + a.contenido + " " + textoFecha(a.fecha)).includes(q)));
  $("lista-avisos").innerHTML = (buscando && l.length ? `<p class="fecha-txt">${l.length} aviso${l.length === 1 ? "" : "s"} encontrado${l.length === 1 ? "" : "s"} (incluye el archivo).</p>` : "") +
    (estado.archivo && !buscando ? `<p class="fecha-txt">Avisos de hace más de ${mesesArchivo()} mes${mesesArchivo() === 1 ? "" : "es"}.</p>` : "") +
    (l.length ? l.map(a => tarjetaAviso(a, { nuevo: a.id === idNuevo, resaltar: qr })).join("")
      : vacio("avisos", buscando ? "No hay avisos que coincidan con la búsqueda o la fecha." : "Todavía no hay avisos publicados."));
}
$("buscar-avisos").oninput = () => pintaAvisos();

// ---------- Calendario ----------
const isoDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function pintaCalendario() {
  const m = estado.mes, ini = new Date(m.getFullYear(), m.getMonth(), 1);
  $("cal-mes").textContent = may(ini.toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
  const desfase = (ini.getDay() + 6) % 7, hoy = hoyISO(), porDia = {};
  D.eventos.forEach(e => (porDia[e.fecha] ||= []).push(e));
  let html = "";
  for (let i = 0; i < 42; i++) {
    const d = new Date(m.getFullYear(), m.getMonth(), 1 - desfase + i), iso = isoDe(d);
    if (i >= 35 && d.getMonth() !== m.getMonth()) break;
    const evs = porDia[iso] || [], dow = d.getDay();
    html += `<button class="dia ${d.getMonth() !== m.getMonth() ? "fuera" : ""} ${iso === hoy ? "hoy" : ""} ${iso === estado.diaSel ? "sel" : ""} ${dow === 0 || dow === 6 ? "finde" : ""}"
      data-d="${iso}" aria-label="${d.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}${evs.length ? ", " + evs.length + " evento(s)" : ""}">
      <span class="n">${d.getDate()}</span>
      <span class="puntos">${evs.slice(0, 4).map(e => `<span class="punto ${claseTipo(e.tipo, "evento")}"></span>`).join("")}</span></button>`;
  }
  $("cal-dias").innerHTML = html;
  $("cal-dias").querySelectorAll(".dia").forEach(b => b.onclick = () => {
    estado.diaSel = b.dataset.d;
    const d = fechaDia(b.dataset.d);
    if (d.getMonth() !== estado.mes.getMonth()) estado.mes = new Date(d.getFullYear(), d.getMonth(), 1);
    pintaCalendario();
    if (innerWidth < 900) $("cal-detalle").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  $("cal-leyenda").innerHTML = nombres("evento").map(t => `<span class="etq tipo ${claseTipo(t, "evento")}">${esc(t)}</span>`).join("");
  const sel = porDia[estado.diaSel] || [];
  $("cal-detalle").innerHTML = `<h3>${may(fechaDia(estado.diaSel).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))}</h3>` +
    (sel.length ? sel.map(e => eventoHTML(e)).join("") : `<p class="fecha-txt" style="margin:0">No hay nada programado este día.</p>`);
  const prox = D.eventos.filter(e => e.fecha >= hoy).slice(0, 6);
  $("cal-proximas").innerHTML = prox.length ? prox.map(e => eventoHTML(e, true)).join("") : `<p class="fecha-txt" style="margin:0">No hay fechas próximas.</p>`;
}
$("cal-ant").onclick = () => { estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() - 1, 1); pintaCalendario(); };
$("cal-sig").onclick = () => { estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() + 1, 1); pintaCalendario(); };
$("cal-ir").onchange = (e) => { if (!e.target.value) return; const [y, m] = e.target.value.split("-"); estado.mes = new Date(+y, +m - 1, 1); estado.diaSel = `${y}-${m}-01`; pintaCalendario(); };
document.querySelector(".cal-mes-btn").onclick = (e) => { if (e.target.id !== "cal-ir") { const i = $("cal-ir"); i.value = isoDe(estado.mes).slice(0, 7); try { i.showPicker(); } catch (_) { i.focus(); i.click(); } } };
$("cal-hoy").onclick = () => { estado.mes = new Date(); estado.diaSel = hoyISO(); pintaCalendario(); };

// ---------- Convenio ----------
function pintaConvenio() {
  $("conv-intro").innerHTML = `<span class="ic">${icono("convenio")}</span><div>${textoHTML(D.paginas.convenio || "")}</div>`;
  pintaFiltros("filtros-convenio", usadas("convenio", D.convenio, "categoria"), estado.catConv, o => { estado.catConv = o; pintaConvenio(); });
  const qr = $("buscar-convenio").value.trim(), q = normal(qr);
  const l = D.convenio.filter(s => (estado.catConv === "Todos" || s.categoria === estado.catConv) &&
    (!q || normal(s.titulo + " " + s.resumen + " " + s.contenido + " " + (s.articulo || "")).includes(q)));
  $("lista-convenio").innerHTML = l.length ? l.map(s => apartadoHTML(s, qr, !!q)).join("")
    : vacio("convenio", q ? "No hay apartados que coincidan con la búsqueda." : "Todavía no hay apartados del convenio.");
  const docsConv = D.docs.slice(0, 5);
  $("lista-docs").innerHTML = (docsConv.length ? docsConv.map(d => {
      const t = tipoArchivo(d.tipo_archivo, d.nombre_archivo || d.url);
      return `<a class="doc" href="${esc(d.url)}" target="_blank" rel="noopener"><span class="ic">${icono(t.ic, "p")}</span>
        <span><b>${esc(d.titulo)}</b><small>${t.txt} · ${haceTxt(d.fecha)}</small></span></a>`;
    }).join("") : `<p class="fecha-txt" style="margin:0">Aún no hay documentos subidos.</p>`) +
    `<a class="enlace-btn" href="#documentos" style="margin-top:10px">Ver todos los documentos ${icono("der", "p")}</a>`;
}
$("buscar-convenio").oninput = () => pintaConvenio();

// ---------- Actas ----------
function pintaActas() {
  pintaFiltros("filtros-actas", usadas("acta", D.actas, "tipo"), estado.tipoActa, o => { estado.tipoActa = o; pintaActas(); });
  pintaFechas("fechas-actas", "actas", D.actas, a => a.fecha, () => pintaActas());
  const qr = $("buscar-actas").value.trim(), q = normal(qr);
  const l = D.actas.filter(a => (estado.tipoActa === "Todos" || a.tipo === estado.tipoActa) && pasaFecha("actas", a.fecha) &&
    (!q || normal(a.titulo + " " + a.resumen + " " + a.acuerdos + " " + textoFecha(a.fecha)).includes(q)));
  if (!l.length) { $("lista-actas").innerHTML = vacio("actas", q || hayFecha("actas") ? "No hay actas que coincidan con la búsqueda o la fecha." : "Todavía no hay actas publicadas."); return; }
  let html = "", anyo = null;
  l.forEach(a => {
    const y = (a.fecha || "").slice(0, 4);
    if (y !== anyo) { html += `<div class="grupo-anyo">${y}</div>`; anyo = y; }
    html += actaHTML(a, qr);
  });
  $("lista-actas").innerHTML = html;
}
$("buscar-actas").oninput = () => pintaActas();

// ---------- Documentos ----------
function pintaDocumentos() {
  pintaFiltros("filtros-docs", usadas("documento", D.docs, "categoria"), estado.catDoc, o => { estado.catDoc = o; pintaDocumentos(); });
  pintaFechas("fechas-docs", "docs", D.docs, d => d.fecha, () => pintaDocumentos());
  const q = normal($("buscar-docs").value.trim());
  const l = D.docs.filter(d => (estado.catDoc === "Todos" || d.categoria === estado.catDoc) && pasaFecha("docs", d.fecha) &&
    (!q || normal(d.titulo + " " + d.descripcion + " " + d.nombre_archivo + " " + textoFecha(d.fecha)).includes(q)));
  $("lista-documentos").innerHTML = l.length ? l.map(docHTML).join("")
    : vacio("carpeta", q || hayFecha("docs") ? "No hay documentos que coincidan con la búsqueda o la fecha." : "Todavía no hay documentos subidos.");
}
$("buscar-docs").oninput = () => pintaDocumentos();

// ---------- Preguntas frecuentes ----------
function pintaPreguntas() {
  pintaFiltros("filtros-preguntas", usadas("pregunta", D.preguntas, "categoria"), estado.catPreg, o => { estado.catPreg = o; pintaPreguntas(); });
  const qr = $("buscar-preguntas").value.trim(), q = normal(qr);
  const l = D.preguntas.filter(p => (estado.catPreg === "Todos" || p.categoria === estado.catPreg) && (!q || normal(p.pregunta + " " + p.respuesta).includes(q)));
  $("lista-preguntas").innerHTML = l.length ? l.map(p => preguntaHTML(p, qr, !!q)).join("")
    : vacio("pregunta", q ? "No hay preguntas que coincidan. Escríbenos y te respondemos." : "Todavía no hay preguntas frecuentes.");
}
$("buscar-preguntas").oninput = () => pintaPreguntas();

// ---------- Nosotros ----------
function pintaInfo() {
  $("txt-quienes").innerHTML = textoHTML(D.paginas.quienes || "");
  $("txt-contacto").innerHTML = textoHTML(D.paginas.contacto || "");
  $("tit-delegados").classList.toggle("oculto", !D.delegados.length);
  $("lista-delegados").innerHTML = D.delegados.map(delegadoHTML).join("");
  $("tit-enlaces").classList.toggle("oculto", !D.enlaces.length);
  $("lista-enlaces").innerHTML = D.enlaces.map(enlaceHTML).join("");
}

// ---------- Carga de datos ----------
async function cargar(idNuevo) {
  await cargarOpciones();
  const [a, e, c, d, ac, p, pr, dl, en] = await Promise.all([
    sb.from("comunicados").select("*").order("fecha", { ascending: false }).limit(200),
    sb.from("eventos").select("*").order("fecha"),
    sb.from("convenio_secciones").select("*").order("orden").order("id"),
    sb.from("documentos").select("*").order("fecha", { ascending: false }),
    sb.from("actas").select("*").order("fecha", { ascending: false }),
    sb.from("paginas").select("*"),
    sb.from("preguntas").select("*").order("orden").order("id"),
    sb.from("delegados").select("*").order("orden").order("id"),
    sb.from("enlaces").select("*").order("orden").order("id"),
  ]);
  if (a.error) {
    document.querySelectorAll("#inicio-destacado, #lista-avisos").forEach(el =>
      el.innerHTML = vacio("alerta", "No se ha podido conectar. Comprueba tu conexión a internet y vuelve a abrir la página."));
    return;
  }
  D.avisos = a.data || []; D.eventos = e.data || []; D.convenio = c.data || []; D.docs = d.data || []; D.actas = ac.data || [];
  D.paginas = Object.fromEntries((p.data || []).map(x => [x.slug, x.contenido]));
  D.preguntas = pr.data || []; D.delegados = dl.data || []; D.enlaces = en.data || [];
  pintaInicio(); pintaAvisos(idNuevo); pintaCalendario(); pintaConvenio(); pintaActas(); pintaDocumentos(); pintaPreguntas(); pintaInfo(); pintaCanales();
  if (/^#aviso-\d+$/.test(location.hash) && !cargar.hecho) { cargar.hecho = true; irA(); }
}
cargar();

// ---------- Tiempo real: avisos al momento si alguien tiene la web abierta ----------
const toast = $("toast");
function avisar(texto, hash) {
  toast.innerHTML = icono("campana", "p") + esc(texto);
  toast.classList.add("ver");
  toast.onclick = () => { location.hash = hash; toast.classList.remove("ver"); };
  clearTimeout(avisar.t); avisar.t = setTimeout(() => toast.classList.remove("ver"), 9000);
}
let recarga;
const QUE = { comunicados: ["Nuevo aviso: ", "avisos"], actas: ["Nueva acta: ", "actas"], documentos: ["Nuevo documento: ", "documentos"], eventos: ["Nueva fecha: ", "calendario"] };
const canal = sb.channel("web-directo");
Object.keys(QUE).forEach(t => canal.on("postgres_changes", { event: "*", schema: "public", table: t }, (pl) => {
  clearTimeout(recarga); recarga = setTimeout(() => cargar(t === "comunicados" ? pl.new?.id : null), 400);
  if (pl.eventType === "INSERT") avisar(QUE[t][0] + (pl.new.titulo || ""), QUE[t][1]);
}));
canal.subscribe();
document.addEventListener("visibilitychange", () => { if (!document.hidden) cargar(); });

// ---------- Instalar como app y activar avisos ----------
const ES_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const INSTALADA = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const PUSH_OK = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
let promptInst = null, suscrito = false;
window.addEventListener("beforeinstallprompt", (ev) => { ev.preventDefault(); promptInst = ev; pintaBanda(); });
window.addEventListener("appinstalled", () => { promptInst = null; pintaBanda(); });

function modal(titulo, html) {
  const v = document.createElement("div");
  v.className = "modal-velo";
  v.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>${titulo}</h2>${html}<div class="botones"><button class="btn">Entendido</button></div></div>`;
  v.onclick = (e) => { if (e.target === v || e.target.closest(".btn")) v.remove(); };
  document.body.appendChild(v);
}
async function instalar() {
  if (promptInst) { promptInst.prompt(); await promptInst.userChoice; promptInst = null; pintaBanda(); return; }
  if (ES_IOS) modal("Instalar en iPhone", `<ol><li>Abre esta página en <b>Safari</b>.</li><li>Pulsa el botón <b>Compartir</b> (el cuadrado con una flecha hacia arriba).</li><li>Elige <b>«Añadir a pantalla de inicio»</b> y pulsa <b>Añadir</b>.</li><li>Abre la app desde el icono nuevo y activa los avisos.</li></ol>`);
  else modal("Instalar la app", `<ol><li>Abre esta página en <b>Chrome</b>.</li><li>Pulsa el menú <b>⋮</b> (arriba a la derecha).</li><li>Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.</li></ol><p class="fecha-txt">No hace falta descargar nada de fuera: es la propia web, sin avisos de seguridad.</p>`);
}
const b64aBytes = (b) => { const p = "=".repeat((4 - b.length % 4) % 4), s = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...s].map(c => c.charCodeAt(0))); };
async function activarAvisos() {
  if (ES_IOS && !INSTALADA()) return modal("Primero, instala la app", "<p>En iPhone, los avisos solo funcionan si la app está instalada.</p><ol><li>Pulsa <b>Compartir</b> en Safari.</li><li>Elige <b>«Añadir a pantalla de inicio»</b>.</li><li>Abre la app desde el icono y pulsa otra vez <b>Activar avisos</b>.</li></ol>");
  if (!PUSH_OK) return modal("Este navegador no admite avisos", "<p>Prueba a abrir la web con Chrome (Android) o instalarla en el iPhone con Safari.</p>");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return modal("Avisos bloqueados", "<p>Has bloqueado los avisos para esta web. Para activarlos, entra en los ajustes del navegador → Configuración de sitios → Notificaciones, y permite esta página.</p>");
  const reg = await navigator.serviceWorker.ready;
  const suscribirse = () => reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aBytes(VAPID_PUBLICA) });
  // Si este móvil ya tenía una suscripción, se reutiliza (así no se duplica)
  let sub = await reg.pushManager.getSubscription().catch(() => null), ultimoError = null;
  // El navegador a veces falla al primer intento («Registration failed»): se reintenta solo
  for (let intento = 0; intento < 3 && !sub; intento++) {
    try { sub = await suscribirse(); }
    catch (e) {
      ultimoError = e;
      const vieja = await reg.pushManager.getSubscription().catch(() => null);
      if (vieja) await vieja.unsubscribe().catch(() => {}); // por si quedó una suscripción antigua a medias
      await new Promise(r => setTimeout(r, 1200 * (intento + 1)));
    }
  }
  if (!sub) {
    const brave = navigator.brave && await navigator.brave.isBrave?.().catch(() => false);
    return modal("No se han podido activar los avisos", brave
      ? `<p>Estás usando <b>Brave</b>, que trae desactivadas las notificaciones de Google.</p><ol><li>Abre los <b>Ajustes de Brave → Privacidad y seguridad</b>.</li><li>Activa <b>«Usar servicios de Google para mensajería push»</b>.</li><li>Cierra Brave, vuelve a abrir la web y pulsa <b>Activar avisos</b>.</li></ol><p>O abre la web con <b>Chrome</b>.</p>`
      : `<p>El móvil no ha podido conectar con el servicio de notificaciones. Suele ser algo pasajero.</p><ol><li>Comprueba que tienes internet.</li><li>Cierra la app o la pestaña del todo y vuelve a abrirla.</li><li>Pulsa otra vez <b>Activar avisos</b>.</li></ol><p>Si sigue fallando, prueba con <b>Chrome</b> (en Android) o instalando la app (en iPhone).</p><p class="fecha-txt">Detalle técnico: ${esc(ultimoError?.message || ultimoError || "")}</p>`);
  }
  try {
    const j = sub.toJSON();
    const { error } = await sb.rpc("suscribir_push", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
    if (error) throw error;
    guardarEndpoint(j.endpoint);
    suscrito = true; pintaBanda();
    avisar("Avisos activados en este móvil", "inicio");
  } catch (e) { modal("No se han podido guardar los avisos", `<p>Comprueba la conexión y vuelve a intentarlo.</p><p class="fecha-txt">${esc(e.message || e)}</p>`); }
}
// Recuerda en este móvil su dirección de avisos; si cambia, se borra la anterior del servidor
function guardarEndpoint(nuevo) {
  try {
    const viejo = localStorage.getItem("ccoo-push");
    if (viejo && viejo !== nuevo) sb.rpc("desuscribir_push", { p_endpoint: viejo });
    localStorage.setItem("ccoo-push", nuevo);
  } catch (_) {}
}
async function desactivarAvisos() {
  const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
  if (sub) { await sb.rpc("desuscribir_push", { p_endpoint: sub.endpoint }); await sub.unsubscribe(); }
  try { localStorage.removeItem("ccoo-push"); } catch (_) {}
  suscrito = false; pintaBanda();
}
async function comprobarSuscripcion() {
  if (!PUSH_OK || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
  suscrito = !!sub;
  if (sub) { const j = sub.toJSON(); sb.rpc("suscribir_push", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }); guardarEndpoint(j.endpoint); } // por si se borró
  pintaBanda();
}
function pintaBanda() {
  const inst = INSTALADA();
  $("cab-instalar").classList.toggle("oculto", inst);
  // Barra fija de abajo
  const iosSinInstalar = ES_IOS && !inst;
  const botonAvisos = suscrito
    ? `<button class="accion-baja on" data-acc="estado">${icono("check", "p")}Avisos activados</button>`
    : iosSinInstalar
      ? `<button class="accion-baja principal" data-acc="instalar">${icono("descargar", "p")}Instalar la app</button>`
      : `<button class="accion-baja principal" data-acc="activar">${icono("campana", "p")}Activar avisos</button>`;
  $("barra-acciones").innerHTML = botonAvisos + `<a class="accion-baja" href="#info">${icono("correo", "p")}Contacto</a>`;
  // Sugerencia de instalar (solo si no está instalada), arriba del tablón
  const banda = inst ? "" : `<div class="banda-instalar"><span class="ic">${icono("movil", "p")}</span>
      <span class="txt"><b>Tenla como una app</b> con su icono en el móvil.</span>
      <button class="btn peq" data-acc="instalar">Instalar</button></div>`;
  $("banda-app").innerHTML = banda;
  // En «Nosotros», el estado completo
  $("banda-app-info").innerHTML = `<div class="panel banda ${suscrito ? "avisos-on" : ""}"><span class="ic">${icono(suscrito ? "check" : "campana")}</span>
      <div class="txt"><b>${suscrito ? "Avisos activados en este móvil" : "Avisos en el móvil"}</b><p>${suscrito ? "Te llegará una notificación con cada novedad." : "Actívalos para enterarte al momento de cada aviso."}</p></div>
      <div class="botones">${suscrito ? `<button class="btn sec peq" data-acc="desactivar">Desactivar</button>` : `<button class="btn peq" data-acc="${iosSinInstalar ? "instalar" : "activar"}">${iosSinInstalar ? "Instalar la app" : "Activar avisos"}</button>`}${inst ? "" : ` <button class="btn sec peq" data-acc="instalar">Instalar</button>`}</div></div>`;
  document.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => ({
    instalar, activar: activarAvisos, desactivar: desactivarAvisos,
    estado: () => modal("Avisos activados", `<p>Este móvil recibe una notificación con cada aviso, acta, documento o fecha nueva.</p><div class="botones" style="justify-content:flex-start"><button class="btn sec" id="m-desact">Desactivar los avisos</button></div>`) || setTimeout(() => { const d = document.getElementById("m-desact"); if (d) d.onclick = () => { document.querySelector(".modal-velo")?.remove(); desactivarAvisos(); }; }, 0),
  })[b.dataset.acc]());
}
$("cab-instalar").onclick = instalar;
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").then(r => { r.update(); return comprobarSuscripcion(); }).catch(() => {});
pintaBanda();

// ---------- Compartir y calendario (botones de las tarjetas) ----------
document.addEventListener("click", (ev) => {
  const c = ev.target.closest("[data-compartir]");
  if (c) { const a = D.avisos.find(x => x.id == c.dataset.id); if (a) compartir(a.titulo, textoCompartir(a.titulo, a.contenido, "aviso-" + a.id)); return; }
  const i = ev.target.closest("[data-ics]");
  if (i) { const e = D.eventos.find(x => x.id == i.dataset.ics); if (e) descargarICS(e); }
});

// ---------- Canales (Telegram / WhatsApp) ----------
function pintaCanales() {
  const tg = (D.paginas.telegram || "").trim(), wa = (D.paginas.whatsapp || "").trim();
  const tgUrl = tg.startsWith("@") ? "https://t.me/" + tg.slice(1) : (tg.startsWith("https://t.me/") ? tg : "");
  $("canales").innerHTML = (tgUrl ? `<a class="canal tg" href="${esc(tgUrl)}" target="_blank" rel="noopener">${icono("telegram", "p")}Canal de Telegram</a>` : "") +
    (/^https:\/\/(chat\.)?whatsapp\.com\//.test(wa) ? `<a class="canal wa" href="${esc(wa)}" target="_blank" rel="noopener">${icono("whatsapp", "p")}Canal de WhatsApp</a>` : "");
}

// ---------- Traducir ----------
document.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("[data-traducir]");
  const opc = ev.target.closest("[data-idioma]");
  document.querySelectorAll(".menu-idiomas").forEach(m => { if (!m.contains(ev.target)) m.remove(); });
  if (btn) {
    ev.preventDefault();
    const caja = btn.parentElement, reg = btn.closest("[data-reg]");
    if (reg.dataset.idiomaActual) { // volver al original
      reg.querySelectorAll("[data-campo]").forEach(el => { el.innerHTML = el.dataset.original; el.removeAttribute("dir"); delete el.dataset.original; });
      delete reg.dataset.idiomaActual; btn.innerHTML = icono("idioma", "p") + "Traducir"; return;
    }
    if (caja.querySelector(".menu-idiomas")) return;
    caja.insertAdjacentHTML("beforeend", `<div class="menu-idiomas" role="menu">${Object.entries(IDIOMAS).map(([k, n]) => `<button role="menuitem" data-idioma="${k}" ${k === "ar" ? 'dir="rtl"' : ""}>${n}</button>`).join("")}</div>`);
    return;
  }
  if (opc) {
    ev.preventDefault();
    const reg = opc.closest("[data-reg]"), [tabla, id] = reg.dataset.reg.split(":"), idioma = opc.dataset.idioma;
    const boton = reg.querySelector("[data-traducir]");
    opc.closest(".menu-idiomas").remove();
    boton.innerHTML = icono("idioma", "p") + "Traduciendo…"; boton.disabled = true;
    try {
      const { data, error } = await sb.functions.invoke("traducir", { body: { tabla, id: +id, idioma } });
      if (error || !data?.texto) { let m = "No se ha podido traducir ahora mismo."; try { m = (await error.context.json()).error || m; } catch (_) {} throw new Error(m); }
      reg.querySelectorAll("[data-campo]").forEach(el => {
        const t = data.texto[el.dataset.campo]; if (t == null) return;
        if (el.dataset.original == null) el.dataset.original = el.innerHTML;
        el.innerHTML = (el.tagName === "H3" || el.hasAttribute("data-plano")) ? esc(t) : textoHTML(t);
        if (idioma === "ar") el.setAttribute("dir", "rtl"); else el.removeAttribute("dir");
      });
      if (reg.tagName === "DETAILS") reg.open = true;
      reg.dataset.idiomaActual = idioma;
      boton.innerHTML = icono("idioma", "p") + "Ver en español";
    } catch (e) { boton.innerHTML = icono("idioma", "p") + "Traducir"; avisar(e.message, location.hash.slice(1) || "inicio"); }
    boton.disabled = false;
  }
});

// ---------- Buscar en toda la web ----------
function buscarTodo() {
  const qr = $("buscar-todo").value.trim(), q = normal(qr);
  if (q.length < 2) { $("resultados-todo").innerHTML = `<p class="fecha-txt">Escribe al menos dos letras.</p>`; return; }
  const pasa = (...t) => normal(t.join(" ")).includes(q);
  const grupos = [
    ["Avisos", "avisos", D.avisos.filter(a => pasa(a.titulo, a.contenido, textoFecha(a.fecha))).map(a => ({ h: "aviso-" + a.id, t: a.titulo, s: fechaLarga(a.fecha) }))],
    ["Calendario", "calendario", D.eventos.filter(e => pasa(e.titulo, e.descripcion, e.lugar, e.tipo, textoFecha(e.fecha))).map(e => ({ h: "calendario", t: e.titulo, s: fechaLarga(e.fecha + "T12:00:00") + (e.hora ? " · " + e.hora : ""), dia: e.fecha }))],
    ["Convenio", "convenio", D.convenio.filter(s => pasa(s.titulo, s.resumen, s.contenido, s.articulo)).map(s => ({ h: "convenio", t: s.titulo, s: s.resumen || s.categoria, q: qr }))],
    ["Preguntas frecuentes", "pregunta", D.preguntas.filter(x => pasa(x.pregunta, x.respuesta)).map(x => ({ h: "preguntas", t: x.pregunta, s: x.categoria, q: qr }))],
    ["Actas", "actas", D.actas.filter(a => pasa(a.titulo, a.resumen, a.acuerdos, a.tipo, textoFecha(a.fecha))).map(a => ({ h: "actas", t: a.titulo, s: a.fecha ? fechaLarga(a.fecha + "T12:00:00") : a.tipo, q: qr }))],
    ["Documentos", "carpeta", D.docs.filter(d => pasa(d.titulo, d.descripcion, d.nombre_archivo, d.categoria)).map(d => ({ url: d.url, t: d.titulo, s: d.categoria + " · " + tipoArchivo(d.tipo_archivo, d.nombre_archivo).txt }))],
  ].filter(g => g[2].length);
  const total = grupos.reduce((n, g) => n + g[2].length, 0);
  $("resultados-todo").innerHTML = total ? `<p class="fecha-txt">${total} resultado${total === 1 ? "" : "s"}</p>` + grupos.map(([tit, ic, l]) => `
    <h2 class="titulo-bloque">${tit} <span class="etq">${l.length}</span></h2>
    <div class="panel resultados">${l.slice(0, 8).map(r => `<a class="novedad" ${r.url ? `href="${esc(r.url)}" target="_blank" rel="noopener"` : `href="#${r.h}" data-q="${esc(r.q || "")}" data-dia="${r.dia || ""}"`}>
      <span class="ic">${icono(ic === "pregunta" ? "pregunta" : ic, "p")}</span><span class="txt"><b>${esc(r.t)}</b><small>${esc(r.s || "")}</small></span>${icono("der", "p")}</a>`).join("")}</div>`).join("")
    : vacio("buscar", `No hay nada con «${esc(qr)}». Prueba con otra palabra o <a href="#info">pregúntanos</a>.`);
  $("resultados-todo").querySelectorAll("a[data-q]").forEach(l => l.onclick = () => {
    const h = l.getAttribute("href").slice(1), q2 = l.dataset.q;
    if (l.dataset.dia) { const d = fechaDia(l.dataset.dia); estado.mes = new Date(d.getFullYear(), d.getMonth(), 1); estado.diaSel = l.dataset.dia; pintaCalendario(); }
    const campo = { convenio: "buscar-convenio", preguntas: "buscar-preguntas", actas: "buscar-actas" }[h];
    if (campo && q2) { $(campo).value = q2; $(campo).dispatchEvent(new Event("input")); }
  });
}
$("buscar-todo").oninput = buscarTodo;

// ---------- Contador anónimo de visitas ----------
// Solo suma 1 a las visitas del día (y 1 a «móviles distintos» la primera vez de hoy en este móvil).
// No se guarda nada que identifique a nadie: ni IP, ni nombres, ni un identificador del móvil.
(function contarVisita() {
  try {
    if (sessionStorage.getItem("ccoo-contada")) return; // una vez por cada vez que se abre la web
    sessionStorage.setItem("ccoo-contada", "1");
    const clave = "ccoo-dia-" + hoyISO(), nuevo = !localStorage.getItem(clave);
    if (nuevo) { Object.keys(localStorage).filter(k => k.startsWith("ccoo-dia-")).forEach(k => localStorage.removeItem(k)); localStorage.setItem(clave, "1"); }
    sb.rpc("contar_visita", { p_nuevo: nuevo });
  } catch (_) { sb.rpc("contar_visita", { p_nuevo: false }); }
})();
