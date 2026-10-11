// ===== Panel de publicación · Sección Sindical CCOO Calsina Carré =====
const $ = (id) => document.getElementById(id);
const aqui = location.origin + location.pathname;
const msg = (id, t, ok) => { const el = $(id); if (!el) return; el.textContent = t; el.className = "msg " + (ok ? "ok" : "err"); };
const MAX_MB = 20;
$("ver-web").innerHTML = icono("ver", "p");
$("ed-cerrar").innerHTML = icono("cerrar", "p");
$("fab").innerHTML = icono("mas");
$("previa-icono").innerHTML = icono("ver", "p");

function aviso(texto, error) {
  const t = $("toast");
  t.innerHTML = icono(error ? "alerta" : "check", "p") + esc(texto);
  t.style.background = error ? "var(--rojo)" : "";
  t.classList.add("ver"); clearTimeout(aviso.t); aviso.t = setTimeout(() => t.classList.remove("ver"), 4000);
}

// ---------- Secciones ----------
const FORMATO = `<div class="formato">Para dar formato: deja una línea en blanco entre párrafos, empieza una línea con <code>- </code> para hacer una lista y escribe <code>**así**</code> para poner negrita. Los enlaces se activan solos.</div>`;
const SECCIONES = {
  avisos: {
    nombre: "Avisos", icono: "avisos", tabla: "comunicados", orden: ["fecha", false], uno: "aviso", nuevo: "Nuevo aviso", lista: "aviso", campoColor: "categoria",
    intro: "Comunicados para la plantilla. Lo urgente sale en rojo y arriba del todo en Inicio.",
    campos: [
      { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Convocatoria de asamblea" },
      { k: "categoria", l: "Categoría", t: "select", lista: "aviso" },
      { k: "contenido", l: "Texto del aviso", t: "textarea", formato: true },
      { k: "adjuntos", l: "Archivos adjuntos", t: "archivos", opc: true },
      { checks: [{ k: "urgente", l: "Urgente: sale en rojo y arriba del todo en Inicio" }, { k: "fijado", l: "Fijar arriba de la lista de avisos" }, { k: "notificar", l: "Avisar en los móviles y en el canal de Telegram", def: true, soloNuevo: true }] },
      { k: "publicar_en", l: "Programar la publicación", t: "datetime-local", opc: true, ayuda: "Déjalo vacío para publicar ahora. Si pones día y hora, se publicará y avisará solo en ese momento." },
    ],
    previa: (x) => tarjetaAviso(x),
    extracto: (x) => x.contenido, chips: (x) => [x.publicar_en && new Date(x.publicar_en) > new Date() ? "Programado: " + new Date(x.publicar_en).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null, x.categoria, x.urgente && "Urgente", x.fijado && "Fijado"], fechas: (x) => [x.fecha, x.actualizado],
  },
  calendario: {
    nombre: "Calendario", icono: "calendario", tabla: "eventos", orden: ["fecha", false], uno: "fecha", nuevo: "Nueva fecha", lista: "evento", campoColor: "tipo",
    intro: "Asambleas, reuniones, negociaciones y festivos que salen en el calendario.",
    campos: [
      { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Asamblea de trabajadores" },
      { fila: [{ k: "tipo", l: "Tipo", t: "select", lista: "evento" }, { k: "fecha", l: "Día", t: "date", req: true }] },
      { fila: [{ k: "hora", l: "Hora de inicio", t: "time", opc: true }, { k: "hora_fin", l: "Hora de fin", t: "time", opc: true }] },
      { k: "lugar", l: "Lugar", t: "text", opc: true, ph: "Ej: Comedor de la nave 2" },
      { k: "descripcion", l: "Descripción", t: "textarea", opc: true, corto: true },
      { checks: [{ k: "notificar", l: "Avisar en los móviles y en el canal de Telegram", def: true, soloNuevo: true }] },
    ],
    previa: (x) => `<div class="panel dia-detalle">${x.fecha ? `<h3>${fechaDia(x.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</h3>` : ""}${eventoHTML(x, true)}</div>`,
    extracto: (x) => [x.hora, x.lugar].filter(Boolean).join(" · "), chips: (x) => [x.fecha && fechaLarga(x.fecha + "T12:00:00"), x.tipo], fechas: (x) => [x.creado, x.actualizado],
  },
  convenio: {
    nombre: "Convenio", icono: "convenio", tabla: "convenio_secciones", orden: ["orden", true], uno: "apartado", nuevo: "Nuevo apartado", lista: "convenio", campoColor: "categoria",
    intro: "Apartados del convenio explicados de forma sencilla. Los trabajadores los abren al tocarlos.",
    campos: [
      { k: "titulo", l: "Título del apartado", t: "text", req: true, ph: "Ej: Permisos retribuidos" },
      { fila: [{ k: "categoria", l: "Categoría", t: "select", lista: "convenio" }, { k: "articulo", l: "Artículo", t: "text", opc: true, ph: "Ej: Art. 24" }] },
      { k: "resumen", l: "Resumen en una frase", t: "text", opc: true, ph: "Se ve sin abrir el apartado" },
      { k: "contenido", l: "Explicación completa", t: "textarea", formato: true },
      { k: "orden", l: "Posición en la lista", t: "number", ayuda: "1 sale primero, 2 después… Así ordenas los apartados." },
    ],
    previa: (x) => apartadoHTML(x, "", true),
    extracto: (x) => x.resumen || x.contenido, chips: (x) => [x.categoria, x.articulo, "Posición " + x.orden], fechas: (x) => [null, x.actualizado],
  },
  actas: {
    nombre: "Actas", icono: "actas", tabla: "actas", orden: ["fecha", false], uno: "acta", nuevo: "Nueva acta", lista: "acta", campoColor: "tipo", asistente: true,
    intro: "Resumen y acuerdos de cada reunión. Puedes usar el asistente para redactarla a partir de tus notas.",
    campos: [
      { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Reunión ordinaria del comité" },
      { fila: [{ k: "tipo", l: "Tipo de reunión", t: "select", lista: "acta" }, { k: "fecha", l: "Fecha de la reunión", t: "date", req: true }] },
      { k: "resumen", l: "Resumen", t: "textarea", opc: true, corto: true, ayuda: "De qué se habló, en pocas líneas." },
      { k: "acuerdos", l: "Acuerdos", t: "textarea", opc: true, formato: true, ayuda: "Mejor en lista: una línea por acuerdo empezando con «- »." },
      { k: "adjuntos", l: "Acta completa y otros archivos", t: "archivos", opc: true },
      { checks: [{ k: "notificar", l: "Avisar en los móviles y en el canal de Telegram", def: true, soloNuevo: true }] },
    ],
    previa: (x) => actaHTML(x),
    extracto: (x) => x.resumen, chips: (x) => [x.fecha && fechaLarga(x.fecha + "T12:00:00"), x.tipo], fechas: (x) => [x.creado, x.actualizado],
  },
  documentos: {
    nombre: "Documentos", icono: "carpeta", tabla: "documentos", orden: ["fecha", false], uno: "documento", nuevo: "Subir documento", lista: "documento", campoColor: "categoria",
    intro: "Convenio en PDF, tablas salariales, calendario laboral, formularios… Salen en la sección Documentos.",
    campos: [
      { k: "archivo", l: "Archivo", t: "archivo", req: true },
      { k: "titulo", l: "Nombre del documento", t: "text", req: true, ph: "Ej: Convenio colectivo 2025-2027" },
      { k: "categoria", l: "Categoría", t: "select", lista: "documento" },
      { k: "descripcion", l: "Descripción", t: "textarea", opc: true, corto: true, ayuda: "Una frase para saber qué es. Ej: Tablas vigentes desde enero." },
      { checks: [{ k: "notificar", l: "Avisar en los móviles y en el canal de Telegram", def: true, soloNuevo: true }] },
    ],
    previa: (x) => docHTML(x),
    extracto: (x) => x.descripcion || x.nombre_archivo, chips: (x) => [x.categoria, tipoArchivo(x.tipo_archivo, x.nombre_archivo).txt, tamanoTxt(x.tamano)], fechas: (x) => [x.fecha, x.actualizado],
  },
  preguntas: {
    nombre: "Preguntas", icono: "pregunta", tabla: "preguntas", orden: ["orden", true], uno: "pregunta", nuevo: "Nueva pregunta", lista: "pregunta", campoColor: "categoria",
    intro: "Las dudas más comunes de la plantilla, con su respuesta. Salen en «Preguntas frecuentes».",
    campos: [
      { k: "pregunta", l: "Pregunta", t: "text", req: true, ph: "Ej: ¿Cuántos días tengo por mudanza?" },
      { k: "categoria", l: "Categoría", t: "select", lista: "pregunta" },
      { k: "respuesta", l: "Respuesta", t: "textarea", formato: true },
      { k: "orden", l: "Posición en la lista", t: "number", ayuda: "1 sale primero, 2 después…" },
    ],
    previa: (x) => preguntaHTML(x, "", true),
    tituloDe: (x) => x.pregunta,
    extracto: (x) => x.respuesta, chips: (x) => [x.categoria, "Posición " + x.orden], fechas: (x) => [x.creado, x.actualizado],
  },
  plantillas: {
    nombre: "Plantillas", icono: "plantilla", tabla: "plantillas", orden: ["orden", true], uno: "plantilla", nuevo: "Nueva plantilla", lista: "aviso", campoColor: "categoria",
    intro: "Avisos que se repiten, ya escritos. Al crear un aviso nuevo puedes empezar desde una plantilla. Usa [corchetes] para lo que hay que rellenar.",
    campos: [
      { k: "titulo", l: "Nombre de la plantilla (será el título del aviso)", t: "text", req: true, ph: "Ej: Convocatoria de asamblea" },
      { k: "categoria", l: "Categoría del aviso", t: "select", lista: "aviso" },
      { k: "contenido", l: "Texto", t: "textarea", formato: true, ayuda: "Pon entre [corchetes] lo que cambia cada vez: [día], [hora], [lugar]…" },
      { k: "orden", l: "Posición en la lista", t: "number" },
    ],
    previa: (x) => tarjetaAviso({ ...x, id: 0 }),
    extracto: (x) => x.contenido, chips: (x) => [x.categoria], fechas: (x) => [null, x.actualizado],
  },
};
const PAGINAS = {
  resumen: { nombre: "Inicio", icono: "resumen" },
  ...Object.fromEntries(Object.entries(SECCIONES).map(([k, s]) => [k, { nombre: s.nombre, icono: s.icono }])),
  textos: { nombre: "Textos", icono: "texto" },
  ajustes: { nombre: "Ajustes", icono: "ajustes" },
};
const EN_MOVIL = ["resumen", "avisos", "calendario", "actas"];
let actual = "resumen", datos = {};

// ---------- Sesión ----------
let iniciado = false;
const mostrar = (s) => { ["s-login", "s-recuperar", "s-panel"].forEach(x => $(x).classList.toggle("oculto", x !== s)); document.body.classList.toggle("sin-nav", s !== "s-panel"); };
sb.auth.onAuthStateChange((ev, ses) => {
  if (ev === "PASSWORD_RECOVERY") return mostrar("s-recuperar");
  if (!ses) { iniciado = false; return mostrar("s-login"); }
  // Supabase avisa de nuevo al volver a la pestaña o al refrescar la sesión: el panel solo se monta una vez,
  // así no se pierde lo que se está escribiendo ni los archivos elegidos.
  if (iniciado) return;
  iniciado = true; window.MI_EMAIL = ses.user.email;
  setTimeout(iniciar, 0);
});
async function iniciar() {
  mostrar("s-panel");
  const { data } = await sb.rpc("is_admin");
  window.ES_ADMIN = !!data;
  await cargarOpciones();
  pintaNav();
  const h = location.hash.slice(1);
  abrir(PAGINAS[h] ? h : "resumen");
}
$("b-entrar").onclick = async () => {
  msg("m-login", "Entrando…", true);
  const { error } = await sb.auth.signInWithPassword({ email: $("email").value.trim(), password: $("pass").value });
  if (error) msg("m-login", /confirm/i.test(error.message) ? "Falta confirmar la cuenta: abre el email que te ha llegado y pulsa el enlace." : "Email o contraseña incorrectos.");
};
$("pass").onkeydown = (e) => { if (e.key === "Enter") $("b-entrar").click(); };
$("b-registro").onclick = async () => {
  if ($("pass").value.length < 8) return msg("m-login", "Escribe arriba una contraseña de al menos 8 caracteres y vuelve a pulsar.");
  const { error } = await sb.auth.signUp({ email: $("email").value.trim(), password: $("pass").value, options: { emailRedirectTo: aqui } });
  error ? msg("m-login", error.message) : msg("m-login", "Cuenta creada. Abre el email de confirmación, pulsa el enlace y luego entra aquí.", true);
};
$("b-olvido").onclick = async () => {
  const { error } = await sb.auth.resetPasswordForEmail($("email").value.trim(), { redirectTo: aqui });
  error ? msg("m-login", error.message) : msg("m-login", "Te hemos enviado un email para cambiar la contraseña.", true);
};
$("b-nueva").onclick = async () => {
  if ($("nueva").value.length < 8) return msg("m-rec", "Mínimo 8 caracteres.");
  const { error } = await sb.auth.updateUser({ password: $("nueva").value });
  error ? msg("m-rec", error.message) : (msg("m-rec", "Contraseña guardada.", true), setTimeout(() => location.replace(aqui), 1200));
};
const salir = async () => { if (await confirmarSalida()) { await sb.auth.signOut(); location.replace(aqui); } };

// ---------- Navegación ----------
function pintaNav() {
  const b = (k, extra = "") => `<button data-p="${k}" class="${k === actual ? "activa" : ""} ${extra}">${icono(PAGINAS[k].icono)}${PAGINAS[k].nombre}</button>`;
  $("nav-admin").innerHTML =
    Object.keys(PAGINAS).map(k => b(k, EN_MOVIL.includes(k) ? "" : "solo-pc")).join("") +
    `<button class="solo-movil ${EN_MOVIL.includes(actual) ? "" : "activa"}" id="b-mas">${icono("menu")}Más</button>
     <div class="sep solo-pc"></div>
     <div class="quien">${esc(window.MI_EMAIL || "")}<br>Versión ${VERSION_WEB}</div>
     ${INSTALADA_A() ? "" : `<button class="solo-pc" id="b-instalar-pc">${icono("descargar")}Instalar la app</button>`}
     <button class="solo-pc" id="b-salir">${icono("salir")}Salir</button>`;
  $("nav-admin").querySelectorAll("[data-p]").forEach(x => x.onclick = () => abrir(x.dataset.p));
  $("b-mas").onclick = abrirMas;
  $("b-salir").onclick = salir;
  if ($("b-instalar-pc")) $("b-instalar-pc").onclick = instalarApp;
}
function abrirMas() {
  $("hoja-mas").innerHTML = Object.keys(PAGINAS).filter(k => !EN_MOVIL.includes(k)).map(k =>
    `<button data-p="${k}">${icono(PAGINAS[k].icono)}${PAGINAS[k].nombre}</button>`).join("") +
    (INSTALADA_A() ? "" : `<button id="m-instalar">${icono("descargar")}Instalar la app</button>`) +
    `<a href="index.html" target="_blank">${icono("ver")}Ver la web</a><button id="m-salir">${icono("salir")}Salir (${esc(window.MI_EMAIL || "")})</button><p class="fecha-txt" style="text-align:center;margin:6px 0 0">Versión ${VERSION_WEB}</p>`;
  ["velo-mas", "hoja-mas"].forEach(i => $(i).classList.remove("oculto"));
  $("hoja-mas").querySelectorAll("[data-p]").forEach(x => x.onclick = () => { cerrarMas(); abrir(x.dataset.p); });
  $("m-salir").onclick = () => { cerrarMas(); salir(); };
  if ($("m-instalar")) $("m-instalar").onclick = () => { cerrarMas(); instalarApp(); };
}
const cerrarMas = () => ["velo-mas", "hoja-mas"].forEach(i => $(i).classList.add("oculto"));
$("velo-mas").onclick = cerrarMas;

function abrir(k) {
  actual = k; history.replaceState(null, "", "#" + k); pintaNav(); window.scrollTo(0, 0);
  $("fab").classList.toggle("oculto", !SECCIONES[k]);
  if (SECCIONES[k]) { $("fab").onclick = () => abrirEditor(k); $("fab").setAttribute("aria-label", SECCIONES[k].nuevo); }
  if (!window.ES_ADMIN) { $("zona").innerHTML = `<div class="panel vacio">${icono("alerta")}Esta cuenta (${esc(window.MI_EMAIL)}) no tiene permiso para publicar. Pide a la Sección Sindical que añada tu email en Ajustes.</div>`; return; }
  if (k === "resumen") pintaResumen();
  else if (k === "textos") pintaTextos();
  else if (k === "ajustes") pintaAjustes();
  else pintaSeccion(k);
}

// ---------- Resumen ----------
async function pintaResumen() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Hola</h1><p>¿Qué quieres publicar hoy?</p></div></div>
    <div class="rapidos">
      <button class="panel rapido" data-n="avisos"><span class="ic">${icono("avisos")}</span><span><b>Publicar un aviso</b><small>Con archivos si quieres</small></span></button>
      <button class="panel rapido ia" data-n="actas"><span class="ic">${icono("magia")}</span><span><b>Hacer un acta</b><small>Con el asistente: notas o foto</small></span></button>
      <button class="panel rapido" data-n="calendario"><span class="ic">${icono("calendario")}</span><span><b>Añadir una fecha</b><small>Asamblea, reunión…</small></span></button>
      <button class="panel rapido" data-n="documentos"><span class="ic">${icono("subir")}</span><span><b>Subir un documento</b><small>PDF, Word, Excel, fotos</small></span></button>
      <button class="panel rapido" data-n="convenio"><span class="ic">${icono("convenio")}</span><span><b>Apartado del convenio</b><small>Explicar un derecho</small></span></button>
      <button class="panel rapido" data-ir="ajustes"><span class="ic">${icono("telegram")}</span><span><b>Telegram y avisos</b><small>Canales y cartel QR</small></span></button>
    </div>
    <div id="recordatorio-copia"></div>
    <div id="banda-instalar"></div>
    <h2 class="titulo-bloque">Lo último que has publicado</h2>
    <div class="cuentas" id="cuentas"></div>
    <div class="lista-adm" id="ultimos"><p class="fecha-txt">Cargando…</p></div>`;
  $("zona").querySelectorAll("[data-n]").forEach(b => b.onclick = () => abrirEditor(b.dataset.n));
  pintaBandaInstalar();
  $("zona").querySelector("[data-ir]").onclick = () => { abrir("ajustes"); setTimeout(() => $("ajuste-canales")?.scrollIntoView({ behavior: "smooth" }), 400); };
  sb.from("paginas").select("contenido").eq("slug", "ultima_copia").maybeSingle().then(({ data }) => {
    const f = data?.contenido, dias = f ? (Date.now() - new Date(f)) / 86400000 : Infinity;
    if (dias > 30 && $("recordatorio-copia")) {
      $("recordatorio-copia").innerHTML = `<button class="panel banda aviso-copia" id="ir-copia"><span class="ic">${icono("copia")}</span><span class="txt"><b>${f ? "Hace más de un mes de la última copia" : "Todavía no has hecho ninguna copia de seguridad"}</b><p>Descárgala en un minuto desde Ajustes y guárdala en el ordenador.</p></span>${icono("der")}</button>`;
      $("ir-copia").onclick = () => { abrir("ajustes"); setTimeout(() => $("ajuste-copia")?.scrollIntoView({ behavior: "smooth" }), 400); };
    }
  });
  await Promise.all(Object.keys(SECCIONES).map(cargarDatos));
  $("cuentas").innerHTML = Object.entries(SECCIONES).map(([k, s]) => `<span class="etq">${datos[k].length} ${s.nombre.toLowerCase()}</span>`).join("");
  const todos = Object.entries(SECCIONES).flatMap(([k, s]) => datos[k].map(x => ({ k, x, f: s.fechas(x)[1] || s.fechas(x)[0] })))
    .sort((a, b) => new Date(b.f) - new Date(a.f)).slice(0, 6);
  $("ultimos").innerHTML = todos.length ? todos.map(({ k, x }) => itemHTML(k, x, true)).join("") : `<div class="panel vacio">${icono("avisos")}Todavía no has publicado nada.</div>`;
  enlazarItems($("ultimos"));
}

// ---------- Listas ----------
async function cargarDatos(k) {
  const s = SECCIONES[k];
  const { data, error } = await sb.from(s.tabla).select("*").order(s.orden[0], { ascending: s.orden[1] }).order("id", { ascending: false });
  if (error) throw error;
  datos[k] = data || [];
  return datos[k];
}
function itemHTML(k, x, conSeccion) {
  const s = SECCIONES[k], [pub, act] = s.fechas(x), nAdj = (x.adjuntos || []).length;
  const chips = [conSeccion ? s.nombre : null, ...s.chips(x)].filter(Boolean);
  return `<button class="item-adm ${claseTipo(x[s.campoColor], s.lista)}" data-k="${k}" data-id="${x.id}">
    <span class="barra-color"></span>
    <span class="txt">
      <span class="tit">${esc((s.tituloDe ? s.tituloDe(x) : x.titulo) || "Sin título")}</span>
      ${s.extracto(x) ? `<span class="extracto">${esc(String(s.extracto(x)).replace(/\*\*/g, ""))}</span>` : ""}
      <span class="chips">${chips.map(c => `<span class="etq">${esc(c)}</span>`).join("")}${nAdj ? `<span class="etq adj">${icono("clip", "p")}${nAdj} archivo${nAdj > 1 ? "s" : ""}</span>` : ""}</span>
      ${fechasHTML(pub || act, act)}
    </span>
    ${icono("der", "chevron")}
  </button>`;
}
function enlazarItems(cont) {
  cont.querySelectorAll(".item-adm").forEach(b => b.onclick = () => abrirEditor(b.dataset.k, datos[b.dataset.k].find(x => x.id == b.dataset.id)));
}
async function pintaSeccion(k) {
  const s = SECCIONES[k];
  $("zona").innerHTML = `<div class="sec-cab">
      <div><h1>${s.nombre}</h1><p id="cuenta">${s.intro}</p></div>
      <button class="btn btn-nuevo" id="b-nuevo">${icono("mas", "p")}${s.nuevo}</button>
    </div>
    <div class="herramientas"><div class="buscador">${icono("buscar", "p")}<input id="buscar" type="search" placeholder="Buscar en ${s.nombre.toLowerCase()} (también fechas: 12/10, octubre…)" aria-label="Buscar"></div></div>
    ${FECHA_DE[k] ? `<div class="filtro-fechas" id="fechas-adm"></div>` : ""}
    <div class="lista-adm" id="lista"><p class="fecha-txt">Cargando…</p></div>`;
  $("b-nuevo").onclick = () => abrirEditor(k);
  try { await cargarDatos(k); } catch (e) { $("lista").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message)}</p>`; return; }
  const ff = FILTRO_ADM[k] ||= {};
  const pinta = () => {
    if (FECHA_DE[k]) pintaFechasAdm(datos[k], k, ff, pinta);
    const q = $("buscar").value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const l = datos[k].filter(x => pasaFechaAdm(ff, FECHA_DE[k]?.(x)) &&
      (!q || (JSON.stringify(x) + " " + textoFecha(FECHA_DE[k]?.(x))).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)));
    $("lista").innerHTML = l.length ? l.map(x => itemHTML(k, x)).join("") :
      `<div class="panel vacio">${icono(s.icono)}${q || ff.a || ff.m || ff.d ? "Nada coincide con la búsqueda o la fecha." : `Todavía no hay nada. Pulsa «${s.nuevo}» para empezar.`}</div>`;
    enlazarItems($("lista"));
  };
  $("buscar").oninput = pinta; pinta();
}

// ---------- Archivos ----------
async function subirArchivo(file) {
  const tipo = mimeDe(file);
  if (!tipo) throw new Error(`«${file.name}» no es de un tipo permitido.`);
  if (file.size > MAX_MB * 1048576) throw new Error(`«${file.name}» pesa más de ${MAX_MB} MB.`);
  const limpio = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80);
  const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${limpio}`;
  const { error } = await sb.storage.from("documentos").upload(ruta, file, { contentType: tipo, cacheControl: "3600" });
  if (error) throw new Error(`No se ha podido subir «${file.name}»: ${error.message}`);
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

// ---------- Editor ----------
let ED = null; // { k, orig, pendientes:[File], existentes:[adj], quitar:[url], sucio }
function campoHTML(c, v) {
  const id = "f-" + c.k, opc = c.opc ? " <small>(opcional)</small>" : "", ayuda = c.ayuda ? `<p class="ayuda">${c.ayuda}</p>` : "";
  if (c.t === "select") {
    const ops = nombres(c.lista); if (v && !ops.includes(v)) ops.push(v);
    return `<label for="${id}">${c.l}</label><select id="${id}">${ops.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
      <p class="ayuda">¿Falta una opción? Añádela en Ajustes.</p>`;
  }
  if (c.t === "textarea") return `<label for="${id}">${c.l}${opc}</label><textarea id="${id}" ${c.corto ? 'style="min-height:90px"' : ""}>${esc(v || "")}</textarea>${ayuda}${c.formato ? FORMATO : ""}`;
  if (c.t === "archivos" || c.t === "archivo") {
    const multi = c.t === "archivos";
    return `<label>${c.l}${opc}</label>
      <label class="dropzone" id="dz-${c.k}">
        ${icono("subir")}<b>${multi ? "Toca para elegir archivos" : "Toca para elegir el archivo"}</b>
        <span>${multi ? "Puedes elegir varios a la vez. " : ""}PDF, fotos, Word, Excel o PowerPoint · máx. ${MAX_MB} MB</span>
        <input type="file" id="${id}" ${multi ? "multiple" : ""} accept="${ACEPTA_ARCHIVOS}">
      </label>
      <div class="archivos" id="lista-${c.k}"></div>`;
  }
  if (c.t === "datetime-local") {
    const loc = v ? new Date(new Date(v) - new Date(v).getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "";
    return `<label for="${id}">${c.l}${opc}</label><input id="${id}" type="datetime-local" value="${loc}">${ayuda}`;
  }
  return `<label for="${id}">${c.l}${opc}</label><input id="${id}" type="${c.t}" value="${esc(v ?? "")}" ${c.ph ? `placeholder="${esc(c.ph)}"` : ""}>${ayuda}`;
}
const camposPlanos = (s) => s.campos.flatMap(c => c.fila || c.checks?.map(x => ({ ...x, t: "check" })) || [c]);

function abrirEditor(k, orig = null) {
  const s = SECCIONES[k];
  if (actual !== k && actual !== "resumen") abrir(k);
  const x = orig || {};
  ED = { k, orig, pendientes: [], existentes: orig ? (s.campos.some(c => c.t === "archivos") ? [...(orig.adjuntos || [])] : (orig.url ? [{ nombre: orig.nombre_archivo || "Archivo", url: orig.url, tipo: orig.tipo_archivo, tamano: orig.tamano }] : [])) : [], quitar: [], sucio: false };
  const def = { orden: Math.max(0, ...(datos[k] || []).map(d => d.orden || 0)) + 1, fecha: k === "calendario" ? hoyISO() : undefined };
  $("ed-modo").innerHTML = orig ? `${icono("editar", "p")}Editando ${s.uno}` : `${icono("mas", "p")}${s.nuevo}`;
  $("ed-modo").className = orig ? "editando" : "";
  $("ed-titulo").textContent = orig ? ((s.tituloDe ? s.tituloDe(orig) : orig.titulo) || "Sin título") : "Sin título todavía";
  $("ed-borrar").innerHTML = icono("borrar", "p") + "<span>Borrar</span>";
  $("ed-borrar").classList.toggle("oculto", !orig);
  $("ed-guardar").innerHTML = icono(orig ? "check" : "subir", "p") + (orig ? "Guardar cambios" : (k === "documentos" ? "Subir" : "Publicar"));
  $("ed-guardar").disabled = false; msg("ed-msg", "");

  $("ed-form").innerHTML =
    (k === "avisos" && !orig ? `<div class="desde-plantilla oculto" id="desde-plantilla">${icono("plantilla", "p")}<label for="sel-plantilla">Empezar desde una plantilla</label>
      <select id="sel-plantilla"><option value="">— En blanco —</option></select></div>` : "") +
    (s.asistente && !orig ? asistenteHTML() : "") +
    (s.asistente && !orig ? `<div class="separador">Revisa el acta y publícala</div>` : "") +
    s.campos.map(c => {
      if (c.fila) return `<div class="fila">${c.fila.map(f => `<div>${campoHTML(f, x[f.k] ?? def[f.k])}</div>`).join("")}</div>`;
      if (c.checks) { const v = c.checks.filter(ch => !(ch.soloNuevo && orig)); return v.length ? `<div class="grupo-check">${v.map(ch => `<label class="check"><input type="checkbox" id="f-${ch.k}" ${(orig ? x[ch.k] : (x[ch.k] ?? ch.def)) ? "checked" : ""}>${ch.l}</label>`).join("")}</div>` : ""; }
      return campoHTML(c, x[c.k] ?? def[c.k]);
    }).join("");

  // archivos
  s.campos.filter(c => c.t === "archivos" || c.t === "archivo").forEach(c => prepararArchivos(c));
  // cambios → vista previa
  $("ed-form").querySelectorAll("input:not([type=file]), textarea, select").forEach(el => {
    el.addEventListener("input", () => { ED.sucio = true; actualizarPrevia(); });
    el.addEventListener("change", () => { ED.sucio = true; actualizarPrevia(); });
  });
  if (s.asistente && !orig) prepararAsistente();
  if (k === "avisos" && !orig) prepararPlantillas();
  actualizarPrevia();
  cambiarPestana("form");
  ["velo-ed", "editor"].forEach(i => $(i).classList.remove("oculto"));
  document.body.style.overflow = "hidden";
  history.pushState({ editor: 1 }, "");
  setTimeout(() => (!orig && !s.asistente ? $("ed-form").querySelector("input:not([type=file]), textarea") : null)?.focus(), 50);
}

function prepararArchivos(c) {
  const input = $("f-" + c.k), dz = $("dz-" + c.k), multi = c.t === "archivos";
  const añadir = (files) => {
    const lista = [...files];
    if (!multi) { ED.pendientes = []; if (ED.existentes[0]) { ED.quitar.push(ED.existentes[0].url); ED.existentes = []; } }
    lista.slice(0, multi ? 20 : 1).forEach(f => ED.pendientes.push({ file: f, error: validarArchivo(f), vista: f.type.startsWith("image/") ? URL.createObjectURL(f) : null }));
    if (!multi && lista[0] && !$("f-titulo").value.trim()) $("f-titulo").value = lista[0].name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    ED.sucio = true; input.value = ""; pintaArchivos(c); actualizarPrevia();
  };
  input.onchange = () => añadir(input.files);
  dz.ondragover = (e) => { e.preventDefault(); dz.classList.add("encima"); };
  dz.ondragleave = () => dz.classList.remove("encima");
  dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove("encima"); añadir(e.dataTransfer.files); };
  pintaArchivos(c);
}
function pintaArchivos(c) {
  const filaHTML = (nombre, sub, ic, vista, quitar, clase = "") => `<div class="archivo-fila ${clase}">
    <span class="ic">${vista ? `<img src="${esc(vista)}" alt="">` : icono(ic, "p")}</span>
    <span class="txt"><b>${esc(nombre)}</b>${sub}</span>
    <button class="btn-ic" ${quitar} aria-label="Quitar">${icono("cerrar", "p")}</button></div>`;
  $("lista-" + c.k).innerHTML =
    ED.existentes.map((a, i) => filaHTML(a.nombre, `<small>${tipoArchivo(a.tipo, a.nombre).txt}${a.tamano ? " · " + tamanoTxt(a.tamano) : ""} · ya subido</small>`,
      tipoArchivo(a.tipo, a.nombre).ic, (a.tipo || "").startsWith("image/") ? a.url : null, `data-qe="${i}"`)).join("") +
    ED.pendientes.map((p, i) => filaHTML(p.file.name, p.error ? `<small>${esc(p.error)}</small>` : `<small class="ok">${tipoArchivo(mimeDe(p.file), p.file.name).txt} · ${tamanoTxt(p.file.size)} · listo para subir</small>`,
      tipoArchivo(mimeDe(p.file), p.file.name).ic, p.vista, `data-qp="${i}"`, p.error ? "error" : "")).join("");
  $("lista-" + c.k).querySelectorAll("[data-qe]").forEach(b => b.onclick = (e) => { e.preventDefault(); const [a] = ED.existentes.splice(+b.dataset.qe, 1); ED.quitar.push(a.url); ED.sucio = true; pintaArchivos(c); actualizarPrevia(); });
  $("lista-" + c.k).querySelectorAll("[data-qp]").forEach(b => b.onclick = (e) => { e.preventDefault(); ED.pendientes.splice(+b.dataset.qp, 1); pintaArchivos(c); actualizarPrevia(); });
}

function leerFormulario() {
  const s = SECCIONES[ED.k], fila = {};
  for (const c of camposPlanos(s)) {
    if (c.t === "archivos" || c.t === "archivo") continue;
    const el = $("f-" + c.k); if (!el) continue;
    if (c.t === "check") fila[c.k] = el.checked;
    else if (c.t === "datetime-local") fila[c.k] = el.value ? new Date(el.value).toISOString() : null;
    else if (c.t === "number") fila[c.k] = parseInt(el.value || "0", 10);
    else { const v = el.value.trim(); fila[c.k] = v || (c.opc ? null : ""); }
  }
  return fila;
}
function actualizarPrevia() {
  if (!ED) return;
  const s = SECCIONES[ED.k], f = leerFormulario(), ahora = new Date().toISOString();
  const adj = [...ED.existentes, ...ED.pendientes.filter(p => !p.error).map(p => ({ nombre: p.file.name, url: p.vista || "#", tipo: mimeDe(p.file), tamano: p.file.size }))];
  const x = { ...(ED.orig || {}), ...f, adjuntos: adj, fecha: f.fecha || ED.orig?.fecha || ahora, creado: ED.orig?.creado || ahora, actualizado: ED.orig ? ahora : null };
  if (ED.k === "documentos") { x.fecha = ED.orig?.fecha || ahora; const a = adj[0]; Object.assign(x, a ? { url: a.url, nombre_archivo: a.nombre, tipo_archivo: a.tipo, tamano: a.tamano } : {}); }
  if (ED.k === "calendario") x.fecha = f.fecha || hoyISO();
  $("ed-titulo").textContent = (s.tituloDe ? s.tituloDe(f) : f.titulo) || (ED.orig ? "Sin título" : "Sin título todavía");
  $("ed-previa").innerHTML = s.previa(x);
  $("ed-previa").querySelectorAll("a").forEach(a => a.onclick = (e) => { if (a.getAttribute("href") === "#" || a.href.startsWith("blob:")) e.preventDefault(); });
}
function cambiarPestana(p) {
  $("editor").classList.toggle("ver-previa", p === "previa");
  document.querySelectorAll(".ed-pestanas button").forEach(b => b.classList.toggle("activa", b.dataset.p === p));
}
document.querySelectorAll(".ed-pestanas button").forEach(b => b.onclick = () => cambiarPestana(b.dataset.p));

async function confirmarSalida() { return !ED || !ED.sucio || confirm("Tienes cambios sin guardar. ¿Salir sin guardar?"); }
async function cerrarEditor(desdeAtras) {
  if (!ED) return;
  if (!(await confirmarSalida())) { if (desdeAtras) history.pushState({ editor: 1 }, ""); return; }
  ED.pendientes.forEach(p => p.vista && URL.revokeObjectURL(p.vista));
  ED = null;
  ["velo-ed", "editor"].forEach(i => $(i).classList.add("oculto"));
  document.body.style.overflow = "";
  if (!desdeAtras && history.state?.editor) history.back();
}
$("ed-cerrar").onclick = () => cerrarEditor();
$("ed-cancelar").onclick = () => cerrarEditor();
$("velo-ed").onclick = () => cerrarEditor();
window.addEventListener("popstate", () => { if (ED) cerrarEditor(true); });
window.addEventListener("beforeunload", (e) => { if (ED?.sucio) { e.preventDefault(); e.returnValue = ""; } });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && ED) cerrarEditor(); });

$("ed-guardar").onclick = async () => {
  const s = SECCIONES[ED.k], btn = $("ed-guardar"), fila = leerFormulario();
  for (const c of camposPlanos(s)) {
    if (c.req && c.t !== "archivo" && c.t !== "archivos" && !fila[c.k]) { cambiarPestana("form"); $("f-" + c.k)?.focus(); return msg("ed-msg", "Falta: " + c.l.toLowerCase() + "."); }
  }
  if (["avisos"].includes(ED.k) && /\[[^\]]{1,30}\]/.test((fila.titulo || "") + (fila.contenido || "")) && !confirm("El aviso todavía tiene partes entre [corchetes] sin rellenar. ¿Publicar igualmente?")) return;
  const malos = ED.pendientes.filter(p => p.error);
  if (malos.length) { cambiarPestana("form"); return msg("ed-msg", "Quita los archivos marcados en rojo antes de guardar."); }
  if (ED.k === "documentos" && !ED.existentes.length && !ED.pendientes.length) { cambiarPestana("form"); return msg("ed-msg", "Falta elegir el archivo."); }
  btn.disabled = true;
  const subidos = [];
  try {
    for (const [i, p] of ED.pendientes.entries()) {
      msg("ed-msg", `Subiendo archivo ${i + 1} de ${ED.pendientes.length}…`, true);
      subidos.push(await subirArchivo(p.file));
    }
    msg("ed-msg", "Guardando…", true);
    const adj = [...ED.existentes, ...subidos];
    if (ED.k === "documentos") { const a = adj[0]; Object.assign(fila, { url: a.url, nombre_archivo: a.nombre, tipo_archivo: a.tipo, tamano: a.tamano || null }); }
    else if (s.campos.some(c => c.t === "archivos")) fila.adjuntos = adj;
    if (fila.publicar_en && new Date(fila.publicar_en) < new Date(Date.now() - 60000)) { if (!confirm("La fecha programada ya ha pasado. ¿Publicar ahora?")) { btn.disabled = false; return msg("ed-msg", ""); } fila.publicar_en = null; }
    const q = ED.orig ? sb.from(s.tabla).update(fila).eq("id", ED.orig.id).select("*").single() : sb.from(s.tabla).insert(fila).select("*").single();
    const { data: guardado, error } = await q;
    if (error) throw error;
    await borrarArchivos(ED.quitar);
    const editado = !!ED.orig, k = ED.k;
    ED.sucio = false; await cerrarEditor();
    abrir(actual === "resumen" ? "resumen" : k);
    if (editado) return aviso("Cambios guardados. Ya se ven en la web.");
    // Avisar a los móviles y a Telegram
    let res = null;
    if (fila.notificar !== false) {
      const r = await sb.functions.invoke("notificar", { body: { modo: "publicado", tabla: s.tabla, id: guardado.id } }).catch(() => null);
      res = r?.data || null;
    }
    trasPublicar(k, guardado, res);
  } catch (e) {
    await borrarArchivos(subidos.map(a => a.url)); // no dejar archivos sueltos si algo falla
    msg("ed-msg", e.message || "No se ha podido guardar."); btn.disabled = false;
  }
};
$("ed-borrar").onclick = async () => {
  const s = SECCIONES[ED.k], x = ED.orig;
  if (!confirm(`¿Borrar «${(s.tituloDe ? s.tituloDe(x) : x.titulo)}»? Desaparecerá de la web y no se puede deshacer.`)) return;
  const { error } = await sb.from(s.tabla).delete().eq("id", x.id);
  if (error) return msg("ed-msg", "No se ha podido borrar: " + error.message);
  await borrarArchivos([...(x.adjuntos || []).map(a => a.url), x.url, x.pdf_url]);
  ED.sucio = false; const k = ED.k; await cerrarEditor();
  aviso("Borrado."); abrir(actual === "resumen" ? "resumen" : k);
};

// ---------- Asistente de actas (a partir de fotos y archivos) ----------
let IA_ARCHIVOS = [];
const IA_MAX = 6;
function asistenteHTML() {
  return `<div class="asistente">
    <h3>${icono("magia", "p")}Hacer el acta con el asistente</h3>
    <p class="ayuda">Haz una <b>foto de tus notas</b> (aunque sean a mano) o sube el <b>PDF o Word</b> de la reunión. El asistente rellena el acta de abajo y tú la revisas antes de publicar.</p>
    <div class="ia-botones">
      <label class="ia-boton">${icono("camara")}<b>Hacer foto</b><span>con la cámara</span>
        <input type="file" id="f-ia-cam" accept="image/*" capture="environment"></label>
      <label class="ia-boton">${icono("subir")}<b>Elegir archivos</b><span>fotos, PDF, Word</span>
        <input type="file" id="f-ia" multiple accept="image/*,application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"></label>
    </div>
    <div class="archivos" id="lista-ia"></div>
    <details class="nota-ia"><summary>Añadir una nota escrita (opcional)</summary>
      <textarea id="notas-ia" placeholder="Algo que no esté en los archivos: quién asistió, la fecha…"></textarea></details>
    <p class="ayuda"><b>Importante:</b> los archivos se envían a la IA gratuita de Google (Gemini), que puede usarlos para mejorar sus productos. Evita fotos con datos personales de compañeros o información confidencial de la empresa.</p>
    <div class="botones" style="margin-top:12px"><button class="btn azul" id="b-ia" disabled>${icono("magia", "p")}Generar acta</button></div>
    <div class="msg" id="m-ia"></div>
  </div>`;
}
function prepararAsistente() {
  IA_ARCHIVOS = [];
  const pinta = () => {
    $("lista-ia").innerHTML = IA_ARCHIVOS.map((f, i) => {
      const t = tipoArchivo(mimeDe(f), f.name), img = mimeDe(f).startsWith("image/");
      return `<div class="archivo-fila"><span class="ic">${img ? `<img src="${URL.createObjectURL(f)}" alt="">` : icono(t.ic, "p")}</span>
        <span class="txt"><b>${esc(f.name)}</b><small class="ok">${t.txt} · ${tamanoTxt(f.size)} · listo</small></span>
        <button class="btn-ic" data-q="${i}" aria-label="Quitar">${icono("cerrar", "p")}</button></div>`;
    }).join("");
    $("lista-ia").querySelectorAll("[data-q]").forEach(b => b.onclick = (e) => { e.preventDefault(); IA_ARCHIVOS.splice(+b.dataset.q, 1); pinta(); });
    $("b-ia").disabled = !IA_ARCHIVOS.length && $("notas-ia").value.trim().length < 20;
  };
  const añadir = (files) => {
    const malos = [];
    for (const f of files) {
      const t = mimeDe(f), ext = extDe(f.name);
      const vale = t.startsWith("image/") || t === "application/pdf" || ext === "docx" || ext === "txt";
      if (!vale) { malos.push(f.name); continue; }
      if (IA_ARCHIVOS.length >= IA_MAX) { malos.push(f.name + " (máximo " + IA_MAX + ")"); continue; }
      IA_ARCHIVOS.push(f);
    }
    msg("m-ia", malos.length ? "No se pueden usar: " + malos.join(", ") + ". Usa fotos, PDF o Word (.docx)." : "", !malos.length);
    $("f-ia").value = ""; $("f-ia-cam").value = ""; pinta();
  };
  $("f-ia").onchange = () => añadir($("f-ia").files);
  $("f-ia-cam").onchange = () => añadir($("f-ia-cam").files);
  $("notas-ia").oninput = pinta;
  const zona = $("ed-form").querySelector(".asistente");
  zona.ondragover = (e) => { e.preventDefault(); zona.classList.add("encima"); };
  zona.ondragleave = () => zona.classList.remove("encima");
  zona.ondrop = (e) => { e.preventDefault(); zona.classList.remove("encima"); añadir(e.dataTransfer.files); };
  $("b-ia").onclick = generarActa;
}
// Reduce las fotos para que pesen poco (la IA las lee igual de bien)
async function aBase64(f) {
  const t = mimeDe(f);
  if (t.startsWith("image/")) {
    try {
      const img = await createImageBitmap(f), max = 2000, r = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      return { mime: "image/jpeg", data: cv.toDataURL("image/jpeg", 0.85).split(",")[1], nombre: f.name };
    } catch (_) { /* formato que el navegador no sabe abrir (p. ej. HEIC): se envía tal cual */ }
  }
  if (f.size > 12 * 1048576) throw new Error(`«${f.name}» es demasiado grande para el asistente (máx. 12 MB).`);
  const data = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = mal; r.readAsDataURL(f); });
  return { mime: t, data, nombre: f.name };
}
// Saca el texto de un Word (.docx) en el propio navegador
async function textoDeWord(f) {
  if (!window.JSZip) await new Promise((ok, mal) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; sc.onload = ok; sc.onerror = () => mal(new Error("No se ha podido abrir el Word. Guárdalo como PDF y súbelo otra vez.")); document.head.appendChild(sc); });
  const zip = await JSZip.loadAsync(f), xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error(`«${f.name}» no parece un Word válido.`);
  return xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
}
async function generarActa() {
  const btn = $("b-ia");
  let notas = $("notas-ia").value.trim();
  if (notas.length < 20 && !IA_ARCHIVOS.length) return msg("m-ia", "Añade una foto o un archivo con las notas de la reunión.");
  btn.disabled = true;
  try {
    msg("m-ia", "Preparando los archivos…", true);
    const archivos = [];
    for (const f of IA_ARCHIVOS) {
      const ext = extDe(f.name);
      if (ext === "docx") notas += `\n\nContenido del documento «${f.name}»:\n` + (await textoDeWord(f)).slice(0, 25000);
      else if (ext === "txt") notas += `\n\nContenido de «${f.name}»:\n` + (await f.text()).slice(0, 25000);
      else archivos.push(await aBase64(f));
    }
    msg("m-ia", "Leyendo las notas y redactando el acta… (puede tardar unos segundos)", true);
    const { data, error } = await sb.functions.invoke("generar-acta", { body: { notas: notas.trim(), tipos: nombres("acta"), hoy: hoyISO(), archivos } });
    if (error) { let m = "No se ha podido generar el acta."; try { m = (await error.context.json()).error || m; } catch (_) {} throw new Error(m); }
    const a = data.acta;
    $("f-titulo").value = a.titulo || "";
    const sel = $("f-tipo");
    if (a.tipo && ![...sel.options].some(o => o.value === a.tipo)) sel.add(new Option(a.tipo, a.tipo));
    if (a.tipo) sel.value = a.tipo;
    if (a.fecha) $("f-fecha").value = a.fecha;
    $("f-resumen").value = a.resumen || "";
    $("f-acuerdos").value = a.acuerdos || "";
    ED.sucio = true; actualizarPrevia();
    const falta = [!a.fecha && "pon la fecha de la reunión", a.avisos].filter(Boolean).join(". ");
    msg("m-ia", "Hecho. Revisa el acta abajo" + (falta ? " (ojo: " + falta + ")" : "") + " y pulsa «Publicar».", true);
    $("f-titulo").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (e) { msg("m-ia", e.message); }
  btn.disabled = false;
}

// ---------- Textos ----------
const TEXTOS = [
  { slug: "inicio", l: "Bienvenida (Inicio)", ayuda: "Sale debajo de «Hola, compañero/a»." },
  { slug: "convenio", l: "Introducción del convenio", ayuda: "Sale arriba de los apartados: qué convenio es, vigencia, etc." },
  { slug: "quienes", l: "Quiénes somos" },
  { slug: "contacto", l: "Contacto", ayuda: "Email, teléfono, horario, delegados…" },
];
async function pintaTextos() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Textos</h1><p>Los textos fijos de la web, que cambian poco.</p></div></div><div id="textos"><p class="fecha-txt">Cargando…</p></div>`;
  const { data } = await sb.from("paginas").select("*");
  const p = Object.fromEntries((data || []).map(x => [x.slug, x]));
  $("textos").innerHTML = `<div class="panel tarjeta-ajuste" style="max-width:780px">
    ${TEXTOS.map(t => `<label for="t-${t.slug}">${t.l}</label><textarea id="t-${t.slug}" style="min-height:100px">${esc(p[t.slug]?.contenido || "")}</textarea>
      <p class="ayuda">${t.ayuda ? t.ayuda + " " : ""}${p[t.slug]?.actualizado ? "Cambiado " + haceTxt(p[t.slug].actualizado) + "." : ""}</p>`).join("")}
    ${FORMATO}
    <div class="botones"><button class="btn" id="b-textos">${icono("check", "p")}Guardar textos</button></div>
    <div class="msg" id="m-textos"></div></div>`;
  $("b-textos").onclick = async () => {
    const filas = TEXTOS.map(t => ({ slug: t.slug, contenido: $("t-" + t.slug).value, actualizado: new Date().toISOString() }));
    const { error } = await sb.from("paginas").upsert(filas);
    error ? msg("m-textos", "No se ha podido guardar: " + error.message) : aviso("Textos guardados. Ya se ven en la web.");
  };
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
async function pintaAjustes() {
  await cargarOpciones();
  const todas = window.OPC_FILAS || [];
  filasLista = {};
  Object.keys(LISTAS).forEach(k => filasLista[k] = todas.filter(o => o.lista === k).map(o => ({ ...o, original: o.nombre })));
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Ajustes</h1><p>Canales y avisos, copia de seguridad, archivo, filtros de cada sección y quién puede publicar. Versión ${VERSION_WEB}.</p></div></div>
  <nav class="indice-ajustes">
    <a href="#ajuste-canales">${icono("telegram", "p")}Telegram y WhatsApp</a>
    <a href="#ajuste-copia">${icono("copia", "p")}Copia de seguridad</a>
    <a href="#ajuste-archivo">${icono("archivo2", "p")}Archivo</a>
    <a href="#ajuste-admins">${icono("admin", "p")}Quién publica</a>
    <a href="#ajuste-listas">${icono("filtro", "p")}Filtros y categorías</a>
  </nav>
  <div class="rejilla-ajustes">
    <div class="panel tarjeta-ajuste" id="ajuste-canales">
      <h2>Avisos y canales</h2>
      <div class="estado-canales" id="estado-canales"><p class="fecha-txt">Comprobando…</p></div>
      <h3 class="sub-ajuste">${icono("telegram", "p")}Canal de Telegram (automático)</h3>
      <div id="tg-zona"></div>
      <h3 class="sub-ajuste">${icono("whatsapp", "p")}Canal o grupo de WhatsApp</h3>
      <p class="ayuda">WhatsApp no permite publicar automáticamente. Al publicar algo, el panel te dará un botón para enviarlo con un toque. Si tenéis un <b>canal o grupo con enlace de invitación</b>, pégalo aquí y saldrá un botón «Unirse» en la web.</p>
      <div class="fila-op nueva" style="grid-template-columns:1fr auto;border:0;padding-top:0">
        <input id="wa-enlace" type="url" placeholder="https://whatsapp.com/channel/…  o  https://chat.whatsapp.com/…" aria-label="Enlace de WhatsApp">
        <button class="btn sec peq" id="b-wa">${icono("check", "p")}Guardar</button></div>
      <div class="msg" id="m-wa"></div>
      <h3 class="sub-ajuste">${icono("qr", "p")}Cartel para el tablón</h3>
      <p class="ayuda">Un cartel A4 con código QR para instalar la app${" "}(y el de Telegram, si está conectado).</p>
      <div class="botones" style="margin-top:8px"><a class="btn sec" href="cartel.html" target="_blank">${icono("qr", "p")}Abrir el cartel para imprimir</a></div>
    </div>
    <div class="panel tarjeta-ajuste" id="ajuste-copia">
      <h2>Copia de seguridad</h2>
      <p class="ayuda">El plan gratuito no guarda copias. Descarga una al mes y guárdala en el ordenador o en el Drive: tiene todos los avisos, actas, convenio, calendario, preguntas y textos${" "}(y, si quieres, también los archivos).</p>
      <p class="ayuda" id="ultima-copia"></p>
      <div class="botones" style="margin-top:10px">
        <button class="btn" id="b-copia-todo">${icono("copia", "p")}Descargar copia con archivos</button>
        <button class="btn sec" id="b-copia-datos">${icono("descargar", "p")}Solo los textos</button></div>
      <div class="msg" id="m-copia"></div>
    </div>
    <div class="panel tarjeta-ajuste" id="ajuste-archivo">
      <h2>Archivo de avisos</h2>
      <p class="ayuda">Los avisos antiguos pasan a la pestaña «Archivo» de la web para que la lista no se llene. Los fijados nunca se archivan.</p>
      <label for="meses-archivo">Archivar los avisos de hace más de…</label>
      <select id="meses-archivo">${[[1, "1 mes"], [2, "2 meses"], [3, "3 meses"], [6, "6 meses"], [12, "1 año"], [0, "Nunca"]].map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>
      <div class="msg" id="m-archivo"></div>
    </div>
    <div class="panel tarjeta-ajuste" id="ajuste-admins">
      <h2>Quién puede publicar</h2>
      <p class="ayuda">Añade el email de otro delegado. Después, esa persona entra en esta página y pulsa «Primera vez: crear la cuenta».</p>
      <div id="lista-admins" style="margin-top:12px"><p class="fecha-txt">Cargando…</p></div>
      <div class="fila-op nueva" style="grid-template-columns:1fr auto">
        <input id="nuevo-admin" type="email" placeholder="email@ejemplo.com" aria-label="Email del nuevo delegado">
        <button class="btn sec peq" id="b-admin">${icono("mas", "p")}Añadir</button></div>
      <div class="msg" id="m-admins"></div>
    </div>
  </div>
  <h2 class="titulo-bloque" id="ajuste-listas">Filtros y categorías de cada sección</h2>
  <div class="rejilla-ajustes">${Object.entries(LISTAS).map(([k, L]) => `
      <div class="panel tarjeta-ajuste">
        <h2>${L.l}</h2><p class="ayuda">${L.ayuda} Si cambias un nombre, se cambia también en todo lo ya publicado.</p>
        <div id="lst-${k}" style="margin-top:12px"></div>
        <div class="fila-op nueva">${selColor("gris", `nc-${k}`)}<input id="nn-${k}" placeholder="Nueva opción" aria-label="Nueva opción">
          <button class="btn sec peq" data-anadir="${k}">${icono("mas", "p")}Añadir</button></div>
        <div class="botones"><button class="btn" data-guardar="${k}">${icono("check", "p")}Guardar cambios</button></div>
        <div class="msg" id="m-${k}"></div>
      </div>`).join("")}</div>`;
  document.querySelectorAll(".indice-ajustes a").forEach(l => l.onclick = (e) => { e.preventDefault(); $(l.getAttribute("href").slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }); });
  Object.keys(LISTAS).forEach(pintaLista);
  document.querySelectorAll("[data-anadir]").forEach(b => b.onclick = () => {
    const k = b.dataset.anadir, n = $("nn-" + k).value.trim();
    if (!n) return msg("m-" + k, "Escribe el nombre de la nueva opción.");
    if (filasLista[k].some(o => !o.borrar && o.nombre.toLowerCase() === n.toLowerCase())) return msg("m-" + k, "Esa opción ya existe.");
    filasLista[k].push({ lista: k, nombre: n, color: $("nc-" + k).value, nuevo: true });
    $("nn-" + k).value = ""; pintaLista(k); msg("m-" + k, "Añadida. Pulsa «Guardar cambios» para que se guarde.", true);
  });
  document.querySelectorAll("[data-guardar]").forEach(b => b.onclick = () => guardarLista(b.dataset.guardar));
  document.querySelectorAll("[id^=nn-]").forEach(i => i.onkeydown = (e) => { if (e.key === "Enter") document.querySelector(`[data-anadir="${i.id.slice(3)}"]`).click(); });
  cargarAdmins(); cargarCanales(); prepararCopiaYArchivo();
}
function selColor(v, id) {
  return `<select ${id ? `id="${id}"` : ""} class="sel-color c-${v}" aria-label="Color" onchange="this.className='sel-color c-'+this.value">
    ${Object.entries(COLORES).map(([c, n]) => `<option value="${c}" ${c === v ? "selected" : ""}>${n}</option>`).join("")}</select>`;
}
function pintaLista(k) {
  const l = filasLista[k].filter(o => !o.borrar);
  $("lst-" + k).innerHTML = l.length ? l.map((o, i) => `<div class="fila-op" data-i="${filasLista[k].indexOf(o)}">
      ${selColor(o.color)}<input value="${esc(o.nombre)}" aria-label="Nombre">
      <div class="acc">
        <button class="btn sec peq" data-mov="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">${icono("arriba", "p")}</button>
        <button class="btn sec peq" data-mov="1" ${i === l.length - 1 ? "disabled" : ""} aria-label="Bajar">${icono("abajo", "p")}</button>
        <button class="btn peligro peq" data-quitar aria-label="Quitar">${icono("borrar", "p")}</button>
      </div></div>`).join("") : `<p class="fecha-txt">No hay opciones. Añade la primera abajo.</p>`;
  $("lst-" + k).querySelectorAll(".fila-op").forEach(f => {
    const o = filasLista[k][f.dataset.i];
    f.querySelector("select").onchange = (e) => { o.color = e.target.value; e.target.className = "sel-color c-" + o.color; };
    f.querySelector("input").oninput = (e) => { o.nombre = e.target.value; };
    f.querySelectorAll("[data-mov]").forEach(b => b.onclick = () => {
      const vis = filasLista[k].filter(x => !x.borrar), i = vis.indexOf(o), j = i + +b.dataset.mov;
      const a = filasLista[k].indexOf(vis[i]), c = filasLista[k].indexOf(vis[j]);
      [filasLista[k][a], filasLista[k][c]] = [filasLista[k][c], filasLista[k][a]]; pintaLista(k);
    });
    f.querySelector("[data-quitar]").onclick = () => { o.borrar = true; pintaLista(k); msg("m-" + k, "Quitada. Pulsa «Guardar cambios» para confirmar.", true); };
  });
}
async function guardarLista(k) {
  const L = LISTAS[k], filas = filasLista[k], vis = filas.filter(o => !o.borrar);
  if (vis.some(o => !o.nombre.trim())) return msg("m-" + k, "Hay una opción sin nombre.");
  const nv = vis.map(o => o.nombre.trim().toLowerCase());
  if (new Set(nv).size !== nv.length) return msg("m-" + k, "Hay dos opciones con el mismo nombre.");
  msg("m-" + k, "Guardando…", true);
  try {
    for (const o of filas.filter(o => o.borrar && !o.nuevo)) {
      const { count } = await sb.from(L.tabla).select("id", { count: "exact", head: true }).eq(L.col, o.original);
      if (count && !confirm(`«${o.original}» se usa en ${count} elemento(s) publicado(s). Se quedarán con ese nombre, pero ya no saldrá en la lista. ¿Quitarla?`)) continue;
      const r = await sb.from("opciones").delete().eq("id", o.id); if (r.error) throw r.error;
    }
    for (const o of vis.filter(o => !o.nuevo && o.nombre.trim() !== o.original)) {
      const r = await sb.from("opciones").update({ nombre: "~" + o.id + "~" }).eq("id", o.id); if (r.error) throw r.error;
    }
    for (const [i, o] of vis.entries()) {
      const nombre = o.nombre.trim(), fila = { lista: k, nombre, color: o.color, orden: i + 1 };
      if (o.nuevo) { const r = await sb.from("opciones").insert(fila); if (r.error) throw r.error; }
      else {
        const r = await sb.from("opciones").update(fila).eq("id", o.id); if (r.error) throw r.error;
        if (nombre !== o.original) { const r2 = await sb.from(L.tabla).update({ [L.col]: nombre }).eq(L.col, o.original); if (r2.error) throw r2.error; }
      }
    }
    await pintaAjustes(); aviso("Guardado. Ya se ve en la web.");
  } catch (e) { msg("m-" + k, "No se ha podido guardar: " + e.message); }
}
async function cargarAdmins() {
  const { data, error } = await sb.from("admins").select("email").order("email");
  if (error) { $("lista-admins").innerHTML = `<p class="msg err">${esc(error.message)}</p>`; return; }
  const yo = (window.MI_EMAIL || "").toLowerCase();
  $("lista-admins").innerHTML = data.map(a => `<div class="panel item"><div class="txt"><b>${esc(a.email)}</b>${a.email.toLowerCase() === yo ? '<span class="etq">Tú</span>' : ""}</div>
      ${a.email.toLowerCase() === yo ? "" : `<button class="btn peligro peq" data-email="${esc(a.email)}" aria-label="Quitar permiso">${icono("borrar", "p")}</button>`}</div>`).join("");
  $("lista-admins").querySelectorAll("[data-email]").forEach(b => b.onclick = async () => {
    if (!confirm(`¿Quitar el permiso de publicar a ${b.dataset.email}?`)) return;
    const { error } = await sb.from("admins").delete().eq("email", b.dataset.email);
    error ? msg("m-admins", error.message) : (aviso("Permiso quitado."), cargarAdmins());
  });
  $("b-admin").onclick = async () => {
    const e = $("nuevo-admin").value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return msg("m-admins", "Escribe un email válido.");
    const { error } = await sb.from("admins").insert({ email: e });
    if (error) return msg("m-admins", /duplicate/i.test(error.message) ? "Ese email ya tiene permiso." : error.message);
    $("nuevo-admin").value = ""; aviso("Añadido. Ya puede crear su cuenta en esta página."); cargarAdmins();
  };
}

// ---------- Tras publicar: resumen de avisos y botón de WhatsApp ----------
function modalAdm(titulo, html) {
  const v = document.createElement("div"); v.className = "modal-velo";
  v.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>${titulo}</h2>${html}<div class="botones"><button class="btn sec" data-cerrar>Cerrar</button></div></div>`;
  v.onclick = (e) => { if (e.target === v || e.target.closest("[data-cerrar]")) v.remove(); };
  document.body.appendChild(v); return v;
}
function textoDe(k, x) {
  if (k === "avisos") return textoCompartir((x.urgente ? "URGENTE: " : "") + x.titulo, x.contenido, "aviso-" + x.id);
  if (k === "actas") return textoCompartir("Nueva acta: " + x.titulo, x.resumen || "", "actas");
  if (k === "documentos") return textoCompartir("Nuevo documento: " + x.titulo, x.descripcion || "Ya disponible en la web.", "documentos");
  if (k === "calendario") return textoCompartir(x.titulo, fechaDia(x.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) + (x.hora ? ", " + x.hora : "") + (x.lugar ? " · " + x.lugar : ""), "calendario");
  return textoCompartir(x.titulo, "", "");
}
function trasPublicar(k, x, res) {
  if (k === "convenio") return aviso("Publicado. Ya se ve en la web.");
  const programado = x.publicar_en && new Date(x.publicar_en) > new Date();
  const lineas = [];
  if (programado) lineas.push(`${icono("reloj", "p")} Se publicará el <b>${new Date(x.publicar_en).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</b>, y entonces se avisará.`);
  else if (x.notificar === false) lineas.push("Publicado sin avisar a los móviles.");
  else if (res?.enviado) {
    lineas.push(`${icono("campana", "p")} Avisados <b>${res.push.ok}</b> móvil${res.push.ok === 1 ? "" : "es"}.`);
    lineas.push(res.telegram?.configurado ? (res.telegram.ok ? `${icono("telegram", "p")} Publicado en el canal de Telegram.` : `${icono("alerta", "p")} No se ha podido publicar en Telegram: ${esc(res.telegram.error || "")}`) : `${icono("telegram", "p")} Telegram no está conectado (puedes hacerlo en Ajustes).`);
  } else lineas.push("Publicado. Los avisos se enviarán en unos minutos.");
  const texto = textoDe(k, x);
  const v = modalAdm(programado ? "Programado" : "Publicado", `<div class="lineas-res">${lineas.map(l => `<p>${l}</p>`).join("")}</div>
    <p style="margin-top:14px"><b>${programado ? "Cuando se publique, envíalo" : "Envíalo también"} por WhatsApp</b> a tu grupo o canal:</p>
    <div class="botones" style="justify-content:flex-start;margin-top:8px">
      <a class="btn wa-btn" href="${enlaceWhatsApp(texto)}" target="_blank" rel="noopener">${icono("whatsapp", "p")}Enviar por WhatsApp</a>
      <button class="btn sec" data-copiar>${icono("texto", "p")}Copiar texto</button></div>`);
  v.querySelector("[data-copiar]").onclick = async (e) => { try { await navigator.clipboard.writeText(texto); e.target.closest("button").innerHTML = icono("check", "p") + "Copiado"; } catch (_) { prompt("Copia el texto:", texto); } };
}

// ---------- Avisos y canales ----------
async function cargarCanales() {
  const [{ data: est }, { data: pags }] = await Promise.all([
    sb.functions.invoke("notificar", { body: { modo: "estado" } }).catch(() => ({ data: null })),
    sb.from("paginas").select("slug, contenido").in("slug", ["telegram", "whatsapp"]),
  ]);
  const p = Object.fromEntries((pags || []).map(x => [x.slug, x.contenido]));
  $("wa-enlace").value = p.whatsapp || "";
  $("estado-canales").innerHTML = est ? `<div class="cuentas" style="margin:0">
      <span class="etq ${est.suscritos ? "nuevo" : ""}">${icono("campana", "p")}${est.suscritos} móvil${est.suscritos === 1 ? "" : "es"} con avisos activados</span>
      <span class="etq ${est.telegram ? "nuevo" : ""}">${icono("telegram", "p")}Telegram: ${est.telegram ? "conectado (" + esc(est.telegram_canal) + ")" : "sin conectar"}</span></div>
      <div class="botones" style="margin-top:10px"><button class="btn sec peq" id="b-prueba">${icono("campana", "p")}Enviar un aviso de prueba</button></div>`
    : `<p class="msg err">No se ha podido comprobar el estado de los avisos.</p>`;
  if ($("b-prueba")) $("b-prueba").onclick = async () => {
    const { data, error } = await sb.functions.invoke("notificar", { body: { modo: "prueba" } });
    if (error || !data) return aviso("No se ha podido enviar la prueba.", true);
    aviso(`Prueba enviada a ${data.push.ok} móvil(es)` + (data.telegram.configurado ? (data.telegram.ok ? " y a Telegram." : ". Telegram ha fallado.") : "."));
  };
  $("tg-zona").innerHTML = est?.telegram ? `<p class="ayuda">Conectado a <b>${esc(est.telegram_canal)}</b>. Cada aviso, acta, documento y fecha nueva se publicará allí automáticamente.</p>
      <div class="botones" style="margin-top:8px"><button class="btn peligro peq" id="b-tg-quitar">Desconectar Telegram</button></div>` :
    `<ol class="pasos-tg">
      <li>En Telegram, crea un <b>canal</b> (público, con nombre tipo <code>@ccoocalsina</code>).</li>
      <li>Abre <b>@BotFather</b>, escribe <code>/newbot</code>, ponle un nombre y copia el <b>token</b> que te da.</li>
      <li>En tu canal: Administradores → Añadir administrador → busca tu bot y dale permiso para <b>publicar</b>.</li>
      <li>Pega aquí el token y el nombre del canal, y pulsa «Conectar».</li></ol>
    <label for="tg-token">Token del bot</label><input id="tg-token" placeholder="123456789:AAH…" autocomplete="off">
    <label for="tg-chat">Nombre del canal</label><input id="tg-chat" placeholder="@ccoocalsina">
    <div class="botones" style="margin-top:12px"><button class="btn" id="b-tg">${icono("telegram", "p")}Conectar y enviar mensaje de prueba</button></div>`;
  $("tg-zona").insertAdjacentHTML("beforeend", `<div class="msg" id="m-tg"></div>`);
  if ($("b-tg")) $("b-tg").onclick = async () => {
    msg("m-tg", "Conectando…", true);
    let chat = $("tg-chat").value.trim(); if (chat && !chat.startsWith("@") && !/^-?\d+$/.test(chat)) chat = "@" + chat.replace(/^https?:\/\/t\.me\//, "");
    const r = await sb.functions.invoke("notificar", { body: { modo: "telegram_config", token: $("tg-token").value.trim(), chat } });
    let err = r.error ? ((await r.error.context?.json?.().catch(() => null))?.error || "No se ha podido conectar.") : null;
    if (err) return msg("m-tg", err);
    if (chat.startsWith("@")) await sb.from("paginas").upsert({ slug: "telegram", contenido: chat, actualizado: new Date().toISOString() });
    aviso("Telegram conectado. Mira tu canal: ha llegado un mensaje de prueba."); cargarCanales();
  };
  if ($("b-tg-quitar")) $("b-tg-quitar").onclick = async () => {
    if (!confirm("¿Desconectar Telegram? Los avisos dejarán de publicarse en el canal.")) return;
    await sb.functions.invoke("notificar", { body: { modo: "telegram_quitar" } });
    await sb.from("paginas").upsert({ slug: "telegram", contenido: "", actualizado: new Date().toISOString() });
    aviso("Telegram desconectado."); cargarCanales();
  };
  $("b-wa").onclick = async () => {
    const v = $("wa-enlace").value.trim();
    if (v && !/^https:\/\/(chat\.)?whatsapp\.com\//.test(v)) return msg("m-wa", "El enlace debe empezar por https://whatsapp.com/channel/ o https://chat.whatsapp.com/");
    const { error } = await sb.from("paginas").upsert({ slug: "whatsapp", contenido: v, actualizado: new Date().toISOString() });
    error ? msg("m-wa", error.message) : (msg("m-wa", ""), aviso(v ? "Enlace guardado. Ya sale en la web." : "Enlace quitado."));
  };
}

// ---------- Filtro por fecha en las listas del panel ----------
const FECHA_DE = { avisos: x => x.fecha, calendario: x => x.fecha, actas: x => x.fecha, documentos: x => x.fecha };
const FILTRO_ADM = {};
function pintaFechasAdm(items, k, f, repintar) {
  const anyos = [...new Set(items.map(x => partesFecha(FECHA_DE[k](x))?.a).filter(Boolean))].sort((a, b) => b - a);
  const activo = f.a || f.m || f.d;
  $("fechas-adm").innerHTML = items.length ? `<span class="ff-ic">${icono("calendario", "p")}</span>
    <select data-f="a" aria-label="Año"><option value="">Cualquier año</option>${anyos.map(a => `<option ${f.a == a ? "selected" : ""}>${a}</option>`).join("")}</select>
    <select data-f="m" aria-label="Mes"><option value="">Cualquier mes</option>${MESES.map((m, i) => `<option value="${i + 1}" ${f.m == i + 1 ? "selected" : ""}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>`).join("")}</select>
    <input type="date" data-f="d" value="${f.d || ""}" aria-label="Día exacto">
    ${activo ? `<button class="filtro" data-f-quitar>${icono("cerrar", "p")}Quitar fecha</button>` : ""}` : "";
  $("fechas-adm").querySelectorAll("[data-f]").forEach(el => el.onchange = () => {
    f[el.dataset.f] = el.value; if (el.dataset.f === "d" && el.value) { f.a = ""; f.m = ""; } if (el.dataset.f !== "d" && el.value) f.d = ""; repintar();
  });
  const q = $("fechas-adm").querySelector("[data-f-quitar]"); if (q) q.onclick = () => { f.a = f.m = f.d = ""; repintar(); };
}
function pasaFechaAdm(f, iso) {
  if (!f.a && !f.m && !f.d) return true;
  const p = partesFecha(iso); if (!p) return false;
  if (f.d) return p.iso === f.d;
  return (!f.a || p.a == f.a) && (!f.m || p.m == f.m);
}

// ---------- Plantillas al crear un aviso ----------
async function prepararPlantillas() {
  const { data } = await sb.from("plantillas").select("*").order("orden").order("id");
  if (!ED || ED.k !== "avisos" || !data?.length || !$("sel-plantilla")) return;
  $("desde-plantilla").classList.remove("oculto");
  $("sel-plantilla").innerHTML += data.map(p => `<option value="${p.id}">${esc(p.titulo)}</option>`).join("");
  $("sel-plantilla").onchange = (e) => {
    const p = data.find(x => x.id == e.target.value); if (!p) return;
    if (($("f-titulo").value || $("f-contenido").value) && !confirm("Se sustituirá lo que has escrito. ¿Seguir?")) { e.target.value = ""; return; }
    $("f-titulo").value = p.titulo; $("f-contenido").value = p.contenido;
    const sel = $("f-categoria"); if (![...sel.options].some(o => o.value === p.categoria)) sel.add(new Option(p.categoria, p.categoria)); sel.value = p.categoria;
    ED.sucio = true; actualizarPrevia();
    const m = p.contenido.match(/\[[^\]]+\]/);
    msg("ed-msg", m ? "Cambia lo que está entre [corchetes] antes de publicar." : "", true);
    const ta = $("f-contenido"); ta.focus(); if (m) { const i = p.contenido.indexOf(m[0]); ta.setSelectionRange(i, i + m[0].length); }
  };
}

// ---------- Copia de seguridad y archivo ----------
const TABLAS_COPIA = ["comunicados", "eventos", "convenio_secciones", "actas", "documentos", "preguntas", "plantillas", "paginas", "opciones", "admins"];
async function prepararCopiaYArchivo() {
  const { data } = await sb.from("paginas").select("slug, contenido, actualizado").in("slug", ["archivo_meses", "ultima_copia"]);
  const p = Object.fromEntries((data || []).map(x => [x.slug, x]));
  $("meses-archivo").value = p.archivo_meses?.contenido ?? "3";
  $("meses-archivo").onchange = async (e) => {
    const { error } = await sb.from("paginas").upsert({ slug: "archivo_meses", contenido: e.target.value, actualizado: new Date().toISOString() });
    error ? msg("m-archivo", error.message) : aviso("Guardado. Ya se aplica en la web.");
  };
  $("ultima-copia").innerHTML = p.ultima_copia?.contenido ? `Última copia: <b>${haceTxt(p.ultima_copia.contenido)}</b>.` : "<b>Todavía no se ha hecho ninguna copia.</b>";
  $("b-copia-todo").onclick = () => hacerCopia(true);
  $("b-copia-datos").onclick = () => hacerCopia(false);
}
async function cargarJSZip() {
  if (window.JSZip) return;
  await new Promise((ok, mal) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; sc.onload = ok; sc.onerror = () => mal(new Error("No se ha podido preparar el archivo ZIP. Revisa la conexión.")); document.head.appendChild(sc); });
}
async function hacerCopia(conArchivos) {
  const b1 = $("b-copia-todo"), b2 = $("b-copia-datos"); b1.disabled = b2.disabled = true;
  try {
    msg("m-copia", "Reuniendo los datos…", true);
    const copia = { creada: new Date().toISOString(), web: WEB_URL, tablas: {} };
    for (const t of TABLAS_COPIA) { const { data, error } = await sb.from(t).select("*"); if (error) throw error; copia.tablas[t] = data; }
    const fecha = hoyISO(), nombre = `copia-ccoo-calsina-${fecha}`;
    let blob;
    if (!conArchivos) blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
    else {
      await cargarJSZip();
      const zip = new JSZip();
      zip.file("datos.json", JSON.stringify(copia, null, 2));
      zip.file("LEEME.txt", "Copia de seguridad de la web de la Sección Sindical CCOO Calsina Carré.\r\n\r\ndatos.json: todos los textos (avisos, actas, convenio, calendario, preguntas, plantillas, ajustes).\r\narchivos/: los PDF, fotos y documentos subidos.\r\n\r\nGuárdala en un sitio seguro. Si algún día hace falta recuperar algo, con este archivo se puede restaurar.");
      const urls = new Map();
      (copia.tablas.comunicados || []).concat(copia.tablas.actas || []).forEach(x => (x.adjuntos || []).forEach(a => urls.set(a.url, a.nombre)));
      (copia.tablas.documentos || []).forEach(d => d.url && urls.set(d.url, d.nombre_archivo || d.titulo));
      let i = 0, fallos = 0;
      for (const [url, nom] of urls) {
        i++; msg("m-copia", `Descargando archivos: ${i} de ${urls.size}…`, true);
        try { const r = await fetch(url); if (!r.ok) throw 0; zip.file("archivos/" + (url.split("/").pop() || nom), await r.blob()); } catch (_) { fallos++; }
      }
      msg("m-copia", "Comprimiendo…", true);
      blob = await zip.generateAsync({ type: "blob" });
      if (fallos) aviso(`${fallos} archivo(s) no se han podido incluir.`, true);
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre + (conArchivos ? ".zip" : ".json");
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    await sb.from("paginas").upsert({ slug: "ultima_copia", contenido: new Date().toISOString(), actualizado: new Date().toISOString() });
    msg("m-copia", `Copia descargada (${tamanoTxt(blob.size)}). Guárdala en un sitio seguro.`, true);
    $("ultima-copia").innerHTML = "Última copia: <b>ahora mismo</b>.";
  } catch (e) { msg("m-copia", "No se ha podido hacer la copia: " + (e.message || e)); }
  b1.disabled = b2.disabled = false;
}

// Mantener la app al día también en el panel
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").then(r => r.update()).catch(() => {});

// ---------- Instalar la app (también desde el panel) ----------
let PROMPT_INST = null;
const ES_IOS_A = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const INSTALADA_A = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); PROMPT_INST = e; if (actual === "resumen" && $("banda-instalar")) pintaBandaInstalar(); });
async function instalarApp() {
  if (PROMPT_INST) { PROMPT_INST.prompt(); await PROMPT_INST.userChoice; PROMPT_INST = null; pintaBandaInstalar(); return; }
  if (ES_IOS_A) modalAdm("Instalar en iPhone", `<ol><li>Abre esta página en <b>Safari</b>.</li><li>Pulsa <b>Compartir</b> (el cuadrado con la flecha).</li><li>Elige <b>«Añadir a pantalla de inicio»</b> y pulsa <b>Añadir</b>.</li></ol><p class="fecha-txt">La app abre la web; para publicar, toca «Acceso para publicar» al final de la página.</p>`);
  else modalAdm("Instalar la app", `<ol><li>Abre esta página en <b>Chrome</b>.</li><li>Pulsa el menú <b>⋮</b> (arriba a la derecha).</li><li>Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.</li></ol><p class="fecha-txt">No es un archivo descargado: no sale ningún aviso de seguridad. Para publicar desde la app, toca «Acceso para publicar» al final de la página.</p>`);
}
function pintaBandaInstalar() {
  const z = $("banda-instalar"); if (!z) return;
  z.innerHTML = INSTALADA_A() ? "" : `<div class="panel banda"><span class="ic">${icono("movil")}</span>
    <span class="txt"><b>Instala la app en tu móvil</b><p>Tendrás la web y el panel a un toque, con el logo en la pantalla de inicio.</p></span>
    <span class="botones"><button class="btn" id="b-instalar-adm">${icono("descargar", "p")}Instalar</button></span></div>`;
  if ($("b-instalar-adm")) $("b-instalar-adm").onclick = instalarApp;
}
