// Panel: ayudas comunes, errores en español y la lista de secciones (SECCIONES).
// El panel está repartido en admin-base.js, admin-sesion.js, admin-listas.js, admin-editor.js,
// admin-herramientas.js, admin-ajustes.js y admin-calendario.js, que se cargan en ese orden (comparten variables).

// ===== Panel de publicación · Sección Sindical CCOO Calsina Carré =====
const $ = (id) => document.getElementById(id);
const aqui = location.origin + location.pathname;
const msg = (id, t, ok) => { const el = $(id); if (!el) return; el.textContent = t; el.className = "msg " + (ok ? "ok" : "err"); };
const MAX_MB = 20;
// Guía del panel (página aparte con capturas): sale en el menú como «Guía del panel»
const GUIA_URL = "https://claude.ai/artifact/92KXfVBJpw9ri9FzDnnduu";
// Errores del servidor explicados en español (Supabase los da en inglés técnico). Si no se reconoce, se enseña tal cual.
function errTxt(e) {
  const m = String((e && (e.message || e.error_description)) || e || "");
  if (/jwt|refresh token|not authenticated|session (missing|not found|expired)|auth session/i.test(m)) return "Se ha cerrado la sesión del panel. Vuelve a entrar: lo que estabas escribiendo queda guardado como borrador.";
  if (/failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(m)) return "No hay conexión con el servidor. Comprueba internet y vuelve a probar.";
  if (/row-level security|permission denied|not authorized|unauthorized|42501/i.test(m)) return "No tienes permiso para hacer esto. Sal del panel y vuelve a entrar (con el código de dos pasos si lo tienes activado).";
  if (/duplicate key|already exists|23505/i.test(m)) return "Ya existe uno igual.";
  if (/payload too large|exceeded the maximum|entity too large|413/i.test(m)) return "El archivo es demasiado grande.";
  if (/timeout|timed out|57014|statement canceled/i.test(m)) return "El servidor ha tardado demasiado. Vuelve a probar en un momento.";
  if (/not-null|23502/i.test(m)) return "Falta rellenar un dato obligatorio.";
  if (/check constraint|invalid input|23514|22P02/i.test(m)) return "Algún dato no tiene el formato correcto. Revisa fechas, horas y enlaces.";
  if (/rate limit|too many|429/i.test(m)) return "Demasiados intentos seguidos. Espera un par de minutos.";
  return m || "Error desconocido.";
}
$("ver-web").innerHTML = icono("ver", "p");
$("ed-cerrar").innerHTML = icono("cerrar", "p");
$("fab").innerHTML = icono("mas") + "<span>Nuevo</span>";
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
      { k: "adjuntos", l: "Archivos adjuntos", t: "archivos", opc: true, ayuda: "Si añades una foto o un cartel, la primera foto sale en grande en el aviso y en «Lo último»." },
      { checks: [{ k: "urgente", l: "Urgente: sale en rojo y arriba del todo en Inicio" }, { k: "fijado", l: "Fijar arriba de la lista de avisos" }, { k: "notificar", l: "Avisar en los móviles y en el canal de Telegram", def: true, soloNuevo: true }] },
      { k: "publicar_en", l: "Programar la publicación", t: "datetime-local", opc: true, atajos: true, ayuda: "Déjalo vacío para publicar ahora. Si pones día y hora, se publicará y avisará solo en ese momento." },
    ],
    previa: (x) => previaCanales(x),
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
      { checks: [{ k: "importante", l: "Cita importante: sale en la portada con cuenta atrás" }, { k: "notificar", l: "Avisar en los móviles y en el canal de Telegram", def: true, soloNuevo: true }] },
    ],
    previa: (x) => `<div class="panel dia-detalle">${x.fecha ? `<h3>${fechaDia(x.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</h3>` : ""}${eventoHTML(x, true)}</div>`,
    extracto: (x) => [x.hora, x.lugar].filter(Boolean).join(" · "), chips: (x) => [x.fecha && fechaLarga(x.fecha + "T12:00:00"), x.tipo, x.importante && "Importante: cuenta atrás"], fechas: (x) => [x.creado, x.actualizado],
  },
  convenio: {
    nombre: "Convenio", icono: "convenio", tabla: "convenio_secciones", orden: ["orden", true], uno: "apartado", nuevo: "Nuevo apartado", lista: "convenio", campoColor: "categoria",
    intro: "Apartados del convenio explicados de forma sencilla. Los trabajadores los abren al tocarlos.",
    campos: [
      { k: "titulo", l: "Título del apartado", t: "text", req: true, ph: "Ej: Permisos retribuidos" },
      { fila: [{ k: "categoria", l: "Categoría", t: "select", lista: "convenio" }, { k: "articulo", l: "Artículo", t: "text", opc: true, ph: "Ej: Art. 24" }] },
      { k: "resumen", l: "Resumen en una frase", t: "text", opc: true, ph: "Se ve sin abrir el apartado" },
      { k: "contenido", l: "Explicación completa", t: "textarea", formato: true },
      { k: "adjuntos", l: "Archivos del apartado", t: "archivos", opc: true, ayuda: "El artículo en PDF, una tabla, una foto… Salen para descargar debajo de la explicación." },
      { k: "orden", l: "Posición en la lista", t: "number", ayuda: "1 sale primero, 2 después… Así ordenas los apartados." },
      { checks: [{ k: "visible", l: "Se ve en la web (desmárcalo para ocultarlo sin borrarlo)", def: true }] },
    ],
    previa: (x) => apartadoHTML(x, "", true),
    extracto: (x) => x.resumen || x.contenido, chips: (x) => [x.visible === false && "Oculto en la web", x.categoria, x.articulo, "Posición " + x.orden], fechas: (x) => [null, x.actualizado],
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
  delegados: {
    nombre: "Delegados", icono: "grupo", tabla: "delegados", orden: ["orden", true], uno: "delegado", nuevo: "Añadir delegado", lista: "aviso", campoColor: "_",
    intro: "Las personas de la Sección Sindical que salen en «Nosotros». Pon solo los datos que cada uno quiera publicar.",
    campos: [
      { k: "nombre", l: "Nombre", t: "text", req: true, ph: "Ej: Marian" },
      { k: "cargo", l: "Cargo", t: "text", ph: "Ej: Secretario de la Sección Sindical" },
      { k: "detalle", l: "Dónde encontrarle", t: "text", opc: true, ph: "Ej: Turno de mañana · Nave 2" },
      { fila: [{ k: "telefono", l: "Teléfono", t: "tel", opc: true, ph: "600 000 000" }, { k: "email", l: "Email", t: "email", opc: true }] },
      { k: "orden", l: "Posición en la lista", t: "number" },
    ],
    ayuda: "Solo publica el teléfono o el email si esa persona está de acuerdo.",
    previa: (x) => delegadoHTML(x), tituloDe: (x) => x.nombre,
    extracto: (x) => [x.cargo, x.detalle].filter(Boolean).join(" · "), chips: (x) => [x.telefono && "Con teléfono", x.email && "Con email"], fechas: (x) => [null, x.actualizado],
  },
  encuestas: {
    nombre: "Encuestas", icono: "encuesta", tabla: "encuestas", orden: ["creado", false], uno: "encuesta", nuevo: "Nueva encuesta", lista: "aviso", campoColor: "_",
    intro: "Preguntas para la plantilla. Salen en la portada; se vota tocando una opción y nadie puede saber qué ha votado cada uno: solo se cuentan los votos (un voto por móvil).",
    campos: [
      { k: "pregunta", l: "Pregunta", t: "text", req: true, ph: "Ej: ¿Qué turno preferís para la asamblea?" },
      { k: "opciones", l: "Opciones", t: "textarea", req: true, corto: true, ayuda: "Una opción por línea, de 2 a 6. Cuando ya haya votos, no cambies el orden ni quites opciones: los votos van por posición." },
      { k: "cierra", l: "Se cierra el día", t: "date", opc: true, ayuda: "Déjalo vacío para que siga abierta hasta que la ocultes. Cerrada, se ven los resultados en la portada 15 días más." },
      { checks: [{ k: "publicada", l: "Se ve en la web (desmárcalo para ocultarla sin borrarla)", def: true }, { k: "notificar", l: "Avisar en los móviles y en el canal de Telegram", def: true, soloNuevo: true }] },
    ],
    previa: (x) => encuestaHTML(x, VOTOS[x.id] || {}, 0),
    tituloDe: (x) => x.pregunta,
    extracto: (x) => { const v = VOTOS[x.id] || {}; return opcionesEncuesta(x).map((o, i) => `${o}: ${+v[i + 1] || 0}`).join(" · "); },
    chips: (x) => { const v = VOTOS[x.id] || {}, n = Object.values(v).reduce((a, b) => a + b, 0); return [n + (n === 1 ? " voto" : " votos"), x.publicada === false ? "Oculta" : encuestaAbierta(x) ? (x.cierra ? "Abierta hasta el " + fechaLarga(x.cierra + "T12:00:00") : "Abierta") : "Cerrada"]; },
    fechas: (x) => [x.creado, x.actualizado],
  },
  enlaces: {
    nombre: "Enlaces", icono: "idioma", tabla: "enlaces", orden: ["orden", true], uno: "enlace", nuevo: "Nuevo enlace", lista: "aviso", campoColor: "_",
    intro: "Webs útiles para la plantilla (sindicato, Seguridad Social, SEPE…). Salen en «Nosotros».",
    campos: [
      { k: "titulo", l: "Nombre", t: "text", req: true, ph: "Ej: Seguridad Social" },
      { k: "url", l: "Dirección web", t: "url", req: true, ph: "https://…" },
      { k: "descripcion", l: "Para qué sirve", t: "text", opc: true },
      { k: "orden", l: "Posición en la lista", t: "number" },
    ],
    previa: (x) => enlaceHTML(x),
    extracto: (x) => x.descripcion || x.url, chips: (x) => [x.url && x.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]], fechas: (x) => [null, x.actualizado],
  },
};
// Apartados nuevos de la web (Comité de empresa, etc.): los crea el admin y cada uno tiene su lista de publicaciones
const ICONOS_AP = [["grupo", "Personas"], ["carpeta", "Carpeta"], ["camara", "Cámara de fotos"], ["imagen", "Foto"], ["actas", "Hoja"], ["convenio", "Libro"], ["avisos", "Altavoz"], ["calendario", "Calendario"], ["pregunta", "Pregunta"], ["alerta", "Atención"], ["archivo2", "Archivo"]];
SECCIONES.apartados = {
  nombre: "Apartados de la web", icono: "carpeta", tabla: "apartados", orden: ["orden", true], uno: "apartado de la web", nuevo: "Nuevo apartado de la web", lista: "aviso", campoColor: "_",
  tarjeta: (x) => tarjetaApartado(x),
  intro: "Secciones nuevas de la web, como «Comité de empresa». Cada una sale como una pestaña y aquí en el panel tiene su propia lista para publicar fotos, documentos y textos.",
  campos: [
    { k: "titulo", l: "Nombre del apartado", t: "text", req: true, ph: "Ej: Comité de empresa", ayuda: "Corto: es lo que sale en la pestaña de la web." },
    { k: "descripcion", l: "Explicación corta", t: "text", opc: true, ph: "Ej: Fotos, documentos y novedades del comité." },
    { k: "padre_id", l: "Dónde sale en la web", t: "select", opc: true, get ops() { return opcionesPadre(); },
      ayuda: "«Pestaña principal» sale arriba en la web. Si eliges otro apartado, sale dentro de él como subapartado (por ejemplo, «Fotos» dentro de «Comité de empresa»)." },
    { k: "icono", l: "Dibujo", t: "select", ops: ICONOS_AP },
    { k: "orden", l: "Posición", t: "number", ayuda: "1 sale primero, 2 después…" },
    { checks: [{ k: "visible", l: "Se ve en la web (desmárcalo para prepararlo sin que se vea)", def: true }] },
  ],
  previa: (x) => `<div class="accesos-tablon" style="max-width:360px"><a href="#">${icono(x.icono || "carpeta")}<b>${esc(x.titulo || "Sin nombre")}</b></a></div><p class="ayuda">${esc(x.descripcion || "")}</p>`,
  extracto: (x) => x.descripcion, chips: (x) => [x.visible === false ? "Oculto" : "Se ve en la web", "Posición " + x.orden], fechas: (x) => [x.creado, x.actualizado],
};
// Apartados donde se puede meter otro: solo los principales (un nivel) y nunca él mismo ni uno que ya tenga subapartados dentro
function opcionesPadre() {
  const yo = ED?.orig?.id, tieneHijos = yo && APARTADOS.some(a => a.padre_id === yo);
  return [["", "Pestaña principal de la web"], ...(tieneHijos ? [] : APARTADOS.filter(a => !a.padre_id && a.id !== yo).map(a => [String(a.id), "Dentro de «" + a.titulo + "»"]))];
}
// Valores de las calculadoras de la web («Calcula»). Se editan desde la página «Calculadoras».
const UNIDADES = ["días", "días naturales", "días laborables", "horas", "días al año", "tiempo necesario"].map(u => [u, u]);
SECCIONES.permisos = {
  nombre: "Permisos retribuidos", icono: "convenio", tabla: "calc_permisos", orden: ["orden", true], uno: "permiso", nuevo: "Añadir permiso", lista: "aviso", campoColor: "_", oculta: true, volver: "calculadoras",
  intro: "", tituloDe: (x) => x.nombre,
  campos: [
    { k: "nombre", l: "Qué ha pasado (así lo verá el trabajador)", t: "text", req: true, ph: "Ej: Boda o registro como pareja de hecho" },
    { fila: [{ k: "dias", l: "Cuántos", t: "number", dec: true, paso: "0.5" }, { k: "unidad", l: "Unidad", t: "select", ops: UNIDADES }] },
    { k: "pregunta_extra", l: "Pregunta para sumar días (si la hay)", t: "text", opc: true, ph: "Ej: ¿Tienes que desplazarte a otra localidad?", ayuda: "Si el trabajador contesta «Sí», se suman los días de abajo." },
    { k: "dias_extra", l: "Días que se suman si contesta «Sí»", t: "number", dec: true, paso: "0.5" },
    { k: "detalle", l: "Explicación", t: "textarea", opc: true, corto: true, ayuda: "A quién afecta, qué hay que llevar, etc." },
    { k: "articulo", l: "De dónde sale", t: "text", opc: true, ph: "Ej: Convenio, art. 24" },
    { k: "orden", l: "Posición en la lista", t: "number" },
    { checks: [{ k: "visible", l: "Se ve en la web", def: true }] },
  ],
  previa: (x) => `<div class="panel calc">${resultadoPermisoHTML(x, false)}${Number(x.dias_extra) && x.pregunta_extra ? `<p class="ayuda">Si contesta «Sí» a «${esc(x.pregunta_extra)}»:</p>${resultadoPermisoHTML(x, true)}` : ""}</div>`,
  extracto: (x) => x.detalle, chips: (x) => [x.unidad === "tiempo necesario" ? "Tiempo necesario" : numTxt(x.dias) + " " + x.unidad, Number(x.dias_extra) ? "+" + numTxt(x.dias_extra) + " con desplazamiento" : null, x.visible === false ? "Oculto" : null, x.articulo], fechas: (x) => [null, x.actualizado],
};
SECCIONES.categorias = {
  nombre: "Precios de horas extra", icono: "reloj", tabla: "calc_categorias", orden: ["orden", true], uno: "categoría", nuevo: "Añadir categoría", lista: "aviso", campoColor: "_", oculta: true, volver: "calculadoras",
  intro: "", tituloDe: (x) => x.nombre,
  campos: [
    { k: "nombre", l: "Categoría", t: "text", req: true, ph: "Ej: Conductor/a" },
    { fila: [{ k: "precio_extra", l: "Precio de la hora extra (€)", t: "number", dec: true, paso: "0.01" }, { k: "precio_extra_festiva", l: "Hora extra en festivo (€)", t: "number", dec: true, paso: "0.01", ayuda: "Pon 0 si no hay precio distinto." }] },
    { k: "orden", l: "Posición en la lista", t: "number" },
  ],
  previa: (x) => `<div class="panel calc"><div class="resultado-calc"><span class="rc-tit">${esc(x.nombre || "Categoría")}</span><span class="rc-num">${eurosTxt(x.precio_extra)} <small>por hora</small></span>${Number(x.precio_extra_festiva) ? `<span class="rc-sub">En festivo: ${eurosTxt(x.precio_extra_festiva)} por hora</span>` : ""}</div></div>`,
  extracto: () => "", chips: (x) => [eurosTxt(x.precio_extra) + " la hora", Number(x.precio_extra_festiva) ? eurosTxt(x.precio_extra_festiva) + " en festivo" : null], fechas: (x) => [null, x.actualizado],
};

// Importes de «Mis incentivos» (Zona Conductores de la web, v81). Se editan en la página «Importes conductores».
// La unidad dice cómo lo apunta el conductor cada día (casilla, contador o número) o si es fijo al mes.
const UNIDADES_TARIFA = [["dia", "Por día (casilla)"], ["noche", "Por noche (casilla)"], ["finde", "Por fin de semana (casilla)"], ["vez", "Cada vez (contador: desayuno, carga…)"],
  ["hora", "Por hora"], ["km", "Por kilómetro"], ["minuto", "Por minuto"], ["mes", "Fijo al mes (salario, plus fijo)"]];
const UNIDAD_CORTA = { dia: "por día", noche: "por noche", finde: "por fin de semana", vez: "cada vez", hora: "por hora", km: "por km", minuto: "por minuto", mes: "al mes" };
const precioTxt = (n) => Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 8 }) + " €";
SECCIONES.tarifas = {
  nombre: "Importes de «Mis incentivos»", icono: "euro", tabla: "tarifas_conductor", orden: ["orden", true], uno: "importe", nuevo: "Añadir concepto", lista: "aviso", campoColor: "_", oculta: true, volver: "ganancias",
  intro: "", tituloDe: (x) => x.concepto,
  campos: [
    { k: "concepto", l: "Concepto (así lo verá el conductor)", t: "text", req: true, ph: "Ej: Dieta completa nacional" },
    { k: "grupo", l: "Grupo", t: "text", opc: true, ph: "Ej: Dieta fraccionada nacional", ayuda: "Los conceptos con el mismo grupo salen juntos, con este título encima." },
    { fila: [{ k: "importe", l: "Importe (€)", t: "number", dec: true, paso: "any" }, { k: "unidad", l: "Cómo se cuenta", t: "select", ops: UNIDADES_TARIFA, def: "dia" }] },
    { k: "pago", l: "Cuándo se cobra", t: "select", ops: [["Semanal", "Semanal"], ["Mensual", "Mensual (con la nómina)"]], def: "Semanal" },
    { fila: [{ k: "sin_pagar", l: "No se pagan las primeras… (cada día)", t: "number", ayuda: "Ej: 1 si la primera carga del día no se paga. Si no, 0." },
      { k: "max_mes", l: "Como mucho al mes", t: "number", ayuda: "Ej: 2 fines de semana al mes. 0 = sin tope." }] },
    { k: "nota", l: "Nota para el conductor", t: "text", opc: true, ph: "Ej: Solo si haces ADR." },
    { k: "orden", l: "Posición en la lista", t: "number" },
    { checks: [{ k: "visible", l: "Se ve en la web", def: true }] },
  ],
  previa: (x) => `<div class="panel calc"><div class="resultado-calc"><span class="rc-tit">${esc(x.concepto || "Concepto")}</span><span class="rc-num">${esc(precioTxt(x.importe))} <small>${esc(UNIDAD_CORTA[x.unidad] || "")}</small></span>${x.nota ? `<span class="rc-sub">${esc(x.nota)}</span>` : ""}</div></div>`,
  extracto: (x) => x.nota, chips: (x) => [precioTxt(x.importe) + " " + (UNIDAD_CORTA[x.unidad] || ""), x.grupo || null, x.pago === "Mensual" ? "Con la nómina" : "Semanal", Number(x.sin_pagar) ? (Number(x.sin_pagar) === 1 ? "La primera de cada día no se paga" : `Las ${x.sin_pagar} primeras de cada día no se pagan`) : null, Number(x.max_mes) ? `Máx. ${x.max_mes} al mes` : null, x.visible === false ? "Oculto" : null], fechas: (x) => [null, x.actualizado],
};

// Restricciones para camiones (Zona Conductores de la web). Se editan en la página «Restricciones camiones».
SECCIONES.restricciones = {
  nombre: "Restricciones para camiones", icono: "lugar", tabla: "restricciones", orden: ["orden", true], uno: "país", nuevo: "Añadir país", lista: "aviso", campoColor: "_", oculta: true, volver: "camiones",
  intro: "", tituloDe: (x) => x.pais,
  campos: [
    { k: "pais", l: "País o zona", t: "text", req: true, ph: "Ej: Francia" },
    { k: "url", l: "Enlace a la página oficial", t: "url", req: true, ph: "https://…", ayuda: "Pon solo páginas oficiales y gratuitas (gobierno, tráfico, policía)." },
    { k: "fuente", l: "Quién lo publica", t: "text", opc: true, ph: "Ej: Bison Futé (Gobierno de Francia)" },
    { k: "idioma", l: "Idioma de la página", t: "text", opc: true, ph: "Ej: En francés", ayuda: "Si no pone «español», en la web se explica cómo traducirla con el móvil al abrirla. Si la página ya está en español, escribe «En español»." },
    { k: "orden", l: "Posición en la lista", t: "number" },
    { checks: [{ k: "visible", l: "Se ve en la web (desmárcalo para ocultarlo sin borrarlo)", def: true }] },
  ],
  previa: (x) => `<div class="lista-restr">${restriccionHTML(x)}</div>`,
  extracto: (x) => x.fuente, chips: (x) => [x.visible === false && "Oculto en la web", x.idioma, x.url && x.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]], fechas: (x) => [null, x.actualizado],
};

// Una sección del panel por cada apartado
const seccionApartado = (a) => ({
  slug: a.slug, nombre: a.titulo, icono: a.icono || "carpeta", tabla: "publicaciones", filtro: { apartado_id: a.id }, orden: ["fecha", false], uno: "publicación", nuevo: "Publicar en " + a.titulo, lista: "aviso", campoColor: "_",
  intro: (a.descripcion ? a.descripcion + " " : "") + "Lo que publiques aquí sale en la web, ordenado por año y mes.",
  campos: [
    { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Reunión con la empresa por el parking" },
    { k: "fecha", l: "Fecha", t: "date", req: true, ayuda: "El día de la reunión, la foto o el documento. Sirve para ordenarlo por año y mes." },
    { k: "contenido", l: "Texto", t: "textarea", opc: true, formato: true },
    { k: "adjuntos", l: "Fotos y documentos", t: "archivos", opc: true },
    { checks: [{ k: "publicado", l: "Se ve en la web (desmárcalo para ocultarlo sin borrarlo)", def: true },
      { k: "notificar", l: "Avisar en los móviles y en el canal de Telegram", def: true, soloNuevo: true }] },
  ],
  previa: (x) => publicacionHTML(x),
  extracto: (x) => x.contenido, chips: (x) => [x.publicado === false && "Oculto en la web", x.fecha && fechaLarga(x.fecha + "T12:00:00")], fechas: (x) => [x.creado, x.actualizado],
});
let APARTADOS = [];
async function cargarApartados() {
  Object.keys(SECCIONES).filter(k => /^ap\d+$/.test(k)).forEach(k => { delete SECCIONES[k]; delete FECHA_DE[k]; });
  const { data } = await sb.from("apartados").select("*").order("orden").order("id");
  APARTADOS = data || [];
  APARTADOS.forEach(a => { SECCIONES["ap" + a.id] = seccionApartado(a); FECHA_DE["ap" + a.id] = x => x.fecha; });
  construirPaginas();
}
let PAGINAS = {};
// Menú agrupado igual que las pestañas de la web (v52): cada apartado principal con lo que va dentro, un poco metido.
// «cab» pone un título encima; «sub» lo mete dentro del de arriba. Si falta el apartado de arriba, va suelto.
const DENTRO_PANEL = { actas: "comite", convenio: "convenio-y-leyes", calculadoras: "convenio-y-leyes", camiones: "zona-conductores", ganancias: "zona-conductores" };
const PAG_FIJAS = { calculadoras: { nombre: "Calculadoras", icono: "reloj" }, camiones: { nombre: "Restricciones camiones", icono: "lugar" }, ganancias: { nombre: "Importes conductores", icono: "euro" },
  buzon: { nombre: "Buzón anónimo", icono: "correo" }, ortografia: { nombre: "Revisar ortografía", icono: "check" }, historial: { nombre: "Historial", icono: "reloj" }, textos: { nombre: "Textos", icono: "texto" }, ajustes: { nombre: "Ajustes", icono: "ajustes" } };
const padreDe = (a) => a.padre_id ? APARTADOS.find(p => p.id === a.padre_id && !p.padre_id) : null;
function construirPaginas() {
  const P = { resumen: { nombre: "Inicio", icono: "resumen" } };
  const pon = (k, extra = {}) => { if (P[k] || (!SECCIONES[k] && !PAG_FIJAS[k])) return; P[k] = { nombre: SECCIONES[k]?.nombre, icono: SECCIONES[k]?.icono, ...PAG_FIJAS[k], ...extra }; };
  pon("avisos"); pon("calendario");
  const principales = APARTADOS.filter(a => !padreDe(a)), afiliate = principales.filter(a => a.slug === "afiliate");
  principales.filter(a => a.slug !== "afiliate").forEach(a => {
    pon("ap" + a.id, { grupo: true });
    Object.keys(DENTRO_PANEL).filter(k => DENTRO_PANEL[k] === a.slug).forEach(k => pon(k, { sub: true }));
    APARTADOS.filter(h => padreDe(h)?.id === a.id).forEach(h => pon("ap" + h.id, { sub: true }));
  });
  Object.keys(DENTRO_PANEL).forEach(k => pon(k, { grupo: true }));
  pon("documentos", { grupo: true });
  ["preguntas", "delegados", "enlaces", "buzon"].forEach((k, i) => pon(k, i ? {} : { cab: "Nosotros" }));
  afiliate.forEach(a => pon("ap" + a.id, { grupo: true }));
  const herr = ["encuestas", "plantillas", "recurrentes", "apartados", "ortografia", "historial", "textos", "ajustes"];
  Object.keys(SECCIONES).filter(k => !SECCIONES[k].oculta && !/^ap\d+$/.test(k) && !herr.includes(k)).forEach(k => pon(k));
  herr.forEach((k, i) => pon(k, i ? {} : { cab: "Herramientas" }));
  PAGINAS = P;
}
construirPaginas();
const EN_MOVIL = ["resumen", "avisos", "calendario", "actas"];
let actual = "resumen", datos = {};

