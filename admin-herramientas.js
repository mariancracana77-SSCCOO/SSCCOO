// Panel: historial, revisar ortografía, archivos, calculadoras, camiones, buzón y textos.
// El panel está repartido en admin-base.js, admin-sesion.js, admin-listas.js, admin-editor.js,
// admin-herramientas.js, admin-ajustes.js y admin-calendario.js, que se cargan en ese orden (comparten variables).

// ---------- Historial y deshacer ----------
const NOMBRE_TABLA = { comunicados: "el aviso", eventos: "la fecha", convenio_secciones: "el apartado del convenio", actas: "el acta", documentos: "el documento",
  preguntas: "la pregunta frecuente", plantillas: "la plantilla", delegados: "el delegado", enlaces: "el enlace", apartados: "el apartado de la web",
  publicaciones: "la publicación", opciones: "la opción de lista", calc_permisos: "el permiso de la calculadora", calc_categorias: "el precio de horas extra",
  avisos_recurrentes: "el aviso que se repite", buzon: "el mensaje del buzón", paginas: "el texto", calc_ajustes: "el ajuste de la calculadora", admins: "el administrador", restricciones: "el país de restricciones para camiones", tarifas_conductor: "el importe de «Mis incentivos»", peajes_paises: "el precio de peaje de un país", aparcamientos_compas: "el aparcamiento propuesto", aparcamientos_correcciones: "el aviso de un aparcamiento", prohibiciones_camion: "la prohibición de circular" };
const VERBO = { crear: "creó", cambiar: "cambió", borrar: "borró" };
const BOTON_DESHACER = { borrar: "Recuperar", cambiar: "Volver a como estaba", crear: "Deshacer (quitarlo)" };
const CAMPOS_NOMBRE = { titulo: "Título", contenido: "Texto", categoria: "Categoría", urgente: "Urgente", fijado: "Fijado", adjuntos: "Archivos", fecha: "Fecha", hora: "Hora", hora_fin: "Hora de fin",
  lugar: "Lugar", descripcion: "Descripción", tipo: "Tipo", resumen: "Resumen", acuerdos: "Acuerdos", pregunta: "Pregunta", respuesta: "Respuesta", nombre: "Nombre", cargo: "Cargo",
  telefono: "Teléfono", email: "Email", url: "Dirección", orden: "Posición", visible: "Se ve en la web", publicado: "Publicado", publicar_en: "Programado", importante: "Importante",
  leido: "Leído", archivado: "Archivado", valor: "Valor", dias: "Días", unidad: "Unidad", precio_extra: "Precio hora extra", precio_extra_festiva: "Precio festivo", activo: "Activo", pais: "País", fuente: "Quién lo publica", idioma: "Idioma" };
const nombreDe = (r) => r && (r.titulo || r.nombre || r.pais || r.pregunta || (r.texto && r.texto.slice(0, 60)) || r.slug || r.clave || r.email || r.id);
const valorTxt = (v) => v == null || v === "" ? "(vacío)" : Array.isArray(v) ? v.length + (v.length === 1 ? " archivo" : " archivos") : typeof v === "boolean" ? (v ? "Sí" : "No") : String(v).length > 140 ? String(v).slice(0, 139) + "…" : String(v);
const FILTRO_HIST = { tabla: "", accion: "", max: 60 };
async function pintaHistorial() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Historial</h1><p>Todo lo que se ha creado, cambiado o borrado en el panel durante el último año: quién, qué y cuándo. Si algo se borró o cambió por error, pulsa el botón para deshacerlo.</p></div></div>
    <div class="fila filtros-hist">
      <div><label for="h-tabla">Qué</label><select id="h-tabla"><option value="">Todo</option>${Object.entries(NOMBRE_TABLA).map(([k, n]) => `<option value="${k}" ${FILTRO_HIST.tabla === k ? "selected" : ""}>${mayus(n.replace(/^(el|la) /, ""))}</option>`).join("")}</select></div>
      <div><label for="h-accion">Qué se hizo</label><select id="h-accion"><option value="">Todo</option>${[["borrar", "Borrados"], ["cambiar", "Cambios"], ["crear", "Creados"]].map(([k, n]) => `<option value="${k}" ${FILTRO_HIST.accion === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    </div>
    <div class="lista-adm" id="lista-hist"><p class="fecha-txt">Cargando…</p></div>`;
  ["h-tabla", "h-accion"].forEach(id => $(id).onchange = () => { FILTRO_HIST.tabla = $("h-tabla").value; FILTRO_HIST.accion = $("h-accion").value; FILTRO_HIST.max = 60; pintaHistorial(); });
  let q = sb.from("historial").select("*").order("cuando", { ascending: false }).order("id", { ascending: false }).limit(FILTRO_HIST.max + 1);
  if (FILTRO_HIST.tabla) q = q.eq("tabla", FILTRO_HIST.tabla);
  if (FILTRO_HIST.accion) q = q.eq("accion", FILTRO_HIST.accion);
  const { data, error } = await q;
  if (error) { $("lista-hist").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(errTxt(error))}</p>`; return; }
  const l = data.slice(0, FILTRO_HIST.max);
  $("lista-hist").innerHTML = l.length ? l.map(h => {
    const reg = h.despues || h.antes, quien = h.email || "La web (automático)";
    const cambios = h.accion === "cambiar" ? Object.keys(h.despues || {}).filter(c => !["actualizado", "notificado", "ultima_publicacion", "id"].includes(c) && JSON.stringify(h.antes?.[c]) !== JSON.stringify(h.despues?.[c])) : [];
    return `<article class="panel cambio ${h.accion}">
      <span class="ic-cambio">${icono(h.accion === "crear" ? "mas" : h.accion === "borrar" ? "borrar" : "editar", "p")}</span>
      <div class="txt"><p class="que"><b>${esc(quien)}</b> ${VERBO[h.accion]} ${esc(NOMBRE_TABLA[h.tabla] || h.tabla)} <b>«${esc(String(nombreDe(reg) ?? ""))}»</b></p>
        <small class="fecha-txt">${esc(haceTxt(h.cuando))} · ${new Date(h.cuando).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
        ${cambios.length ? `<details class="detalle-cambio"><summary>Ver qué cambió (${cambios.length})</summary><ul>${cambios.map(c => `<li><b>${esc(CAMPOS_NOMBRE[c] || c)}:</b> <del>${esc(valorTxt(h.antes?.[c]))}</del> → <ins>${esc(valorTxt(h.despues?.[c]))}</ins></li>`).join("")}</ul></details>` : ""}
      </div>
      <button class="btn ${h.accion === "borrar" ? "" : "sec"} peq" data-deshacer="${h.id}">${icono(h.accion === "borrar" ? "subir" : "izq", "p")}${BOTON_DESHACER[h.accion]}</button>
    </article>`;
  }).join("") + (data.length > FILTRO_HIST.max ? `<button class="btn sec ver-mas" id="h-mas">Ver más</button>` : "")
    : `<div class="panel vacio">${icono("reloj")}Todavía no hay cambios apuntados.</div>`;
  if ($("h-mas")) $("h-mas").onclick = () => { FILTRO_HIST.max += 60; pintaHistorial(); };
  $("lista-hist").querySelectorAll("[data-deshacer]").forEach(b => b.onclick = async () => {
    const h = data.find(x => x.id == b.dataset.deshacer), nom = String(nombreDe(h.despues || h.antes) ?? "");
    const pregunta = h.accion === "borrar" ? `¿Recuperar ${NOMBRE_TABLA[h.tabla]} «${nom}»? Volverá a salir en la web.`
      : h.accion === "cambiar" ? `¿Dejar ${NOMBRE_TABLA[h.tabla]} «${nom}» como estaba antes de este cambio? Se perderán los cambios que se hicieron en ese momento.`
      : `¿Quitar ${NOMBRE_TABLA[h.tabla]} «${nom}» que se creó?${h.tabla === "apartados" ? " Se quitarán también sus publicaciones." : ""}`;
    if (!confirm(pregunta)) return;
    b.disabled = true;
    const { data: r, error: e } = await sb.rpc("recuperar_cambio", { p_id: h.id });
    if (e) { b.disabled = false; return aviso(errTxt(e), true); }
    aviso(r || "Hecho.");
    if (["apartados"].includes(h.tabla)) { await cargarApartados(); }
    pintaHistorial();
  });
}

// Quita del almacenamiento los archivos que ya no usa nada (ni la web ni los últimos 90 días del Historial) y tienen más de 30 días
async function limpiarArchivos() {
  const b = $("b-limpiar"); b.disabled = true; msg("m-limpiar", "Buscando…", true);
  try {
    const objetos = [];
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await sb.storage.from("documentos").list("", { limit: 1000, offset: desde, sortBy: { column: "created_at", order: "asc" } });
      if (error) throw error;
      objetos.push(...(data || []).filter(o => o.id)); if (!data || data.length < 1000) break;
    }
    const hace90 = new Date(Date.now() - 90 * 86400000).toISOString();
    const usados = await Promise.all([
      sb.from("comunicados").select("adjuntos, pdf_url"), sb.from("actas").select("adjuntos, pdf_url"), sb.from("documentos").select("url"),
      sb.from("publicaciones").select("adjuntos"), sb.from("convenio_secciones").select("adjuntos"),
      sb.from("historial").select("antes, despues").gte("cuando", hace90),
    ]);
    const err = usados.find(r => r.error); if (err) throw err.error;
    const texto = JSON.stringify(usados.map(r => r.data));
    const viejos = Date.now() - 30 * 86400000;
    const sobran = objetos.filter(o => new Date(o.created_at).getTime() < viejos && !texto.includes(o.name) && !texto.includes(encodeURIComponent(o.name)));
    if (!sobran.length) { msg("m-limpiar", "No hay archivos sin usar. Todo en orden.", true); return; }
    const mb = sobran.reduce((n, o) => n + (o.metadata?.size || 0), 0) / 1048576;
    if (!confirm(`Hay ${sobran.length} archivo(s) sin usar (${mb.toFixed(1).replace(".", ",")} MB). ¿Quitarlos? No se podrán recuperar.`)) { msg("m-limpiar", ""); return; }
    const { error } = await sb.storage.from("documentos").remove(sobran.map(o => o.name));
    if (error) throw error;
    msg("m-limpiar", `Hecho: se han quitado ${sobran.length} archivo(s).`, true);
  } catch (e) { msg("m-limpiar", "No se ha podido: " + errTxt(e)); }
  finally { b.disabled = false; }
}

// ---------- Revisar la ortografía de todo (v53) ----------
// Pasa por el corrector (función «corregir», Gemini gratis) los textos ya publicados, en tandas pequeñas.
// No cambia nada solo: enseña cada propuesta y se aplica una a una (o todas) tras mirarla. Todo queda en el Historial.
// No toca los textos legales ni las páginas de Textos, ni nombres, enlaces, emails o teléfonos.
// Lo ya revisado (aplicado o dejado como está) se recuerda en este navegador para no volver a pedirlo (localStorage «ccoo-revisado»).
const NO_CORREGIR_TODO = [...NO_CORREGIR, "nombre", "opciones", "lugar", "articulo"];
const huellaTxt = (t) => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + t.length; };
const leeRevisado = () => { try { return new Set(JSON.parse(localStorage.getItem("ccoo-revisado") || "[]")); } catch (_) { return new Set(); } };
const marcaRevisado = (t) => { try { const s = leeRevisado(); s.add(huellaTxt(t)); localStorage.setItem("ccoo-revisado", JSON.stringify([...s].slice(-5000))); } catch (_) {} };
let ORTO = null; // { parar, propuestas: [] }
function pintaOrtografia() {
  const secs = Object.keys(SECCIONES).filter(k => !SECCIONES[k].oculta && k !== "recurrentes" && camposPlanos(SECCIONES[k]).some(c => (c.t === "text" || c.t === "textarea") && !NO_CORREGIR_TODO.includes(c.k)));
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Revisar la ortografía</h1><p>El corrector repasa lo que ya está publicado y te propone arreglos (tildes, mayúsculas, signos…). No se cambia nada hasta que lo apliques, y todo queda en el Historial por si quieres deshacerlo. No toca los textos legales.</p></div></div>
    <div class="panel orto-elegir">
      <details class="orto-que"><summary>Qué revisar: <span id="orto-cuantas">todas las secciones</span></summary>
        <div class="orto-secs">${secs.map(k => `<label class="check"><input type="checkbox" data-sec="${k}" checked>${esc(SECCIONES[k].nombre)}</label>`).join("")}</div></details>
      <label class="check"><input type="checkbox" id="orto-nuevo" checked>Solo lo que no he revisado antes</label>
      <div class="botones"><button class="btn" id="b-orto">${icono("check", "p")}Empezar a revisar</button><button class="btn sec oculto" id="b-orto-parar">Parar</button></div>
      <div class="orto-barra oculto" id="orto-barra"><span id="orto-prog"></span></div>
      <div class="msg" id="m-orto"></div>
    </div>
    <div class="botones oculto" id="orto-todos"><button class="btn" id="b-orto-todos">${icono("check", "p")}Aplicar todos los cambios</button></div>
    <div class="lista-adm" id="orto-lista"></div>`;
  $("zona").querySelectorAll("[data-sec]").forEach(x => x.onchange = () => { const n = $("zona").querySelectorAll("[data-sec]:checked").length; $("orto-cuantas").textContent = n === secs.length ? "todas las secciones" : n === 1 ? "1 sección" : n + " secciones"; });
  $("b-orto").onclick = () => empiezaOrtografia([...$("zona").querySelectorAll("[data-sec]:checked")].map(x => x.dataset.sec), $("orto-nuevo").checked);
  $("b-orto-parar").onclick = () => { if (ORTO) ORTO.parar = true; };
  $("b-orto-todos").onclick = async () => {
    const pend = ORTO?.propuestas.filter(p => !p.hecho) || [];
    if (!pend.length || !confirm(`¿Aplicar los ${pend.length} cambios propuestos? Puedes deshacer cualquiera en el Historial.`)) return;
    for (const p of pend) await aplicaOrto(p, true);
  };
}
async function empiezaOrtografia(secs, soloNuevo) {
  if (!secs.length) return msg("m-orto", "Marca al menos una sección.");
  const b = $("b-orto"); b.disabled = true; $("b-orto-parar").classList.remove("oculto"); $("orto-barra").classList.remove("oculto");
  $("orto-lista").innerHTML = ""; $("orto-todos").classList.add("oculto");
  ORTO = { parar: false, propuestas: [] };
  msg("m-orto", "Cargando los textos…", true);
  const revisado = soloNuevo ? leeRevisado() : new Set(), piezas = [];
  try {
    for (const k of secs) {
      const s = SECCIONES[k]; await cargarDatos(k);
      const campos = camposPlanos(s).filter(c => (c.t === "text" || c.t === "textarea") && !NO_CORREGIR_TODO.includes(c.k));
      for (const x of datos[k]) for (const c of campos) {
        const t = x[c.k];
        if (typeof t === "string" && /\p{L}{3}/u.test(t) && t.length <= 15000 && !revisado.has(huellaTxt(t))) piezas.push({ k, id: x.id, campo: c.k, etiqueta: c.l, texto: t, x });
      }
    }
  } catch (e) { b.disabled = false; return msg("m-orto", "No se han podido cargar los textos: " + errTxt(e)); }
  if (!piezas.length) { b.disabled = false; $("b-orto-parar").classList.add("oculto"); $("orto-barra").classList.add("oculto"); return msg("m-orto", soloNuevo ? "No hay nada nuevo que revisar. Para repasarlo todo otra vez, desmarca «Solo lo que no he revisado antes»." : "No hay textos que revisar.", true); }
  // Tandas de hasta 10 campos y 6000 letras (el corrector admite 12 y 20000)
  const tandas = []; let t = [], n = 0;
  for (const p of piezas) { if (t.length && (t.length >= 10 || n + p.texto.length > 6000)) { tandas.push(t); t = []; n = 0; } t.push(p); n += p.texto.length; }
  if (t.length) tandas.push(t);
  const clave = (i) => "c_" + String.fromCharCode(97 + Math.floor(i / 26)) + String.fromCharCode(97 + i % 26);
  let hechas = 0, fallos = 0, cambios = 0;
  for (const tanda of tandas) {
    if (ORTO.parar) break;
    $("orto-prog").style.width = Math.round(hechas / tandas.length * 100) + "%";
    msg("m-orto", `Revisando… ${Math.min(hechas * 10 + 1, piezas.length)} de ${piezas.length} textos. ${cambios ? cambios + (cambios === 1 ? " con propuesta." : " con propuestas.") : ""}`, true);
    const cuerpo = { textos: Object.fromEntries(tanda.map((p, i) => [clave(i), p.texto])) };
    let res = null;
    for (let intento = 0; intento < 2 && !res; intento++) {
      try {
        const r = await Promise.race([sb.functions.invoke("corregir", { body: cuerpo }), new Promise(ok => setTimeout(() => ok({ error: "tiempo" }), 30000))]);
        if (!r.error && r.data?.textos) res = r.data.textos;
      } catch (_) {}
      if (!res && intento === 0 && !ORTO.parar) { msg("m-orto", "El corrector va lento. Esperando un poco para seguir…", true); await new Promise(ok => setTimeout(ok, 20000)); }
    }
    if (!res) { fallos++; if (fallos >= 2) { msg("m-orto", "El corrector gratuito ha llegado a su límite por ahora. Lo revisado se queda; vuelve a pulsar «Empezar» más tarde y seguirá con lo que falta."); break; } continue; }
    fallos = 0;
    tanda.forEach((p, i) => {
      const nuevo = res[clave(i)];
      if (typeof nuevo === "string" && nuevo !== p.texto) { p.nuevo = nuevo; ORTO.propuestas.push(p); cambios++; pintaPropuesta(p); }
      else marcaRevisado(p.texto); // está bien: no se vuelve a pedir
    });
    hechas++;
    await new Promise(ok => setTimeout(ok, 1500)); // sin agobiar al corrector gratuito
  }
  $("orto-prog").style.width = "100%";
  $("b-orto").disabled = false; $("b-orto-parar").classList.add("oculto");
  if (!$("m-orto").classList.contains("err")) msg("m-orto", ORTO.parar ? `Parado. ${cambios === 1 ? "1 propuesta" : cambios + " propuestas"} hasta ahora.` : cambios ? (cambios === 1 ? "Hecho. Hay 1 propuesta: revísala abajo." : `Hecho. Hay ${cambios} propuestas: revísalas abajo.`) : "Hecho. No hay nada que corregir.", true);
  $("orto-todos").classList.toggle("oculto", ORTO.propuestas.filter(p => !p.hecho).length < 2);
}
function pintaPropuesta(p) {
  const s = SECCIONES[p.k], el = document.createElement("div");
  el.className = "panel orto-prop"; el.dataset.i = ORTO.propuestas.indexOf(p);
  el.innerHTML = `<div class="orto-cab"><span class="etq">${esc(s.nombre)}</span><b>${esc((s.tituloDe ? s.tituloDe(p.x) : p.x.titulo) || "Sin título")}</b><small>${esc(p.etiqueta)}</small></div>
    <div class="corr-dif">${difHTML(p.texto, p.nuevo)}</div>
    <div class="botones"><button class="btn peq" data-a="si">${icono("check", "p")}Aplicar</button><button class="btn sec peq" data-a="no">Dejar como está</button><button class="btn sec peq" data-a="ver">${icono("editar", "p")}Abrir</button></div>`;
  el.querySelector("[data-a=si]").onclick = () => aplicaOrto(p);
  el.querySelector("[data-a=no]").onclick = () => { marcaRevisado(p.texto); p.hecho = true; el.classList.add("hecho"); el.querySelector(".botones").innerHTML = `<span class="fecha-txt">Se queda como está.</span>`; };
  el.querySelector("[data-a=ver]").onclick = () => abrirEditor(p.k, datos[p.k].find(x => x.id === p.id) || p.x);
  p.el = el; $("orto-lista").appendChild(el);
  $("orto-todos").classList.toggle("oculto", ORTO.propuestas.filter(q => !q.hecho).length < 2);
}
async function aplicaOrto(p, enLote) {
  if (p.hecho) return;
  const s = SECCIONES[p.k], caja = p.el.querySelector(".botones");
  caja.innerHTML = `<span class="fecha-txt">Guardando…</span>`;
  // Solo si nadie lo ha cambiado mientras tanto (si no, se perdería lo nuevo)
  const { data: ahora, error: e1 } = await sb.from(s.tabla).select(p.campo).eq("id", p.id).maybeSingle();
  if (e1 || !ahora) { caja.innerHTML = `<span class="msg err">No se ha podido comprobar. Prueba otra vez.</span>`; return; }
  if (ahora[p.campo] !== p.texto) { p.hecho = true; caja.innerHTML = `<span class="msg err">Este texto ha cambiado desde que se revisó: no se ha tocado.</span>`; return; }
  const { error } = await sb.from(s.tabla).update({ [p.campo]: p.nuevo }).eq("id", p.id);
  if (error) { caja.innerHTML = `<span class="msg err">No se ha podido guardar: ${esc(errTxt(error))}</span>`; return; }
  p.hecho = true; marcaRevisado(p.nuevo); p.el.classList.add("hecho");
  const x = datos[p.k]?.find(y => y.id === p.id); if (x) x[p.campo] = p.nuevo;
  caja.innerHTML = `<span class="msg ok">${icono("check", "p")}Corregido.</span>`;
  if (!enLote) aviso("Corregido. Si no te convence, lo puedes deshacer en el Historial.");
  $("orto-todos").classList.toggle("oculto", ORTO.propuestas.filter(q => !q.hecho).length < 2);
}

// ---------- Todos los archivos y fotos ----------
// Todo lo subido en cualquier sección (avisos, actas, convenio, documentos y apartados), en un solo sitio.
// Se busca por el nombre del archivo y también por el título de lo que se publicó con él.
let FILTRO_ARCH = "todo";
async function pintaTodosArchivos() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Todos los archivos y fotos</h1><p>Todo lo que se ha subido a la web, esté donde esté. Toca uno para verlo o «Abrir donde está» para cambiarlo.</p></div>
      <div class="botones" style="margin:0"><button class="btn sec" id="b-volver-docs">${icono("izq", "p")}Volver a Documentos</button></div></div>
    <div class="herramientas"><div class="buscador">${icono("buscar", "p")}<input id="buscar" type="search" placeholder="Buscar por nombre del archivo o título (ej.: nómina, asamblea, PRL…)" aria-label="Buscar archivos"></div></div>
    <div class="cambio-vista filtro-arch" role="group" aria-label="Qué enseñar">${[["todo", "Todo"], ["foto", "Fotos"], ["pdf", "PDF"], ["otro", "Otros"]].map(([v, t]) => `<button data-fa="${v}" class="${FILTRO_ARCH === v ? "activa" : ""}">${t}</button>`).join("")}</div>
    <p class="ayuda" id="cuenta-arch"></p>
    <div class="rejilla-arch" id="lista-arch"><p class="fecha-txt">Cargando…</p></div>`;
  $("b-volver-docs").onclick = () => abrir("documentos");
  let todos = [];
  try {
    const [av, ac, cv, dc, pb] = await Promise.all([
      sb.from("comunicados").select("id, titulo, fecha, adjuntos"), sb.from("actas").select("id, titulo, fecha, adjuntos"),
      sb.from("convenio_secciones").select("id, titulo, actualizado, adjuntos"), sb.from("documentos").select("*"),
      sb.from("publicaciones").select("id, apartado_id, titulo, fecha, adjuntos")]);
    const err = [av, ac, cv, dc, pb].find(r => r.error); if (err) throw err.error;
    const de = (k, sec, filas, fecha) => (filas || []).forEach(x => (x.adjuntos || []).forEach(a => a?.url && todos.push({ ...a, k, sec, id: x.id, titulo: x.titulo, fecha: fecha(x) })));
    de("avisos", "Avisos", av.data, x => x.fecha); de("actas", "Actas", ac.data, x => x.fecha); de("convenio", "Convenio", cv.data, x => x.actualizado);
    (dc.data || []).forEach(x => x.url && todos.push({ nombre: x.nombre_archivo || x.titulo, url: x.url, tipo: x.tipo_archivo, tamano: x.tamano, k: "documentos", sec: "Documentos", id: x.id, titulo: x.titulo, fecha: x.fecha }));
    (pb.data || []).forEach(x => { const a = APARTADOS.find(a => a.id === x.apartado_id); if (a) de("ap" + a.id, a.titulo, [x], y => y.fecha); });
  } catch (e) { $("lista-arch").innerHTML = `<p class="msg err">No se ha podido cargar: ${escerrTxt(e)}</p>`; return; }
  todos.sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
  const clase = (a) => esImagen(a) ? "foto" : /pdf/i.test(a.tipo || "") || /\.pdf$/i.test(a.nombre || "") ? "pdf" : "otro";
  const sinAcentos = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const pinta = () => {
    const q = sinAcentos($("buscar").value.trim());
    const l = todos.filter(a => (FILTRO_ARCH === "todo" || clase(a) === FILTRO_ARCH) && (!q || coincide([a.nombre, a.titulo, a.sec, textoFecha(a.fecha)].join(" "), q)));
    $("cuenta-arch").textContent = l.length === 1 ? "1 archivo" : `${l.length} archivos`;
    $("lista-arch").innerHTML = l.length ? l.map((a, i) => {
      const t = tipoArchivo(a.tipo, a.nombre);
      return `<div class="arch-ficha">
        <a class="arch-ver" href="${esc(urlSegura(a.url))}" target="_blank" rel="noopener">${esImagen(a) ? `<img src="${esc(fotoSrc(a.url))}" alt="" loading="lazy">` : `<span class="arch-ic">${icono(t.ic)}<small>${esc(t.txt)}</small></span>`}</a>
        <div class="arch-txt"><b>${esc(a.nombre || "Archivo")}</b><small>${esc(a.sec)} · ${esc(a.titulo || "Sin título")}${a.fecha ? " · " + esc(fechaLarga(String(a.fecha).length === 10 ? a.fecha + "T12:00:00" : a.fecha)) : ""}${a.tamano ? " · " + tamanoTxt(a.tamano) : ""}</small></div>
        <button class="btn sec peq" data-donde="${i}">${icono("editar", "p")}Abrir donde está</button></div>`;
    }).join("") : `<div class="panel vacio">${icono("carpeta")}${q || FILTRO_ARCH !== "todo" ? "Nada coincide con la búsqueda." : "Todavía no hay archivos subidos."}</div>`;
    $("lista-arch").querySelectorAll("[data-donde]").forEach(b => b.onclick = async () => {
      const a = l[+b.dataset.donde];
      try { if (!datos[a.k]?.some(x => x.id === a.id)) await cargarDatos(a.k); } catch (e) { return aviso("No se ha podido abrir: " + errTxt(e), true); }
      const x = datos[a.k].find(x => x.id === a.id);
      x ? abrirEditor(a.k, x) : aviso("No se ha encontrado. Puede que se haya borrado.", true);
    });
  };
  $("zona").querySelectorAll("[data-fa]").forEach(b => b.onclick = () => { FILTRO_ARCH = b.dataset.fa; $("zona").querySelectorAll("[data-fa]").forEach(x => x.classList.toggle("activa", x === b)); pinta(); });
  $("buscar").oninput = pinta; pinta();
}

// ---------- Calculadoras (valores que usa «Calcula» en la web) ----------
const AJUSTES_CALC = [
  ["vac_dias", "Días de vacaciones al año", "number"], ["vac_unidad", "Unidad de las vacaciones", "unidad"],
  ["vac_nota", "Nota bajo las vacaciones", "text"], ["extra_nota", "Nota bajo las horas extra", "text"], ["aviso", "Aviso de arriba (que es orientativo)", "text"],
];
async function pintaCalculadoras() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Calculadoras</h1><p>Los datos que usan las calculadoras de la web (pestaña «Calcula»): vacaciones, permisos pagados y horas extra. Al principio están los <b>mínimos del Estatuto de los Trabajadores</b>: revísalos con el convenio y cámbialos aquí.</p></div></div>
    <section class="panel tarjeta-ajuste"><h2>Vacaciones y avisos</h2><div id="calc-ajustes"><p class="fecha-txt">Cargando…</p></div></section>
    <section class="panel tarjeta-ajuste"><div class="sec-cab" style="margin:0 0 10px"><div><h2>Permisos retribuidos</h2><p>Cada línea es un motivo que el trabajador puede elegir.</p></div><button class="btn" data-nuevo="permisos">${icono("mas", "p")}Añadir permiso</button></div><div class="lista-adm" id="lista-permisos"></div></section>
    <section class="panel tarjeta-ajuste"><div class="sec-cab" style="margin:0 0 10px"><div><h2>Precios de las horas extra</h2><p>Un precio por categoría. Sin precios, la calculadora de horas extra no sale.</p></div><button class="btn" data-nuevo="categorias">${icono("mas", "p")}Añadir categoría</button></div><div class="lista-adm" id="lista-categorias"></div></section>`;
  $("zona").querySelectorAll("[data-nuevo]").forEach(b => b.onclick = () => abrirEditor(b.dataset.nuevo));
  const [aj] = await Promise.all([sb.from("calc_ajustes").select("*"), cargarDatos("permisos"), cargarDatos("categorias")]);
  const A = Object.fromEntries((aj.data || []).map(x => [x.clave, x.valor]));
  $("calc-ajustes").innerHTML = AJUSTES_CALC.map(([k, l, t]) => t === "unidad"
      ? `<label for="ca-${k}">${l}</label><select id="ca-${k}">${["días naturales", "días laborables", "días"].map(u => `<option ${u === A[k] ? "selected" : ""}>${u}</option>`).join("")}</select>`
      : t === "number" ? `<label for="ca-${k}">${l}</label><input id="ca-${k}" type="number" step="0.5" min="0" inputmode="decimal" value="${esc(A[k] || "")}">`
      : `<label for="ca-${k}">${l}</label><textarea id="ca-${k}" maxlength="400" style="min-height:76px">${esc(A[k] || "")}</textarea>`).join("") +
    `<div class="botones"><button class="btn" id="ca-guardar">${icono("check", "p")}Guardar</button></div><p class="msg" id="ca-msg"></p>`;
  $("ca-guardar").onclick = async () => {
    const filas = AJUSTES_CALC.map(([k]) => ({ clave: k, valor: String($("ca-" + k).value).trim().slice(0, 400), actualizado: new Date().toISOString() }));
    const dias = parseFloat(filas[0].valor.replace(",", "."));
    if (isNaN(dias) || dias < 0 || dias > 60) return msg("ca-msg", "Pon un número de días entre 0 y 60.");
    filas[0].valor = String(dias);
    const { error } = await sb.from("calc_ajustes").upsert(filas);
    msg("ca-msg", error ? "No se ha podido guardar: " + errTxt(error) : "Guardado. Ya se usa en la web.", !error);
  };
  $("lista-permisos").innerHTML = datos.permisos.length ? datos.permisos.map(x => filaOrden("permisos", x)).join("") : `<div class="panel vacio">${icono("convenio")}Todavía no hay permisos.</div>`;
  $("lista-categorias").innerHTML = datos.categorias.length ? datos.categorias.map(x => filaOrden("categorias", x)).join("") : `<div class="panel vacio">${icono("reloj")}Todavía no hay precios. Pulsa «Añadir categoría».</div>`;
  enlazarItems($("lista-permisos")); enlazarItems($("lista-categorias"));
  hacerOrdenable($("lista-permisos"), "permisos"); hacerOrdenable($("lista-categorias"), "categorias");
}

// ---------- Restricciones para camiones (Zona Conductores) ----------
async function pintaCamiones() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Restricciones para camiones</h1><p>Los enlaces oficiales que salen en el apartado «Zona Conductores» de la web: días y horas en que los camiones no pueden circular en cada país.</p></div></div>
    <section class="panel tarjeta-ajuste"><h2>Fecha de revisión</h2>
      <label for="rv-fecha">Revisado por última vez</label><input type="date" id="rv-fecha">
      <p class="ayuda">Sale en la web. Cámbiala cuando compruebes que los enlaces siguen funcionando. Si la dejas vacía, sale el 17 de octubre de 2026.</p>
      <div class="botones"><button class="btn sec" id="rv-hoy">${icono("calendario", "p")}Poner hoy</button><button class="btn" id="rv-guardar">${icono("check", "p")}Guardar fecha</button></div><p class="msg" id="rv-msg"></p></section>
    <section class="panel tarjeta-ajuste"><div class="sec-cab" style="margin:0 0 10px"><div><h2>Países</h2><p>Toca un país para cambiarlo, ocultarlo o borrarlo.</p></div><button class="btn" data-nuevo="restricciones">${icono("mas", "p")}Añadir país</button></div><div class="lista-adm" id="lista-restricciones"><p class="fecha-txt">Cargando…</p></div></section>
    ${SECCIONES[Object.keys(SECCIONES).find(k => SECCIONES[k].slug === "zona-conductores")] ? "" : `<p class="msg err">No hay ningún apartado «Zona Conductores» en la web, así que esta lista no se ve. Créalo en «Apartados de la web».</p>`}`;
  $("zona").querySelector("[data-nuevo]").onclick = () => abrirEditor("restricciones");
  $("rv-hoy").onclick = () => { $("rv-fecha").value = hoyISO(); };
  try {
    const [pg] = await Promise.all([sb.from("paginas").select("contenido").eq("slug", "restricciones_revisado").maybeSingle(), cargarDatos("restricciones")]);
    $("rv-fecha").value = /^\d{4}-\d{2}-\d{2}$/.test(pg.data?.contenido || "") ? pg.data.contenido : "";
  } catch (e) { $("lista-restricciones").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(errTxt(e))}</p>`; return; }
  $("rv-guardar").onclick = async () => {
    const { error } = await sb.from("paginas").upsert({ slug: "restricciones_revisado", contenido: $("rv-fecha").value, actualizado: new Date().toISOString() });
    msg("rv-msg", error ? "No se ha podido guardar: " + errTxt(error) : "Guardado. Ya se ve en la web.", !error);
  };
  const l = datos.restricciones;
  $("lista-restricciones").innerHTML = l.length ? l.map(x => filaOrden("restricciones", x)).join("") : `<div class="panel vacio">${icono("lugar")}No hay ningún país. Pulsa «Añadir país». Sin países, el bloque no sale en la web.</div>`;
  enlazarItems($("lista-restricciones"));
  if (l.length > 1) hacerOrdenable($("lista-restricciones"), "restricciones");
}

// ---------- Importes de «Mis incentivos» (Zona Conductores, v81) ----------
async function pintaImportes() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Importes de «Mis incentivos»</h1><p>Los importes que usa la calculadora de los conductores (Zona Conductores > Mis incentivos): salario, dietas, suplementos y pluses. Cuando llegue la tabla de la empresa del año siguiente, pon en cada concepto el «Importe nuevo» y desde qué día vale: la web lo usa desde ese día y los días de antes siguen con el precio de ahora. Lo que apunta cada conductor se queda en su móvil: aquí no se ve.</p></div><button class="btn" data-nuevo="tarifas">${icono("mas", "p")}Añadir concepto</button></div>
    <div class="lista-adm" id="lista-tarifas"><p class="fecha-txt">Cargando…</p></div>
    ${SECCIONES[Object.keys(SECCIONES).find(k => SECCIONES[k].slug === "zona-conductores")] ? "" : `<p class="msg err">No hay ningún apartado «Zona Conductores» en la web, así que la calculadora sale suelta en las pestañas.</p>`}`;
  $("zona").querySelector("[data-nuevo]").onclick = () => abrirEditor("tarifas");
  try { await cargarDatos("tarifas"); } catch (e) { $("lista-tarifas").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message)}</p>`; return; }
  const l = datos.tarifas;
  $("lista-tarifas").innerHTML = l.length ? l.map(x => filaOrden("tarifas", x)).join("") : `<div class="panel vacio">${icono("euro")}No hay ningún importe. Pulsa «Añadir concepto».</div>`;
  enlazarItems($("lista-tarifas"));
  if (l.length > 1) hacerOrdenable($("lista-tarifas"), "tarifas");
}

// ---------- Peajes de camión de «Aparcamientos en mi ruta» (v90) ----------
async function pintaPeajes() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Peajes camión</h1><p>Precio aproximado por kilómetro que usa «Aparcamientos en mi ruta» para calcular los peajes de la ruta (camión de 5 ejes, 40 t, Euro 6). En cada país pon qué se paga (solo los tramos de peaje, todas las autopistas o todas las carreteras) y cuántos euros por km. Es orientativo: cada autopista tiene su tarifa.</p></div><button class="btn" data-nuevo="peajes">${icono("mas", "p")}Añadir país</button></div>
    <div class="lista-adm" id="lista-peajes"><p class="fecha-txt">Cargando…</p></div>`;
  $("zona").querySelector("[data-nuevo]").onclick = () => abrirEditor("peajes");
  try { await cargarDatos("peajes"); } catch (e) { $("lista-peajes").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message)}</p>`; return; }
  const l = datos.peajes;
  $("lista-peajes").innerHTML = l.length ? l.map(x => filaOrden("peajes", x)).join("") : `<div class="panel vacio">${icono("euro")}No hay ningún país. Pulsa «Añadir país».</div>`;
  enlazarItems($("lista-peajes"));
  if (l.length > 1) hacerOrdenable($("lista-peajes"), "peajes");
}

// ---------- Prohibiciones de circular para camiones (v108) ----------
async function pintaProhibiciones() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Prohibiciones de circular</h1><p>Cuándo no pueden circular los camiones en cada país. Al calcular una ruta, «Aparcamientos en mi ruta» avisa si alguna le pilla por el camino según la hora de salida. Las de cada semana (fines de semana, de noche) ya están puestas para Alemania, Austria, Suiza, Francia e Italia: revísalas. Añade los festivos con «Un día concreto».</p></div><button class="btn" data-nuevo="prohibiciones">${icono("mas", "p")}Añadir prohibición</button></div>
    <div class="lista-adm" id="lista-prohibiciones"><p class="fecha-txt">Cargando…</p></div>`;
  $("zona").querySelector("[data-nuevo]").onclick = () => abrirEditor("prohibiciones");
  try { await cargarDatos("prohibiciones"); } catch (e) { $("lista-prohibiciones").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message)}</p>`; return; }
  const l = datos.prohibiciones;
  $("lista-prohibiciones").innerHTML = l.length ? l.map(x => filaOrden("prohibiciones", x)).join("") : `<div class="panel vacio">${icono("alerta")}No hay ninguna. Pulsa «Añadir prohibición».</div>`;
  enlazarItems($("lista-prohibiciones"));
  if (l.length > 1) hacerOrdenable($("lista-prohibiciones"), "prohibiciones");
}

// ---------- Aparcamientos propuestos por los conductores (v106) ----------
async function pintaPropuestas() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Aparcamientos propuestos</h1><p>Los conductores añaden en el mapa de «Aparcamientos en mi ruta» los aparcamientos que encuentran. Si marcan «Proponerlo a los compañeros», salen enseguida en el mapa de todos y llegan aquí sin nombre de quien lo manda. Si alguno está mal, tócalo y cambia «¿Sale en el mapa de todos?» a «Rechazado»: deja de salir.</p></div><button class="btn" data-nuevo="compas">${icono("mas", "p")}Añadir aparcamiento</button></div>
    <div id="lista-propuestas"><p class="fecha-txt">Cargando…</p></div>
    <h2 class="titulo-bloque" style="margin-top:28px">Avisos de aparcamientos que están mal</h2>
    <p class="fecha-txt">Desde cualquier aparcamiento, los conductores pueden avisar de que ya no existe, de que no se puede con camión, de que tiene otras plazas o de otra cosa. Si lo pones en «Aplicado», se corrige en el mapa de todos.</p>
    <div id="lista-correcciones"><p class="fecha-txt">Cargando…</p></div>`;
  $("zona").querySelector("[data-nuevo]").onclick = () => abrirEditor("compas");
  try { await cargarDatos("compas"); } catch (e) { $("lista-propuestas").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message)}</p>`; return; }
  const l = datos.compas, grupo = (est, tit) => { const g = l.filter(x => x.estado === est); return g.length ? `<h2 class="titulo-bloque">${esc(tit)} (${g.length})</h2><div class="lista-adm">${g.map(x => itemHTML("compas", x)).join("")}</div>` : ""; };
  $("lista-propuestas").innerHTML = l.length ? grupo("pendiente", "Por revisar") + grupo("aprobado", "Salen en el mapa de todos") + grupo("rechazado", "Quitados: no salen")
    : `<div class="panel vacio">${icono("lugar")}Todavía nadie ha propuesto ningún aparcamiento.</div>`;
  enlazarItems($("lista-propuestas"));
  try { localStorage.setItem("ccoo-adm-compas-visto", String(Math.max(0, ...l.map(x => +x.id || 0)))); } catch (_) {} // v111: para la banda del Inicio
  // v108: avisos de aparcamientos que están mal
  const z = $("lista-correcciones"); if (!z) return;
  try { await cargarDatos("correcciones"); } catch (e) { z.innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message)}</p>`; return; }
  const c = datos.correcciones, g2 = (est, tit) => { const g = c.filter(x => x.estado === est); return g.length ? `<h3 class="titulo-bloque">${esc(tit)} (${g.length})</h3><div class="lista-adm">${g.map(x => itemHTML("correcciones", x)).join("")}</div>` : ""; };
  z.innerHTML = c.length ? g2("pendiente", "Por revisar") + g2("aplicado", "Aplicados: corregidos para todos") + g2("descartado", "Descartados") : `<div class="panel vacio">${icono("alerta")}Nadie ha avisado de ningún aparcamiento.</div>`;
  enlazarItems(z);
}

// ---------- Buzón anónimo ----------
let BUZON_SIN_LEER = 0, BUZON_A_PREGUNTA = null, VISTA_BUZON = "nuevos";
async function contarBuzon() {
  const { count, error } = await sb.from("buzon").select("id", { count: "exact", head: true }).eq("leido", false).eq("archivado", false);
  BUZON_SIN_LEER = error ? 0 : count || 0;
  return BUZON_SIN_LEER;
}
async function pintaBuzon() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Buzón anónimo</h1><p>Preguntas y sugerencias que la plantilla envía desde «Dudas». No se sabe quién las envía: solo se guarda el texto y el día.</p></div></div>
    <div class="cambio-vista" role="tablist" id="vistas-buzon"></div>
    <div class="lista-adm" id="lista-buzon"><p class="fecha-txt">Cargando…</p></div>`;
  const { data, error } = await sb.from("buzon").select("*").order("dia", { ascending: false }).order("id", { ascending: false }).limit(500);
  if (error) { $("lista-buzon").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(errTxt(error))}</p>`; return; }
  const grupos = { nuevos: data.filter(m => !m.leido && !m.archivado), leidos: data.filter(m => m.leido && !m.archivado), archivo: data.filter(m => m.archivado) };
  BUZON_SIN_LEER = grupos.nuevos.length; pintaNav();
  const NOM = { nuevos: "Sin leer", leidos: "Leídos", archivo: "Archivados" };
  $("vistas-buzon").innerHTML = Object.keys(NOM).map(k => `<button role="tab" class="${k === VISTA_BUZON ? "activa" : ""}" data-v="${k}">${NOM[k]} <span class="etq">${grupos[k].length}</span></button>`).join("");
  $("vistas-buzon").querySelectorAll("[data-v]").forEach(b => b.onclick = () => { VISTA_BUZON = b.dataset.v; pintaBuzon(); });
  const l = grupos[VISTA_BUZON];
  $("lista-buzon").innerHTML = l.length ? l.map(m => `<article class="panel msg-buzon ${m.leido ? "" : "sin-leer"}" data-id="${m.id}">
      <div class="cab"><span class="etq ${m.tipo === "Pregunta" ? "tipo-preg" : "tipo-sug"}">${esc(m.tipo)}</span><span class="fecha-txt">Llegó el ${fechaLarga(m.dia + "T12:00:00")}</span></div>
      <p class="texto">${esc(m.texto)}</p>
      <div class="acciones-buzon">
        ${m.archivado ? "" : `<button class="btn" data-acc="pregunta">${icono("pregunta", "p")}Convertir en pregunta frecuente</button>`}
        ${m.archivado ? "" : `<button class="btn sec" data-acc="leido">${icono("check", "p")}${m.leido ? "No leído" : "Leído"}</button>`}
        <button class="btn sec" data-acc="archivar">${icono("archivo2", "p")}${m.archivado ? "Sacar del archivo" : "Archivar"}</button>
        <button class="btn peligro" data-acc="borrar">${icono("borrar", "p")}Borrar</button>
      </div></article>`).join("")
    : `<div class="panel vacio">${icono("correo")}${VISTA_BUZON === "nuevos" ? "No hay mensajes sin leer." : "No hay mensajes aquí."}</div>`;
  $("lista-buzon").querySelectorAll("[data-acc]").forEach(b => b.onclick = async () => {
    const art = b.closest("[data-id]"), id = +art.dataset.id, m = data.find(x => x.id === id), acc = b.dataset.acc;
    let r = null;
    if (acc === "pregunta") {
      BUZON_A_PREGUNTA = id;
      return abrirEditor("preguntas", null, { pregunta: m.texto.length > 160 ? "" : m.texto, respuesta: m.texto.length > 160 ? "Pregunta recibida: " + m.texto + "\n\nRespuesta: " : "" });
    }
    if (acc === "leido") r = await sb.from("buzon").update({ leido: !m.leido }).eq("id", id);
    if (acc === "archivar") r = await sb.from("buzon").update({ archivado: !m.archivado, leido: true }).eq("id", id);
    if (acc === "borrar") { if (!confirm("¿Borrar este mensaje del buzón? No se puede deshacer.")) return; r = await sb.from("buzon").delete().eq("id", id); }
    if (r?.error) return aviso("No se ha podido: " + errTxt(r.error), true);
    pintaBuzon();
  });
}

// ---------- Textos ----------
const TEXTOS = [
  { slug: "inicio", l: "Texto de la portada", ayuda: "Sale al final de la portada («Todo»)." },
  { slug: "convenio", l: "Introducción del convenio", ayuda: "Sale arriba de los apartados: qué convenio es, vigencia, etc." },
  { slug: "quienes", l: "Quiénes somos" },
  { slug: "contacto", l: "Contacto", ayuda: "Email, teléfono, horario, delegados…" },
  { slug: "aviso_legal", l: "Aviso legal", ayuda: "Quién es el responsable de la web. Enlazado abajo en la web. Conviene que lo revise el servicio jurídico de CCOO." },
  { slug: "privacidad", l: "Privacidad y cookies", ayuda: "Qué datos se tratan y cómo. Si cambias algo de la web (por ejemplo, un formulario), actualízalo." },
  { slug: "aviso_privacidad_texto", l: "Aviso de privacidad (la franja de abajo la primera vez)", corto: true, ayuda: "Detrás sale siempre «Puedes leer cómo tratamos tus datos en Privacidad y en el Aviso legal». Si lo dejas vacío, sale: «Esta web usa solo lo necesario para funcionar.»" },
  { slug: "consentimiento_buzon", l: "Casilla del buzón anónimo", corto: true, ayuda: "Lo que acepta el trabajador al enviar una duda. Las palabras «política de privacidad» salen como enlace. Si lo dejas vacío, sale el texto de siempre." },
  { slug: "consentimiento_avisos", l: "Casilla al activar los avisos en el móvil", corto: true, ayuda: "Lo que acepta el trabajador al activar los avisos. Las palabras «política de privacidad» salen como enlace. Si lo dejas vacío, sale el texto de siempre." },
];
async function pintaTextos() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Textos</h1><p>Los textos fijos de la web, que cambian poco.</p></div></div><div id="textos"><p class="fecha-txt">Cargando…</p></div>`;
  const { data } = await sb.from("paginas").select("*");
  const p = Object.fromEntries((data || []).map(x => [x.slug, x]));
  $("textos").innerHTML = `<div class="panel tarjeta-ajuste" style="max-width:780px">
    <p class="ayuda">La lista de países y la fecha de las restricciones para camiones se cambian en <a href="#camiones" id="t-ir-camiones">Restricciones camiones</a>.</p>
    ${TEXTOS.map(t => `<label for="t-${t.slug}">${t.l}</label>${t.t === "date" ? `<input type="date" id="t-${t.slug}" value="${esc(p[t.slug]?.contenido || "")}">` : `<textarea id="t-${t.slug}" style="min-height:${t.corto ? 70 : 100}px" ${t.corto ? 'maxlength="400"' : ""}>${esc(p[t.slug]?.contenido || "")}</textarea>`}
      <p class="ayuda">${t.ayuda ? t.ayuda + " " : ""}${p[t.slug]?.actualizado ? "Cambiado " + haceTxt(p[t.slug].actualizado) + "." : ""}</p>`).join("")}
    ${FORMATO}
    <div class="botones"><button class="btn" id="b-textos"></button></div>
    <div class="msg" id="m-textos"></div></div>`;
  // Solo se guarda lo que ha cambiado: así «Cambiado hace…» sigue diciendo la verdad en los demás
  const original = Object.fromEntries(TEXTOS.map(t => [t.slug, p[t.slug]?.contenido || ""]));
  const cambiados = () => TEXTOS.filter(t => $("t-" + t.slug) && $("t-" + t.slug).value !== original[t.slug]);
  const marca = () => {
    const c = cambiados(), n = c.length;
    TEXTOS.forEach(t => document.querySelector(`label[for="t-${t.slug}"]`)?.classList.toggle("sin-guardar", c.includes(t)));
    $("b-textos").innerHTML = icono("check", "p") + (n ? (n === 1 ? "Guardar 1 texto cambiado" : `Guardar ${n} textos cambiados`) : "Guardar textos");
    $("b-textos").disabled = !n;
  };
  marca();
  $("textos").addEventListener("input", marca);
  PENDIENTE = () => cambiados().length ? "Has cambiado textos y no los has guardado. ¿Salir sin guardar?" : "";
  $("b-textos").onclick = async () => {
    const c = cambiados(); if (!c.length) return;
    const ahora = new Date().toISOString(), filas = c.map(t => ({ slug: t.slug, contenido: $("t-" + t.slug).value, actualizado: ahora }));
    $("b-textos").disabled = true;
    const { error } = await sb.from("paginas").upsert(filas);
    if (error) { msg("m-textos", "No se ha podido guardar: " + errTxt(error)); return marca(); }
    filas.forEach(f => { original[f.slug] = f.contenido; });
    msg("m-textos", ""); marca();
    aviso(filas.length === 1 ? "Texto guardado. Ya se ve en la web." : "Textos guardados. Ya se ven en la web.");
  };
  $("t-ir-camiones").onclick = (e) => { e.preventDefault(); abrir("camiones"); };
}

// ---------- Ajustes: listas editables y personas que publican ----------
const LISTAS = {
  aviso: { l: "Categorías de los avisos", ayuda: "Son los filtros de la sección Avisos.", tabla: "comunicados", col: "categoria" },
  evento: { l: "Tipos del calendario", ayuda: "Cada tipo tiene su color en el calendario.", tabla: "eventos", col: "tipo" },
  acta: { l: "Tipos de acta", ayuda: "Son los filtros de la sección Actas.", tabla: "actas", col: "tipo" },
  convenio: { l: "Categorías del convenio", ayuda: "Son los filtros de la sección Convenio.", tabla: "convenio_secciones", col: "categoria" },
  documento: { l: "Categorías de documentos", ayuda: "Son los filtros de la sección Documentos.", tabla: "documentos", col: "categoria" },
  pregunta: { l: "Categorías de las preguntas", ayuda: "Son los filtros de Preguntas frecuentes.", tabla: "preguntas", col: "categoria" },
};
let filasLista = {};
const LISTAS_SUCIAS = new Set(); // filtros y categorías con cambios sin guardar
const pendienteAjustes = () => {
  const sin = Object.keys(LISTAS).filter(k => LISTAS_SUCIAS.has(k) || $("nn-" + k)?.value.trim());
  return sin.length ? `No has guardado los cambios en: ${sin.map(k => LISTAS[k].l.toLowerCase()).join(", ")}. ¿Salir sin guardar?` : "";
};


// ---------- Pedir un cambio a Claude (v114, lo pidió Lorena para su padre) ----------
// El padre escribe (o dicta con el micrófono del teclado) lo que quiere y añade fotos, vídeos o audios. Se guarda en la tabla
// peticiones_claude (solo admins) y los archivos en el bucket público «peticiones» (nombres al azar, sin listar). Claude lo mira al tocar el
// timbre: al enviar, el panel llama a la función «timbre», que deja un comentario corto en la pull request buzón de GitHub y despierta a Claude (v117; el artefacto TIMBRE_URL queda solo para Lorena), o la revisión de cada hora; lo deja hecho y avisa a Lorena, que publica con «publica».
// No pasa por el editor general: ni corrector (Gemini) ni avisos a los móviles.
const TIMBRE_URL = "https://claude.ai/artifact/2gJ1aBLBNLMGCxrLZTwWdW";
const PET_MB = 50;
const PET_ESTADO = { nueva: "Enviada: Claude la mirará", en_curso: "Claude está con ella", lista: "Hecha: mira las fotos y decide", publicada: "Ya está en la web", descartada: "Descartada", no_hecha: "Claude no la ha hecho: lee por qué", deshecha: "Vuelto a como estaba antes" };
const tipoPet = (f) => /^(image|video|audio)\//.test(f.type || "") ? f.type : ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", "3gp": "video/3gpp", m4a: "audio/mp4", mp3: "audio/mpeg", ogg: "audio/ogg", opus: "audio/ogg", aac: "audio/aac", wav: "audio/wav", amr: "audio/amr" })[extDe(f.name)] || "";
let PET_ARCH = [];
// Sube las fotos, vídeos o audios al bucket «peticiones» (nombres al azar) y devuelve la lista para guardar
async function subePet(archivos, idMsg) {
  const subidos = [];
  for (let i = 0; i < archivos.length; i++) {
    msg(idMsg, `Subiendo ${i + 1} de ${archivos.length}…`, true);
    let f = archivos[i]; if (/^image\/(jpeg|png|webp)$/.test(tipoPet(f))) f = await reducirFoto(f);
    const limpio = f.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "_").slice(-60);
    const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${limpio}`;
    const { error } = await sb.storage.from("peticiones").upload(ruta, f, { contentType: tipoPet(f) });
    if (error) throw new Error(`No se ha podido subir «${f.name}»: ${errTxt(error)}`);
    subidos.push({ nombre: f.name, url: sb.storage.from("peticiones").getPublicUrl(ruta).data.publicUrl, tipo: tipoPet(f), tamano: f.size });
  }
  return subidos;
}
// Revisa los archivos elegidos: deja los buenos en «lista» y devuelve lo que no vale
const eligePet = (input, lista) => {
  const malos = [];
  [...input.files].forEach(f => { if (!tipoPet(f)) malos.push(`«${f.name}» no es foto, vídeo ni audio`); else if (f.size > PET_MB * 1048576) malos.push(`«${f.name}» pesa más de ${PET_MB} MB (graba un vídeo más corto)`); else lista.push(f); });
  input.value = ""; return malos;
};
// v125 (lo pidió Lorena): las fotos (las del padre y las capturas de Claude) se ven dentro del mensaje; lo demás, como enlace
const adjPet = (a) => { const fotos = (a || []).filter(esImagen), otros = (a || []).filter(x => !esImagen(x));
  return (fotos.length ? `<div class="pet-fotos">${fotos.map(x => `<a href="${esc(urlSegura(x.url))}" target="_blank" rel="noopener" aria-label="Ver en grande: ${esc(x.nombre || "foto")}"><img src="${esc(urlSegura(x.url))}" alt="${esc(x.nombre || "")}" loading="lazy"></a>`).join("")}</div>` : "")
    + (otros.length ? `<p class="fecha-txt">${otros.map(x => `<a href="${esc(urlSegura(x.url))}" target="_blank" rel="noopener">${esc(x.nombre)}</a>`).join(" · ")}</p>` : ""); };
// v125: ventana para confirmar «Descartar» (que no se pulse sin querer)
function confirmaDescartar(id) {
  return new Promise((ok) => {
    const v = document.createElement("div"); v.className = "modal-velo";
    v.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>¿Descartar la petición n.º ${esc(id)}?</h2><p>Si la descartas, este cambio <b>no se publica</b> y Claude no sigue con él. Si solo quieres cambiar algo, pulsa «No, volver» y luego «Añadir algo o mejorarlo».</p><div class="botones"><button type="button" class="btn sec" data-no>No, volver</button><button type="button" class="btn pet-descarta-si" data-si>Sí, descartar</button></div></div>`;
    const fin = (r) => { v.remove(); ok(r); };
    v.onclick = (e) => { if (e.target === v || e.target.closest("[data-no]")) fin(false); else if (e.target.closest("[data-si]")) fin(true); };
    document.body.appendChild(v); v.querySelector("[data-no]").focus();
  });
}
const horaPet = (t) => new Date(t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const PET_ANADE = {}; // archivos elegidos para añadir a cada petición (por id)
async function pintaPeticiones() {
  PET_ARCH = [];
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Pedir un cambio a Claude</h1><p>Escribe lo que quieres cambiar o añadir en la web o en el panel. Para no escribir, toca el micrófono del teclado del móvil y dilo en voz alta. Puedes añadir fotos, capturas de pantalla y vídeos cortos. Al enviarlo, Claude se entera al momento, lo prepara y avisa a Lorena: no se publica nada sin que ella lo diga.</p></div></div>
    <p class="aviso-pausa" id="pet-pausa" role="status" hidden>${icono("reloj", "p")}<span>Ahora mismo Claude está en pausa. Puedes enviar igual: lo verá más tarde, cuando Lorena lo vuelva a encender.</span></p>
    <div class="panel pet-consejos"><b>Para que salga bien</b><ul>
      <li><b>Una cosa por petición.</b> Si quieres tres cambios, envía tres peticiones.</li>
      <li>Si se te olvida algo, no hagas otra: búscala abajo, en «Lo que has pedido», y toca «Añadir algo a esta petición».</li>
      <li>Una foto o una captura de lo que quieres cambiar ayuda mucho.</li>
    </ul></div>
    <form class="panel pet-form" id="pet-form" novalidate>
      <label for="pet-texto">¿Qué quieres?</label>
      <textarea id="pet-texto" class="crece" rows="5" maxlength="5000" spellcheck="true" autocapitalize="sentences" placeholder="Ej: En Mis incentivos, que la dieta festiva salga arriba del todo."></textarea>
      <p class="ayuda">Claude ve las fotos y lo que se ve en los vídeos, pero no oye el sonido: lo importante, escríbelo o díctalo aquí.</p>

      <label class="btn sec pet-adjuntar">${icono("clip", "p")}Añadir fotos o vídeos<input type="file" id="pet-archivos" multiple accept="image/*,video/*,audio/*" hidden></label>
      <ul class="pet-lista" id="pet-lista"></ul>
      <p class="msg" id="pet-msg" role="status" aria-live="polite"></p>
      <button class="btn" type="submit" id="pet-enviar">${icono("check", "p")}Enviar a Claude</button>
    </form>
    <h2 class="titulo-bloque">Lo que has pedido</h2>
    <div id="pet-hechas"><p class="fecha-txt">Cargando…</p></div>`;
  const t = $("pet-texto"); creceTexto?.(t);
  t.addEventListener("input", () => creceTexto?.(t));
  const lista = () => { $("pet-lista").innerHTML = PET_ARCH.map((f, i) => `<li><span>${esc(f.name)} <small>${esc(tamanoTxt(f.size))}</small></span><button type="button" class="btn-txt" data-quita="${i}">Quitar</button></li>`).join("");
    $("pet-lista").querySelectorAll("[data-quita]").forEach(b => b.onclick = () => { PET_ARCH.splice(+b.dataset.quita, 1); lista(); }); };
  $("pet-archivos").onchange = () => {
    const malos = eligePet($("pet-archivos"), PET_ARCH);
    lista(); if (malos.length) msg("pet-msg", malos.join(". ")); else $("pet-msg").textContent = "";
  };
  $("pet-form").onsubmit = async (e) => {
    e.preventDefault();
    const texto = t.value.trim();
    if (!texto) { msg("pet-msg", "Escribe o dicta qué quieres antes de enviar."); t.focus(); return; }
    const b = $("pet-enviar"); b.disabled = true;
    const subidos = [];
    try {
      subidos.push(...await subePet(PET_ARCH, "pet-msg"));
      msg("pet-msg", "Enviando…", true);
      const { data: nueva, error } = await sb.from("peticiones_claude").insert({ texto, adjuntos: subidos }).select("id").single();
      if (error) throw error;
      t.value = ""; PET_ARCH = []; lista();
      // v117: el timbre lo toca el panel solo (comentario corto en GitHub, función «timbre»): Claude se entera al momento
      msg("pet-msg", "Enviada. Avisando a Claude…", true);
      const r = await sb.functions.invoke("timbre", { body: { id: nueva?.id } }).catch(() => null);
      msg("pet-msg", !$("pet-pausa")?.hidden ? "Enviada. Claude está en pausa: la verá cuando Lorena lo vuelva a encender." : r?.data?.ok ? "Enviada. Claude ya está avisado y se pone con ello. Lorena recibirá un aviso cuando esté listo." : "Enviada. Claude la mirará en la próxima revisión (cada hora, de 8 a 22).", true);
      pintaHechas();
    } catch (er) { msg("pet-msg", errTxt(er)); }
    b.disabled = false;
  };
  pintaHechas();
  // v121: si Claude está en pausa (lo enciende o apaga Lorena desde su app; Claude lo copia en peticiones_estado), se avisa arriba
  sb.from("peticiones_estado").select("pausa").eq("id", 1).maybeSingle().then(({ data }) => { const a = $("pet-pausa"); if (a) a.hidden = !data?.pausa; }, () => {});
}
// v128 (lo pidió Lorena: que el padre vea como ella lo pedido, lo hecho y pueda volver a los chats): cada petición se pliega con su
// título y estado; arriba, «En marcha» / «Terminadas» / «Todas» y un buscador; dentro, lo que ha hecho Claude (columna ficha).
// Se recuerda qué tenía abierto, el filtro y cuántos mensajes de Claude ha visto (localStorage, en try/catch).
const PET_EN_MARCHA = ["nueva", "en_curso", "lista", "no_hecha"];
let PET_LIMITE = 30;
const petLee = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const petGuarda = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const petTitulo = (x) => (x.ficha?.titulo || String(x.texto || "").split("\n")[0]).slice(0, 90);
const petAccion = (x) => (x.estado === "lista" && x.propuesta && !x.decision) || x.estado === "no_hecha";
const fichaPet = (x) => {
  const f = x.ficha || {}, hecho = Array.isArray(f.hecho) ? f.hecho : [];
  const caps = (Array.isArray(f.capturas) ? f.capturas : []).filter(c => /^https:\/\/kdfedwcskymaitvpryvg\.supabase\.co\//.test(c?.url || "")).map(c => ({ url: c.url, nombre: c.texto || "Captura", tipo: "image/jpeg" }));
  if (!f.entendido && !hecho.length && !caps.length && !x.version) return "";
  return `<div class="pet-ficha"><b>${icono("magia", "p")}Lo que ha hecho Claude</b>
    ${f.entendido ? `<p><span class="pet-ficha-etq">Lo ha entendido así:</span> ${esc(f.entendido)}</p>` : ""}
    ${hecho.length ? `<ul>${hecho.map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    ${adjPet(caps)}
    ${x.version && ["publicada", "deshecha"].includes(x.estado) ? `<p class="fecha-txt">Se publicó en la versión ${esc(x.version)}.</p>` : ""}</div>`;
};
async function pintaHechas() {
  const z = $("pet-hechas"); if (!z) return;
  const { data, error } = await sb.from("peticiones_claude").select("id,creado,texto,adjuntos,estado,respuesta,mensajes,deshacer,version,propuesta,decision,ficha").order("id", { ascending: false }).limit(PET_LIMITE);
  if (!$("pet-hechas")) return;
  if (error) { z.innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(errTxt(error))}</p>`; return; }
  // v121: cada petición es como un chat: lo que pidió, lo que ha ido añadiendo y lo que contesta Claude
  const burbuja = (m) => `<li class="pet-m ${m.quien === "claude" ? "de-claude" : "de-padre"}${m.aviso ? " aviso" : ""}"><small>${m.quien === "claude" ? "Claude" : "Tú"} · ${esc(horaPet(m.cuando))}</small>${m.texto ? `<p class="pet-texto">${esc(m.texto)}</p>` : ""}${adjPet(m.adjuntos)}</li>`;
  const filas = data || [], abiertas = new Set(petLee("ccoo-adm-pet-abiertas", [])), vistos = petLee("ccoo-adm-pet-vistos", {});
  const deClaude = (x) => (Array.isArray(x.mensajes) ? x.mensajes : []).filter(m => m.quien === "claude").length;
  const enMarcha = filas.filter(x => PET_EN_MARCHA.includes(x.estado)).length;
  let filtro = petLee("ccoo-adm-pet-filtro", "marcha"); if (filtro === "marcha" && !enMarcha && filas.length) filtro = "todas";
  const chip = (k, t, n) => `<button type="button" class="pet-chip" data-pet-filtro="${k}" aria-pressed="${filtro === k}">${t}${n != null ? ` <span>${n}</span>` : ""}</button>`;
  const cabecera = filas.length ? `<div class="pet-filtros" role="group" aria-label="Qué peticiones ver">${chip("marcha", "En marcha", enMarcha)}${chip("hechas", "Terminadas", filas.length - enMarcha)}${chip("todas", "Todas", null)}</div>
    ${filas.length > 4 ? `<label class="pet-busca">${icono("buscar", "p")}<input type="search" id="pet-busca" placeholder="Buscar en lo que has pedido" aria-label="Buscar en lo que has pedido" autocomplete="off"></label>` : ""}
    <p class="fecha-txt pet-nada" id="pet-nada" hidden>No hay ninguna aquí. Toca «Todas» para verlas todas.</p>` : "";
  z.innerHTML = filas.length ? cabecera + filas.map(x => {
    const ms = Array.isArray(x.mensajes) ? x.mensajes : [], nuevos = deClaude(x) - (vistos[x.id] ?? 0);
    const abierta = abiertas.has(x.id) || petAccion(x);
    return `<details class="panel pet-item est-${esc(x.estado)}" data-pet="${esc(x.id)}" data-grupo="${PET_EN_MARCHA.includes(x.estado) ? "marcha" : "hechas"}"${abierta ? " open" : ""}>
      <summary class="pet-sum"><span class="pet-tit">${esc(petTitulo(x))}</span>
        <span class="pet-cab"><span class="etq">${esc(PET_ESTADO[x.estado] || x.estado)}</span>${petAccion(x) ? `<span class="pet-toca">Te toca a ti</span>` : ""}${nuevos > 0 ? `<span class="pet-nuevo">${nuevos === 1 ? "1 mensaje nuevo" : `${nuevos} mensajes nuevos`}</span>` : ""}<small>N.º ${esc(x.id)} · ${esc(horaPet(x.creado))}${ms.length ? ` · ${ms.length} ${ms.length === 1 ? "mensaje" : "mensajes"}` : ""}</small></span></summary>
      <div class="pet-cuerpo">
      <p class="pet-texto">${esc(x.texto)}</p>
      ${adjPet(x.adjuntos)}
      ${ms.length ? `<ul class="pet-chat" aria-label="Lo añadido después">${ms.map(burbuja).join("")}</ul>` : ""}
      ${x.respuesta ? `<p class="pet-resp"><b>Claude:</b> ${esc(x.respuesta)}</p>` : ""}
      ${fichaPet(x)}
      ${x.estado === "lista" && x.propuesta && !x.decision ? `<div class="pet-decide" role="group" aria-label="¿Qué hago con esta petición?">
        <p class="pet-decide-tit">${icono("ver", "p")}Mira las fotos de arriba. ¿Te gusta cómo queda?</p>
        <button type="button" class="btn pet-publica" data-decide="${esc(x.id)}" data-que="publicar">${icono("check", "p")}Publicar</button>
        <button type="button" class="btn sec" data-anade-abre-2="${esc(x.id)}">${icono("mas", "p")}Añadir algo o mejorarlo</button>
        <button type="button" class="btn sec pet-descarta" data-decide="${esc(x.id)}" data-que="descartar">${icono("cerrar", "p")}Descartar</button>
        <p class="msg" role="status" aria-live="polite" id="pet-decide-msg-${esc(x.id)}"></p>
      </div>` : ""}
      ${x.estado === "lista" && x.decision === "publicar" ? `<p class="aviso-pausa">${icono("reloj", "p")}<span>Has dicho «Publicar». Claude lo sube a la web y te avisa aquí.</span></p>` : ""}
      ${`<div class="pet-lorena"><p class="ayuda">${["no_hecha", "descartada"].includes(x.estado) ? "Si no estás de acuerdo, avisa a Lorena: le llega un aviso al móvil y lo mira ella." : "¿Quieres que lo mire Lorena? Le llega un aviso al móvil."}</p><button type="button" class="btn${["no_hecha", "descartada"].includes(x.estado) ? "" : " sec"}" data-avisa-lorena="${esc(x.id)}">${icono("campana", "p")}Avisar a Lorena</button><p class="msg" role="status" aria-live="polite" id="pet-lorena-msg-${esc(x.id)}"></p></div>`}
      ${x.estado === "publicada" ? (x.deshacer ? `<p class="aviso-pausa">${icono("reloj", "p")}<span>Has pedido volver a como estaba antes. Claude lo deshace y avisa a Lorena.</span></p>` : `<div class="pet-lorena"><p class="ayuda">¿No te gusta cómo ha quedado o algo ha salido mal? La web vuelve a estar como antes de esta petición.</p><button type="button" class="btn sec" data-deshacer="${esc(x.id)}">${icono("izq", "p")}Volver a como estaba antes</button><p class="msg" role="status" aria-live="polite" id="pet-deshacer-msg-${esc(x.id)}"></p></div>`) : ""}
      <button type="button" class="btn sec pet-anade-abre" data-anade-abre="${esc(x.id)}" aria-expanded="false">${icono("mas", "p")}Añadir algo a esta petición</button>
      <form class="pet-anade" data-anade="${esc(x.id)}" hidden novalidate>
        <label for="pet-anade-${esc(x.id)}">¿Qué quieres añadir?</label>
        <textarea id="pet-anade-${esc(x.id)}" class="crece" rows="3" maxlength="5000" spellcheck="true" autocapitalize="sentences" placeholder="Ej: y que también salga en el PDF."></textarea>
        <label class="btn sec pet-adjuntar">${icono("clip", "p")}Añadir fotos o vídeos<input type="file" multiple accept="image/*,video/*,audio/*" hidden data-anade-arch></label>
        <ul class="pet-lista" data-anade-lista></ul>
        <p class="msg" role="status" aria-live="polite"></p>
        <button class="btn" type="submit">${icono("check", "p")}Enviar a Claude</button>
      </form>
      </div>
    </details>`; }).join("") + (filas.length >= PET_LIMITE ? `<button type="button" class="btn sec pet-mas" id="pet-mas">${icono("abajo", "p")}Ver las más antiguas</button>` : "") : `<div class="panel vacio">${icono("magia")}Todavía no has pedido nada.</div>`;
  // v128: filtro, buscador, plegar y «mensajes nuevos»
  const aplica = () => {
    const q = $("pet-busca")?.value.trim() || ""; let n = 0;
    z.querySelectorAll("details.pet-item").forEach(d => {
      const ok = (filtro === "todas" || q || d.dataset.grupo === filtro) && (!q || coincide(d.textContent, q));
      d.hidden = !ok; if (ok) n++;
    });
    const nada = $("pet-nada"); if (nada) nada.hidden = n > 0;
    z.querySelectorAll("[data-pet-filtro]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.petFiltro === filtro)));
  };
  z.querySelectorAll("[data-pet-filtro]").forEach(b => b.onclick = () => { filtro = b.dataset.petFiltro; petGuarda("ccoo-adm-pet-filtro", filtro); aplica(); });
  let espera; $("pet-busca")?.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(aplica, 200); });
  $("pet-mas")?.addEventListener("click", () => { PET_LIMITE += 30; pintaHechas(); });
  // Las que ya salen abiertas cuentan como vistas (sin quitar ahora la marca «nuevo»); el toggle del primer pintado no se guarda
  const vis = petLee("ccoo-adm-pet-vistos", {}); filas.forEach(x => { if (z.querySelector(`details[data-pet="${x.id}"]`)?.open) vis[x.id] = deClaude(x); }); petGuarda("ccoo-adm-pet-vistos", vis);
  let listo = false; setTimeout(() => { listo = true; }, 0);
  z.querySelectorAll("details.pet-item").forEach(d => d.addEventListener("toggle", () => {
    if (!listo) return;
    const id = Number(d.dataset.pet), ab = new Set(petLee("ccoo-adm-pet-abiertas", []));
    if (d.open) { ab.add(id); const x = filas.find(f => f.id === id); if (x) { const v = petLee("ccoo-adm-pet-vistos", {}); v[id] = deClaude(x); petGuarda("ccoo-adm-pet-vistos", v); d.querySelector(".pet-nuevo")?.remove(); } }
    else ab.delete(id);
    petGuarda("ccoo-adm-pet-abiertas", [...ab].slice(-40));
  }));
  aplica();
  // v121: si Claude dice que no, el padre puede pedir que lo mire Lorena (le llega un aviso al móvil)
  z.querySelectorAll("[data-avisa-lorena]").forEach(b => b.onclick = async () => {
    const id = Number(b.dataset.avisaLorena), mid = `pet-lorena-msg-${id}`; b.disabled = true;
    msg(mid, "Avisando a Lorena…", true);
    try {
      const { data: r, error } = await sb.rpc("pedir_lorena", { p_id: id });
      if (error) throw error;
      if (r === "ya") { msg(mid, "Ya la avisaste hace poco. Si no contesta, vuelve a probar dentro de media hora.", true); return; }
      if (r !== "ok") throw new Error("No se ha podido avisar. Prueba otra vez.");
      const tr = await sb.functions.invoke("timbre", { body: { id, avisar: true } }).catch(() => null);
      await pintaHechas();
      msg(mid, tr?.data?.ok ? "Avisada. Le llegará un aviso al móvil." : "Apuntado. Lorena lo verá cuando mire las peticiones.", true);
    } catch (er) { msg(mid, errTxt(er)); b.disabled = false; }
  });
  // v122: volver a como estaba antes de una petición ya publicada (Claude lo deshace con la copia de antes)
  z.querySelectorAll("[data-deshacer]").forEach(b => b.onclick = async () => {
    const id = Number(b.dataset.deshacer), mid = `pet-deshacer-msg-${id}`;
    if (!confirm(`¿Volver a dejar la web como estaba antes de la petición n.º ${id}? Lo que se cambió en esa petición se quita.`)) return;
    b.disabled = true; msg(mid, "Pidiéndolo…", true);
    try {
      const { data: r, error } = await sb.rpc("deshacer_peticion", { p_id: id });
      if (error) throw error;
      if (r !== "ok" && r !== "ya") throw new Error(r === "no_publicada" ? "Esta petición no está publicada: no hay nada que deshacer." : "No se ha podido pedir. Prueba otra vez.");
      await sb.functions.invoke("timbre", { body: { id, deshacer: true } }).catch(() => null);
      await pintaHechas();
    } catch (er) { msg(mid, errTxt(er)); b.disabled = false; }
  });
  // v125 (lo pidió Lorena): el padre ve las capturas y decide; «Descartar» pide confirmación para no pulsarlo sin querer
  z.querySelectorAll("[data-anade-abre-2]").forEach(b => b.onclick = () => z.querySelector(`[data-anade-abre="${b.dataset.anadeAbre2}"]`)?.click());
  z.querySelectorAll("[data-decide]").forEach(b => b.onclick = async () => {
    const id = Number(b.dataset.decide), que = b.dataset.que, mid = `pet-decide-msg-${id}`;
    if (que === "descartar" && !(await confirmaDescartar(id))) return;
    z.querySelectorAll(`[data-decide="${id}"]`).forEach(x => x.disabled = true);
    msg(mid, que === "publicar" ? "Avisando a Claude para que lo publique…" : "Descartando…", true);
    try {
      const { data: r, error } = await sb.rpc("decidir_peticion", { p_id: id, p_decision: que });
      if (error) throw error;
      if (r !== "ok" && r !== "ya") throw new Error(r === "no_propuesta" ? "Esta petición ya no está esperando tu respuesta." : "No se ha podido guardar. Prueba otra vez.");
      await sb.functions.invoke("timbre", { body: { id, decision: true } }).catch(() => null);
      await pintaHechas();
    } catch (er) { msg(mid, errTxt(er)); z.querySelectorAll(`[data-decide="${id}"]`).forEach(x => x.disabled = false); }
  });
  z.querySelectorAll("[data-anade-abre]").forEach(b => b.onclick = () => {
    const f = z.querySelector(`[data-anade="${b.dataset.anadeAbre}"]`); f.hidden = !f.hidden; b.setAttribute("aria-expanded", String(!f.hidden));
    if (!f.hidden) { const t = f.querySelector("textarea"); creceTexto?.(t); t.focus(); }
  });
  z.querySelectorAll("form[data-anade]").forEach(f => {
    const id = Number(f.dataset.anade), t = f.querySelector("textarea"), m = f.querySelector(".msg"), ul = f.querySelector("[data-anade-lista]");
    m.id = `pet-anade-msg-${id}`;
    const arch = PET_ANADE[id] = [];
    const lista = () => { ul.innerHTML = arch.map((a, i) => `<li><span>${esc(a.name)} <small>${esc(tamanoTxt(a.size))}</small></span><button type="button" class="btn-txt" data-quita="${i}">Quitar</button></li>`).join("");
      ul.querySelectorAll("[data-quita]").forEach(q => q.onclick = () => { arch.splice(+q.dataset.quita, 1); lista(); }); };
    t.addEventListener("input", () => creceTexto?.(t));
    f.querySelector("[data-anade-arch]").onchange = (e) => { const malos = eligePet(e.target, arch); lista(); if (malos.length) msg(m.id, malos.join(". ")); else m.textContent = ""; };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const texto = t.value.trim();
      if (!texto && !arch.length) { msg(m.id, "Escribe o dicta qué quieres añadir."); t.focus(); return; }
      const b = f.querySelector("button[type=submit]"); b.disabled = true;
      try {
        const subidos = await subePet(arch, m.id);
        msg(m.id, "Enviando…", true);
        const { data: r, error } = await sb.rpc("anadir_a_peticion", { p_id: id, p_texto: texto, p_adjuntos: subidos });
        if (error) throw error;
        if (r !== "ok") throw new Error(r === "largo" ? "Es demasiado largo: pártelo en dos." : "No se ha podido añadir. Prueba otra vez.");
        msg(m.id, "Añadido. Avisando a Claude…", true);
        const tr = await sb.functions.invoke("timbre", { body: { id, anadido: true } }).catch(() => null);
        await pintaHechas();
        const nuevo = $(`pet-anade-msg-${id}`);
        if (nuevo) { nuevo.closest("form").hidden = false; msg(nuevo.id, tr?.data?.ok ? "Añadido a la petición. Claude ya está avisado." : "Añadido a la petición. Claude lo verá cuando la mire.", true); }
      } catch (er) { msg(m.id, errTxt(er)); b.disabled = false; }
    };
  });
}
