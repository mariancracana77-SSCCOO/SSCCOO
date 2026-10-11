// ===== Web pública: Sección Sindical CCOO Calsina Carré =====
const $ = (id) => document.getElementById(id);
const D = { avisos: [], eventos: [], convenio: [], docs: [], actas: [], paginas: {} };
const estado = { catAviso: "Todos", catConv: "Todos", tipoActa: "Todos", mes: new Date(), diaSel: hoyISO() };

// ---------- Iconos fijos ----------
document.querySelectorAll("[data-i]").forEach(el => el.outerHTML = icono(el.dataset.i));
const accIc = ["convenio", "actas", "calendario", "correo"];
document.querySelectorAll(".acceso .ic").forEach((el, i) => el.innerHTML = icono(accIc[i]));
$("cal-ant").innerHTML = icono("izq", "p"); $("cal-sig").innerHTML = icono("der", "p");
document.querySelector(".contacto-btn").innerHTML = icono("correo", "p") + "Escribir a la Sección Sindical";
document.querySelector(".instalar-panel .ic").innerHTML = icono("movil");

// ---------- Navegación ----------
const VISTAS = ["inicio", "avisos", "calendario", "convenio", "actas", "info"];
function irA() {
  const v = VISTAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "inicio";
  document.querySelectorAll(".vista").forEach(s => s.classList.toggle("activa", s.id === "v-" + v));
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("activa", b.dataset.v === v));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".nav button").forEach(b => b.onclick = () => { location.hash = b.dataset.v; });
window.addEventListener("hashchange", irA);
irA();

// ---------- Utilidades de pintado ----------
const vacio = (ic, t) => `<div class="panel vacio">${icono(ic)}${t}</div>`;
const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function pintaFiltros(id, opciones, actual, alElegir) {
  $(id).innerHTML = ["Todos", ...opciones].map(o =>
    `<button class="filtro ${o === actual ? "activo" : ""}" data-o="${esc(o)}">${esc(o)}</button>`).join("");
  $(id).querySelectorAll("button").forEach(b => b.onclick = () => alElegir(b.dataset.o));
}

// ---------- Avisos ----------
function tarjetaAviso(a, { corto = false, nuevo = false, resaltar = "" } = {}) {
  return `<article class="panel aviso ${a.urgente ? "urgente" : ""} ${a.fijado ? "fijado" : ""} ${nuevo ? "nuevo" : ""}">
    <div class="cab">
      ${a.urgente ? `<span class="etq urgente">${icono("alerta", "p")}Urgente</span>` : ""}
      ${a.fijado ? `<span class="etq fijado">${icono("fijado", "p")}Fijado</span>` : ""}
      <span class="etq tipo ${claseTipo(a.categoria, "aviso")}">${esc(a.categoria)}</span>
      <span class="fecha-txt">${fechaLarga(a.fecha)}</span>
    </div>
    <h3>${esc(a.titulo)}</h3>
    <div class="cuerpo ${corto ? "corto" : ""}">${textoHTML(a.contenido, resaltar)}</div>
    ${a.pdf_url ? `<a class="adjunto" href="${esc(a.pdf_url)}" target="_blank" rel="noopener">${icono("pdf", "p")}Ver documento adjunto</a>` : ""}
  </article>`;
}
function ordenAvisos(l) { return [...l].sort((a, b) => (b.fijado - a.fijado) || (new Date(b.fecha) - new Date(a.fecha))); }
function pintaAvisos(idNuevo) {
  const cats = [...new Set([...nombres("aviso"), ...D.avisos.map(a => a.categoria)])].filter(c => D.avisos.some(a => a.categoria === c));
  pintaFiltros("filtros-avisos", cats, estado.catAviso, o => { estado.catAviso = o; pintaAvisos(); });
  const q = normal($("buscar-avisos").value.trim());
  const l = ordenAvisos(D.avisos).filter(a =>
    (estado.catAviso === "Todos" || a.categoria === estado.catAviso) &&
    (!q || normal(a.titulo + " " + a.contenido).includes(q)));
  $("lista-avisos").innerHTML = l.length ? l.map(a => tarjetaAviso(a, { nuevo: a.id === idNuevo, resaltar: $("buscar-avisos").value.trim() })).join("")
    : vacio("avisos", q ? "No hay avisos que coincidan con la búsqueda." : "Todavía no hay avisos publicados.");
}
$("buscar-avisos").oninput = () => pintaAvisos();

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
      <a class="enlace-btn" href="#avisos">Leer el aviso completo ${icono("der", "p")}</a>
    </article>` : vacio("avisos", "Todavía no hay avisos.");
  const resto = orden.filter(a => a !== dest).slice(0, 3);
  $("inicio-avisos").innerHTML = resto.length ? resto.map(a => tarjetaAviso(a, { corto: true })).join("") : `<p class="fecha-txt">No hay más avisos.</p>`;
  const prox = D.eventos.filter(e => e.fecha >= hoyISO()).slice(0, 3);
  $("inicio-fechas").innerHTML = prox.length ? prox.map(e => `<div class="panel proxima" style="margin-bottom:12px">
      ${cartel(e.fecha, e.tipo, "evento")}
      <div><span class="etq tipo ${claseTipo(e.tipo, "evento")}">${esc(e.tipo)}</span>
        <h3 style="margin-top:6px">${esc(e.titulo)}</h3>
        <div class="info">${fechaDia(e.fecha).toLocaleDateString("es-ES", { weekday: "long" })}${e.hora ? ", " + esc(e.hora) + (e.hora_fin ? "–" + esc(e.hora_fin) : "") : ""}${e.lugar ? " · " + esc(e.lugar) : ""}</div></div>
    </div>`).join("") : vacio("calendario", "No hay fechas próximas.");
}

// ---------- Calendario ----------
const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const mesTxt = (d) => may(d.toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
function isoDe(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function pintaCalendario() {
  const m = estado.mes, ini = new Date(m.getFullYear(), m.getMonth(), 1);
  $("cal-mes").textContent = mesTxt(ini);
  const desfase = (ini.getDay() + 6) % 7, hoy = hoyISO();
  const porDia = {};
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
  });
  $("cal-leyenda").innerHTML = nombres("evento").map(t => `<span class="etq tipo ${claseTipo(t, "evento")}">${esc(t)}</span>`).join("");
  // Detalle del día
  const sel = porDia[estado.diaSel] || [], dSel = fechaDia(estado.diaSel);
  $("cal-detalle").innerHTML = `<h3>${may(dSel.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))}</h3>` +
    (sel.length ? sel.map(evento).join("") : `<p class="fecha-txt" style="margin:0">No hay nada programado este día.</p>`);
  // Próximas
  const prox = D.eventos.filter(e => e.fecha >= hoy).slice(0, 6);
  $("cal-proximas").innerHTML = prox.length ? prox.map(e => evento(e, true)).join("") : `<p class="fecha-txt" style="margin:0">No hay fechas próximas.</p>`;
}
function evento(e, conCartel) {
  return `<div class="evento">
    ${conCartel ? cartel(e.fecha, e.tipo) : ""}
    <div><span class="etq tipo ${claseTipo(e.tipo, "evento")}">${esc(e.tipo)}</span>
      <h4>${esc(e.titulo)}</h4>
      <div class="info">
        ${e.hora ? `<span>${icono("reloj", "p")}${esc(e.hora)}${e.hora_fin ? "–" + esc(e.hora_fin) : ""}</span>` : ""}
        ${e.lugar ? `<span>${icono("lugar", "p")}${esc(e.lugar)}</span>` : ""}
      </div>
      ${e.descripcion ? `<div>${textoHTML(e.descripcion)}</div>` : ""}</div></div>`;
}
$("cal-ant").onclick = () => { estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() - 1, 1); pintaCalendario(); };
$("cal-sig").onclick = () => { estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() + 1, 1); pintaCalendario(); };
$("cal-hoy").onclick = () => { estado.mes = new Date(); estado.diaSel = hoyISO(); pintaCalendario(); };

// ---------- Convenio ----------
function pintaConvenio() {
  $("conv-intro").innerHTML = `<span class="ic">${icono("convenio")}</span><div>${textoHTML(D.paginas.convenio || "")}</div>`;
  const cats = [...new Set([...nombres("convenio"), ...D.convenio.map(s => s.categoria)])].filter(c => D.convenio.some(s => s.categoria === c));
  pintaFiltros("filtros-convenio", cats, estado.catConv, o => { estado.catConv = o; pintaConvenio(); });
  const qr = $("buscar-convenio").value.trim(), q = normal(qr);
  const l = D.convenio.filter(s => (estado.catConv === "Todos" || s.categoria === estado.catConv) &&
    (!q || normal(s.titulo + " " + s.resumen + " " + s.contenido + " " + (s.articulo || "")).includes(q)));
  $("lista-convenio").innerHTML = l.length ? l.map(s => `<details class="panel apartado" ${q ? "open" : ""}>
      <summary><div class="txt">
        <div class="meta"><span class="etq tipo ${claseTipo(s.categoria, "convenio")}">${esc(s.categoria)}</span>${s.articulo ? `<span class="etq">${esc(s.articulo)}</span>` : ""}</div>
        <h3>${esc(s.titulo)}</h3>${s.resumen ? `<div class="res">${esc(s.resumen)}</div>` : ""}</div>
        ${icono("abajo", "flecha")}</summary>
      <div class="contenido">${textoHTML(s.contenido, qr)}</div></details>`).join("")
    : vacio("convenio", q ? "No hay apartados que coincidan con la búsqueda." : "Todavía no hay apartados del convenio.");
  $("lista-docs").innerHTML = D.docs.length ? D.docs.map(d => `<a class="doc" href="${esc(d.url)}" target="_blank" rel="noopener">
      <span class="ic">${icono("pdf", "p")}</span><span><b>${esc(d.titulo)}</b><small>${esc(d.categoria)} · ${fechaLarga(d.fecha)}</small></span></a>`).join("")
    : `<p class="fecha-txt" style="margin:0">Aún no hay documentos subidos.</p>`;
}
$("buscar-convenio").oninput = () => pintaConvenio();

// ---------- Actas ----------
function pintaActas() {
  const tipos = [...new Set([...nombres("acta"), ...D.actas.map(a => a.tipo)])].filter(t => D.actas.some(a => a.tipo === t));
  pintaFiltros("filtros-actas", tipos, estado.tipoActa, o => { estado.tipoActa = o; pintaActas(); });
  const qr = $("buscar-actas").value.trim(), q = normal(qr);
  const l = D.actas.filter(a => (estado.tipoActa === "Todos" || a.tipo === estado.tipoActa) &&
    (!q || normal(a.titulo + " " + a.resumen + " " + a.acuerdos).includes(q)));
  if (!l.length) { $("lista-actas").innerHTML = vacio("actas", q ? "No hay actas que coincidan con la búsqueda." : "Todavía no hay actas publicadas."); return; }
  let html = "", anyo = null;
  l.forEach(a => {
    const y = a.fecha.slice(0, 4);
    if (y !== anyo) { html += `<div class="grupo-anyo">${y}</div>`; anyo = y; }
    html += `<article class="panel acta">
      ${cartel(a.fecha, a.tipo, "acta")}
      <div><span class="etq tipo ${claseTipo(a.tipo, "acta")}">${esc(a.tipo)}</span>
        <h3>${esc(a.titulo)}</h3>
        <div class="fecha-txt">${fechaLarga(a.fecha + "T12:00:00")}</div>
        ${a.resumen ? `<div style="margin-top:8px">${textoHTML(a.resumen, qr)}</div>` : ""}
        ${a.acuerdos ? `<div class="acuerdos"><b>Acuerdos</b>${textoHTML(a.acuerdos, qr)}</div>` : ""}
        ${a.pdf_url ? `<a class="adjunto" href="${esc(a.pdf_url)}" target="_blank" rel="noopener">${icono("pdf", "p")}Descargar el acta (PDF)</a>` : ""}
      </div></article>`;
  });
  $("lista-actas").innerHTML = html;
}
$("buscar-actas").oninput = () => pintaActas();

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
  pintaInicio(); pintaAvisos(idNuevo); pintaCalendario(); pintaConvenio(); pintaActas(); pintaInfo();
}
cargar();

// ---------- Tiempo real ----------
const toast = $("toast");
sb.channel("avisos-directo")
  .on("postgres_changes", { event: "*", schema: "public", table: "comunicados" }, (pl) => {
    cargar(pl.new?.id);
    if (pl.eventType === "INSERT") {
      toast.innerHTML = icono("campana", "p") + "Nuevo aviso: " + esc(pl.new.titulo || "");
      toast.classList.add("ver");
      toast.onclick = () => { location.hash = "avisos"; toast.classList.remove("ver"); };
      setTimeout(() => toast.classList.remove("ver"), 9000);
    }
  }).subscribe();
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
