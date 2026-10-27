// Panel: calendario, duplicar, estadísticas y visitas.
// El panel está repartido en admin-base.js, admin-sesion.js, admin-listas.js, admin-editor.js,
// admin-herramientas.js, admin-ajustes.js y admin-calendario.js, que se cargan en ese orden (comparten variables).

// ---------- Calendario del panel (vista de mes) ----------
const VISTA_CAL = { modo: "mes", mes: new Date(), dia: hoyISO() };
try { VISTA_CAL.modo = localStorage.getItem("ccoo-vista-cal") || "mes"; } catch (_) {}
const cambioVistaCal = () => `<div class="cambio-vista" role="tablist">
  <button data-vista="mes" class="${VISTA_CAL.modo === "mes" ? "activa" : ""}">${icono("calendario", "p")}Mes</button>
  <button data-vista="lista" class="${VISTA_CAL.modo === "lista" ? "activa" : ""}">${icono("texto", "p")}Lista</button></div>`;
function enlazarVistaCal() {
  document.querySelectorAll("[data-vista]").forEach(b => b.onclick = () => {
    VISTA_CAL.modo = b.dataset.vista; try { localStorage.setItem("ccoo-vista-cal", VISTA_CAL.modo); } catch (_) {}
    pintaSeccion("calendario");
  });
}
const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
async function pintaCalAdm() {
  const s = SECCIONES.calendario;
  $("zona").innerHTML = `<div class="sec-cab">
      <div><h1>Calendario</h1><p>Toca un día para ver lo que hay o añadir una fecha. También salen los avisos programados y las actas.</p></div>
      <div class="botones" style="margin:0"><button class="btn btn-nuevo" id="b-nuevo">${icono("mas", "p")}${s.nuevo}</button></div>
    </div>
    ${cambioVistaCal()}
    <div class="cal-rejilla cal-adm">
      <div class="panel cal">
        <div class="cal-cab">
          <label class="cal-mes-btn"><h2 id="cala-mes"></h2>${icono("abajo")}<input type="month" id="cala-ir" aria-label="Ir a un mes"></label>
          <div class="cal-nav">
            <button class="btn-hoy" id="cala-hoy">Hoy</button>
            <button class="btn-ic" id="cala-ant" aria-label="Mes anterior">${icono("izq", "p")}</button>
            <button class="btn-ic" id="cala-sig" aria-label="Mes siguiente">${icono("der", "p")}</button>
          </div>
        </div>
        <div class="semana"><div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div></div>
        <div class="dias" id="cala-dias"><p class="fecha-txt">Cargando…</p></div>
        <div class="leyenda" id="cala-leyenda"></div>
      </div>
      <div class="panel dia-detalle" id="cala-detalle"></div>
    </div>`;
  $("b-nuevo").onclick = () => abrirEditor("calendario", null, { fecha: VISTA_CAL.dia });
  enlazarVistaCal();
  $("cala-ant").onclick = () => { VISTA_CAL.mes = new Date(VISTA_CAL.mes.getFullYear(), VISTA_CAL.mes.getMonth() - 1, 1); dibujaCalAdm(); };
  $("cala-sig").onclick = () => { VISTA_CAL.mes = new Date(VISTA_CAL.mes.getFullYear(), VISTA_CAL.mes.getMonth() + 1, 1); dibujaCalAdm(); };
  $("cala-hoy").onclick = () => { VISTA_CAL.mes = new Date(); VISTA_CAL.dia = hoyISO(); dibujaCalAdm(); };
  $("cala-ir").onchange = (e) => { if (!e.target.value) return; const [y, m] = e.target.value.split("-"); VISTA_CAL.mes = new Date(+y, +m - 1, 1); VISTA_CAL.dia = `${y}-${m}-01`; dibujaCalAdm(); };
  document.querySelector(".cal-adm .cal-mes-btn").onclick = (e) => { if (e.target.id !== "cala-ir") { const i = $("cala-ir"); i.value = isoLocal(VISTA_CAL.mes).slice(0, 7); try { i.showPicker(); } catch (_) { i.focus(); } } };
  try { await Promise.all(["calendario", "avisos", "actas"].map(cargarDatos)); } catch (e) { $("cala-dias").innerHTML = `<p class="msg err">${esc(errTxt(e))}</p>`; return; }
  dibujaCalAdm();
}
// Todo lo que pasa en un día: fechas del calendario, avisos programados y actas
function cosasDelCal() {
  const porDia = {};
  const add = (iso, x) => { if (iso) (porDia[iso] ||= []).push(x); };
  (datos.calendario || []).forEach(e => add(e.fecha, { k: "calendario", x: e, clase: claseTipo(e.tipo, "evento"), etq: e.tipo, t: e.titulo, sub: [e.hora && e.hora + (e.hora_fin ? "–" + e.hora_fin : ""), e.lugar].filter(Boolean).join(" · ") }));
  (datos.avisos || []).filter(a => a.publicar_en && new Date(a.publicar_en) > new Date()).forEach(a => add(partesFecha(a.publicar_en).iso,
    { k: "avisos", x: a, clase: "c-ambar", etq: "Aviso programado", t: a.titulo, sub: "Se publica a las " + new Date(a.publicar_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }), forma: "f-prog" }));
  (datos.actas || []).forEach(a => add(a.fecha, { k: "actas", x: a, clase: "c-gris", etq: "Acta", t: a.titulo, sub: a.tipo, forma: "f-acta" }));
  return porDia;
}
function dibujaCalAdm() {
  const m = VISTA_CAL.mes, ini = new Date(m.getFullYear(), m.getMonth(), 1), hoy = hoyISO(), porDia = cosasDelCal();
  $("cala-mes").textContent = mayus(ini.toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
  const desfase = (ini.getDay() + 6) % 7;
  let html = "";
  for (let i = 0; i < 42; i++) {
    const d = new Date(m.getFullYear(), m.getMonth(), 1 - desfase + i), iso = isoLocal(d);
    if (i >= 35 && d.getMonth() !== m.getMonth()) break;
    const cosas = porDia[iso] || [], dow = d.getDay();
    html += `<button class="dia ${d.getMonth() !== m.getMonth() ? "fuera" : ""} ${iso === hoy ? "hoy" : ""} ${iso === VISTA_CAL.dia ? "sel" : ""} ${dow === 0 || dow === 6 ? "finde" : ""}" data-d="${iso}">
      <span class="n">${d.getDate()}</span>
      <span class="eventos-mini">${cosas.slice(0, 3).map(c => `<span class="ev-mini ${c.clase} ${c.forma || ""}">${esc(c.t)}</span>`).join("")}${cosas.length > 3 ? `<span class="ev-mas">+${cosas.length - 3}</span>` : ""}</span>
      <span class="puntos">${cosas.slice(0, 4).map(c => `<span class="punto ${c.clase} ${c.forma || ""}"></span>`).join("")}</span></button>`;
  }
  $("cala-dias").innerHTML = html;
  $("cala-dias").querySelectorAll(".dia").forEach(b => {
    b.onclick = () => { VISTA_CAL.dia = b.dataset.d; const d = fechaDia(b.dataset.d); if (d.getMonth() !== VISTA_CAL.mes.getMonth()) VISTA_CAL.mes = new Date(d.getFullYear(), d.getMonth(), 1); dibujaCalAdm();
      if (innerWidth < 900) $("cala-detalle").scrollIntoView({ behavior: "smooth", block: "start" }); };
    b.ondblclick = () => abrirEditor("calendario", null, { fecha: b.dataset.d });
  });
  $("cala-leyenda").innerHTML = nombres("evento").map(t => `<span class="etq tipo ${claseTipo(t, "evento")}">${esc(t)}</span>`).join("") +
    `<span class="etq tipo c-ambar">Aviso programado</span><span class="etq tipo c-gris">Acta</span>`;
  // Detalle del día
  const sel = porDia[VISTA_CAL.dia] || [], dSel = fechaDia(VISTA_CAL.dia);
  const txtDia = dSel.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  $("cala-detalle").innerHTML = `<h3>${mayus(dSel.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</h3>
    ${sel.length ? `<div class="lista-dia">${sel.map((c, i) => `<button class="cosa-dia ${c.clase}" data-i="${i}">
        <span class="barra-color"></span><span class="txt"><span class="etq tipo ${c.clase}">${esc(c.etq)}</span><b>${esc(c.t)}</b>${c.sub ? `<small>${esc(c.sub)}</small>` : ""}</span>${icono("editar", "p")}</button>`).join("")}</div>`
      : `<p class="fecha-txt">No hay nada este día.</p>`}
    <div class="botones"><button class="btn" id="cala-anadir">${icono("mas", "p")}Añadir fecha el ${txtDia}</button>
      <button class="btn sec" id="cala-aviso">${icono("reloj", "p")}Programar aviso ese día</button></div>`;
  $("cala-detalle").querySelectorAll(".cosa-dia").forEach(b => b.onclick = () => { const c = sel[+b.dataset.i]; abrirEditor(c.k, c.x); });
  $("cala-anadir").onclick = () => abrirEditor("calendario", null, { fecha: VISTA_CAL.dia });
  $("cala-aviso").onclick = () => abrirEditor("avisos", null, { publicar_en: new Date(VISTA_CAL.dia + "T08:00:00").toISOString() });
}

// ---------- Duplicar: abre un elemento nuevo con los mismos datos ----------
$("ed-duplicar").onclick = async () => {
  if (!ED?.orig) return;
  if (!(await confirmarSalida())) return;
  const k = ED.k, x = { ...ED.orig };
  ["id", "fecha", "creado", "actualizado", "notificado", "publicar_en"].forEach(c => { if (!(k === "calendario" && c === "fecha") && !(k === "actas" && c === "fecha")) delete x[c]; });
  if (k === "actas") x.fecha = "";
  const titulo = SECCIONES[k].tituloDe ? "pregunta" : "titulo";
  x[titulo] = (x[titulo] || "") + " (copia)";
  ED.pendientes.forEach(p => p.vista && URL.revokeObjectURL(p.vista));
  ED = null; BUZON_A_PREGUNTA = null; // se reutiliza el editor abierto, sin tocar el historial
  abrirEditor(k, null, x);
  if (ED) { ED.existentes = []; msg("ed-msg", "Copia lista: cambia lo que haga falta (por ejemplo la fecha) y publica.", true); }
};

// ---------- Estadísticas (anónimas) ----------
let LECTURAS = {};
const TABLAS_LEIDAS = ["comunicados", "actas", "documentos", "publicaciones"];
async function cargarLecturas() {
  const { data } = await sb.from("lecturas").select("*");
  LECTURAS = Object.fromEntries((data || []).map(r => [r.tabla + ":" + r.item_id, r.total]));
}
const vecesTxt = (n) => n + (n === 1 ? " vez" : " veces");
// Barras horizontales (una sola serie): nombre a la izquierda, valor al final de la barra
function barrasH(filas, unidad) {
  const max = Math.max(1, ...filas.map(f => f.n));
  return `<div class="graf-h" role="list">${filas.map(f => `<div class="fila-h" role="listitem" tabindex="0" data-tip="${esc(f.et)}: ${f.n} ${unidad}">
      <span class="et">${esc(f.et)}${f.sub ? ` <small>${esc(f.sub)}</small>` : ""}</span>
      <span class="pista"><span class="barra" style="width:${Math.max(2, Math.round(f.n / max * 100))}%"></span><b>${f.n}</b></span></div>`).join("")}</div>`;
}
const tablaDatos = (cab, filas) => `<details class="tabla-datos"><summary>Ver como tabla</summary><table><thead><tr>${cab.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>
  <tbody>${filas.map(f => `<tr>${f.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></details>`;
async function pintaEstadisticas() {
  const hace30 = isoLocal(new Date(Date.now() - 29 * 86400000));
  const [lec, sec, sem] = await Promise.all([
    sb.from("lecturas").select("*").order("total", { ascending: false }).limit(300),
    sb.from("visitas_seccion").select("*").gte("dia", hace30),
    sb.from("suscritos_semana").select("*").order("semana", { ascending: false }).limit(12),
  ]);
  if (!$("est-leido")) return;
  // Lo más leído: título de cada cosa según su tabla
  const titulos = {}, TIPO = { comunicados: "Aviso", actas: "Acta", documentos: "Documento" };
  (datos.avisos || []).forEach(x => titulos["comunicados:" + x.id] = [x.titulo, "Aviso"]);
  (datos.actas || []).forEach(x => titulos["actas:" + x.id] = [x.titulo, "Acta"]);
  (datos.documentos || []).forEach(x => titulos["documentos:" + x.id] = [x.titulo, "Documento"]);
  APARTADOS.forEach(a => (datos["ap" + a.id] || []).forEach(x => titulos["publicaciones:" + x.id] = [x.titulo, a.titulo]));
  LECTURAS = Object.fromEntries((lec.data || []).map(r => [r.tabla + ":" + r.item_id, r.total]));
  const leidas = (lec.data || []).map(r => ({ k: r.tabla + ":" + r.item_id, n: r.total })).filter(r => titulos[r.k]).slice(0, 8)
    .map(r => ({ et: titulos[r.k][0] || "Sin título", sub: titulos[r.k][1] || TIPO[r.k.split(":")[0]], n: r.n }));
  $("est-leido").innerHTML = leidas.length ? barrasH(leidas, "veces") + tablaDatos(["Qué", "Tipo", "Veces"], leidas.map(f => [f.et, f.sub, f.n]))
    : `<p class="vacio-graf">Todavía no hay lecturas. Se cuentan desde esta versión de la web.</p>`;
  // Móviles con avisos por semana (columnas)
  const semanas = (sem.data || []).slice().reverse();
  if (semanas.length) {
    const max = Math.max(1, ...semanas.map(x => x.n)), et = (d) => { const f = fechaDia(d); return f.getDate() + " " + MESES[f.getMonth()].slice(0, 3); };
    $("est-suscritos").innerHTML = `<div class="graf-col" role="list">${semanas.map((x, i) => `<div class="col-s" role="listitem" tabindex="0" data-tip="Semana del ${et(x.semana)}: ${x.n} móviles">
        <span class="valor ${i === semanas.length - 1 ? "ver" : ""}">${x.n}</span><span class="col" style="height:${Math.max(2, Math.round(x.n / max * 100))}%"></span><span class="et">${et(x.semana)}</span></div>`).join("")}</div>` +
      tablaDatos(["Semana del", "Móviles"], semanas.map(x => [et(x.semana), x.n]));
  } else $("est-suscritos").innerHTML = `<p class="vacio-graf">Todavía no hay datos. Se apunta cada noche.</p>`;
  // Secciones más visitadas
  const NOM = { inicio: "Inicio", avisos: "Avisos", calendario: "Fechas", convenio: "Convenio", calcula: "Calcula", actas: "Actas", documentos: "Documentos", preguntas: "Dudas", info: "Nosotros", buscar: "Buscar", legal: "Aviso legal y privacidad" };
  APARTADOS.forEach(a => NOM["ap-" + a.slug] = a.titulo);
  const suma = {}; (sec.data || []).forEach(r => suma[r.seccion] = (suma[r.seccion] || 0) + r.n);
  const secs = Object.entries(suma).map(([k, n]) => ({ et: NOM[k] || k, n })).sort((a, b) => b.n - a.n).slice(0, 10);
  $("est-secciones").innerHTML = secs.length ? barrasH(secs, "visitas") + tablaDatos(["Sección", "Visitas"], secs.map(f => [f.et, f.n]))
    : `<p class="vacio-graf">Todavía no hay visitas apuntadas. Se cuentan desde esta versión de la web.</p>`;
}

// ---------- Visitas (anónimas) ----------
// Últimos 7 días: cuántas veces se abre desde la app instalada y cuántas desde el navegador
function origenHTML(filas) {
  const app = filas.filter(x => x.origen === "app").reduce((n, x) => n + x.n, 0), nav = filas.filter(x => x.origen === "navegador").reduce((n, x) => n + x.n, 0), t = app + nav;
  if (!t) return `<p class="ayuda">Desde la app o desde el navegador: se cuenta desde la versión 42.</p>`;
  const pa = Math.round(app * 100 / t);
  return `<div class="origen"><b>Desde dónde se abre (últimos 7 días)</b>
    <div class="origen-barra" role="img" aria-label="Desde la app ${pa} %, desde el navegador ${100 - pa} %"><i style="width:${pa}%"></i></div>
    <div class="origen-ley"><span><i class="app"></i>App instalada: ${app} (${pa} %)</span><span><i></i>Navegador: ${nav} (${100 - pa} %)</span></div>
    <p class="ayuda">En iPhone, quien entra el mismo día por la app y por Safari cuenta como 2 móviles distintos. En Android, no.</p></div>`;
}
async function pintaVisitas() {
  const desde = isoLocal(new Date(Date.now() - 13 * 86400000));
  const hoyD = new Date(), lunes = isoLocal(new Date(hoyD.getFullYear(), hoyD.getMonth(), hoyD.getDate() - (hoyD.getDay() + 6) % 7)), mes = hoyISO().slice(0, 7);
  const [{ data, error }, per, ori] = await Promise.all([sb.from("visitas_dia").select("*").gte("dia", desde).order("dia"),
    sb.from("moviles_periodo").select("*").in("periodo", ["S" + lunes, "M" + mes]),
    sb.from("visitas_origen").select("*").gte("dia", isoLocal(new Date(Date.now() - 6 * 86400000)))]);
  const unicos = Object.fromEntries((per.data || []).map(x => [x.periodo, x.n]));
  if (!$("visitas")) return;
  if (error) { $("visitas").innerHTML = `<p class="fecha-txt">No se han podido cargar las visitas.</p>`; return; }
  const porDia = Object.fromEntries((data || []).map(v => [v.dia, v]));
  const dias = [...Array(14)].map((_, i) => isoLocal(new Date(Date.now() - (13 - i) * 86400000)));
  const hoy = porDia[hoyISO()] || { visitas: 0, dispositivos: 0 }, ayer = porDia[dias[12]] || { visitas: 0, dispositivos: 0 };
  const veces7 = dias.slice(7).reduce((n, d) => n + (porDia[d]?.visitas || 0), 0);
  const cifra = (v) => v === undefined ? "–" : v;
  const max = Math.max(1, ...dias.map(d => porDia[d]?.dispositivos || 0));
  $("visitas").innerHTML = `<div class="cifras">
      <div><b>${hoy.dispositivos}</b><span>móviles distintos hoy</span></div>
      <div><b>${hoy.visitas}</b><span>veces abierta hoy</span></div>
      <div><b>${cifra(unicos["S" + lunes])}</b><span>móviles distintos esta semana</span></div>
      <div><b>${cifra(unicos["M" + mes])}</b><span>móviles distintos este mes</span></div>
      <div><b>${ayer.dispositivos}</b><span>móviles distintos ayer</span></div>
      <div><b>${veces7}</b><span>veces abierta en 7 días</span></div>
    </div>
    <div class="barras" role="img" aria-label="Móviles distintos por día, últimos 14 días">${dias.map(d => {
      const v = porDia[d]?.dispositivos || 0, f = fechaDia(d);
      return `<div class="barra-dia ${d === hoyISO() ? "hoy" : ""}" title="${f.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}: ${v} móvil(es), ${porDia[d]?.visitas || 0} visitas">
        <span class="valor">${v || ""}</span><span class="col" style="height:${Math.round(v / max * 100)}%"></span><span class="et">${f.toLocaleDateString("es-ES", { weekday: "narrow" })}<br>${f.getDate()}</span></div>`;
    }).join("")}</div>
    ${origenHTML(ori.data || [])}
    <p class="ayuda">Cuenta de forma anónima: no se sabe quién entra, solo cuántos. «Móviles distintos» cuenta cada móvil una sola vez en ese día, semana o mes, aunque entre muchas veces; «veces abierta» suma todas las veces que se abre. La semana y el mes se cuentan desde la versión 42 («–» si aún no hay datos). No cuenta el navegador donde está abierto este panel.</p>`;
}

// Selector de color: el recuadro toma el color elegido
document.addEventListener("change", (e) => { const s = e.target.closest?.(".sel-color"); if (s) s.className = "sel-color c-" + s.value; });
