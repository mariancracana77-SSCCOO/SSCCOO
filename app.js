// ===== Web pública: Sección Sindical CCOO Calsina Carré =====
const $ = (id) => document.getElementById(id);
const D = { avisos: [], eventos: [], convenio: [], docs: [], actas: [], preguntas: [], delegados: [], enlaces: [], apartados: [], publicaciones: [], encuestas: [], votos: {}, calc: { permisos: [], categorias: [], ajustes: {} }, paginas: {} };
const estado = { catAviso: "Todos", catConv: "Todos", tipoActa: "Todos", catDoc: "Todos", catPreg: "Todos", archivo: false, mes: new Date(), diaSel: hoyISO(),
  fechas: { avisos: {}, actas: {}, docs: {}, ap: {} }, ap: null, calc: "vacaciones", permiso: null };

// En el navegador con la sesión del panel abierta no se cuentan visitas ni lecturas (las pruebas del administrador no inflan las cifras)
const ES_ADMIN = (() => { try { return Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k)); } catch (_) { return false; } })();

// ---------- Iconos fijos ----------
document.querySelectorAll("[data-i]").forEach(el => el.outerHTML = icono(el.dataset.i));
document.querySelectorAll("[data-ic]").forEach(el => el.innerHTML = icono(el.dataset.ic));
$("cal-ant").innerHTML = icono("izq", "p"); $("cal-sig").innerHTML = icono("der", "p");
$("version-web").textContent = "Versión " + VERSION_WEB;
document.querySelector(".contacto-btn").innerHTML = icono("correo", "p") + "Escribir a la Sección Sindical";

// ---------- Navegación ----------
const VISTAS = ["inicio", "avisos", "calendario", "convenio", "calcula", "actas", "documentos", "preguntas", "info", "buscar", "legal"];
function irA() {
  const h = location.hash.slice(1), avisoDirecto = /^aviso-\d+$/.test(h) ? h : null;
  const legal = h === "aviso-legal" || h === "privacidad" ? h : null, aDelegados = h === "delegados", aEncuesta = /^encuesta-\d+$/.test(h) ? h : null;
  const ap = /^ap-[a-z0-9-]+$/.test(h) ? h.slice(3) : null;
  if (ap && ap !== estado.ap) { estado.ap = ap; estado.fechas.ap = {}; if ($("buscar-ap")) $("buscar-ap").value = ""; }
  const v = avisoDirecto ? "avisos" : legal ? "legal" : aDelegados ? "info" : ap ? "apartado" : (VISTAS.includes(h) ? h : "inicio");
  if (ap) pintaApartado();
  if (aDelegados) setTimeout(() => ($("lista-delegados").children.length ? $("tit-delegados") : $("txt-contacto"))?.scrollIntoView({ block: "start" }), 50);
  if (legal) setTimeout(() => $("leg-" + legal)?.scrollIntoView({ block: "start" }), 50);
  if (aEncuesta) { const ir = () => { const el = $(aEncuesta); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("nuevo"); } else if (!cargar.listo) setTimeout(ir, 300); }; setTimeout(ir, 300); }
  if (avisoDirecto) setTimeout(() => { const el = $(avisoDirecto); if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("nuevo"); } }, 300);
  // La vista nueva entra desde el lado de su pestaña (más a la derecha en la barra: entra por la derecha)
  const orden = ordenVistas(), clave = ap ? "ap-" + ap : v;
  const iAntes = orden.indexOf(irA.antes), iAhora = orden.indexOf(clave), lado = iAntes < 0 || iAhora < 0 || iAntes === iAhora ? "" : iAhora > iAntes ? "desde-der" : "desde-izq";
  const cambia = irA.antes !== undefined && irA.antes !== clave; irA.antes = clave;
  document.querySelectorAll(".vista").forEach(s => { s.classList.toggle("activa", s.id === "v-" + v); s.classList.remove("desde-der", "desde-izq"); });
  if (lado && cambia) $("v-" + v)?.classList.add(lado);
  if (v === "inicio" && cambia) animaPortada();
  marcaPestanas(clave);
  if (!avisoDirecto && !legal && !aDelegados && !aEncuesta) window.scrollTo(0, 0);
  const sec = ap ? "ap-" + ap : v;
  if (sec !== "inicio") { marcaVisto(sec); if (cargar.listo) pintaContadores(); }
  contarUnaVez("s:" + sec, () => sb.rpc("contar_seccion", { p_seccion: sec }));
  if (v === "buscar") setTimeout(() => $("buscar-todo").focus(), 100);
}

window.addEventListener("hashchange", irA);

// ---------- Pestañas agrupadas (v52) ----------
// Arriba solo salen los apartados principales; lo que va dentro (Actas en «Comité de empresa», los subapartados
// que crea el admin…) sale en una segunda fila (#subpestanas). Las direcciones de siempre (#actas, #ap-…) siguen valiendo.
// Si falta el apartado de arriba (borrado u oculto), lo de dentro vuelve a salir arriba.
const DENTRO_DE = { actas: "comite", convenio: "convenio-y-leyes", calcula: "convenio-y-leyes", preguntas: "@info" };
const APARTADO_AFILIATE = "afiliate"; // va el último, al lado de «Nosotros», para animar a afiliarse
const NOMBRE_FIJO = { inicio: "Inicio", avisos: "Avisos", calendario: "Calendario", actas: "Actas", documentos: "Documentos", convenio: "Convenio", calcula: "Calcula", preguntas: "Dudas", info: "Nosotros" };
let GRUPOS = [], GRUPO_DE = {};
const padreValido = (a) => !!a.padre_id && D.apartados.some(p => p.id === a.padre_id && !p.padre_id);
function montaGrupos() {
  const principales = D.apartados.filter(a => !padreValido(a));
  const fijo = (k) => ({ clave: k, titulo: NOMBRE_FIJO[k], miembros: [{ clave: k, titulo: NOMBRE_FIJO[k] }, ...Object.keys(DENTRO_DE).filter(x => DENTRO_DE[x] === "@" + k).map(x => ({ clave: x, titulo: NOMBRE_FIJO[x] }))] });
  const grupoAp = (a) => {
    const fijos = Object.keys(DENTRO_DE).filter(k => DENTRO_DE[k] === a.slug), hijos = D.apartados.filter(h => h.padre_id === a.id && padreValido(h));
    const propio = D.publicaciones.some(p => p.apartado_id === a.id) || a.slug === APARTADO_CONDUCTORES || !(fijos.length + hijos.length);
    return { clave: "ap-" + a.slug, titulo: a.titulo, miembros: [...(propio ? [{ clave: "ap-" + a.slug, titulo: a.titulo }] : []),
      ...fijos.map(k => ({ clave: k, titulo: NOMBRE_FIJO[k] })), ...hijos.map(h => ({ clave: "ap-" + h.slug, titulo: h.titulo }))] };
  };
  const sueltos = Object.keys(DENTRO_DE).filter(k => !DENTRO_DE[k].startsWith("@") && !principales.some(a => a.slug === DENTRO_DE[k])).map(k => ({ clave: k, titulo: NOMBRE_FIJO[k], miembros: [{ clave: k, titulo: NOMBRE_FIJO[k] }] }));
  GRUPOS = [fijo("inicio"), fijo("avisos"), fijo("calendario"), ...principales.filter(a => a.slug !== APARTADO_AFILIATE).map(grupoAp), ...sueltos,
    fijo("documentos"), fijo("info"), ...principales.filter(a => a.slug === APARTADO_AFILIATE).map(grupoAp)];
  GRUPO_DE = {}; GRUPOS.forEach(g => { GRUPO_DE[g.clave] = g; g.miembros.forEach(m => GRUPO_DE[m.clave] = g); });
}
const ordenVistas = () => GRUPOS.length ? GRUPOS.flatMap(g => g.miembros.map(m => m.clave)) : [...document.querySelectorAll(".pestanas-web a")].map(b => b.dataset.v);
function pintaPestanas() {
  montaGrupos();
  document.querySelector(".pestanas-web").innerHTML = GRUPOS.map(g => `<a href="#${esc(g.miembros[0].clave)}" data-v="${esc(g.clave)}">${esc(g.titulo)}</a>`).join("");
  marcaPestanas(irA.antes);
  flechasPestanas();
}
function marcaPestanas(clave) {
  const g = GRUPO_DE[clave], arriba = g ? g.clave : clave;
  document.querySelectorAll(".pestanas-web a").forEach(b => {
    const on = b.dataset.v === arriba; b.classList.toggle("activa", on); on ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current");
    if (on) b.scrollIntoView({ inline: "center", block: "nearest" });
  });
  const sub = $("subpestanas"), hay = g && g.miembros.length > 1;
  sub.classList.toggle("oculto", !hay);
  document.body.classList.toggle("con-subpestanas", !!hay);
  if (!hay) { sub.innerHTML = ""; return; }
  sub.setAttribute("aria-label", "Dentro de " + g.titulo);
  sub.innerHTML = g.miembros.map(m => `<a href="#${esc(m.clave)}" data-v="${esc(m.clave)}" class="${m.clave === clave ? "activa" : ""}"${m.clave === clave ? ' aria-current="page"' : ""}>${esc(m.titulo)}</a>`).join("");
  sub.scrollLeft = 0; // se ve desde el principio; solo se mueve si la elegida no cabe
  const act = sub.querySelector(".activa"); if (act && act.offsetLeft + act.offsetWidth > sub.clientWidth) sub.scrollLeft = act.offsetLeft - 16;
  if (cargar.listo) pintaContadores();
}

// ---------- Aviso de privacidad (informativo, no bloquea) ----------
// Sale la primera vez, encima de la barra de abajo. Con «Entendido» no vuelve a salir en este móvil
// (si el navegador no deja guardar, vuelve a salir la próxima vez que se abra la web).
(function avisoPrivacidad() {
  const caja = $("aviso-privacidad"), CLAVE = "ccoo-aviso-privacidad";
  let visto = false;
  try { visto = localStorage.getItem(CLAVE) === "1"; } catch (_) {}
  if (visto || !caja) return;
  const colocar = () => { const barra = $("barra-acciones"); caja.style.bottom = (barra ? barra.getBoundingClientRect().height : 0) + "px"; document.body.style.setProperty("--alto-aviso", caja.offsetHeight + "px"); };
  caja.classList.remove("oculto"); document.body.classList.add("con-aviso-priv"); colocar();
  addEventListener("resize", colocar); setTimeout(colocar, 300);
  // la barra de abajo se rellena después y cambia de alto con la letra grande: se recoloca sola
  const obs = "ResizeObserver" in window ? new ResizeObserver(colocar) : null;
  if (obs) { obs.observe($("barra-acciones")); obs.observe(caja); }
  $("aviso-privacidad-ok").addEventListener("click", () => {
    try { localStorage.setItem(CLAVE, "1"); } catch (_) {}
    caja.classList.add("oculto"); document.body.classList.remove("con-aviso-priv"); removeEventListener("resize", colocar); if (obs) obs.disconnect();
  });
})();

// Barra de pestañas: en el móvil caben 2 o 3 de 12 y no se notaba que se puede deslizar.
// Una flecha a cada lado (y la sombra) solo cuando hay más secciones escondidas por ese lado.
function flechasPestanas() {
  const nav = document.querySelector(".pestanas-web"), izq = document.querySelector(".pest-flecha.izq"), der = document.querySelector(".pest-flecha.der");
  if (!nav || !izq || !der) return;
  const hayIzq = nav.scrollLeft > 4, hayDer = nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4;
  izq.hidden = !hayIzq; der.hidden = !hayDer;
  nav.classList.toggle("hay-izq", hayIzq); nav.classList.toggle("hay-der", hayDer);
}
document.querySelectorAll(".pest-flecha").forEach(b => b.addEventListener("click", () => {
  const nav = document.querySelector(".pestanas-web"), lado = b.classList.contains("izq") ? -1 : 1;
  nav.scrollBy({ left: lado * nav.clientWidth * 0.7, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}));
document.querySelector(".pestanas-web")?.addEventListener("scroll", flechasPestanas, { passive: true });
window.addEventListener("resize", flechasPestanas);
irA();
flechasPestanas();

// ---------- Utilidades ----------
const vacio = (ic, t) => `<div class="panel vacio">${icono(ic)}${t}</div>`;
const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
function pintaFiltros(id, opciones, actual, alElegir) {
  $(id).innerHTML = opciones.length < 2 ? "" : ["Todos", ...opciones].map(o =>
    `<button class="filtro ${o === actual ? "activo" : ""}" data-o="${esc(o)}">${esc(o)}</button>`).join("");
  $(id).querySelectorAll("button").forEach(b => b.onclick = () => alElegir(b.dataset.o));
}
// Clasificación por año y mes: botones con los años que tienen algo y, dentro de un año, sus meses (con cuántos hay)
function pintaFechas(id, clave, items, isoDe, repintar) {
  const f = estado.fechas[clave], partes = items.map(x => partesFecha(isoDe(x))).filter(Boolean);
  const anyos = [...new Set(partes.map(p => p.a))].sort((a, b) => b - a);
  if (anyos.length < 2 && partes.length < 6) { $(id).innerHTML = ""; return; } // con muy poco no hace falta
  const boton = (dato, valor, texto, activo, n) => `<button class="filtro ${activo ? "activo" : ""}" data-${dato}="${valor}">${texto}${n != null ? ` <span class="cuenta">${n}</span>` : ""}</button>`;
  let html = `<div class="fila-anyos" role="group" aria-label="Año">${boton("a", "", "Todos", !f.a)}${anyos.map(a => boton("a", a, a, f.a == a, partes.filter(p => p.a === a).length)).join("")}</div>`;
  if (f.a) {
    const meses = [...new Set(partes.filter(p => p.a == f.a).map(p => p.m))].sort((a, b) => b - a);
    html += `<div class="fila-meses" role="group" aria-label="Mes">${boton("m", "", "Todo " + f.a, !f.m)}${meses.map(m => boton("m", m, may(MESES[m - 1]), f.m == m, partes.filter(p => p.a == f.a && p.m === m).length)).join("")}</div>`;
  }
  $(id).innerHTML = html;
  $(id).querySelectorAll("[data-a]").forEach(b => b.onclick = () => { f.a = b.dataset.a; f.m = ""; f.d = ""; repintar(); });
  $(id).querySelectorAll("[data-m]").forEach(b => b.onclick = () => { f.m = b.dataset.m; repintar(); });
}
// Pone un título de mes («Octubre de 2026 · 3») cada vez que cambia el mes en una lista ordenada por fecha
function porMeses(lista, isoDe, htmlDe) {
  let html = "", clave = null;
  lista.forEach(x => {
    const p = partesFecha(isoDe(x)), k = p ? p.a + "-" + p.m : "";
    if (k !== clave) { clave = k; const n = lista.filter(y => { const q = partesFecha(isoDe(y)); return q && q.a + "-" + q.m === k; }).length;
      html += `<h2 class="grupo-mes">${p ? may(MESES[p.m - 1]) + " de " + p.a : "Sin fecha"} <span>${n}</span></h2>`; }
    html += htmlDe(x);
  });
  return html;
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
const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIA_CORTO = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
// Última visita de este móvil (solo se guarda aquí, en el navegador). Sirve para marcar lo nuevo.
const ULTIMA = (() => { try { const v = +localStorage.getItem("ccoo-ultima-visita"); return v || Date.now() - 7 * 86400000; } catch (_) { return Date.now() - 7 * 86400000; } })();
const guardaVisita = () => { try { localStorage.setItem("ccoo-ultima-visita", String(Date.now())); } catch (_) {} };
addEventListener("pagehide", guardaVisita);
document.addEventListener("visibilitychange", () => { if (document.hidden) guardaVisita(); });
const esDesdeUltima = (f) => f && new Date(f).getTime() > ULTIMA;
// «Hoy · 19:00», «Mañana · todo el día», «Sáb 18 oct · 19:00»
const cuandoEvento = (e) => {
  const d = fechaDia(e.fecha), dias = Math.round((d - fechaDia(hoyISO())) / 86400000);
  const dia = dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : may(DIA_CORTO[d.getDay()]) + " " + d.getDate() + " " + MES_CORTO[d.getMonth()];
  return dia + (e.hora ? " · " + horaEvento(e).toLowerCase() : "");
};
const resumenPlano = (t, n) => { const r = String(t || "").replace(/\*\*/g, "").replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, "").replace(/\s+/g, " ").trim(); return r.length > n ? r.slice(0, n).replace(/\s+\S*$/, "") + "…" : r; };
const irADia = (iso) => { const d = fechaDia(iso); estado.mes = new Date(d.getFullYear(), d.getMonth(), 1); estado.diaSel = iso; pintaCalendario(); };

// Contador pequeño en cada pestaña: lo nuevo desde la última visita de este móvil (o desde que se abrió esa pestaña)
function leeVisto() { try { return JSON.parse(localStorage.getItem("ccoo-visto") || "{}") || {}; } catch (_) { return {}; } }
function marcaVisto(sec) { try { const v = leeVisto(); v[sec] = Date.now(); localStorage.setItem("ccoo-visto", JSON.stringify(v)); } catch (_) {} }
// Los festivos son fechas fijas del calendario, no noticias: salen en Calendario y en «Próximas paradas»,
// pero no cuentan como novedad (si no, al añadir los del año saldrían «14 novedades» a todo el mundo).
function esFestivo(e) { return (e.tipo || "").toLowerCase() === "festivo"; }
function pintaContadores() {
  const VISTO = leeVisto();
  const nuevos = (sec, l, f) => { const desde = Math.max(ULTIMA, VISTO[sec] || 0); return l.filter(x => f(x) && new Date(f(x)).getTime() > desde).length; };
  const c = { avisos: nuevos("avisos", D.avisos, a => a.fecha), calendario: nuevos("calendario", D.eventos.filter(e => !esFestivo(e)), e => e.creado), actas: nuevos("actas", D.actas, a => a.creado),
    documentos: nuevos("documentos", D.docs, d => d.fecha), convenio: nuevos("convenio", D.convenio, x => x.actualizado), preguntas: nuevos("preguntas", D.preguntas, x => x.creado) };
  D.apartados.forEach(a => { c["ap-" + a.slug] = nuevos("ap-" + a.slug, D.publicaciones.filter(p => p.apartado_id === a.id), p => p.creado); });
  const actual = irA.antes;
  document.querySelectorAll(".pestanas-web a[data-v], #subpestanas a[data-v]").forEach(a => {
    a.querySelectorAll(".cuenta-pestana, .sr-cuenta").forEach(e => e.remove());
    const g = a.closest("#subpestanas") ? null : GRUPOS.find(x => x.clave === a.dataset.v);
    const n = g ? g.miembros.reduce((t, m) => t + (m.clave === actual ? 0 : c[m.clave] || 0), 0) : a.dataset.v === actual ? 0 : c[a.dataset.v] || 0;
    if (n) a.insertAdjacentHTML("beforeend", `<span class="cuenta-pestana" aria-hidden="true">${n > 9 ? "9+" : n}</span><span class="sr-only sr-cuenta">, ${n} ${n === 1 ? "nuevo" : "nuevos"}</span>`);
  });
}

function pintaInicio() {
  $("txt-inicio").textContent = D.paginas.inicio || "";
  const hoy = hoyISO(), ahora = Date.now(), DIA = 86400000;
  const urg = ordenAvisos(D.avisos).find(a => a.urgente && ahora - new Date(a.fecha) < 14 * DIA);
  const prox = D.eventos.filter(e => e.fecha >= hoy).sort((a, b) => (a.fecha + (a.hora || "")).localeCompare(b.fecha + (b.hora || "")));
  // Rótulo: lo urgente; si no hay, la próxima cita; si no, «todo en orden»
  let rot;
  // Lo urgente lleva además una tira como los paneles luminosos de las autopistas (texto de puntos ámbar que pasa)
  const led = "AVISO URGENTE · " + String(urg?.titulo || "").toUpperCase() + " · ";
  if (urg) rot = `<a class="rotulo es-urgente" href="#aviso-${urg.id}"><span class="rot-tipo urgente">${icono("alerta", "p")}Urgente</span>
      <span class="rot-led" aria-hidden="true"><span class="rot-led-txt" style="animation-duration:${Math.max(8, Math.round(led.length * .28))}s"><span>${esc(led)}</span><span>${esc(led)}</span></span></span>
      <span class="rot-l1">${esc(urg.titulo)}</span><span class="rot-l2">${esc(resumenPlano(urg.contenido, 110))}</span>
      <span class="rot-ir">Ver el aviso completo${icono("der", "p")}</span></a>`;
  // Próxima cita como en la carretera: el título en un panel luminoso de autopista (letras blancas de puntos y luces
  // que parpadean en las esquinas) y, debajo, en un poste, la señal del lugar con los días que faltan (como los km)
  // y la de día y hora. (Un festivo solo sale si no hay ninguna reunión o asamblea por delante.)
  else if (prox[0]) { const e = prox.find(x => !esFestivo(x)) || prox[0], d = fechaDia(e.fecha), faltan = Math.round((d - fechaDia(hoy)) / DIA);
    const dias = faltan === 0 ? "Hoy" : faltan === 1 ? "Mañana" : `${faltan}<small>días</small>`;
    const fecha = may(DIA_CORTO[d.getDay()]) + " " + d.getDate() + " " + MES_CORTO[d.getMonth()] + (e.hora ? " · " + horaEvento(e) : "");
    rot = `<a class="rotulo cita" href="#calendario" data-dia="${e.fecha}"><span class="cita-et">Próxima parada</span>
      <span class="cita-panel"><i class="cita-luz"></i><i class="cita-luz"></i><b>${esc(e.titulo)}</b></span>
      <span class="cita-poste"><span class="cita-placa"><span>${icono("lugar", "p")}${esc(e.lugar || "Faltan")}<b>${dias}</b></span></span>
        <span class="cita-placa hora"><span>${icono("reloj", "p")}${esc(fecha)}</span></span></span>
      <span class="sr-only">${faltan > 1 ? "Faltan " + faltan + " días" : ""}</span>
      <span class="rot-ir">Ver en el calendario${icono("der", "p")}</span></a>`; }
  else rot = `<div class="rotulo"><span class="rot-tipo">Sin avisos urgentes</span><span class="rot-l1">Todo en orden</span><span class="rot-l2">Aquí verás lo importante en cuanto se publique.</span></div>`;
  $("inicio-rotulo").innerHTML = rot;
  // Todo lo publicado, por fecha
  const ICONOS = { aviso: ["avisos", "c-verde"], fecha: ["calendario", "c-azul"], acta: ["actas", "c-ambar"], doc: ["carpeta", "c-rojo"], conv: ["convenio", "c-morado"], preg: ["pregunta", "c-gris"], pub: ["carpeta", "c-turquesa"] };
  const items = [
    ...D.avisos.filter(a => a !== urg).map(a => ({ f: a.fecha, k: "aviso", que: "Aviso" + (a.fijado ? " · fijado" : ""), t: a.titulo, s: resumenPlano(a.contenido, 90), h: "#aviso-" + a.id, adj: (a.adjuntos || []).length, foto: (a.adjuntos || []).find(esImagen) })),
    ...D.eventos.filter(e => e.fecha >= hoy && !esFestivo(e)).map(e => ({ f: e.creado, k: "fecha", que: "Fecha · " + cuandoEvento(e), t: e.titulo, s: e.lugar || "", h: "#calendario", dia: e.fecha })),
    ...D.actas.map(a => ({ f: a.creado, k: "acta", que: "Acta" + (a.fecha ? " · " + fechaDia(a.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : ""), t: a.titulo, s: a.acuerdos ? (a.acuerdos.split("\n").filter(l => l.trim()).length + " acuerdo(s)") : resumenPlano(a.resumen, 90), h: "#actas" })),
    ...D.docs.map(d => ({ f: d.fecha, k: "doc", que: "Documento · " + tipoArchivo(d.tipo_archivo, d.nombre_archivo).txt, t: d.titulo, s: d.descripcion || "", url: d.url, id: d.id })),
    ...D.publicaciones.map(x => { const ap = D.apartados.find(y => y.id === x.apartado_id); return ap && { f: x.creado, k: "pub", ic: ap.icono, foto: (x.adjuntos || []).find(esImagen), que: ap.titulo, t: x.titulo, s: (x.adjuntos || []).length ? (x.adjuntos.length + " archivo(s)") : resumenPlano(x.contenido, 90), h: "#ap-" + ap.slug }; }).filter(Boolean),
    ...D.convenio.filter(c => ahora - new Date(c.actualizado) < 30 * DIA).map(c => ({ f: c.actualizado, k: "conv", que: "Convenio · actualizado", t: c.titulo, s: c.resumen || "", h: "#convenio" })),
    ...D.preguntas.filter(q => ahora - new Date(q.creado) < 30 * DIA).map(q => ({ f: q.creado, k: "preg", que: "Pregunta frecuente", t: q.pregunta, s: "", h: "#preguntas" })),
  ].filter(x => x.f).sort((a, b) => new Date(b.f) - new Date(a.f));
  const nNuevas = items.filter(x => esDesdeUltima(x.f)).length + (urg && esDesdeUltima(urg.fecha) ? 1 : 0);
  $("inicio-novedades").innerHTML = nNuevas
    ? `<button class="novedades-tira" id="ir-ultimo"><span class="n">${nNuevas}</span><span>${nNuevas === 1 ? "novedad" : "novedades"} desde tu última visita</span>${icono("abajo", "p")}</button>`
    : `<p class="novedades-tira al-dia">${icono("check", "p")}<span>Estás al día: nada nuevo desde tu última visita.</span></p>`;
  if ($("ir-ultimo")) $("ir-ultimo").onclick = () => $("lo-ultimo").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  // Próximas paradas
  $("inicio-paradas").innerHTML = `<h2 class="tit-seccion">Próximas paradas <a href="#calendario">Ver todas</a></h2>` + (prox.length
    ? `<ol class="ruta"><li class="ruta-hoy"><span class="ruta-aqui" aria-hidden="true"></span>
        <span class="cuando">Estás aquí · ${esc(new Date().toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }))}</span></li>${prox.slice(0, 3).map(e => `<li class="${e.fecha === hoy ? "hoy" : ""}"><a href="#calendario" data-dia="${e.fecha}">
        <span class="cuando">${esc(cuandoEvento(e))}</span><b>${esc(e.titulo)}</b>${e.lugar ? `<small>${icono("lugar", "p")}${esc(e.lugar)}</small>` : ""}</a></li>`).join("")}</ol>`
    : `<p class="ruta-vacia">No hay fechas próximas.</p>`);
  // Lo último
  const max = estado.feedMax || 20;
  const grupo = (f) => { const d = (ahora - new Date(f)) / DIA; return d < 1 && partesFecha(f).iso === hoy ? "Hoy" : d < 7 ? "Esta semana" : d < 31 ? "Este mes" : "Antes"; };
  let html = `<h2 class="tit-seccion">Lo último${nNuevas ? ` <span>${nNuevas} sin ver</span>` : ""}</h2>`, g = null;
  items.slice(0, max).forEach(x => {
    const gr = grupo(x.f);
    if (gr !== g) { html += `<h3 class="grupo-tablon">${gr}</h3>`; g = gr; }
    const [icDef, cl] = ICONOS[x.k], ic = x.ic || icDef;
    const attrs = x.url ? `href="${esc(urlSegura(x.url))}" target="_blank" rel="noopener" data-abre="documentos:${x.id}"` : `href="${x.h}"${x.dia ? ` data-dia="${x.dia}"` : ""}`;
    html += `<a class="item-tablon ${esDesdeUltima(x.f) ? "es-nuevo" : ""}" ${attrs}>
      ${x.foto ? `<span class="ic foto"><img src="${esc(urlSegura(x.foto.url))}" alt="" loading="lazy"></span>` : `<span class="ic ${cl}">${icono(ic, "p")}</span>`}
      <span class="txt"><small>${esDesdeUltima(x.f) ? '<span class="marca-nuevo">Nuevo</span>' : ""}<span>${esc(x.que)} · ${haceTxt(x.f)}</span></small>
        <b>${esc(x.t || "Sin título")}</b>${x.s ? `<span class="res">${esc(x.s)}</span>` : ""}${x.adj ? `<span class="res adj">${icono("clip", "p")} ${x.adj} archivo(s)</span>` : ""}</span>
    </a>`;
  });
  if (items.length > max) html += `<button class="btn sec ver-mas" id="ver-mas">Ver más</button>`;
  $("inicio-feed").innerHTML = items.length ? html : html + vacio("avisos", "Todavía no hay nada publicado.");
  if ($("ver-mas")) $("ver-mas").onclick = () => { estado.feedMax = max + 20; pintaInicio(); };
  if (aparece) $("inicio-feed").querySelectorAll(".item-tablon").forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("por-ver"); aparece.observe(el); } });
  // Accesos
  const IC_FIJO = { avisos: "avisos", calendario: "calendario", actas: "actas", documentos: "carpeta", convenio: "convenio", calcula: "reloj", preguntas: "pregunta" };
  const acc = GRUPOS.flatMap(g => g.miembros).filter(m => m.clave !== "inicio" && m.clave !== "info")
    .map(m => [m.clave, IC_FIJO[m.clave] || D.apartados.find(a => "ap-" + a.slug === m.clave)?.icono || "carpeta", m.titulo]);
  $("inicio-accesos").innerHTML = `<h2 class="tit-seccion">Ir a</h2><nav class="accesos-tablon" aria-label="Accesos rápidos">${acc.map(([v, ic, t]) =>
    `<a href="#${esc(v)}">${icono(esc(ic))}<b>${esc(t)}</b></a>`).join("")}</nav>`;
  pintaCuentaAtras(urg ? null : prox.find(x => !esFestivo(x)) || prox[0]);
  pintaSabias();
  document.querySelectorAll("#v-inicio [data-dia]").forEach(l => l.onclick = () => irADia(l.dataset.dia));
}

// Cuenta atrás hasta la próxima cita marcada como importante (se actualiza cada minuto; sin segundos para que no distraiga)
const inicioDe = (e) => { const d = fechaDia(e.fecha); if (e.hora && !esTodoElDia(e)) { const [h, m] = e.hora.split(":"); d.setHours(+h, +m || 0, 0, 0); } return d; };
const finDe = (e) => { const d = fechaDia(e.fecha); if (e.hora_fin && !esTodoElDia(e)) { const [h, m] = e.hora_fin.split(":"); d.setHours(+h, +m || 0, 0, 0); } else d.setHours(23, 59, 59, 0); return d; };
function pintaCuentaAtras(enRotulo) {
  clearInterval(pintaCuentaAtras.t);
  const ahora = new Date(), e = D.eventos.filter(x => x.importante && finDe(x) > ahora).sort((a, b) => inicioDe(a) - inicioDe(b))[0];
  if (!e) { $("cuenta-atras").innerHTML = ""; return; }
  const ms = inicioDe(e) - ahora, min = Math.floor(ms / 60000), dias = Math.floor(min / 1440), horas = Math.floor((min % 1440) / 60), mins = min % 60;
  // Marcador: si una cifra cambia respecto a la vez anterior, gira (como los paneles de las estaciones)
  const antes = pintaCuentaAtras.antes || {}, ahoraV = {};
  const bloque = (n, t) => { const k = t.replace(/s$/, ""); ahoraV[k] = n; const gira = antes.id === e.id && antes[k] !== undefined && antes[k] !== n;
    return `<span class="ca-bloque"><b class="${gira ? "gira" : ""}" data-n="${n}">${n}</b><small>${t}</small></span>`; };
  const cifras = ms <= 0 ? `<span class="ca-ahora">${esTodoElDia(e) || !e.hora ? "Es hoy" : "Está pasando ahora"}</span>`
    : dias > 0 ? bloque(dias, dias === 1 ? "día" : "días") + bloque(horas, horas === 1 ? "hora" : "horas")
    : bloque(horas, horas === 1 ? "hora" : "horas") + bloque(mins, "min");
  // Si la cita importante ya es la del rótulo (que dice cuántos días faltan), no se repite debajo
  if (enRotulo && enRotulo.id === e.id) { $("cuenta-atras").innerHTML = ""; return; }
  pintaCuentaAtras.antes = { ...ahoraV, id: e.id };
  $("cuenta-atras").innerHTML = `<a class="cuenta-atras" href="#calendario" data-dia="${e.fecha}" aria-label="${ms > 0 ? "Faltan " + (dias ? dias + " días y " : "") + horas + " horas para " : ""}${esc(e.titulo)}">
    <span class="ca-txt"><small>${ms > 0 ? "Faltan" : "Cita importante"}</small><b>${esc(e.titulo)}</b><small>${esc(cuandoEvento(e))}${e.lugar ? " · " + esc(e.lugar) : ""}</small></span>
    <span class="ca-cifras" aria-hidden="true">${cifras}</span></a>`;
  $("cuenta-atras").querySelector("[data-dia]").onclick = () => irADia(e.fecha);
  pintaCuentaAtras.t = setInterval(() => pintaCuentaAtras(enRotulo), 60000);
}

const aparece = "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches
  ? new IntersectionObserver((l) => l.forEach(en => { if (en.isIntersecting) { en.target.classList.replace("por-ver", "aparece"); aparece.unobserve(en.target); } }), { rootMargin: "0px 0px -40px 0px" }) : null;

// ---------- Encuestas anónimas (en la portada) ----------
// Se guarda en este móvil qué se votó (para enseñar los resultados y no votar dos veces); al servidor solo va +1 a esa opción.
const leeVotos = () => { try { return JSON.parse(localStorage.getItem("ccoo-votos") || "{}") || {}; } catch (_) { return {}; } };
function pintaEncuestas(recien) {
  const hace15 = new Date(Date.now() - 15 * 864e5).toISOString().slice(0, 10), mios = leeVotos();
  const l = D.encuestas.filter(x => encuestaAbierta(x) || (x.cierra && x.cierra >= hace15)).slice(0, 3);
  $("inicio-encuesta").innerHTML = l.map(x => encuestaHTML(x, D.votos[x.id] || {}, +mios[x.id] || 0, x.id === recien)).join("");
}
$("inicio-encuesta").addEventListener("click", async (ev) => {
  const c = ev.target.closest("[data-compartir-enc]");
  if (c) { const x = D.encuestas.find(e => e.id == c.dataset.compartirEnc); if (x) compartir(x.pregunta, `*Encuesta anónima de la Sección Sindical*\n\n${limpioTxt(x.pregunta)}\n${opcionesEncuesta(x).map(o => "- " + o).join("\n")}\n\nVota aquí (nadie sabe qué votas): ${WEB_URL}#encuesta-${x.id}`); return; }
  const b = ev.target.closest("[data-voto]"); if (!b) return;
  const [id, op] = b.dataset.voto.split(":").map(Number), caja = b.closest(".encuesta");
  caja.querySelectorAll(".enc-op").forEach(x => x.disabled = true); b.classList.add("elegida");
  const { error } = await sb.rpc("votar_encuesta", { p_id: id, p_opcion: op });
  if (error) { caja.querySelector(".enc-msg").textContent = error.message || "No se ha podido votar. Prueba otra vez."; caja.querySelectorAll(".enc-op").forEach(x => x.disabled = false); b.classList.remove("elegida"); return; }
  const v = leeVotos(); v[id] = op; try { localStorage.setItem("ccoo-votos", JSON.stringify(v)); } catch (_) {}
  const t = (D.votos[id] = D.votos[id] || {}); t[op] = (+t[op] || 0) + 1;
  pintaEncuestas(id);
  const nueva = document.querySelector(`.encuesta[data-enc="${id}"] h3`);
  if (nueva) nueva.insertAdjacentHTML("afterend", `<p class="enc-gracias"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7 12.5 3.2 3.2L17 9"/></svg>Gracias por participar</p>`);
  try { navigator.vibrate?.(30); } catch (_) {}
});

// ---------- Animaciones de la portada ----------
// Al abrir la web (tras la pantalla del camión) y al volver a Inicio: la línea de «Próximas paradas» se dibuja,
// el rótulo urgente da un destello, las cifras de la cuenta atrás corren como un marcador y, si hay novedades, la campana se mueve.
const QUIETO = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function sacudeCampana() {
  if (QUIETO()) return; const c = document.querySelector(".campana"); if (!c) return;
  c.classList.remove("sacude"); void c.offsetWidth; c.classList.add("sacude"); setTimeout(() => c.classList.remove("sacude"), 1300);
}
function animaPortada() {
  if (QUIETO() || $("bienvenida")?.isConnected && !$("bienvenida").classList.contains("fuera")) return;
  const v = $("v-inicio"); v.classList.remove("anima"); void v.offsetWidth; v.classList.add("anima");
  clearTimeout(animaPortada.t); animaPortada.t = setTimeout(() => v.classList.remove("anima"), 2600);
  v.querySelectorAll(".ca-bloque b[data-n]").forEach(b => {
    const fin = +b.dataset.n, t0 = performance.now(), dur = 900;
    if (!(fin > 0)) return;
    const paso = (t) => { const k = Math.min(1, (t - t0) / dur); b.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  });
  if (document.querySelector("#inicio-novedades .n")) setTimeout(sacudeCampana, 900);
}

// «Sabías que…»: un apartado del convenio distinto cada día (el mismo para todos ese día)
function pintaSabias() {
  const l = D.convenio.filter(c => c.titulo && (c.resumen || c.contenido));
  if (!l.length) { $("sabias-que").innerHTML = ""; return; }
  const hoy = new Date(), dia = Math.floor((Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - Date.UTC(hoy.getFullYear(), 0, 0)) / 86400000);
  const c = l[(dia + hoy.getFullYear()) % l.length];
  $("sabias-que").innerHTML = `<h2 class="tit-seccion">Sabías que…</h2><div class="sabias-tarjeta">
    <b>${esc(c.titulo)}</b><p>${esc(c.resumen || resumenPlano(c.contenido, 170))}</p>
    <a href="#convenio" id="sabias-leer">Leer en el convenio ${icono("der", "p")}</a></div>`;
  $("sabias-leer").onclick = () => { $("buscar-convenio").value = c.titulo; pintaConvenio(); };
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
    (l.length ? l.filter(a => a.fijado).map(a => tarjetaAviso(a, { nuevo: a.id === idNuevo, resaltar: qr })).join("") +
        porMeses(l.filter(a => !a.fijado), a => a.fecha, a => tarjetaAviso(a, { nuevo: a.id === idNuevo, resaltar: qr }))
      : vacio("avisos", buscando ? "No hay avisos que coincidan con la búsqueda o la fecha." : "Todavía no hay avisos publicados."));
}
$("buscar-avisos").oninput = () => pintaAvisos();

// ---------- Calendario ----------
const isoDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function pintaCalendario() {
  const m = estado.mes, ini = new Date(m.getFullYear(), m.getMonth(), 1);
  $("cal-mes").textContent = may(ini.toLocaleDateString("es-ES", { month: "long" })) + " " + ini.getFullYear();
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
  // Próximas fechas como un panel de salidas: día y hora en ámbar, qué y dónde en blanco
  $("cal-proximas").innerHTML = prox.length ? `<div class="tablero-cab" aria-hidden="true"><span>Día</span><span>Qué y dónde</span></div>` + prox.map(e => {
    const d = fechaDia(e.fecha), dias = Math.round((d - fechaDia(hoy)) / 86400000);
    const dia = dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : may(DIA_CORTO[d.getDay()]) + " " + d.getDate();
    const sub = (dias <= 1 ? d.getDate() + " " + MES_CORTO[d.getMonth()] : MES_CORTO[d.getMonth()]) + (e.hora ? " · " + (esTodoElDia(e) ? "todo el día" : e.hora.slice(0, 5)) : "");
    return `<button class="fila-tablero ${claseTipo(e.tipo, "evento")}" data-dia="${e.fecha}"><span class="t-dia">${esc(dia)}<small>${esc(sub)}</small></span>
      <span class="t-que"><span class="t-tipo">${esc(e.tipo)}</span><b>${esc(e.titulo || "Sin título")}</b>${e.lugar ? `<span class="t-lugar">${esc(e.lugar)}</span>` : ""}</span></button>`;
  }).join("") : `<p class="fecha-txt" style="margin:0;padding:16px">No hay fechas próximas.</p>`;
  $("cal-proximas").querySelectorAll("[data-dia]").forEach(b => b.onclick = () => { irADia(b.dataset.dia); $("cal-detalle").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); });
}
$("cal-ant").onclick = () => { estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() - 1, 1); pintaCalendario(); };
$("cal-sig").onclick = () => { estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() + 1, 1); pintaCalendario(); };
$("cal-ir").onchange = (e) => { if (!e.target.value) return; const [y, m] = e.target.value.split("-"); estado.mes = new Date(+y, +m - 1, 1); estado.diaSel = `${y}-${m}-01`; pintaCalendario(); };
document.querySelector(".cal-mes-btn").onclick = (e) => { if (e.target.id !== "cal-ir") { const i = $("cal-ir"); i.value = isoDe(estado.mes).slice(0, 7); try { i.showPicker(); } catch (_) { i.focus(); i.click(); } } };
$("cal-hoy").onclick = () => { estado.mes = new Date(); estado.diaSel = hoyISO(); pintaCalendario(); };

// ---------- Convenio ----------
function pintaConvenio() {
  // La tarjeta de arriba del convenio es un enlace de verdad: promete «los documentos más importantes»,
  // asi que lleva a Documentos. Antes era un <div> con pinta de tarjeta y al pulsarla no pasaba nada.
  const intro = (D.paginas.convenio || "").trim();
  $("conv-intro").innerHTML = intro
    ? `<a class="panel conv-intro" href="#documentos"><span class="ic">${icono("convenio")}</span><div>${textoHTML(intro)}<span class="conv-ir">Ver los documentos del convenio</span></div>${icono("der", "p")}</a>`
    : "";
  pintaFiltros("filtros-convenio", usadas("convenio", D.convenio, "categoria"), estado.catConv, o => { estado.catConv = o; pintaConvenio(); });
  const qr = $("buscar-convenio").value.trim(), q = normal(qr);
  const l = D.convenio.filter(s => (estado.catConv === "Todos" || s.categoria === estado.catConv) &&
    (!q || normal(s.titulo + " " + s.resumen + " " + s.contenido + " " + (s.articulo || "")).includes(q)));
  $("lista-convenio").innerHTML = l.length ? l.map(s => apartadoHTML(s, qr, !!q)).join("")
    : vacio("convenio", q ? "No hay apartados que coincidan con la búsqueda." : "Todavía no hay apartados del convenio.");
  const docsConv = D.docs.slice(0, 5);
  $("lista-docs").innerHTML = (docsConv.length ? docsConv.map(d => {
      const t = tipoArchivo(d.tipo_archivo, d.nombre_archivo || d.url);
      return `<a class="doc" href="${esc(urlSegura(d.url))}" target="_blank" rel="noopener"><span class="ic">${icono(t.ic, "p")}</span>
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
  const html = porMeses(l, a => a.fecha, a => actaHTML(a, qr));
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
  $("lista-documentos").innerHTML = l.length ? porMeses(l, d => d.fecha, docHTML)
    : vacio("carpeta", q || hayFecha("docs") ? "No hay documentos que coincidan con la búsqueda o la fecha." : "Todavía no hay documentos subidos.");
}
$("buscar-docs").oninput = () => pintaDocumentos();

// ---------- Apartados que crea el admin (Comité de empresa, etc.) ----------
// ---------- Zona Conductores: restricciones de circulación para camiones ----------
// Solo fuentes oficiales y gratuitas, comprobadas el 17/10/2026. La lista sale de la tabla «restricciones»
// y la fecha de revisión de paginas.restricciones_revisado: las dos se cambian en el panel («Restricciones camiones»).
// RESTRICCIONES_RESERVA solo se usa si la tabla no se puede leer (por ejemplo, sin conexión y sin caché).
const APARTADO_CONDUCTORES = "zona-conductores"; // dirección del apartado (no cambia aunque se renombre)
const RESTRICCIONES_REVISADO = "2026-10-17";
const RESTRICCIONES_RESERVA = [
  { pais: "España", fuente: "DGT (Dirección General de Tráfico)", idioma: "En español", url: "https://www.dgt.es/conoce-el-estado-del-trafico/restricciones-a-la-circulacion/" },
  { pais: "Cataluña", fuente: "Servei Català de Trànsit (Generalitat de Catalunya)", idioma: "En español", url: "https://transit.gencat.cat/es/informacio-viaria/professionals-transport/mesures-especials/index.html" },
  { pais: "Francia", fuente: "Bison Futé (Gobierno de Francia): calendario para camiones", idioma: "También en español", url: "https://www.bison-fute.gouv.fr/brochure-poids-lourds,11832.html" },
  { pais: "Alemania", fuente: "BALM (Oficina Federal de Logística y Movilidad)", idioma: "En alemán", url: "https://www.balm.bund.de/DE/Themen/RechtsentwicklungRechtsvorschriften/Rechtsvorschriften/Strassenverkehrsrecht/LKW-Fahrverbote/LKW-Fahrverbote_node.html" },
  { pais: "Italia", fuente: "Ministerio de Infraestructuras y Transportes: calendario de cada año", idioma: "En italiano", url: "https://www.mit.gov.it/taxonomy/term/1511" },
  { pais: "Portugal", fuente: "Infraestruturas de Portugal: camiones en la VCI de Oporto", idioma: "En portugués", url: "https://www.infraestruturasdeportugal.pt/pt-pt/regime-circulacao-VCI-isencao-pagamento-taxas-portagem-CREP" },
  { pais: "Rumanía", fuente: "Policía Rumana: avisos de tráfico y restricciones para pesados", idioma: "En rumano", url: "https://politiaromana.ro/ro/info-trafic" },
];
function restriccionesHTML() {
  const lista = D.restricciones || RESTRICCIONES_RESERVA;
  if (!lista.length) return "";
  const f = String(D.paginas.restricciones_revisado || "").trim();
  const revisado = fechaLarga((/^\d{4}-\d{2}-\d{2}$/.test(f) ? f : RESTRICCIONES_REVISADO) + "T12:00:00");
  return `<section class="restricciones" aria-labelledby="tit-restr">
    <h2 class="tit-seccion" id="tit-restr">Restricciones de circulación para camiones</h2>
    <p class="aviso-oficial">${icono("alerta", "p")}<span>Estos enlaces llevan a páginas oficiales. Antes de salir, comprueba la información en la fuente oficial. Revisado por última vez: ${esc(revisado)}.${lista.some(restrTraducida) ? " Las páginas en otro idioma se pueden traducir al abrirlas: en Android, toca «Traducir» o los tres puntos y «Traducir»; en iPhone, el botón «aA» y «Traducir». Es una traducción automática: ante la duda, fíjate en las fechas y horas de la original." : ""}</span></p>
    <p class="restr-intro">Días y horas en que los camiones no pueden circular en cada país. Ábrelo antes de un viaje para planificar la ruta.</p>
    <div class="lista-restr">${lista.map(restriccionHTML).join("")}</div>
  </section>`;
}

function pintaApartado() {
  const a = D.apartados.find(x => x.slug === estado.ap);
  if (!a) { $("ap-extra").innerHTML = ""; $("ap-titulo").textContent = D.apartados.length || !cargar.listo ? "Cargando…" : "Apartado no encontrado"; $("lista-ap").innerHTML = ""; $("ap-desc").textContent = ""; $("fechas-ap").innerHTML = ""; return; }
  $("ap-titulo").textContent = a.titulo;
  $("ap-desc").textContent = a.descripcion || "";
  $("ap-extra").innerHTML = a.slug === APARTADO_CONDUCTORES ? restriccionesHTML() : "";
  const todas = D.publicaciones.filter(x => x.apartado_id === a.id);
  pintaFechas("fechas-ap", "ap", todas, x => x.fecha, () => pintaApartado());
  const qr = $("buscar-ap").value.trim(), q = normal(qr);
  const l = todas.filter(x => pasaFecha("ap", x.fecha) && (!q || normal(x.titulo + " " + x.contenido + " " + (x.adjuntos || []).map(j => j.nombre).join(" ") + " " + textoFecha(x.fecha)).includes(q)));
  $("lista-ap").innerHTML = l.length ? porMeses(l, x => x.fecha, x => publicacionHTML(x, qr))
    : vacio(a.icono || "carpeta", q || hayFecha("ap") ? "No hay nada que coincida con la búsqueda o la fecha." : "Todavía no hay nada publicado en este apartado.");
}
$("buscar-ap").oninput = () => pintaApartado();

// ---------- Preguntas frecuentes ----------
function pintaPreguntas() {
  pintaFiltros("filtros-preguntas", usadas("pregunta", D.preguntas, "categoria"), estado.catPreg, o => { estado.catPreg = o; pintaPreguntas(); });
  const qr = $("buscar-preguntas").value.trim(), q = normal(qr);
  const l = D.preguntas.filter(p => (estado.catPreg === "Todos" || p.categoria === estado.catPreg) && (!q || normal(p.pregunta + " " + p.respuesta).includes(q)));
  $("lista-preguntas").innerHTML = l.length ? l.map(p => preguntaHTML(p, qr, !!q)).join("")
    : vacio("pregunta", q ? "No hay preguntas que coincidan. Escríbenos y te respondemos." : "Todavía no hay preguntas frecuentes.");
}
$("buscar-preguntas").oninput = () => pintaPreguntas();

// ---------- Calculadoras del convenio ----------
// Los valores (días, precios…) los pone el admin en el panel. Aquí solo se hacen las cuentas, en el móvil.
const numDe = (el) => { const v = parseFloat(String(el?.value || "").replace(",", ".")); return isNaN(v) || v < 0 ? 0 : v; };
document.querySelectorAll("[data-calc]").forEach(b => b.onclick = () => { estado.calc = b.dataset.calc; estado.permiso = null; pintaCalcula(); });
function pintaCalcula() {
  const A = D.calc.ajustes, z = $("calc-zona");
  $("calc-aviso-txt").textContent = A.aviso || "Cálculo orientativo. Ante cualquier duda, pregunta a un delegado.";
  document.querySelectorAll("[data-calc]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.calc === estado.calc)));
  if (estado.calc === "vacaciones") {
    const anyo = new Date().getFullYear();
    z.innerHTML = `<h2>Vacaciones que te quedan</h2>
      <label for="cv-total">Días de vacaciones al año</label>
      <input id="cv-total" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(A.vac_dias || "30")}">
      <p class="ayuda">${esc(A.vac_nota || "")}</p>
      <label class="check"><input type="checkbox" id="cv-nuevo">Empecé a trabajar este año (${anyo})</label>
      <div id="cv-fecha-caja" class="oculto"><label for="cv-fecha">Día en que empezaste</label><input id="cv-fecha" type="date" min="${anyo}-01-01" max="${anyo}-12-31"></div>
      <label for="cv-gastados">Días que ya has disfrutado o pedido este año</label>
      <input id="cv-gastados" type="number" inputmode="decimal" min="0" step="0.5" placeholder="0">
      <div id="cv-res" aria-live="polite"></div>`;
    const calcula = () => {
      let total = numDe($("cv-total"));
      const f = $("cv-nuevo").checked && $("cv-fecha").value ? fechaDia($("cv-fecha").value) : null;
      let prop = "";
      if (f) {
        const fin = new Date(anyo, 11, 31), dAnyo = (new Date(anyo + 1, 0, 1) - new Date(anyo, 0, 1)) / 86400000, dTrab = Math.round((fin - f) / 86400000) + 1;
        const t = Math.round(total * Math.max(0, dTrab) / dAnyo * 2) / 2;
        prop = `Como empezaste el ${f.getDate()} de ${MESES[f.getMonth()]}, te corresponde la parte proporcional: ${numTxt(t)} de ${numTxt(total)}.`;
        total = t;
      }
      const gastados = numDe($("cv-gastados")), quedan = Math.max(0, total - gastados), unidad = A.vac_unidad || "días";
      $("cv-res").innerHTML = `<div class="resultado-calc"><span class="rc-tit">Te quedan</span><span class="rc-num">${numTxt(quedan)} <small>${esc(unidad)}</small></span>
        <span class="rc-sub">${numTxt(total)} que te corresponden − ${numTxt(gastados)} ya disfrutados</span>${prop ? `<p>${esc(prop)}</p>` : ""}${gastados > total ? `<p><b>Has puesto más días disfrutados que los que te corresponden.</b> Revisa los datos o consúltalo con un delegado.</p>` : ""}</div>`;
    };
    $("cv-nuevo").onchange = () => { $("cv-fecha-caja").classList.toggle("oculto", !$("cv-nuevo").checked); calcula(); };
    ["cv-total", "cv-gastados", "cv-fecha"].forEach(id => $(id).oninput = calcula);
    calcula();
  } else if (estado.calc === "permisos") {
    const l = D.calc.permisos, p = l.find(x => x.id === estado.permiso);
    if (!l.length) { z.innerHTML = `<h2>Permisos retribuidos</h2><p class="fecha-txt">Todavía no se han puesto los permisos. Pregunta a un delegado.</p>`; return; }
    if (!p) {
      z.innerHTML = `<h2>¿Qué ha pasado?</h2><p class="ayuda" style="margin-top:0">Toca lo que te ocurre y te decimos qué permiso pagado te corresponde.</p>
        <div class="opciones-permiso">${l.map(x => `<button class="opcion-permiso" data-permiso="${x.id}"><span>${esc(x.nombre)}</span>${icono("der", "p")}</button>`).join("")}</div>`;
      z.querySelectorAll("[data-permiso]").forEach(b => b.onclick = () => { estado.permiso = +b.dataset.permiso; pintaCalcula(); $("calc-zona").scrollIntoView({ block: "start" }); });
      return;
    }
    const conPregunta = Number(p.dias_extra) > 0 && p.pregunta_extra;
    z.innerHTML = `<button class="volver-calc" id="cp-volver">${icono("izq", "p")}Elegir otro motivo</button>
      ${conPregunta ? `<h2>${esc(p.pregunta_extra)}</h2><div class="si-no" role="radiogroup" aria-label="${esc(p.pregunta_extra)}">
        <label><input type="radio" name="cp-extra" value="no" checked><span>No</span></label><label><input type="radio" name="cp-extra" value="si"><span>Sí</span></label></div>` : ""}
      <div id="cp-res" aria-live="polite"></div>`;
    const res = () => { $("cp-res").innerHTML = resultadoPermisoHTML(p, conPregunta && document.querySelector('input[name="cp-extra"]:checked')?.value === "si"); };
    z.querySelectorAll('input[name="cp-extra"]').forEach(r => r.onchange = res);
    $("cp-volver").onclick = () => { estado.permiso = null; pintaCalcula(); };
    res();
  } else {
    const cats = D.calc.categorias;
    if (!cats.length) { z.innerHTML = `<h2>Horas extra</h2><p class="fecha-txt">Todavía no se han puesto los precios de las horas extra. Pregunta a un delegado.</p>`; return; }
    z.innerHTML = `<h2>Horas extra</h2>
      <label for="ce-cat">Tu categoría</label>
      <select id="ce-cat">${cats.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select>
      <div class="fila-calc"><div><label for="ce-h">Horas extra normales</label><input id="ce-h" type="number" inputmode="decimal" min="0" step="0.5" placeholder="0"></div>
      <div id="ce-f-caja"><label for="ce-f">Horas extra en festivo</label><input id="ce-f" type="number" inputmode="decimal" min="0" step="0.5" placeholder="0"></div></div>
      <div id="ce-res" aria-live="polite"></div>
      <p class="ayuda">${esc(A.extra_nota || "")}</p>`;
    const calcula = () => {
      const c = cats.find(x => x.id == $("ce-cat").value) || cats[0], pf = Number(c.precio_extra_festiva || 0);
      $("ce-f-caja").classList.toggle("oculto", !pf);
      const h = numDe($("ce-h")), f = pf ? numDe($("ce-f")) : 0, total = h * Number(c.precio_extra || 0) + f * pf;
      $("ce-res").innerHTML = `<div class="resultado-calc"><span class="rc-tit">Te corresponden</span><span class="rc-num">${eurosTxt(total)}</span>
        <span class="rc-sub">${numTxt(h)} h × ${eurosTxt(c.precio_extra)}${pf ? ` + ${numTxt(f)} h × ${eurosTxt(pf)} (festivo)` : ""}</span></div>`;
    };
    ["ce-cat", "ce-h", "ce-f"].forEach(id => $(id).oninput = calcula); $("ce-cat").onchange = calcula;
    calcula();
  }
}

// ---------- Buzón anónimo ----------
// Se envía con una función de la base de datos que comprueba el texto y pone un límite diario.
// No se guarda nada del móvil: ni IP, ni identificadores, ni la hora (solo el día).
const PARECE_DATO = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(\+?\d[ .-]?){9,}/i;
$("buzon-texto").oninput = () => { $("buzon-cuenta").textContent = $("buzon-texto").value.length; msg2("buzon-msg", ""); };
function msg2(id, t, ok) { const el = $(id); el.textContent = t; el.className = "msg " + (t ? (ok ? "ok" : "err") : ""); }
$("buzon-enviar").onclick = async () => {
  const texto = $("buzon-texto").value.trim(), tipo = document.querySelector('input[name="buzon-tipo"]:checked')?.value || "Pregunta";
  if ($("buzon-web").value) { $("buzon-texto").value = ""; return msg2("buzon-msg", "Enviado. Gracias.", true); } // relleno por un programa automático
  if (texto.length < 5) return msg2("buzon-msg", "Escribe un poco más para que se entienda.");
  if (PARECE_DATO.test(texto)) return msg2("buzon-msg", "Quita el email o el teléfono: el buzón es anónimo.");
  if (!$("buzon-acepto").checked) { $("buzon-acepto").focus(); return msg2("buzon-msg", "Para enviarlo, marca la casilla de la política de privacidad."); }
  const clave = "ccoo-buzon-" + hoyISO(); let n = 0;
  try { n = +localStorage.getItem(clave) || 0; } catch (_) {}
  if (n >= 3) return msg2("buzon-msg", "Ya has enviado 3 mensajes hoy desde este móvil. Prueba mañana o habla con un delegado.");
  const b = $("buzon-enviar"); b.disabled = true; msg2("buzon-msg", "Enviando…", true);
  const { error } = await sb.rpc("enviar_buzon", { p_tipo: tipo, p_texto: texto });
  b.disabled = false;
  if (error) return msg2("buzon-msg", /[a-záéíóú]/i.test(error.message || "") && !/fetch|network/i.test(error.message) ? error.message : "No se ha podido enviar. Comprueba la conexión y vuelve a intentarlo.");
  try { Object.keys(localStorage).filter(k => k.startsWith("ccoo-buzon-") && k !== clave).forEach(k => localStorage.removeItem(k)); localStorage.setItem(clave, String(n + 1)); } catch (_) {}
  $("buzon-texto").value = ""; $("buzon-cuenta").textContent = "0"; $("buzon-acepto").checked = false;
  msg2("buzon-msg", "Enviado. Gracias. Lo leerá la Sección Sindical.", true);
};

// ---------- Nosotros ----------
function pintaInfo() {
  $("txt-aviso-legal").innerHTML = textoHTML(D.paginas.aviso_legal || "Texto pendiente de publicar.");
  $("txt-privacidad").innerHTML = textoHTML(D.paginas.privacidad || "Texto pendiente de publicar.");
  $("txt-quienes").innerHTML = textoHTML(D.paginas.quienes || "");
  $("txt-contacto").innerHTML = textoHTML(D.paginas.contacto || "");
  $("tit-delegados").classList.toggle("oculto", !D.delegados.length);
  $("lista-delegados").innerHTML = D.delegados.map(delegadoHTML).join("");
  $("tit-enlaces").classList.toggle("oculto", !D.enlaces.length);
  $("lista-enlaces").innerHTML = D.enlaces.map(enlaceHTML).join("");
}

// ---------- Copia de lo último cargado (para verlo sin cobertura) ----------
// Solo contenido público de la web; se guarda en este móvil y se sustituye en cada carga correcta.
function guardaCopia(r) { try { localStorage.setItem("ccoo-copia", JSON.stringify({ t: Date.now(), r: r.map(x => x.data || []) })); } catch (_) {} }
function leeCopia() { try { const c = JSON.parse(localStorage.getItem("ccoo-copia") || "null"); return c && Array.isArray(c.r) && c.r.length === 17 ? c : null; } catch (_) { return null; } }
function sinRed(on, desde) {
  const b = $("sin-red"); if (!b) return;
  if (on) {
    const hace = desde ? haceTxt(new Date(desde).toISOString()) : "";
    b.querySelector(".txt").innerHTML = `<b>Sin cobertura.</b> ${desde ? "Estás viendo lo que se cargó " + esc(hace) + "." : "Se cargará en cuanto vuelva la conexión."}`;
    b.classList.remove("oculto", "arranca"); sinRed.on = true;
  } else if (sinRed.on) {
    sinRed.on = false; b.querySelector(".txt").innerHTML = "<b>Vuelve la conexión.</b> Actualizando…"; b.classList.add("arranca");
    setTimeout(() => b.classList.add("oculto"), 1600);
  }
}
addEventListener("offline", () => sinRed(true, leeCopia()?.t));
addEventListener("online", () => { cargar().then(() => sinRed(false), () => {}); });

// ---------- Carga de datos ----------
async function cargar(idNuevo) {
  await cargarOpciones();
  let [a, e, c, d, ac, p, pr, dl, en, aps, pubs, cp, cc, ca, rs, enc, vot] = await Promise.all([
    sb.from("comunicados").select("*").order("fecha", { ascending: false }).limit(200),
    sb.from("eventos").select("*").order("fecha"),
    sb.from("convenio_secciones").select("*").order("orden").order("id"),
    sb.from("documentos").select("*").order("fecha", { ascending: false }),
    sb.from("actas").select("*").order("fecha", { ascending: false }),
    sb.from("paginas").select("*"),
    sb.from("preguntas").select("*").order("orden").order("id"),
    sb.from("delegados").select("*").order("orden").order("id"),
    sb.from("enlaces").select("*").order("orden").order("id"),
    sb.from("apartados").select("*").order("orden").order("id"),
    sb.from("publicaciones").select("*").order("fecha", { ascending: false }).order("id", { ascending: false }).limit(1000),
    sb.from("calc_permisos").select("*").order("orden").order("id"),
    sb.from("calc_categorias").select("*").order("orden").order("id"),
    sb.from("calc_ajustes").select("*"),
    sb.from("restricciones").select("*").order("orden").order("id"),
    sb.from("encuestas").select("*").order("creado", { ascending: false }).limit(20),
    sb.from("encuesta_votos").select("*"),
  ]);
  if (a.error) {
    // Sin cobertura: se enseña lo último que se cargó en este móvil (si lo hay) y se avisa con el camión aparcado
    const copia = leeCopia();
    sinRed(true, copia && copia.t);
    if (!copia) {
      document.querySelectorAll("#inicio-rotulo, #lista-avisos").forEach(el =>
        el.innerHTML = vacio("alerta", "No se ha podido conectar. En cuanto vuelva la conexión se cargará sola."));
      return;
    }
    if (cargar.listo) return; // ya hay datos en pantalla: se quedan
    [a, e, c, d, ac, p, pr, dl, en, aps, pubs, cp, cc, ca, rs, enc, vot] = copia.r.map(x => ({ data: x, error: null }));
  } else { guardaCopia([a, e, c, d, ac, p, pr, dl, en, aps, pubs, cp, cc, ca, rs, enc, vot]); sinRed(false); }
  // La web enseña solo lo publicado, también si en este móvil está abierta la sesión del panel
  // (el servidor a un administrador le da todo: avisos programados, publicaciones y apartados ocultos)
  const ahoraMs = Date.now();
  D.avisos = (a.data || []).filter(x => !x.publicar_en || new Date(x.publicar_en).getTime() <= ahoraMs); D.eventos = e.data || []; D.convenio = (c.data || []).filter(x => x.visible !== false); D.docs = d.data || []; D.actas = ac.data || [];
  D.paginas = Object.fromEntries((p.data || []).map(x => [x.slug, x.contenido]));
  pintaTextosPrivacidad();
  D.preguntas = pr.data || []; D.delegados = dl.data || []; D.enlaces = en.data || [];
  D.apartados = (aps.data || []).filter(x => x.visible !== false);
  D.publicaciones = (pubs.data || []).filter(x => x.publicado !== false && D.apartados.some(ap => ap.id === x.apartado_id)); cargar.listo = true;
  D.restricciones = rs.error ? null : (rs.data || []).filter(x => x.visible !== false); // null: se usa la lista de reserva
  D.encuestas = (enc.data || []).filter(x => x.publicada !== false);
  D.votos = {}; (vot.data || []).forEach(v => { (D.votos[v.encuesta_id] = D.votos[v.encuesta_id] || {})[v.opcion] = v.n; });
  D.calc = { permisos: cp.data || [], categorias: cc.data || [], ajustes: Object.fromEntries((ca.data || []).map(x => [x.clave, x.valor])) };
  if (!$("calc-zona").contains(document.activeElement)) pintaCalcula(); // no borrar lo que se está escribiendo
  pintaPestanas(); pintaApartado();
  pintaInicio(); pintaEncuestas(); pintaAvisos(idNuevo); pintaCalendario(); pintaConvenio(); pintaActas(); pintaDocumentos(); pintaPreguntas(); pintaInfo(); pintaCanales(); pintaContadores();
  if (/^#aviso-\d+$/.test(location.hash) && !cargar.hecho) { cargar.hecho = true; irA(); }
}
// Pantalla de bienvenida: dura lo que tarda el camión en formar el logo (4,3 s) y se quita al terminar de cargar.
// Tocarla la salta. Sale aunque el móvil tenga «quitar animaciones» (muchos lo activan solos con el ahorro de batería).
// La animación no empieza hasta que la página ha cargado: en la app instalada, Android tapa los primeros segundos
// con su propia pantalla y, si empezaba antes, terminaba sin que se viera.
// Al quitarla, lo que hay en pantalla entra escalonado (solo esta vez, no en cada actualización).
function quitarBienvenida() {
  const bv = $("bienvenida"); if (!bv || bv.classList.contains("fuera")) return;
  if (!quitarBienvenida.ya && quitarBienvenida.t0 == null) { quitarBienvenida.pend = true; return; }
  const quieto = QUIETO();
  clearTimeout(quitarBienvenida.t);
  quitarBienvenida.t = setTimeout(() => {
    const listas = document.querySelectorAll("#inicio-feed, #inicio-paradas, .accesos-tablon, [id^='lista-']");
    if (!quieto) listas.forEach(el => el.classList.add("anima-entra"));
    bv.classList.add("fuera");
    if (!location.hash || location.hash === "#inicio") animaPortada();
    setTimeout(() => { bv.remove(); listas.forEach(el => el.classList.remove("anima-entra")); }, 1200);
  }, quitarBienvenida.ya ? 0 : Math.max(0, 4300 - (performance.now() - quitarBienvenida.t0)));
}
function empiezaBienvenida() {
  const bv = $("bienvenida"); if (!bv || quitarBienvenida.t0 != null) return;
  quitarBienvenida.t0 = performance.now();
  bv.classList.add("bv-anda");
  if (quitarBienvenida.pend) quitarBienvenida();
}
if (document.readyState === "complete") requestAnimationFrame(empiezaBienvenida);
else { addEventListener("load", () => requestAnimationFrame(empiezaBienvenida), { once: true }); setTimeout(empiezaBienvenida, 3000); }
if ($("bienvenida")) $("bienvenida").addEventListener("click", () => { quitarBienvenida.ya = true; quitarBienvenida(); });
cargar().finally(quitarBienvenida);

// ---------- Tiempo real: avisos al momento si alguien tiene la web abierta ----------
const toast = $("toast");
function avisar(texto, hash) {
  toast.innerHTML = icono("campana", "p") + esc(texto);
  toast.classList.add("ver");
  toast.onclick = () => { location.hash = hash; toast.classList.remove("ver"); };
  clearTimeout(avisar.t); avisar.t = setTimeout(() => toast.classList.remove("ver"), 9000);
}
// Lo nuevo que llega mientras la web está abierta no se pinta de golpe (no salta nada en la pantalla):
// aparece una banda «Hay 1 novedad · Ver» y se muestra al pulsarla, sin recargar la página.
let recarga;
const PEND = [];
const QUE = { comunicados: "Aviso", actas: "Acta", documentos: "Documento", eventos: "Fecha", publicaciones: "Novedad" };
function pintaBandaNovedad() {
  const b = $("banda-novedad"), n = PEND.length;
  b.classList.toggle("oculto", !n);
  if (!n) { b.innerHTML = ""; return; }
  sacudeCampana();
  b.innerHTML = `<button id="ver-novedad" type="button"><span class="pt" aria-hidden="true"></span>
    <span class="txt">${n === 1 ? `Hay 1 novedad: <b>${esc(PEND[0].titulo || QUE[PEND[0].t])}</b>` : `Hay ${n} novedades`}</span><span class="ver">Ver</span></button>`;
  $("ver-novedad").onclick = verNovedades;
}
const irAHash = (h) => { if (location.hash.slice(1) === h) irA(); else location.hash = h; };
async function verNovedades() {
  const l = PEND.splice(0); pintaBandaNovedad();
  await cargar(l.length === 1 && l[0].t === "comunicados" ? l[0].id : null);
  if (l.length !== 1) { irAHash("inicio"); setTimeout(() => $("lo-ultimo").scrollIntoView({ block: "start" }), 60); return; }
  const x = l[0];
  if (x.t === "comunicados") return irAHash("aviso-" + x.id);
  if (x.t === "eventos") { if (x.fecha) irADia(x.fecha); return irAHash("calendario"); }
  if (x.t === "publicaciones") { const ap = D.apartados.find(a => a.id === x.apartado_id); return irAHash(ap ? "ap-" + ap.slug : "inicio"); }
  irAHash(x.t === "actas" ? "actas" : "documentos");
}
const canal = sb.channel("web-directo");
Object.keys(QUE).forEach(t => canal.on("postgres_changes", { event: "*", schema: "public", table: t }, (pl) => {
  if (pl.eventType === "INSERT" && pl.new?.id != null) {
    if (pl.new.publicado === false || (pl.new.publicar_en && new Date(pl.new.publicar_en) > new Date())) return; // oculto o programado: no es novedad todavía
    if (!PEND.some(x => x.t === t && x.id === pl.new.id)) PEND.push({ t, id: pl.new.id, titulo: pl.new.titulo, fecha: pl.new.fecha, apartado_id: pl.new.apartado_id });
    pintaBandaNovedad();
  } else { clearTimeout(recarga); recarga = setTimeout(() => cargar(), 400); } // cambios y borrados: se actualiza en silencio
}));
canal.subscribe();
document.addEventListener("visibilitychange", () => { if (!document.hidden) cargar(); });

// ---------- Desliza hacia abajo para actualizar (móvil) ----------
(function () {
  if (!("ontouchstart" in window)) return;
  const ind = $("tirar"), txt = ind.querySelector(".txt"), UMBRAL = 80;
  let y0 = null, x0 = 0, dy = 0, ocupado = false;
  const quitar = () => { ind.classList.remove("ver", "listo", "cargando"); ind.style.removeProperty("--tirar"); };
  addEventListener("touchstart", (e) => {
    y0 = (scrollY <= 0 && e.touches.length === 1 && !ocupado && !document.querySelector(".modal-velo")) ? e.touches[0].clientY : null;
    x0 = e.touches[0].clientX; dy = 0;
  }, { passive: true });
  addEventListener("touchmove", (e) => {
    if (y0 == null) return;
    dy = e.touches[0].clientY - y0;
    if (dy <= 0 || scrollY > 0 || Math.abs(e.touches[0].clientX - x0) > dy) { dy = 0; quitar(); return; } // gesto hacia los lados: no es para actualizar
    ind.classList.add("ver"); ind.style.setProperty("--tirar", Math.min(dy, 120) + "px");
    ind.classList.toggle("listo", dy > UMBRAL);
    txt.textContent = dy > UMBRAL ? "Suelta para actualizar" : "Desliza para actualizar";
  }, { passive: true });
  addEventListener("touchend", async () => {
    if (y0 == null) return; y0 = null;
    if (dy <= UMBRAL) { quitar(); return; }
    ocupado = true; ind.classList.add("cargando"); txt.textContent = "Actualizando…";
    try { await cargar(); txt.textContent = "Actualizado"; } catch (_) { txt.textContent = "No se ha podido actualizar"; }
    setTimeout(() => { quitar(); ocupado = false; }, 800);
  });
})();

// ---------- Deslizar a los lados para pasar de pestaña (móvil) ----------
// No salta si el dedo empieza en algo que ya se desliza a los lados (pestañas, filtros, galerías…), en un campo de texto o con una ventana abierta.
(function () {
  if (!("ontouchstart" in window)) return;
  let x0 = null, y0 = 0, t0 = 0;
  const seDesliza = (el) => { for (; el && el !== document.body; el = el.parentElement) { const cs = getComputedStyle(el); if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2) return true; } return false; };
  addEventListener("touchstart", (e) => {
    const t = e.target;
    x0 = (e.touches.length === 1 && !document.querySelector(".modal-velo") && !t.closest("input, textarea, select, .barra-acciones, .bienvenida") && !seDesliza(t)) ? e.touches[0].clientX : null;
    y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  addEventListener("touchend", (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - t0 > 700) return;
    const orden = ordenVistas(), i = orden.indexOf(irA.antes);
    const sig = orden[i + (dx < 0 ? 1 : -1)];
    if (i >= 0 && sig) location.hash = sig;
  }, { passive: true });
})();

// ---------- Volver arriba (en listas largas): botón con un aro que marca lo que se ha bajado ----------
(function () {
  const b = $("arriba"); if (!b) return;
  // El aro se va llenando según lo que se ha bajado
  addEventListener("scroll", () => {
    b.classList.toggle("ver", scrollY > innerHeight * 1.5);
    b.style.setProperty("--prog", Math.min(100, Math.round(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) * 100)));
  }, { passive: true });
  b.onclick = () => {
    b.classList.add("sube"); setTimeout(() => b.classList.remove("sube", "ver"), 700);
    scrollTo({ top: 0, behavior: QUIETO() ? "auto" : "smooth" });
  };
})();

// ---------- El logo de la cabecera da una vuelta al tocarlo ----------
$("cab-logo").addEventListener("click", () => {
  if (QUIETO()) return; const l = $("cab-logo");
  l.classList.remove("vuelta"); void l.offsetWidth; l.classList.add("vuelta");
});

// ---------- Instalar como app y activar avisos ----------
const ES_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const INSTALADA = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const PUSH_OK = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
let promptInst = null, suscrito = false;
window.addEventListener("beforeinstallprompt", (ev) => { ev.preventDefault(); promptInst = ev; pintaBanda(); });
window.addEventListener("appinstalled", () => { promptInst = null; pintaBanda(); });

function modal(titulo, html, pie = "", cabIcono = "") {
  const v = document.createElement("div");
  v.className = "modal-velo";
  v.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${cabIcono}<h2>${titulo}</h2>${html}<div class="botones"><button class="btn">Entendido</button></div>${pie}</div>`;
  v.onclick = (e) => { if (e.target === v || e.target.closest(".btn")) v.remove(); };
  document.body.appendChild(v);
}
async function instalar() {
  if (promptInst) { promptInst.prompt(); await promptInst.userChoice; promptInst = null; pintaBanda(); return; }
  if (ES_IOS) modal("Instalar en iPhone", `<ol><li>Abre esta página en <b>Safari</b>.</li><li>Pulsa el botón <b>Compartir</b> (el cuadrado con una flecha hacia arriba).</li><li>Elige <b>«Añadir a pantalla de inicio»</b> y pulsa <b>Añadir</b>.</li><li>Abre la app desde el icono nuevo y activa los avisos.</li></ol>`);
  else modal("Instalar la app", `<ol><li>Abre esta página en <b>Chrome</b>.</li><li>Pulsa el menú <b>⋮</b> (arriba a la derecha).</li><li>Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.</li></ol><p class="fecha-txt">No hace falta descargar nada de fuera: es la propia web, sin avisos de seguridad.</p>`);
}
// Textos del aviso de privacidad y de las casillas: se pueden cambiar en el panel (Textos). Vacíos = estos.
const TXT_CONSENTIMIENTO = {
  aviso: "Esta web usa solo lo necesario para funcionar.",
  buzon: "He leído la política de privacidad y acepto que traten mis datos para que la Sección Sindical lea mi mensaje y pueda responderlo en «Dudas», sin saber quién lo envía.",
  avisos: "He leído la política de privacidad y acepto que traten mis datos para enviarme a este móvil los avisos de la Sección Sindical.",
};
const textoPagina = (slug, def) => String(D.paginas?.[slug] || "").trim() || def;
// La casilla siempre lleva el enlace a la política: si el texto no la nombra, se añade al final
const conPolitica = (t) => esc(t).includes("política de privacidad") ? esc(t).replace("política de privacidad", '<a href="#privacidad">política de privacidad</a>') : esc(t) + ' (<a href="#privacidad">política de privacidad</a>)';
function pintaTextosPrivacidad() {
  if ($("aviso-privacidad-txt")) $("aviso-privacidad-txt").textContent = textoPagina("aviso_privacidad_texto", TXT_CONSENTIMIENTO.aviso);
  if ($("buzon-acepto-txt")) $("buzon-acepto-txt").innerHTML = conPolitica(textoPagina("consentimiento_buzon", TXT_CONSENTIMIENTO.buzon));
}
// Antes de activar los avisos: casilla de consentimiento (sin marcar). Si la marca y pulsa «Activar avisos»,
// se pide el permiso del navegador en ese mismo toque (algunos móviles solo lo permiten así) y se devuelve esa promesa.
function consentimientoAvisos() {
  return new Promise((resolver) => {
    const v = document.createElement("div");
    v.className = "modal-velo";
    v.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="cons-tit"><h2 id="cons-tit">Activar los avisos en este móvil</h2>
      <p>Para mandarte los avisos se guarda en el servidor una dirección técnica de este móvil, no tu nombre ni tu teléfono. Puedes quitarlos cuando quieras.</p>
      <label class="check consentimiento"><input type="checkbox" id="cons-avisos"><span>${conPolitica(textoPagina("consentimiento_avisos", TXT_CONSENTIMIENTO.avisos))}</span></label>
      <p class="msg" id="cons-msg" role="status"></p>
      <div class="botones"><button class="btn" type="button" data-si>Activar avisos</button><button class="btn sec" type="button" data-no>Ahora no</button></div></div>`;
    const cerrar = (r) => { v.remove(); resolver(r); };
    v.onclick = (e) => {
      if (e.target.closest('a[href="#privacidad"]')) return cerrar(null); // va a leer la política: se cierra y no se activa nada
      if (e.target === v || e.target.closest("[data-no]")) return cerrar(null);
      if (e.target.closest("[data-si]")) {
        if (!v.querySelector("#cons-avisos").checked) { v.querySelector("#cons-avisos").focus(); v.querySelector("#cons-msg").textContent = "Para activar los avisos, marca la casilla de la política de privacidad."; v.querySelector("#cons-msg").className = "msg err"; return; }
        cerrar(Notification.requestPermission());
      }
    };
    document.body.appendChild(v);
    v.querySelector("#cons-avisos").focus();
  });
}
const b64aBytes = (b) => { const p = "=".repeat((4 - b.length % 4) % 4), s = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...s].map(c => c.charCodeAt(0))); };
async function activarAvisos() {
  if (ES_IOS && !INSTALADA()) return modal("Primero, instala la app", "<p>En iPhone, los avisos solo funcionan si la app está instalada.</p><ol><li>Pulsa <b>Compartir</b> en Safari.</li><li>Elige <b>«Añadir a pantalla de inicio»</b>.</li><li>Abre la app desde el icono y pulsa otra vez <b>Activar avisos</b>.</li></ol>");
  if (!PUSH_OK) return modal("Este navegador no admite avisos", "<p>Prueba a abrir la web con Chrome (Android) o instalarla en el iPhone con Safari.</p>");
  const pidePermiso = await consentimientoAvisos();
  if (!pidePermiso) return; // no ha marcado la casilla o ha dicho «Ahora no»: no se guarda nada
  const perm = await pidePermiso;
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
    if (viejo && viejo !== nuevo) sb.rpc("desuscribir_push", { p_endpoint: viejo }).then(() => {}, () => {});
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
  if (sub) { const j = sub.toJSON(); sb.rpc("suscribir_push", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }).then(() => {}, () => {}); guardarEndpoint(j.endpoint); } // por si se borró
  pintaBanda();
}
function pintaBanda() {
  const inst = INSTALADA();
  $("cab-instalar").classList.toggle("oculto", inst);
  // Barra fija de abajo: hablar con un delegado (lo principal) y la campana de avisos
  const iosSinInstalar = ES_IOS && !inst;
  const campana = suscrito
    ? `<button class="accion-baja campana on" data-acc="estado" aria-label="Avisos activados en este móvil" title="Avisos activados">${icono("check")}<span>Avisos</span></button>`
    : `<button class="accion-baja campana" data-acc="${iosSinInstalar ? "instalar" : "activar"}" aria-label="${iosSinInstalar ? "Instalar la app para recibir avisos" : "Activar avisos en este móvil"}" title="Activar avisos">${icono("campana")}<span>Avisos</span></button>`;
  $("barra-acciones").innerHTML = `<a class="accion-baja principal" href="#delegados">${icono("telefono")}Hablar con un delegado</a>` + campana;
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
    estado: () => modal("Avisos activados", `<p>Este móvil recibe una notificación con cada aviso, acta, documento o fecha nueva.</p>`,
      `<button class="enlace-desact" id="m-desact">Desactivar los avisos en este móvil</button>`,
      `<span class="modal-ic ok">${icono("check")}</span>`) || setTimeout(() => { const d = document.getElementById("m-desact"); if (d) d.onclick = () => { document.querySelector(".modal-velo")?.remove(); desactivarAvisos(); }; }, 0),
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
// El menú se abre hacia arriba (hacia abajo lo recortaría el «overflow: hidden» de la tarjeta).
// Con nueve idiomas ya no siempre cabe, así que se le limita el alto al hueco que queda bajo la
// cabecera fija; si no caben todos, el menú se desplaza por dentro.
function colocaMenuIdiomas(menu, btn) {
  if (!menu || !btn) return;
  const cab = document.querySelector("header")?.getBoundingClientRect().bottom || 0;
  const hueco = btn.getBoundingClientRect().top - cab - 12;
  menu.style.maxHeight = Math.max(120, Math.floor(hueco)) + "px";
}
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
    colocaMenuIdiomas(caja.querySelector(".menu-idiomas"), btn);
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
    ["Calendario", "calendario", D.eventos.filter(e => pasa(e.titulo, e.descripcion, e.lugar, e.tipo, textoFecha(e.fecha))).map(e => ({ h: "calendario", t: e.titulo, s: fechaLarga(e.fecha + "T12:00:00") + (e.hora ? " · " + horaEvento(e).toLowerCase() : ""), dia: e.fecha }))],
    ["Convenio", "convenio", D.convenio.filter(s => pasa(s.titulo, s.resumen, s.contenido, s.articulo)).map(s => ({ h: "convenio", t: s.titulo, s: s.resumen || s.categoria, q: qr }))],
    ["Preguntas frecuentes", "pregunta", D.preguntas.filter(x => pasa(x.pregunta, x.respuesta)).map(x => ({ h: "preguntas", t: x.pregunta, s: x.categoria, q: qr }))],
    ["Actas", "actas", D.actas.filter(a => pasa(a.titulo, a.resumen, a.acuerdos, a.tipo, textoFecha(a.fecha))).map(a => ({ h: "actas", t: a.titulo, s: a.fecha ? fechaLarga(a.fecha + "T12:00:00") : a.tipo, q: qr }))],
    ...D.apartados.map(ap => [ap.titulo, ap.icono || "carpeta", D.publicaciones.filter(x => x.apartado_id === ap.id && pasa(x.titulo, x.contenido, textoFecha(x.fecha), (x.adjuntos || []).map(j => j.nombre).join(" "))).map(x => ({ h: "ap-" + ap.slug, t: x.titulo, s: x.fecha ? fechaLarga(x.fecha + "T12:00:00") : "", q: qr }))]),
    ["Documentos", "carpeta", D.docs.filter(d => pasa(d.titulo, d.descripcion, d.nombre_archivo, d.categoria)).map(d => ({ url: d.url, t: d.titulo, s: d.categoria + " · " + tipoArchivo(d.tipo_archivo, d.nombre_archivo).txt }))],
  ].filter(g => g[2].length);
  const total = grupos.reduce((n, g) => n + g[2].length, 0);
  $("resultados-todo").innerHTML = total ? `<p class="fecha-txt">${total} resultado${total === 1 ? "" : "s"}</p>` + grupos.map(([tit, ic, l]) => `
    <h2 class="titulo-bloque">${esc(tit)} <span class="etq">${l.length}</span></h2>
    <div class="panel resultados">${l.slice(0, 8).map(r => `<a class="novedad" ${r.url ? `href="${esc(urlSegura(r.url))}" target="_blank" rel="noopener"` : `href="#${r.h}" data-q="${esc(r.q || "")}" data-dia="${r.dia || ""}"`}>
      <span class="ic">${icono(esc(ic), "p")}</span><span class="txt"><b>${esc(r.t)}</b><small>${esc(r.s || "")}</small></span>${icono("der", "p")}</a>`).join("")}</div>`).join("")
    : vacio("buscar", `No hay nada con «${esc(qr)}». Prueba con otra palabra o <a href="#info">pregúntanos</a>.`);
  $("resultados-todo").querySelectorAll("a[data-q]").forEach(l => l.onclick = () => {
    const h = l.getAttribute("href").slice(1), q2 = l.dataset.q;
    if (l.dataset.dia) { const d = fechaDia(l.dataset.dia); estado.mes = new Date(d.getFullYear(), d.getMonth(), 1); estado.diaSel = l.dataset.dia; pintaCalendario(); }
    const campo = h.startsWith("ap-") ? "buscar-ap" : { convenio: "buscar-convenio", preguntas: "buscar-preguntas", actas: "buscar-actas" }[h];
    if (campo && q2) { $(campo).value = q2; $(campo).dispatchEvent(new Event("input")); }
  });
}
$("buscar-todo").oninput = buscarTodo;

// ---------- Estadísticas anónimas: secciones visitadas y lo que se lee ----------
// Solo se suma 1 en el servidor; aquí se recuerda (en esta visita) qué se ha contado ya, para no contarlo dos veces.
function contarUnaVez(clave, enviar) {
  if (ES_ADMIN) return;
  try {
    const hechos = JSON.parse(sessionStorage.getItem("ccoo-contado") || "[]");
    if (hechos.includes(clave)) return;
    hechos.push(clave); sessionStorage.setItem("ccoo-contado", JSON.stringify(hechos.slice(-300)));
  } catch (_) {}
  enviar().then(() => {}, () => {});
}
const contarLectura = (ref) => { const [t, id] = ref.split(":"); if (+id) contarUnaVez("l:" + ref, () => sb.rpc("contar_lectura", { p_tabla: t, p_id: +id })); };
// Un aviso, acta o publicación cuenta como leído si se ve en pantalla al menos 2 segundos
const ESPERAS = new Map();
const vigia = "IntersectionObserver" in window ? new IntersectionObserver((entradas) => entradas.forEach(en => {
  const ref = en.target.dataset.lectura;
  const visto = en.isIntersecting && (en.intersectionRatio >= 0.5 || en.intersectionRect.height >= innerHeight * 0.4); // los avisos largos no caben enteros
  if (visto) { if (!ESPERAS.has(en.target)) ESPERAS.set(en.target, setTimeout(() => { contarLectura(ref); vigia.unobserve(en.target); }, 2000)); }
  else { clearTimeout(ESPERAS.get(en.target)); ESPERAS.delete(en.target); }
}), { threshold: [0, 0.1, 0.25, 0.5] }) : null;
const vigilar = () => vigia && document.querySelectorAll("[data-lectura]:not([data-vigilado])").forEach(el => { el.dataset.vigilado = "1"; vigia.observe(el); });
new MutationObserver(vigilar).observe(document.querySelector("main"), { childList: true, subtree: true });
document.addEventListener("click", (ev) => { const a = ev.target.closest("[data-abre]"); if (a) contarLectura(a.dataset.abre); });

// ---------- Contador anónimo de visitas ----------
// Solo suma 1 a las visitas del día, y 1 a «móviles distintos» la primera vez de hoy, de esta semana y de este mes en este móvil.
// No se guarda nada que identifique a nadie: ni IP, ni nombres, ni un identificador del móvil.
// En el navegador donde está abierta la sesión del panel no se cuenta nada (ES_ADMIN, arriba del todo).
(function contarVisita() {
  if (ES_ADMIN) return;
  const primera = (prefijo, clave) => { // true solo la primera vez de ese día/semana/mes en este móvil
    if (localStorage.getItem(clave)) return false;
    Object.keys(localStorage).filter(k => k.startsWith(prefijo)).forEach(k => localStorage.removeItem(k)); localStorage.setItem(clave, "1"); return true;
  };
  try {
    if (sessionStorage.getItem("ccoo-contada")) return; // una vez por cada vez que se abre la web
    sessionStorage.setItem("ccoo-contada", "1");
    const d = new Date(), lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7);
    const nuevo = primera("ccoo-dia-", "ccoo-dia-" + hoyISO());
    sb.rpc("contar_visita", { p_nuevo: nuevo }).then(() => {}, () => {});
    // Desde dónde se abre (app instalada o navegador): solo para saber cuánta gente tiene la app
    const app = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    sb.rpc("contar_origen", { p_origen: app ? "app" : "navegador" }).then(() => {}, () => {});
    if (primera("ccoo-sem-", "ccoo-sem-" + isoDe(lunes))) sb.rpc("contar_movil", { p_tipo: "semana" }).then(() => {}, () => {});
    if (primera("ccoo-mes-", "ccoo-mes-" + hoyISO().slice(0, 7))) sb.rpc("contar_movil", { p_tipo: "mes" }).then(() => {}, () => {});
  } catch (_) { sb.rpc("contar_visita", { p_nuevo: false }).then(() => {}, () => {}); }
})();
