// ===== Web pública: Sección Sindical CCOO Calsina Carré =====
const $ = (id) => document.getElementById(id);
const D = { avisos: [], eventos: [], convenio: [], docs: [], actas: [], paginas: {} };
const estado = { catAviso: "Todos", catConv: "Todos", tipoActa: "Todos", catDoc: "Todos", mes: new Date(), diaSel: hoyISO() };

// ---------- Iconos fijos ----------
document.querySelectorAll("[data-i]").forEach(el => el.outerHTML = icono(el.dataset.i));
document.querySelectorAll("[data-ic]").forEach(el => el.innerHTML = icono(el.dataset.ic));
$("cal-ant").innerHTML = icono("izq", "p"); $("cal-sig").innerHTML = icono("der", "p");
document.querySelector(".contacto-btn").innerHTML = icono("correo", "p") + "Escribir a la Sección Sindical";

// ---------- Navegación ----------
const VISTAS = ["inicio", "avisos", "calendario", "convenio", "actas", "documentos", "info"];
function irA() {
  const v = VISTAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "inicio";
  document.querySelectorAll(".vista").forEach(s => s.classList.toggle("activa", s.id === "v-" + v));
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("activa", b.dataset.v === v));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".nav button").forEach(b => b.onclick = () => { location.hash = b.dataset.v; });
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
const usadas = (lista, items, campo) => [...new Set([...nombres(lista), ...items.map(x => x[campo])])].filter(c => items.some(x => x[campo] === c));
const ordenAvisos = (l) => [...l].sort((a, b) => (b.fijado - a.fijado) || (new Date(b.fecha) - new Date(a.fecha)));

// ---------- Inicio ----------
function pintaInicio() {
  $("txt-inicio").textContent = D.paginas.inicio || "";
  const orden = ordenAvisos(D.avisos);
  const dest = orden.find(a => a.urgente) || orden.find(a => a.fijado) || orden[0];
  $("inicio-destacado").innerHTML = dest ? `<article class="panel destacado">
      <div class="cab">
        ${dest.urgente ? `<span class="etq urgente">${icono("alerta", "p")}Urgente</span>` : dest.fijado ? `<span class="etq fijado">${icono("fijado", "p")}Fijado</span>` : `<span class="etq">Último aviso</span>`}
        <span class="fecha-txt">${fechaLarga(dest.fecha)}</span>
      </div>
      <h2>${esc(dest.titulo)}</h2>
      <div class="cuerpo">${textoHTML(dest.contenido)}</div>
      ${dest.adjuntos?.length ? `<div class="fecha-txt" style="margin-top:8px">${icono("clip", "p")} ${dest.adjuntos.length} archivo(s) adjunto(s)</div>` : ""}
      <a class="enlace-btn" href="#avisos">Leer el aviso completo ${icono("der", "p")}</a>
    </article>` : vacio("avisos", "Todavía no hay avisos.");

  // Novedades: lo último que se ha publicado en cualquier sección
  const nov = [
    ...D.avisos.map(x => ({ f: x.fecha, ic: "avisos", que: "Aviso", t: x.titulo, h: "avisos" })),
    ...D.actas.map(x => ({ f: x.creado, ic: "actas", que: "Acta", t: x.titulo, h: "actas" })),
    ...D.docs.map(x => ({ f: x.fecha, ic: "carpeta", que: "Documento", t: x.titulo, h: "documentos" })),
    ...D.eventos.map(x => ({ f: x.creado, ic: "calendario", que: "Fecha en el calendario", t: x.titulo + " (" + fechaDia(x.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + ")", h: "calendario" })),
    ...D.convenio.map(x => ({ f: x.actualizado, ic: "convenio", que: "Convenio", t: x.titulo, h: "convenio" })),
  ].filter(x => x.f).sort((a, b) => new Date(b.f) - new Date(a.f)).slice(0, 6);
  $("inicio-novedades").innerHTML = nov.length ? nov.map(n => `<a class="novedad" href="#${n.h}">
      <span class="ic">${icono(n.ic, "p")}</span>
      <span class="txt"><small>${n.que}${esNuevo(n.f) ? ' <span class="punto-nuevo" title="Nuevo"></span>' : ""}</small><b>${esc(n.t)}</b></span>
      <span class="cuando">${haceTxt(n.f)}</span></a>`).join("") : `<p class="fecha-txt" style="margin:0">Aún no hay novedades.</p>`;

  const prox = D.eventos.filter(e => e.fecha >= hoyISO()).slice(0, 3);
  $("inicio-fechas").innerHTML = prox.length ? prox.map(e => `<a class="panel proxima" href="#calendario">
      ${cartel(e.fecha, e.tipo, "evento")}
      <div><span class="etq tipo ${claseTipo(e.tipo, "evento")}">${esc(e.tipo)}</span>
        <h3 style="margin-top:6px">${esc(e.titulo)}</h3>
        <div class="info">${may(fechaDia(e.fecha).toLocaleDateString("es-ES", { weekday: "long" }))}${e.hora ? ", " + esc(e.hora) + (e.hora_fin ? "–" + esc(e.hora_fin) : "") : ""}${e.lugar ? " · " + esc(e.lugar) : ""}</div></div>
    </a>`).join("") : vacio("calendario", "No hay fechas próximas.");
}

// ---------- Avisos ----------
function pintaAvisos(idNuevo) {
  pintaFiltros("filtros-avisos", usadas("aviso", D.avisos, "categoria"), estado.catAviso, o => { estado.catAviso = o; pintaAvisos(); });
  const qr = $("buscar-avisos").value.trim(), q = normal(qr);
  const l = ordenAvisos(D.avisos).filter(a => (estado.catAviso === "Todos" || a.categoria === estado.catAviso) &&
    (!q || normal(a.titulo + " " + a.contenido).includes(q)));
  $("lista-avisos").innerHTML = l.length ? l.map(a => tarjetaAviso(a, { nuevo: a.id === idNuevo, resaltar: qr })).join("")
    : vacio("avisos", q ? "No hay avisos que coincidan con la búsqueda." : "Todavía no hay avisos publicados.");
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
  const qr = $("buscar-actas").value.trim(), q = normal(qr);
  const l = D.actas.filter(a => (estado.tipoActa === "Todos" || a.tipo === estado.tipoActa) &&
    (!q || normal(a.titulo + " " + a.resumen + " " + a.acuerdos).includes(q)));
  if (!l.length) { $("lista-actas").innerHTML = vacio("actas", q ? "No hay actas que coincidan con la búsqueda." : "Todavía no hay actas publicadas."); return; }
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
  const q = normal($("buscar-docs").value.trim());
  const l = D.docs.filter(d => (estado.catDoc === "Todos" || d.categoria === estado.catDoc) &&
    (!q || normal(d.titulo + " " + d.descripcion + " " + d.nombre_archivo).includes(q)));
  $("lista-documentos").innerHTML = l.length ? l.map(docHTML).join("")
    : vacio("carpeta", q ? "No hay documentos que coincidan con la búsqueda." : "Todavía no hay documentos subidos.");
}
$("buscar-docs").oninput = () => pintaDocumentos();

// ---------- Nosotros ----------
function pintaInfo() {
  $("txt-quienes").innerHTML = textoHTML(D.paginas.quienes || "");
  $("txt-contacto").innerHTML = textoHTML(D.paginas.contacto || "");
}

// ---------- Carga de datos ----------
async function cargar(idNuevo) {
  await cargarOpciones();
  const [a, e, c, d, ac, p] = await Promise.all([
    sb.from("comunicados").select("*").order("fecha", { ascending: false }).limit(200),
    sb.from("eventos").select("*").order("fecha"),
    sb.from("convenio_secciones").select("*").order("orden").order("id"),
    sb.from("documentos").select("*").order("fecha", { ascending: false }),
    sb.from("actas").select("*").order("fecha", { ascending: false }),
    sb.from("paginas").select("*"),
  ]);
  if (a.error) {
    document.querySelectorAll("#inicio-destacado, #lista-avisos").forEach(el =>
      el.innerHTML = vacio("alerta", "No se ha podido conectar. Comprueba tu conexión a internet y vuelve a abrir la página."));
    return;
  }
  D.avisos = a.data || []; D.eventos = e.data || []; D.convenio = c.data || []; D.docs = d.data || []; D.actas = ac.data || [];
  D.paginas = Object.fromEntries((p.data || []).map(x => [x.slug, x.contenido]));
  pintaInicio(); pintaAvisos(idNuevo); pintaCalendario(); pintaConvenio(); pintaActas(); pintaDocumentos(); pintaInfo();
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

// ---------- Instalar como app ----------
let promptInst;
window.addEventListener("beforeinstallprompt", (ev) => {
  ev.preventDefault(); promptInst = ev;
  $("btn-instalar").style.display = "inline-flex";
  $("txt-instalar").textContent = "Instálala en tu móvil y ábrela como una app más.";
});
$("btn-instalar").onclick = async () => { if (promptInst) { promptInst.prompt(); await promptInst.userChoice; $("btn-instalar").style.display = "none"; } };
if (/iphone|ipad/i.test(navigator.userAgent)) $("txt-instalar").textContent = "En iPhone: pulsa Compartir y luego «Añadir a pantalla de inicio».";
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
