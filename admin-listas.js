// Panel: listas, reordenar, borrador, «+ Nuevo» y subir archivos.
// El panel está repartido en admin-base.js, admin-sesion.js, admin-listas.js, admin-editor.js,
// admin-herramientas.js, admin-ajustes.js y admin-calendario.js, que se cargan en ese orden (comparten variables).

// ---------- Listas ----------
async function cargarDatos(k) {
  const s = SECCIONES[k];
  let q = sb.from(s.tabla).select("*");
  Object.entries(s.filtro || {}).forEach(([c, v]) => { q = q.eq(c, v); });
  const { data, error } = await q.order(s.orden[0], { ascending: s.orden[1] }).order("id", { ascending: false });
  if (error) throw error;
  datos[k] = data || [];
  return datos[k];
}
function itemHTML(k, x, conSeccion) {
  if (SECCIONES[k].tarjeta && !conSeccion) return SECCIONES[k].tarjeta(x);
  const s = SECCIONES[k], [pub, act] = s.fechas(x), nAdj = (x.adjuntos || []).length;
  const nl = TABLAS_LEIDAS.includes(s.tabla) ? LECTURAS[s.tabla + ":" + x.id] : 0;
  const chips = [conSeccion ? s.nombre : null, ...s.chips(x), nl ? "Leído " + vecesTxt(nl) : null].filter(Boolean);
  return `<button class="item-adm ${claseTipo(x[s.campoColor], s.lista)}" data-k="${k}" data-id="${x.id}">
    <span class="barra-color"></span>
    <span class="txt">
      <span class="tit">${esc((s.tituloDe ? s.tituloDe(x) : x.titulo) || "Sin título")}</span>
      ${s.extracto(x) ? `<span class="extracto">${esc(String(s.extracto(x)).replace(/\*\*/g, ""))}</span>` : ""}
      <span class="chips">${chips.map(c => `<span class="etq">${esc(c)}</span>`).join("")}${nAdj ? `<span class="etq adj">${icono("clip", "p")}${nAdj} archivo${nAdj > 1 ? "s" : ""}</span>` : ""}</span>
      ${fechasHTML(pub || act, act, x.publicado === false || (k === "convenio" && x.visible === false) ? "Guardado sin publicar" : undefined)}
    </span>
    ${icono("der", "chevron")}
  </button>`;
}
// ---------- Reordenar arrastrando (ratón o dedo) y con el teclado ----------
// «Apartados de la web»: tocar la tarjeta abre la sección para publicar dentro (que es lo que se espera).
// El nombre, el dibujo y la posición se cambian con un botón aparte.
let CUENTA_PUB = {};
async function contarPublicaciones() {
  const { data } = await sb.from("publicaciones").select("apartado_id");
  CUENTA_PUB = {}; (data || []).forEach(p => { CUENTA_PUB[p.apartado_id] = (CUENTA_PUB[p.apartado_id] || 0) + 1; });
}
function tarjetaApartado(x) {
  const n = CUENTA_PUB[x.id] || 0;
  return `<div class="tarjeta-ap">
    <button class="item-adm" data-abrir-ap="${x.id}">
      <span class="ic-ap">${icono(esc(x.icono || "carpeta"))}</span>
      <span class="txt"><span class="tit">${esc(x.titulo || "Sin nombre")}</span>
        <span class="extracto">${n ? `${n} ${n === 1 ? "publicación" : "publicaciones"}. ` : "Todavía está vacío. "}Toca para abrir y publicar textos, fotos y documentos.</span>
        ${x.visible === false || padreDe(x) ? `<span class="chips">${padreDe(x) ? `<span class="etq">Dentro de «${esc(padreDe(x).titulo)}»</span>` : ""}${x.visible === false ? `<span class="etq">Oculto en la web</span>` : ""}</span>` : ""}</span>
      ${icono("der", "chevron")}</button>
    <button class="btn sec peq ajustes-ap" data-ajustes-ap="${x.id}">${icono("editar", "p")}Cambiar nombre y ajustes</button>
  </div>`;
}
const REORDENABLE = (k) => SECCIONES[k]?.orden?.[0] === "orden";
// Envuelve cada elemento con un asa para arrastrarlo y botones para subir/bajar
const filaOrden = (k, x) => `<div class="fila-orden" data-id="${x.id}">
  <span class="asa" role="button" tabindex="0" aria-label="Arrastrar para cambiar el orden de «${esc((SECCIONES[k].tituloDe ? SECCIONES[k].tituloDe(x) : x.titulo) || "")}». También con las flechas del teclado.">${icono("arrastrar")}</span>
  ${itemHTML(k, x)}</div>`;
function hacerOrdenable(cont, k) {
  const filas = () => [...cont.querySelectorAll(":scope > .fila-orden")];
  const guardar = async () => {
    const ids = filas().map(f => +f.dataset.id), cambios = [];
    ids.forEach((id, i) => { const x = datos[k].find(d => d.id === id); if (x && x.orden !== i + 1) { x.orden = i + 1; cambios.push(sb.from(SECCIONES[k].tabla).update({ orden: i + 1 }).eq("id", id)); } });
    if (!cambios.length) return;
    const r = await Promise.all(cambios), e = r.find(x => x.error);
    datos[k].sort((a, b) => a.orden - b.orden);
    aviso(e ? "No se ha podido guardar el orden: " + errTxt(e.error) : "Orden guardado. Ya se ve así en la web.", !!e);
  };
  filas().forEach(f => {
    const asa = f.querySelector(".asa");
    asa.onpointerdown = (e) => {
      if (e.button > 0) return;
      e.preventDefault(); f.classList.add("arrastrando");
      const id = e.pointerId;
      // Se escucha en toda la página: al mover la fila en la lista, el navegador deja de mandar los movimientos al asa
      const mover = (ev) => {
        if (ev.pointerId !== id) return;
        if (ev.clientY < 90) scrollBy(0, -14); else if (ev.clientY > innerHeight - 110) scrollBy(0, 14);
        const sobre = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".fila-orden");
        if (!sobre || sobre === f || sobre.parentElement !== cont) return;
        const r = sobre.getBoundingClientRect();
        cont.insertBefore(f, ev.clientY < r.top + r.height / 2 ? sobre : sobre.nextSibling);
      };
      const soltar = (ev) => {
        if (ev.pointerId !== id) return;
        removeEventListener("pointermove", mover); removeEventListener("pointerup", soltar); removeEventListener("pointercancel", soltar);
        f.classList.remove("arrastrando"); guardar();
      };
      addEventListener("pointermove", mover); addEventListener("pointerup", soltar); addEventListener("pointercancel", soltar);
    };
    asa.onkeydown = (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const otro = e.key === "ArrowUp" ? f.previousElementSibling : f.nextElementSibling;
      if (!otro?.classList.contains("fila-orden")) return;
      cont.insertBefore(f, e.key === "ArrowUp" ? otro : otro.nextSibling); asa.focus(); guardar();
    };
  });
}

// ---------- Borrador guardado solo (por si se cierra la app sin querer) ----------
const claveBorrador = () => ED && `ccoo-borrador-${ED.k}-${ED.orig?.id ?? "nuevo"}`;
function guardarBorrador() {
  if (!ED?.sucio) return;
  const campos = {};
  $("ed-form").querySelectorAll("[id^='f-']:not([type=file])").forEach(el => campos[el.id] = el.type === "checkbox" ? el.checked : el.value);
  try { localStorage.setItem(claveBorrador(), JSON.stringify({ t: Date.now(), campos })); } catch (_) {}
}
const quitarBorrador = () => { try { if (ED) localStorage.removeItem(claveBorrador()); } catch (_) {} };
setInterval(guardarBorrador, 4000);
document.addEventListener("visibilitychange", () => { if (document.hidden) guardarBorrador(); });
function ofrecerBorrador() {
  let b = null; try { b = JSON.parse(localStorage.getItem(claveBorrador()) || "null"); } catch (_) {}
  if (!b || (ED.orig?.actualizado && new Date(ED.orig.actualizado).getTime() > b.t)) return;
  $("ed-form").insertAdjacentHTML("afterbegin", `<div class="borrador" id="borrador"><p>${icono("reloj", "p")}<span>Tienes un borrador sin guardar de ${esc(haceTxt(b.t))}. ¿Lo recuperas? <small>(Los archivos hay que volver a elegirlos.)</small></span></p>
    <div class="botones"><button class="btn" type="button" id="b-borrador-si">Recuperar el borrador</button><button class="btn sec" type="button" id="b-borrador-no">Descartar</button></div></div>`);
  $("b-borrador-si").onclick = () => {
    Object.entries(b.campos).forEach(([id, v]) => { const el = $(id); if (!el) return; if (el.type === "checkbox") el.checked = v; else el.value = v; });
    $("borrador").remove(); ED.sucio = true; actualizarPrevia(); aviso("Borrador recuperado.");
  };
  $("b-borrador-no").onclick = () => { quitarBorrador(); $("borrador").remove(); };
}

// ---------- Botón «+ Nuevo»: pregunta qué crear ----------
function abrirHojaNuevo() {
  const orden = Object.keys(PAGINAS).filter(k => SECCIONES[k] && !SECCIONES[k].oculta);
  if (SECCIONES[actual] && !SECCIONES[actual].oculta) orden.splice(orden.indexOf(actual), 1), orden.unshift(actual);
  $("hoja-mas").innerHTML = `<p class="hoja-tit">¿Qué quieres crear?</p>` + orden.map(k =>
    `<button data-nuevo="${k}" class="${k === actual ? "actual" : ""}">${icono(SECCIONES[k].icono)}${esc({ convenio: "Nuevo apartado del convenio", apartados: "Nuevo apartado de la web" }[k] || SECCIONES[k].nuevo)}</button>`).join("") +
    `<button id="h-calc">${icono("reloj")}Permiso o precio de las calculadoras</button>`;
  ["velo-mas", "hoja-mas"].forEach(i => $(i).classList.remove("oculto"));
  $("hoja-mas").querySelectorAll("[data-nuevo]").forEach(b => b.onclick = () => { cerrarMas(); abrirEditor(b.dataset.nuevo); });
  $("h-calc").onclick = () => { cerrarMas(); abrir("calculadoras"); };
  $("hoja-mas").querySelector("button")?.focus();
}

// Tras guardar, la lista vuelve a pintarse: se baja hasta lo guardado y se resalta un momento para encontrarlo
let RESALTAR = null;
function resaltaGuardado(cont) {
  const r = RESALTAR; RESALTAR = null;
  const el = r && cont?.querySelector(`.item-adm[data-k="${r.k}"][data-id="${r.id}"], [data-abrir-ap="${r.id}"]`);
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el.classList.add("recien"); setTimeout(() => el.classList.remove("recien"), 2600);
}
function enlazarItems(cont) {
  cont.querySelectorAll(".item-adm[data-k]").forEach(b => b.onclick = () => abrirEditor(b.dataset.k, datos[b.dataset.k].find(x => x.id == b.dataset.id)));
  cont.querySelectorAll("[data-abrir-ap]").forEach(b => b.onclick = () => abrir("ap" + b.dataset.abrirAp));
  cont.querySelectorAll("[data-ajustes-ap]").forEach(b => b.onclick = () => abrirEditor("apartados", datos.apartados.find(x => x.id == b.dataset.ajustesAp)));
}
// Filtros rápidos encima de la lista: solo salen los que tienen algo
const RAPIDOS = {
  programados: ["Programados", x => x.publicar_en && new Date(x.publicar_en) > new Date()],
  ocultos: ["Ocultos", x => x.publicado === false || x.publicada === false || x.visible === false],
  urgentes: ["Urgentes", x => x.urgente],
  fijados: ["Fijados", x => x.fijado],
  importantes: ["Con cuenta atrás", x => x.importante],
};
function pintaRapidos(k, ff, repintar) {
  const cont = $("rapidos-lista"); if (!cont) return;
  const hay = Object.entries(RAPIDOS).map(([c, [t, f]]) => [c, t, datos[k].filter(f).length]).filter(([, , n]) => n);
  if (ff.rapido && !hay.some(([c]) => c === ff.rapido)) ff.rapido = "";
  cont.innerHTML = hay.length ? `<button type="button" class="filtro ${ff.rapido ? "" : "activo"}" data-rapido="" aria-pressed="${!ff.rapido}">Todo</button>` +
    hay.map(([c, t, n]) => `<button type="button" class="filtro ${ff.rapido === c ? "activo" : ""}" data-rapido="${c}" aria-pressed="${ff.rapido === c}">${t} <span class="cuenta">${n}</span></button>`).join("") : "";
  cont.querySelectorAll("[data-rapido]").forEach(b => b.onclick = () => { ff.rapido = b.dataset.rapido; repintar(); });
}
async function pintaSeccion(k) {
  const s = SECCIONES[k];
  if (k === "calendario" && VISTA_CAL.modo === "mes") return pintaCalAdm();
  $("zona").innerHTML = `<div class="sec-cab">
      <div><h1>${esc(s.nombre)}</h1><p id="cuenta">${esc(s.intro)}</p></div>
      <div class="botones" style="margin:0">${k === "avisos" ? `<button class="btn sec" id="b-recurrentes">${icono("reloj2", "p")}Avisos que se repiten</button>` : ""}${k === "documentos" ? `<button class="btn sec" id="b-archivos">${icono("imagen", "p")}Todos los archivos y fotos</button>` : ""}${s.slug === "zona-conductores" ? `<button class="btn sec" id="b-camiones">${icono("lugar", "p")}Restricciones para camiones</button>` : ""}<button class="btn btn-nuevo" id="b-nuevo">${icono("mas", "p")}${s.nuevo}</button></div>
    </div>
    ${k === "calendario" ? cambioVistaCal() : ""}
    <div class="herramientas"><div class="buscador">${icono("buscar", "p")}<input id="buscar" type="search" placeholder="Buscar en ${s.nombre.toLowerCase()} (también fechas: 12/10, octubre…)" aria-label="Buscar"></div></div>
    ${FECHA_DE[k] ? `<div class="filtro-fechas" id="fechas-adm"></div>` : ""}
    <div class="filtro-fechas rapidos-lista" id="rapidos-lista" role="group" aria-label="Ver solo"></div>
    <div class="lista-adm" id="lista"><p class="fecha-txt">Cargando…</p></div>`;
  $("b-nuevo").onclick = () => abrirEditor(k);
  if ($("b-recurrentes")) $("b-recurrentes").onclick = () => abrir("recurrentes");
  if ($("b-camiones")) $("b-camiones").onclick = () => abrir("camiones");
  if ($("b-archivos")) $("b-archivos").onclick = () => abrir("archivos");
  enlazarVistaCal();
  try { await Promise.all([cargarDatos(k), TABLAS_LEIDAS.includes(s.tabla) ? cargarLecturas() : null, k === "apartados" ? contarPublicaciones() : null, k === "encuestas" ? cargarVotos() : null]); } catch (e) { $("lista").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(errTxt(e))}</p>`; return; }
  const ff = FILTRO_ADM[k] ||= {};
  const pinta = () => {
    if (FECHA_DE[k]) pintaFechasAdm(datos[k], k, ff, pinta);
    const q = $("buscar").value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    pintaRapidos(k, ff, pinta);
    const l = datos[k].filter(x => pasaFechaAdm(ff, FECHA_DE[k]?.(x)) && (!ff.rapido || RAPIDOS[ff.rapido]?.[1](x)) &&
      (!q || coincide(Object.values(x).filter(v => typeof v === "string").join(" ") + " " + (x.adjuntos || []).map(j => j.nombre).join(" ") + " " + textoFecha(FECHA_DE[k]?.(x)), q)));
    const ordenable = REORDENABLE(k) && !q && !ff.rapido && l.length > 1;
    if (!ordenable) $("ayuda-orden")?.remove();
    if (ordenable && !$("ayuda-orden")) $("lista").insertAdjacentHTML("beforebegin", `<p class="ayuda" id="ayuda-orden">${icono("arrastrar", "p")} Para cambiar el orden, arrastra desde las rayas de la izquierda (con el dedo o el ratón).</p>`);
    $("lista").innerHTML = l.length ? (ordenable ? l.map(x => filaOrden(k, x)).join("") : l.map(x => itemHTML(k, x)).join("")) :
      `<div class="panel vacio">${icono(s.icono)}${q || ff.a || ff.m || ff.d || ff.rapido ? "Nada coincide con la búsqueda o la fecha." : `Todavía no hay nada. Pulsa «${s.nuevo}» para empezar.`}</div>`;
    enlazarItems($("lista"));
    if (ordenable) hacerOrdenable($("lista"), k);
    resaltaGuardado($("lista"));
  };
  $("buscar").oninput = pinta; pinta();
}

// ---------- Archivos ----------
// Las fotos grandes del móvil (3–8 MB) se reducen antes de subirlas: 2000 px por el lado largo, JPEG al 85 %.
// Así los trabajadores gastan menos datos. Si el navegador no sabe abrirla (p. ej. HEIC) o no gana nada, se sube tal cual.
async function reducirFoto(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(mimeDe(file)) || file.size < 600 * 1024) return file;
  try {
    const img = await createImageBitmap(file), r = Math.min(1, 2000 / Math.max(img.width, img.height));
    const cv = document.createElement("canvas"); cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r);
    const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
    const blob = await new Promise(ok => cv.toBlob(ok, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch (_) { return file; }
}
async function subirArchivo(file) {
  file = await reducirFoto(file);
  const tipo = mimeDe(file);
  if (!tipo) throw new Error(`«${file.name}» no es de un tipo permitido.`);
  if (file.size > MAX_MB * 1048576) throw new Error(`«${file.name}» pesa más de ${MAX_MB} MB.`);
  const limpio = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80);
  const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${limpio}`;
  const { error } = await sb.storage.from("documentos").upload(ruta, file, { contentType: tipo, cacheControl: "31536000" }); // nombre único: no cambia nunca, el móvil lo guarda un año
  if (error) throw new Error(`No se ha podido subir «${file.name}»: ${errTxt(error)}`);
  return { nombre: file.name, url: sb.storage.from("documentos").getPublicUrl(ruta).data.publicUrl, tipo, tamano: file.size };
}
async function borrarArchivos(urls) {
  const rutas = urls.filter(Boolean).map(u => decodeURIComponent(u.split("/documentos/")[1] || "")).filter(Boolean);
  if (rutas.length) await sb.storage.from("documentos").remove(rutas);
}
function validarArchivo(f) {
  if (!mimeDe(f)) return "Tipo de archivo no permitido. Usa PDF, foto, Word, Excel o PowerPoint.";
  if (f.size > MAX_MB * 1048576) return `Pesa ${tamanoTxt(f.size)}. El máximo es ${MAX_MB} MB.`;
  if (!f.size) return "El archivo está vacío. Si es de Drive o WhatsApp, descárgalo primero al móvil.";
  return "";
}

