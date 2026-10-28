// Panel: historial, revisar ortografía, archivos, calculadoras, camiones, buzón y textos.
// El panel está repartido en admin-base.js, admin-sesion.js, admin-listas.js, admin-editor.js,
// admin-herramientas.js, admin-ajustes.js y admin-calendario.js, que se cargan en ese orden (comparten variables).

// ---------- Historial y deshacer ----------
const NOMBRE_TABLA = { comunicados: "el aviso", eventos: "la fecha", convenio_secciones: "el apartado del convenio", actas: "el acta", documentos: "el documento",
  preguntas: "la pregunta frecuente", plantillas: "la plantilla", delegados: "el delegado", enlaces: "el enlace", apartados: "el apartado de la web",
  publicaciones: "la publicación", opciones: "la opción de lista", calc_permisos: "el permiso de la calculadora", calc_categorias: "el precio de horas extra",
  avisos_recurrentes: "el aviso que se repite", buzon: "el mensaje del buzón", paginas: "el texto", calc_ajustes: "el ajuste de la calculadora", admins: "el administrador", restricciones: "el país de restricciones para camiones", tarifas_conductor: "el importe de «Mis incentivos»", peajes_paises: "el precio de peaje de un país" };
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
