// ===== Panel de publicación · Sección Sindical CCOO Calsina Carré =====
const $ = (id) => document.getElementById(id);
const aqui = location.origin + location.pathname;
const msg = (id, t, ok) => { const el = $(id); if (!el) return; el.textContent = t; el.className = "msg " + (ok ? "ok" : "err"); };
const MAX_MB = 20;
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
      { k: "publicar_en", l: "Programar la publicación", t: "datetime-local", opc: true, ayuda: "Déjalo vacío para publicar ahora. Si pones día y hora, se publicará y avisará solo en ese momento." },
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
const DENTRO_PANEL = { actas: "comite", convenio: "convenio-y-leyes", calculadoras: "convenio-y-leyes", camiones: "zona-conductores" };
const PAG_FIJAS = { calculadoras: { nombre: "Calculadoras", icono: "reloj" }, camiones: { nombre: "Restricciones camiones", icono: "lugar" },
  buzon: { nombre: "Buzón anónimo", icono: "correo" }, historial: { nombre: "Historial", icono: "reloj" }, textos: { nombre: "Textos", icono: "texto" }, ajustes: { nombre: "Ajustes", icono: "ajustes" } };
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
  const herr = ["encuestas", "plantillas", "recurrentes", "apartados", "historial", "textos", "ajustes"];
  Object.keys(SECCIONES).filter(k => !SECCIONES[k].oculta && !/^ap\d+$/.test(k) && !herr.includes(k)).forEach(k => pon(k));
  herr.forEach((k, i) => pon(k, i ? {} : { cab: "Herramientas" }));
  PAGINAS = P;
}
construirPaginas();
const EN_MOVIL = ["resumen", "avisos", "calendario", "actas"];
let actual = "resumen", datos = {};

// ---------- Sesión ----------
let iniciado = false, CAMBIANDO_CLAVE = false;
const mostrar = (s) => { ["s-login", "s-olvido", "s-rescate", "s-recuperar", "s-codigo", "s-panel"].forEach(x => $(x).classList.toggle("oculto", x !== s)); document.body.classList.toggle("sin-nav", s !== "s-panel"); };
sb.auth.onAuthStateChange((ev, ses) => {
  if (ev === "PASSWORD_RECOVERY") return mostrar("s-recuperar");
  if (!ses) { iniciado = false; return CAMBIANDO_CLAVE ? null : mostrar("s-login"); }
  if (CAMBIANDO_CLAVE) return; // entrando con el código del email: primero se guarda la contraseña nueva
  // Supabase avisa de nuevo al volver a la pestaña o al refrescar la sesión: el panel solo se monta una vez,
  // así no se pierde lo que se está escribiendo ni los archivos elegidos.
  if (iniciado) return;
  iniciado = true; window.MI_EMAIL = ses.user.email;
  setTimeout(iniciar, 0);
});
// Verificación en dos pasos: si la cuenta la tiene activada, antes del panel se pide el código de la app del móvil.
// El servidor también lo exige (is_admin() solo da permiso con la sesión verificada), así que saltarse esta pantalla no sirve.
async function iniciar() {
  try {
    const { data: n } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (n && n.nextLevel === "aal2" && n.currentLevel !== "aal2") {
      mostrar("s-codigo"); $("codigo").value = ""; setTimeout(() => $("codigo").focus(), 50);
      return;
    }
  } catch (e) { console.warn("2 pasos", e); }
  await iniciarPanel();
}
const factorTotp = async () => { const { data } = await sb.auth.mfa.listFactors(); return (data?.totp || []).find(f => f.status === "verified"); };
$("b-codigo").onclick = async () => {
  const c = $("codigo").value.replace(/\D/g, "");
  if (c.length !== 6) return msg("m-codigo", "Escribe las 6 cifras que salen en la app.");
  msg("m-codigo", "Comprobando…", true);
  const f = await factorTotp();
  if (!f) return iniciarPanel();
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: f.id, code: c });
  if (error) { $("codigo").select(); return msg("m-codigo", /rate|too many/i.test(error.message) ? "Demasiados intentos. Espera un minuto." : "Código incorrecto o caducado. Escribe el que sale ahora en la app."); }
  msg("m-codigo", "", true); iniciarPanel();
};
$("codigo").onkeydown = (e) => { if (e.key === "Enter") $("b-codigo").click(); };
$("codigo").oninput = () => { if ($("codigo").value.replace(/\D/g, "").length === 6) $("b-codigo").click(); };
$("b-codigo-salir").onclick = async () => { await sb.auth.signOut(); location.replace(aqui); };
async function iniciarPanel() {
  mostrar("s-panel");
  const { data } = await sb.rpc("is_admin");
  window.ES_ADMIN = !!data;
  await cargarOpciones();
  await cargarApartados();
  await contarBuzon();
  pintaNav();
  const h = location.hash.slice(1);
  abrir(PAGINAS[h] || h === "archivos" ? h : "resumen");
}
// Sin bloqueo por intentos fallidos en el panel (v50: al padre le dejaba esperando y parecía que la cuenta se había bloqueado).
// Contra quien pruebe contraseñas ya protege Supabase, que frena muchos intentos seguidos desde el mismo sitio.
$("b-entrar").onclick = async () => {
  msg("m-login", "Entrando…", true);
  const { error } = await sb.auth.signInWithPassword({ email: $("email").value.trim(), password: $("pass").value });
  if (!error) return;
  msg("m-login", /confirm/i.test(error.message) ? "Falta confirmar la cuenta: abre el email que te ha llegado y pulsa el enlace."
    : /rate|too many/i.test(error.message) ? "Muchos intentos seguidos. Espera un par de minutos y vuelve a probar."
    : "Email o contraseña incorrectos. Si no la recuerdas, pulsa «He olvidado la contraseña» una sola vez.");
};
$("pass").onkeydown = (e) => { if (e.key === "Enter") $("b-entrar").click(); };
// Contraseña segura: 10 caracteres o más, con letras y números, y que no sea de las típicas
const DEBILES = ["1234567890", "contraseña", "contrasena", "password12", "qwertyuiop", "ccoo123456", "calsina123"];
const fallaPass = (p) => p.length < 10 ? "La contraseña debe tener al menos 10 caracteres."
  : !/[a-zA-Z]/.test(p) || !/\d/.test(p) ? "La contraseña debe mezclar letras y números."
  : DEBILES.some(d => p.toLowerCase().includes(d)) ? "Esa contraseña es demasiado fácil de adivinar. Elige otra." : "";
$("b-registro").onclick = async () => {
  const f = fallaPass($("pass").value);
  if (f) return msg("m-login", f + " Escríbela arriba y vuelve a pulsar.");
  const { error } = await sb.auth.signUp({ email: $("email").value.trim(), password: $("pass").value, options: { emailRedirectTo: aqui } });
  if (error) return msg("m-login", /database error|no permitido|not authorized/i.test(error.message)
    ? "Este email no está autorizado. Solo pueden crear cuenta las personas que un administrador haya añadido antes en Ajustes, Administradores."
    : /weak|pwned|leaked/i.test(error.message) ? "Esa contraseña aparece en filtraciones de internet. Elige otra." : error.message);
  msg("m-login", "Cuenta creada. Abre el email de confirmación, pulsa el enlace y luego entra aquí.", true);
};
// Supabase solo envía unos pocos emails por hora (gratis): si se pulsa muchas veces, deja de enviarlos un rato.
// Por eso el botón se queda parado 2 minutos tras enviar y el aviso explica qué hacer.
$("b-olvido").onclick = async () => {
  const email = $("email").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg("m-login", "Escribe arriba tu email y vuelve a pulsar.");
  let ultimo = 0; try { ultimo = +localStorage.getItem("ccoo-olvido") || 0; } catch (_) {}
  const falta = Math.ceil((ultimo + 120000 - Date.now()) / 1000);
  if (falta > 0) return verOlvido(email, `Ya se ha enviado el email hace un momento. Mira en Gmail (también en «Spam» o «Promociones»). Si no llega, puedes pedir otro dentro de ${falta} segundos.`);
  msg("m-login", "Enviando…", true);
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: aqui });
  if (error) return msg("m-login", /rate|429|too many/i.test(error.message + error.status)
    ? "Se han pedido demasiados emails seguidos y hay que esperar una hora. Si ya te llegó alguno, abre el último que llegó (los anteriores dejan de valer)."
    : "No se ha podido enviar: " + error.message);
  try { localStorage.setItem("ccoo-olvido", String(Date.now())); } catch (_) {}
  msg("m-login", "", true);
  verOlvido(email, `Email enviado. Si no llega en 5 minutos, mira en «Spam» o «Promociones».`);
};
// Contraseña nueva con el código del email, sin salir de la app (el enlace del email abre el navegador, no la app instalada)
function verOlvido(email, aviso) {
  $("olvido-email").textContent = email;
  ["olvido-codigo", "olvido-nueva", "olvido-repite"].forEach(i => $(i).value = "");
  mostrar("s-olvido"); msg("m-olvido", aviso || "", true);
  setTimeout(() => $("olvido-codigo").focus(), 50);
}
$("b-tengo-codigo").onclick = () => {
  const email = $("email").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg("m-login", "Escribe arriba tu email y vuelve a pulsar.");
  verOlvido(email);
};
// Código de rescate: contraseña nueva sin email (función «cuenta»). Los códigos se generan en Ajustes.
const llamaCuenta = async (body) => {
  const { data, error } = await sb.functions.invoke("cuenta", { body });
  if (error) { let m = ""; try { m = (await error.context?.json())?.error; } catch (_) {} throw new Error(m || "No hay conexión o el servidor no responde. Prueba otra vez."); }
  if (data?.error) throw new Error(data.error);
  return data || {};
};
$("b-rescate").onclick = () => {
  $("resc-email").value = $("email").value.trim();
  ["resc-codigo", "resc-nueva", "resc-repite"].forEach(i => $(i).value = "");
  msg("m-rescate", ""); mostrar("s-rescate"); setTimeout(() => $("resc-codigo").focus(), 50);
};
$("b-resc-volver").onclick = () => mostrar("s-login");
$("b-resc-guardar").onclick = async () => {
  const email = $("resc-email").value.trim(), codigo = $("resc-codigo").value.trim(), p = $("resc-nueva").value;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg("m-rescate", "Escribe tu email.");
  if (codigo.replace(/[^a-z0-9]/gi, "").length < 10) return msg("m-rescate", "Escribe el código completo: 10 letras y números.");
  const f = fallaPass(p); if (f) return msg("m-rescate", f);
  if (p !== $("resc-repite").value) return msg("m-rescate", "Las dos contraseñas no coinciden.");
  const btn = $("b-resc-guardar"); btn.disabled = true; msg("m-rescate", "Comprobando el código…", true);
  try {
    const r = await llamaCuenta({ accion: "usar_codigo", email, codigo, clave: p });
    msg("m-rescate", "Contraseña cambiada. Entrando…", true);
    const { error } = await sb.auth.signInWithPassword({ email, password: p });
    if (error) return msg("m-rescate", "La contraseña se ha cambiado, pero no ha podido entrar: vuelve atrás y entra con ella.");
    aviso(r.quedan ? `Contraseña cambiada. Te quedan ${r.quedan} códigos de rescate.` : "Contraseña cambiada. Ya no te quedan códigos: genera otros en Ajustes.");
    $("email").value = email;
  } catch (e) { msg("m-rescate", e.message); }
  finally { btn.disabled = false; }
};
$("resc-repite").onkeydown = (e) => { if (e.key === "Enter") $("b-resc-guardar").click(); };
$("b-olvido-volver").onclick = () => { msg("m-login", ""); mostrar("s-login"); };
$("b-olvido-otro").onclick = () => { mostrar("s-login"); $("b-olvido").click(); };
$("b-olvido-guardar").onclick = async () => {
  const email = $("olvido-email").textContent, codigo = $("olvido-codigo").value.replace(/\D/g, ""), p = $("olvido-nueva").value;
  if (codigo.length < 6) return msg("m-olvido", "Escribe el código de cifras que trae el email.");
  const f = fallaPass(p); if (f) return msg("m-olvido", f);
  if (p !== $("olvido-repite").value) return msg("m-olvido", "Las dos contraseñas no coinciden.");
  const btn = $("b-olvido-guardar"); btn.disabled = true; msg("m-olvido", "Comprobando el código…", true);
  CAMBIANDO_CLAVE = true;
  try {
    const { error: e1 } = await sb.auth.verifyOtp({ email, token: codigo, type: "recovery" });
    if (e1) { CAMBIANDO_CLAVE = false; return msg("m-olvido", /expired|invalid|not found/i.test(e1.message) ? "El código no vale: está mal escrito, ha caducado o ya se usó. Mira que sea el del último email, o pulsa «Enviar otro email»." : /rate|too many/i.test(e1.message) ? "Muchos intentos seguidos. Espera un par de minutos." : "No se ha podido comprobar: " + e1.message); }
    msg("m-olvido", "Guardando la contraseña…", true);
    const { error: e2 } = await sb.auth.updateUser({ password: p });
    if (e2 && !/same|different/i.test(e2.message)) {
      await sb.auth.signOut(); // sigue CAMBIANDO_CLAVE: que no salte a la pantalla de entrar y se vea el aviso
      return msg("m-olvido", /weak|pwned|leaked/i.test(e2.message) ? "Esa contraseña aparece en filtraciones de internet. Pide otro email y elige otra." : "No se ha podido guardar: " + e2.message);
    }
    CAMBIANDO_CLAVE = false;
    aviso("Contraseña guardada. Ya estás dentro.");
    const { data } = await sb.auth.getSession();
    iniciado = true; window.MI_EMAIL = data?.session?.user?.email || email;
    iniciar();
  } finally { CAMBIANDO_CLAVE = false; btn.disabled = false; }
};
$("olvido-codigo").oninput = () => { if ($("olvido-codigo").value.replace(/\D/g, "").length >= 6 && !$("olvido-nueva").value) $("olvido-nueva").focus(); };
$("olvido-repite").onkeydown = (e) => { if (e.key === "Enter") $("b-olvido-guardar").click(); };
// Si el enlace del email ya se usó o ha caducado, Supabase vuelve aquí con el error en la dirección
(() => {
  const h = new URLSearchParams(location.hash.slice(1));
  if (!h.get("error") && !h.get("error_code")) return;
  history.replaceState(null, "", location.pathname);
  setTimeout(() => msg("m-login", /expired|invalid/i.test(h.get("error_code") + h.get("error_description"))
    ? "Ese enlace ya no vale: ha caducado o ya se usó. Pulsa «He olvidado la contraseña» una vez y abre el email nuevo."
    : "No se ha podido abrir el enlace. Pulsa «He olvidado la contraseña» y prueba con el email nuevo."), 0);
})();
$("b-nueva").onclick = async () => {
  const f = fallaPass($("nueva").value); if (f) return msg("m-rec", f);
  const { error } = await sb.auth.updateUser({ password: $("nueva").value });
  if (error) return msg("m-rec", /same|different/i.test(error.message) ? "Es la misma que ya tenías: puedes entrar con ella. Si quieres otra, escribe una distinta."
    : /weak|pwned|leaked/i.test(error.message) ? "Esa contraseña aparece en filtraciones de internet. Elige otra."
    : /session|expired|jwt/i.test(error.message) ? "El enlace ha caducado. Vuelve a la pantalla de entrar y pulsa «He olvidado la contraseña» una vez." : "No se ha podido guardar: " + error.message);
  msg("m-rec", "Contraseña guardada. Ya estás dentro.", true); setTimeout(() => location.replace(aqui), 1200);
};
const salir = async () => { if (await confirmarSalida()) { await sb.auth.signOut(); location.replace(aqui); } };

// ---------- Navegación ----------
function pintaNav() {
  const cuenta = (k) => k === "buzon" && BUZON_SIN_LEER ? `<span class="cuenta-menu" aria-label="${BUZON_SIN_LEER} sin leer">${BUZON_SIN_LEER}</span>` : "";
  const b = (k, extra = "") => `<button data-p="${k}" class="${k === actual ? "activa" : ""} ${extra}">${icono(esc(PAGINAS[k].icono))}${esc(PAGINAS[k].nombre)}${cuenta(k)}</button>`;
  $("nav-admin").innerHTML =
    Object.keys(PAGINAS).map(k => (PAGINAS[k].cab ? `<div class="sep solo-pc"></div><div class="nav-cab solo-pc">${esc(PAGINAS[k].cab)}</div>` : PAGINAS[k].grupo ? `<div class="sep solo-pc"></div>` : "")
      + b(k, (EN_MOVIL.includes(k) ? "" : "solo-pc") + (PAGINAS[k].sub ? " sub" : ""))).join("") +
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
  $("hoja-mas").innerHTML = `<div class="buscador hoja-buscar">${icono("buscar", "p")}<input type="search" id="buscar-menu" placeholder="Buscar sección (actas, PRL, ajustes…)" aria-label="Buscar sección"></div>` +
    Object.keys(PAGINAS).filter(k => !EN_MOVIL.includes(k) || PAGINAS[k].sub).map(k =>
    (PAGINAS[k].cab ? `<p class="hoja-tit hoja-cab">${esc(PAGINAS[k].cab)}</p>` : PAGINAS[k].grupo ? `<div class="hoja-sep"></div>` : "") +
    `<button data-p="${k}" class="${PAGINAS[k].sub ? "sub" : ""}${k === actual ? " actual" : ""}">${icono(esc(PAGINAS[k].icono))}${esc(PAGINAS[k].nombre)}${k === "buzon" && BUZON_SIN_LEER ? `<span class="cuenta-menu">${BUZON_SIN_LEER}</span>` : ""}</button>`).join("") +
    (INSTALADA_A() ? "" : `<button id="m-instalar">${icono("descargar")}Instalar la app</button>`) +
    `<a href="index.html" target="_blank">${icono("ver")}Ver la web</a><button id="m-salir">${icono("salir")}Salir (${esc(window.MI_EMAIL || "")})</button><p class="fecha-txt" style="text-align:center;margin:6px 0 0">Versión ${VERSION_WEB}</p>`;
  ["velo-mas", "hoja-mas"].forEach(i => $(i).classList.remove("oculto"));
  $("hoja-mas").querySelectorAll("[data-p]").forEach(x => x.onclick = () => { cerrarMas(); abrir(x.dataset.p); });
  $("buscar-menu").oninput = () => {
    const q = $("buscar-menu").value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    $("hoja-mas").querySelectorAll("[data-p]").forEach(x => x.hidden = !!q && !x.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q));
    $("hoja-mas").querySelectorAll(".hoja-cab, .hoja-sep").forEach(x => x.hidden = !!q);
  };
  $("m-salir").onclick = () => { cerrarMas(); salir(); };
  if ($("m-instalar")) $("m-instalar").onclick = () => { cerrarMas(); instalarApp(); };
}
const cerrarMas = () => ["velo-mas", "hoja-mas"].forEach(i => $(i).classList.add("oculto"));
$("velo-mas").onclick = cerrarMas;

function abrir(k) {
  actual = k; history.replaceState(null, "", "#" + k); pintaNav(); window.scrollTo(0, 0);
  $("fab").classList.remove("oculto");
  const sec = SECCIONES[k];
  if (sec && !sec.oculta) { // dentro de una sección: crea ahí mismo (antes salía la lista de todo y parecía que te llevaba a otro sitio)
    $("fab").innerHTML = icono("mas") + `<span>${esc(/^ap\d+$/.test(k) ? "Publicar" : k === "recurrentes" ? "Nuevo" : sec.nuevo)}</span>`;
    $("fab").setAttribute("aria-label", sec.nuevo);
    $("fab").onclick = () => k === "calendario" ? abrirEditor("calendario", null, { fecha: VISTA_CAL.dia }) : abrirEditor(k);
  } else {
    $("fab").innerHTML = icono("mas") + "<span>Nuevo</span>";
    $("fab").onclick = abrirHojaNuevo; $("fab").setAttribute("aria-label", "Nuevo: elegir qué crear");
  }
  if (!window.ES_ADMIN) { $("zona").innerHTML = `<div class="panel vacio">${icono("alerta")}Esta cuenta (${esc(window.MI_EMAIL)}) no tiene permiso para publicar. Pide a la Sección Sindical que añada tu email en Ajustes.</div>`; return; }
  if (k === "resumen") pintaResumen();
  else if (k === "buzon") pintaBuzon();
  else if (k === "calculadoras") pintaCalculadoras();
  else if (k === "camiones") pintaCamiones();
  else if (k === "historial") pintaHistorial();
  else if (k === "textos") pintaTextos();
  else if (k === "ajustes") pintaAjustes();
  else if (k === "archivos") pintaTodosArchivos();
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
    <div id="aviso-buzon"></div>
    <div id="recordatorio-copia"></div>
    <div id="banda-instalar"></div>
    <h2 class="titulo-bloque">Visitas a la web</h2>
    <div class="panel visitas" id="visitas"><p class="fecha-txt">Cargando…</p></div>
    <h2 class="titulo-bloque">Estadísticas</h2>
    <div class="estadisticas">
      <section class="panel graf"><h3>Lo más leído</h3><p class="fecha-txt">Veces que se ha abierto cada cosa en la web. Anónimo: no se sabe quién.</p><div id="est-leido"><p class="fecha-txt">Cargando…</p></div></section>
      <section class="panel graf"><h3>Móviles con avisos activados</h3><p class="fecha-txt">Por semana.</p><div id="est-suscritos"><p class="fecha-txt">Cargando…</p></div></section>
      <section class="panel graf"><h3>Secciones más visitadas</h3><p class="fecha-txt">Últimos 30 días.</p><div id="est-secciones"><p class="fecha-txt">Cargando…</p></div></section>
    </div>
    <div class="resumen-rejilla">
      <div><h2 class="titulo-bloque">Próximos 14 días <a href="#" id="ir-cal">Ver calendario</a></h2><div class="panel proximos" id="proximos"><p class="fecha-txt">Cargando…</p></div></div>
      <div><h2 class="titulo-bloque">Avisos programados</h2><div class="panel proximos" id="programados"><p class="fecha-txt">Cargando…</p></div></div>
    </div>
    <h2 class="titulo-bloque">Lo último que has publicado</h2>
    <div class="cuentas" id="cuentas"></div>
    <div class="lista-adm" id="ultimos"><p class="fecha-txt">Cargando…</p></div>`;
  $("zona").querySelectorAll("[data-n]").forEach(b => b.onclick = () => abrirEditor(b.dataset.n));
  pintaBandaInstalar();
  contarBuzon().then(n => {
    if (!n || !$("aviso-buzon")) return;
    $("aviso-buzon").innerHTML = `<button class="panel banda aviso-buzon" id="ir-buzon"><span class="ic">${icono("correo")}</span><span class="txt"><b>${n === 1 ? "Tienes 1 mensaje sin leer" : `Tienes ${n} mensajes sin leer`} en el buzón anónimo</b><p>Preguntas y sugerencias de la plantilla.</p></span>${icono("der")}</button>`;
    $("ir-buzon").onclick = () => abrir("buzon");
  });
  $("zona").querySelector("[data-ir]").onclick = () => { abrir("ajustes"); setTimeout(() => $("ajuste-canales")?.scrollIntoView({ behavior: "smooth" }), 400); };
  sb.from("paginas").select("contenido").eq("slug", "ultima_copia").maybeSingle().then(({ data }) => {
    const f = data?.contenido, dias = f ? (Date.now() - new Date(f)) / 86400000 : Infinity;
    if (dias > 30 && $("recordatorio-copia")) {
      $("recordatorio-copia").innerHTML = `<button class="panel banda aviso-copia" id="ir-copia"><span class="ic">${icono("copia")}</span><span class="txt"><b>${f ? "Hace más de un mes de la última copia" : "Todavía no has hecho ninguna copia de seguridad"}</b><p>Descárgala en un minuto desde Ajustes y guárdala en el ordenador.</p></span>${icono("der")}</button>`;
      $("ir-copia").onclick = () => { abrir("ajustes"); setTimeout(() => $("ajuste-copia")?.scrollIntoView({ behavior: "smooth" }), 400); };
    }
  });
  // Sin repetir consultas: las publicaciones de todos los apartados en una sola (antes, una por apartado),
  // los apartados ya están cargados y lo de las calculadoras (secciones ocultas) no sale en el Inicio.
  const claves = Object.keys(SECCIONES).filter(k => !SECCIONES[k].oculta && !/^ap\d+$/.test(k) && k !== "apartados");
  const [pubs] = await Promise.all([
    sb.from("publicaciones").select("*").order("fecha", { ascending: false }).order("id", { ascending: false }),
    ...claves.map(cargarDatos)]);
  if (pubs.error) throw pubs.error;
  APARTADOS.forEach(a => { datos["ap" + a.id] = (pubs.data || []).filter(p => p.apartado_id === a.id); });
  datos.apartados = [...APARTADOS];
  $("cuentas").innerHTML = Object.entries(SECCIONES).filter(([, s]) => !s.oculta).map(([k, s]) => `<span class="etq">${(datos[k] || []).length} ${esc(s.nombre.toLowerCase())}</span>`).join("");
  const todos = Object.entries(SECCIONES).filter(([, s]) => !s.oculta).flatMap(([k, s]) => (datos[k] || []).map(x => ({ k, x, f: s.fechas(x)[1] || s.fechas(x)[0] })))
    .sort((a, b) => new Date(b.f) - new Date(a.f)).slice(0, 6);
  $("ultimos").innerHTML = todos.length ? todos.map(({ k, x }) => itemHTML(k, x, true)).join("") : `<div class="panel vacio">${icono("avisos")}Todavía no has publicado nada.</div>`;
  enlazarItems($("ultimos"));
  pintaVisitas();
  pintaEstadisticas();
  // Próximos días y programados
  $("ir-cal").onclick = (e) => { e.preventDefault(); VISTA_CAL.modo = "mes"; abrir("calendario"); };
  const hoy = hoyISO(), lim = isoLocal(new Date(Date.now() + 14 * 86400000));
  const prox = (datos.calendario || []).filter(e => e.fecha >= hoy && e.fecha <= lim).sort((a, b) => a.fecha.localeCompare(b.fecha) || String(a.hora || "").localeCompare(String(b.hora || "")));
  const fila = (k, x, cartelHTML, t, sub) => `<button class="fila-prox" data-k="${k}" data-id="${x.id}">${cartelHTML}<span class="txt"><b>${esc(t)}</b><small>${esc(sub)}</small></span>${icono("der", "p")}</button>`;
  $("proximos").innerHTML = prox.length ? prox.map(e => fila("calendario", e, cartel(e.fecha, e.tipo, "evento"), e.titulo,
      [mayus(fechaDia(e.fecha).toLocaleDateString("es-ES", { weekday: "long" })), e.hora, e.lugar].filter(Boolean).join(" · "))).join("")
    : `<p class="fecha-txt" style="margin:0">Nada en las próximas dos semanas. <a href="#" id="anadir-prox">Añadir una fecha</a></p>`;
  const prog = (datos.avisos || []).filter(a => a.publicar_en && new Date(a.publicar_en) > new Date()).sort((a, b) => new Date(a.publicar_en) - new Date(b.publicar_en));
  $("programados").innerHTML = prog.length ? prog.map(a => fila("avisos", a, cartel(partesFecha(a.publicar_en).iso, "", "aviso").replace('class="cartel c-gris"', 'class="cartel c-ambar"'), a.titulo,
      "Se publica " + new Date(a.publicar_en).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))).join("")
    : `<p class="fecha-txt" style="margin:0">No hay avisos programados. Al crear un aviso puedes elegir día y hora para que se publique solo.</p>`;
  document.querySelectorAll(".fila-prox").forEach(b => b.onclick = () => abrirEditor(b.dataset.k, datos[b.dataset.k].find(x => x.id == b.dataset.id)));
  if ($("anadir-prox")) $("anadir-prox").onclick = (e) => { e.preventDefault(); abrirEditor("calendario"); };
}

// Votos de las encuestas: solo el recuento por opción
let VOTOS = {};
async function cargarVotos() {
  const { data, error } = await sb.from("encuesta_votos").select("*");
  if (error) throw error;
  VOTOS = {}; (data || []).forEach(v => { (VOTOS[v.encuesta_id] = VOTOS[v.encuesta_id] || {})[v.opcion] = v.n; });
}

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
    aviso(e ? "No se ha podido guardar el orden: " + e.error.message : "Orden guardado. Ya se ve así en la web.", !!e);
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

function enlazarItems(cont) {
  cont.querySelectorAll(".item-adm[data-k]").forEach(b => b.onclick = () => abrirEditor(b.dataset.k, datos[b.dataset.k].find(x => x.id == b.dataset.id)));
  cont.querySelectorAll("[data-abrir-ap]").forEach(b => b.onclick = () => abrir("ap" + b.dataset.abrirAp));
  cont.querySelectorAll("[data-ajustes-ap]").forEach(b => b.onclick = () => abrirEditor("apartados", datos.apartados.find(x => x.id == b.dataset.ajustesAp)));
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
    <div class="lista-adm" id="lista"><p class="fecha-txt">Cargando…</p></div>`;
  $("b-nuevo").onclick = () => abrirEditor(k);
  if ($("b-recurrentes")) $("b-recurrentes").onclick = () => abrir("recurrentes");
  if ($("b-camiones")) $("b-camiones").onclick = () => abrir("camiones");
  if ($("b-archivos")) $("b-archivos").onclick = () => abrir("archivos");
  enlazarVistaCal();
  try { await Promise.all([cargarDatos(k), TABLAS_LEIDAS.includes(s.tabla) ? cargarLecturas() : null, k === "apartados" ? contarPublicaciones() : null, k === "encuestas" ? cargarVotos() : null]); } catch (e) { $("lista").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message)}</p>`; return; }
  const ff = FILTRO_ADM[k] ||= {};
  const pinta = () => {
    if (FECHA_DE[k]) pintaFechasAdm(datos[k], k, ff, pinta);
    const q = $("buscar").value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const l = datos[k].filter(x => pasaFechaAdm(ff, FECHA_DE[k]?.(x)) &&
      (!q || (JSON.stringify(x) + " " + textoFecha(FECHA_DE[k]?.(x))).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)));
    const ordenable = REORDENABLE(k) && !q && l.length > 1;
    if (!ordenable) $("ayuda-orden")?.remove();
    if (ordenable && !$("ayuda-orden")) $("lista").insertAdjacentHTML("beforebegin", `<p class="ayuda" id="ayuda-orden">${icono("arrastrar", "p")} Para cambiar el orden, arrastra desde las rayas de la izquierda (con el dedo o el ratón).</p>`);
    $("lista").innerHTML = l.length ? (ordenable ? l.map(x => filaOrden(k, x)).join("") : l.map(x => itemHTML(k, x)).join("")) :
      `<div class="panel vacio">${icono(s.icono)}${q || ff.a || ff.m || ff.d ? "Nada coincide con la búsqueda o la fecha." : `Todavía no hay nada. Pulsa «${s.nuevo}» para empezar.`}</div>`;
    enlazarItems($("lista"));
    if (ordenable) hacerOrdenable($("lista"), k);
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
  if (c.t === "select" && c.ops) return `<label for="${id}">${c.l}</label><select id="${id}">${c.ops.map(([val, txt]) => `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(txt)}</option>`).join("")}</select>${ayuda}`;
  if (c.t === "select") {
    const ops = nombres(c.lista); if (v && !ops.includes(v)) ops.push(v);
    return `<label for="${id}">${c.l}</label><select id="${id}">${ops.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
      <p class="ayuda">¿Falta una opción? Añádela en Ajustes.</p>`;
  }
  if (c.t === "textarea") return `<label for="${id}">${c.l}${opc}</label><textarea id="${id}" spellcheck="true" autocapitalize="sentences" autocorrect="on" ${c.corto ? 'style="min-height:90px"' : ""}>${esc(v || "")}</textarea>${ayuda}${c.formato ? FORMATO : ""}`;
  if (c.t === "archivos" || c.t === "archivo") {
    const multi = c.t === "archivos";
    return `<label>${c.l}${opc}</label>
      <label class="dropzone" id="dz-${c.k}">
        ${icono("subir")}<b>${multi ? "Toca para elegir archivos" : "Toca para elegir el archivo"}</b>
        <span>${multi ? "Puedes elegir varios a la vez. " : ""}PDF, fotos, Word, Excel o PowerPoint · máx. ${MAX_MB} MB</span>
        <input type="file" id="${id}" ${multi ? "multiple" : ""} accept="${ACEPTA_ARCHIVOS}">
      </label>${ayuda}
      <div class="archivos" id="lista-${c.k}"></div>`;
  }
  if (c.t === "datetime-local") {
    const loc = v ? new Date(new Date(v) - new Date(v).getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "";
    return `<label for="${id}">${c.l}${opc}</label><input id="${id}" type="datetime-local" value="${loc}">${ayuda}`;
  }
  return `<label for="${id}">${c.l}${opc}</label><input id="${id}" type="${c.t}" value="${esc(v ?? "")}" ${c.t === "text" ? 'spellcheck="true" autocapitalize="sentences" autocorrect="on"' : ""} ${c.ph ? `placeholder="${esc(c.ph)}"` : ""} ${c.paso ? `step="${c.paso}" min="0" inputmode="decimal"` : ""}>${ayuda}`;
}
const camposPlanos = (s) => s.campos.flatMap(c => c.fila || c.checks?.map(x => ({ ...x, t: "check" })) || [c]);

function abrirEditor(k, orig = null, preset = {}) {
  const s = SECCIONES[k];
  if (actual !== k && actual !== "resumen" && actual !== "calendario" && !s.oculta) abrir(k);
  const x = orig || {};
  ED = { k, orig, pendientes: [], existentes: orig ? (s.campos.some(c => c.t === "archivos") ? [...(orig.adjuntos || [])] : (orig.url ? [{ nombre: orig.nombre_archivo || "Archivo", url: orig.url, tipo: orig.tipo_archivo, tamano: orig.tamano }] : [])) : [], quitar: [], sucio: false };
  const def = { orden: Math.max(0, ...(datos[k] || []).map(d => d.orden || 0)) + 1, fecha: k === "calendario" || s.filtro ? hoyISO() : undefined, ...preset };
  $("ed-modo").innerHTML = orig ? `${icono("editar", "p")}Editando ${s.uno}` : `${icono("mas", "p")}${s.nuevo}`;
  $("ed-modo").className = orig ? "editando" : "";
  $("ed-titulo").textContent = orig ? ((s.tituloDe ? s.tituloDe(orig) : orig.titulo) || "Sin título") : "Sin título todavía";
  $("ed-borrar").innerHTML = icono("borrar", "p") + "<span>Borrar</span>";
  $("ed-borrar").classList.toggle("oculto", !orig);
  $("ed-duplicar").classList.toggle("oculto", !orig || k === "documentos");
  $("ed-duplicar").innerHTML = icono("copia", "p") + "<span>Duplicar</span>";
  $("ed-guardar").innerHTML = icono(orig ? "check" : "subir", "p") + (orig ? "Guardar cambios" : (k === "documentos" ? "Subir" : "Publicar"));
  $("ed-guardar").disabled = false; msg("ed-msg", "");

  $("ed-form").innerHTML =
    (k === "apartados" && orig ? `<div class="aviso-ajustes"><p>Aquí solo cambias el nombre y el aspecto. Para subir documentos y fotos, pulsa «Abrir y publicar contenido».</p>
      <button class="btn" type="button" id="ed-abrir-ap">${icono("carpeta", "p")}Abrir y publicar contenido</button></div>` : "") +
    (s.ayuda ? `<p class="ayuda" style="margin-top:14px">${s.ayuda}</p>` : "") +
    (k === "avisos" && !orig ? `<div class="desde-plantilla oculto" id="desde-plantilla">${icono("plantilla", "p")}<label for="sel-plantilla">Empezar desde una plantilla</label>
      <select id="sel-plantilla"><option value="">— En blanco —</option></select></div>` : "") +
    (s.asistente && !orig ? asistenteHTML() : "") +
    (s.asistente && !orig ? `<div class="separador">Revisa el acta y publícala</div>` : "") +
    s.campos.map(c => {
      if (c.fila) return `<div class="fila">${c.fila.map(f => `<div${f.si ? ` data-si="${f.si}"` : ""}>${campoHTML(f, x[f.k] ?? def[f.k] ?? f.def)}</div>`).join("")}</div>`;
      if (c.checks) { const v = c.checks.filter(ch => !(ch.soloNuevo && orig)); return v.length ? `<div class="grupo-check">${v.map(ch => `<label class="check"><input type="checkbox" id="f-${ch.k}" ${(x[ch.k] ?? ch.def) ? "checked" : ""}>${ch.l}</label>`).join("")}</div>` : ""; }
      return c.si ? `<div data-si="${c.si}">${campoHTML(c, x[c.k] ?? def[c.k] ?? c.def)}</div>` : campoHTML(c, x[c.k] ?? def[c.k] ?? c.def);
    }).join("");

  if ($("ed-abrir-ap")) $("ed-abrir-ap").onclick = async () => { const id = ED.orig.id; await cerrarEditor(); if (!ED) abrir("ap" + id); };
  // archivos
  s.campos.filter(c => c.t === "archivos" || c.t === "archivo").forEach(c => prepararArchivos(c));
  // cambios → vista previa
  $("ed-form").querySelectorAll("input:not([type=file]), textarea, select").forEach(el => {
    el.addEventListener("input", () => { ED.sucio = true; actualizarPrevia(); });
    el.addEventListener("change", () => { ED.sucio = true; actualizarPrevia(); });
  });
  ofrecerBorrador();
  if (s.asistente && !orig) prepararAsistente();
  if (k === "avisos" && !orig) prepararPlantillas();
  actualizarPrevia();
  cambiarPestana("form");
  ["velo-ed", "editor"].forEach(i => $(i).classList.remove("oculto"));
  document.body.style.overflow = "hidden";
  if (!history.state?.editor) history.pushState({ editor: 1 }, ""); // el botón «atrás» del móvil cierra el editor
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
  dz.ondrop = (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.remove("encima"); $("editor").classList.remove("soltando"); añadir(e.dataTransfer.files); };
  ED.añadir = añadir; // para soltar archivos en cualquier parte del editor o pegarlos
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

// ---------- Corrector de ortografía (Gemini, gratis) ----------
// Al guardar, los títulos y textos que han cambiado pasan por la función «corregir». Si propone cambios,
// se enseñan marcados y se elige: corregir y guardar, guardar sin corregir o volver a editar.
// Si el corrector no responde (sin conexión, límite gratuito…), se guarda igual sin molestar.
const NO_CORREGIR = ["url", "email", "telefono", "slug", "icono", "fuente", "idioma", "pais"];
function difHTML(a, b) {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
  if (A.length * B.length > 3e6) return `<ins>${esc(b)}</ins>`;
  const L = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0, h = "";
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { h += esc(A[i]); i++; j++; }
    else if (i < A.length && (j >= B.length || L[i + 1][j] >= L[i][j + 1])) { if (!/^\s+$/.test(A[i])) h += `<del>${esc(A[i])}</del> `; i++; }
    else { h += /^\s+$/.test(B[j]) ? esc(B[j]) : `<ins>${esc(B[j])}</ins>`; j++; }
  }
  return h;
}
async function revisarOrtografia(s, fila) {
  const campos = camposPlanos(s).filter(c => (c.t === "text" || c.t === "textarea") && !NO_CORREGIR.includes(c.k)
    && typeof fila[c.k] === "string" && /\p{L}{3}/u.test(fila[c.k]) && fila[c.k] !== (ED.orig?.[c.k] ?? ""));
  if (!campos.length) return true;
  const btn = $("ed-guardar"); btn.disabled = true;
  msg("ed-msg", "Revisando la ortografía…", true);
  let res = null;
  try {
    const r = await Promise.race([
      sb.functions.invoke("corregir", { body: { textos: Object.fromEntries(campos.map(c => [c.k, fila[c.k]])) } }),
      new Promise(ok => setTimeout(() => ok({}), 15000))]);
    res = r?.data?.textos || null;
  } catch (e) { console.warn("corrector", e); }
  btn.disabled = false; msg("ed-msg", "");
  if (!res) return true;
  const cambios = campos.filter(c => typeof res[c.k] === "string" && res[c.k] !== fila[c.k]);
  if (!cambios.length) return true;
  return new Promise(ok => {
    const v = document.createElement("div"); v.className = "modal-velo";
    v.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="corr-t"><h2 id="corr-t">Revisa la ortografía</h2>
      <p class="ayuda">El corrector propone estos cambios: <ins>en verde, lo nuevo</ins>; <del>tachado, lo que se quita</del>.</p>
      ${cambios.map(c => `<div class="corr-campo"><b>${esc(c.l)}</b><div class="corr-dif">${difHTML(fila[c.k], res[c.k])}</div></div>`).join("")}
      <div class="botones"><button class="btn" data-r="si">${icono("check", "p")}Corregir y guardar</button><button class="btn sec" data-r="no">Guardar sin corregir</button><button class="btn sec" data-r="volver">Volver a editar</button></div></div>`;
    const fin = (r) => {
      v.remove();
      if (r === "si") cambios.forEach(c => { fila[c.k] = res[c.k]; const el = $("f-" + c.k); if (el) el.value = res[c.k]; });
      ok(r !== "volver");
    };
    v.querySelectorAll("[data-r]").forEach(b => b.onclick = () => fin(b.dataset.r));
    v.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); fin("volver"); } });
    document.body.appendChild(v); v.querySelector("[data-r=si]").focus();
  });
}
function leerFormulario() {
  const s = SECCIONES[ED.k], fila = {};
  for (const c of camposPlanos(s)) {
    if (c.t === "archivos" || c.t === "archivo") continue;
    const el = $("f-" + c.k); if (!el) continue;
    if (c.t === "check") fila[c.k] = el.checked;
    else if (c.t === "datetime-local") fila[c.k] = el.value ? new Date(el.value).toISOString() : null;
    else if (c.num) fila[c.k] = parseInt(el.value, 10) || 1;
    else if (c.t === "number") fila[c.k] = c.dec ? (parseFloat(String(el.value).replace(",", ".")) || 0) : parseInt(el.value || "0", 10);
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
  if (ED.k === "calendario" || s.filtro) x.fecha = f.fecha || hoyISO();
  $("ed-titulo").textContent = (s.tituloDe ? s.tituloDe(f) : f.titulo) || (ED.orig ? "Sin título" : "Sin título todavía");
  $("ed-previa").innerHTML = s.previa(x);
  $("ed-previa").querySelectorAll("[data-canal]").forEach(b => b.onclick = () => { PREVIA_CANAL = b.dataset.canal; actualizarPrevia(); });
  aplicarCondiciones();
  if (["avisos", "recurrentes"].includes(ED.k)) avisoTitulo(f);
  $("ed-previa").querySelectorAll("a").forEach(a => a.onclick = (e) => { if (a.getAttribute("href") === "#" || a.href.startsWith("blob:")) e.preventDefault(); });
}
function cambiarPestana(p) {
  $("editor").classList.toggle("ver-previa", p === "previa");
  document.querySelectorAll(".ed-pestanas button").forEach(b => b.classList.toggle("activa", b.dataset.p === p));
}
document.querySelectorAll(".ed-pestanas button").forEach(b => b.onclick = () => cambiarPestana(b.dataset.p));

async function confirmarSalida() { return !ED || !ED.sucio || confirm("Tienes cambios sin guardar. ¿Salir sin guardar? (Se perderá el borrador.)"); }
async function cerrarEditor(desdeAtras) {
  if (!ED) return;
  if (!(await confirmarSalida())) { if (desdeAtras) history.pushState({ editor: 1 }, ""); return; }
  if (ED.sucio) quitarBorrador(); // ha dicho «salir sin guardar»
  ED.pendientes.forEach(p => p.vista && URL.revokeObjectURL(p.vista));
  ED = null; BUZON_A_PREGUNTA = null;
  ["velo-ed", "editor"].forEach(i => $(i).classList.add("oculto"));
  document.body.style.overflow = "";
  if (!desdeAtras && history.state?.editor) await new Promise(r => { addEventListener("popstate", r, { once: true }); history.back(); setTimeout(r, 500); });
}
$("editor").addEventListener("dragover", (e) => { if (!ED?.añadir || !e.dataTransfer?.types?.includes("Files")) return; e.preventDefault(); $("editor").classList.add("soltando"); });
$("editor").addEventListener("dragleave", (e) => { if (!e.relatedTarget || !$("editor").contains(e.relatedTarget)) $("editor").classList.remove("soltando"); });
$("editor").addEventListener("drop", (e) => { if (!ED?.añadir) return; e.preventDefault(); $("editor").classList.remove("soltando"); if (e.dataTransfer.files.length) { cambiarPestana("form"); ED.añadir(e.dataTransfer.files); } });
document.addEventListener("paste", (e) => { if (!ED?.añadir) return; const f = [...(e.clipboardData?.files || [])]; if (f.length) { e.preventDefault(); ED.añadir(f); aviso(f.length === 1 ? "Archivo pegado." : f.length + " archivos pegados."); } });
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
  if (ED.k === "encuestas") {
    const n = opcionesEncuesta(fila).length;
    if (n < 2 || n > 6) { cambiarPestana("form"); $("f-opciones")?.focus(); return msg("ed-msg", "Pon de 2 a 6 opciones, una por línea."); }
  }
  if (!(await revisarOrtografia(s, fila))) return;
  if (["enlaces", "restricciones"].includes(ED.k) && fila.url && !/^https?:\/\//.test(fila.url)) fila.url = "https://" + fila.url;
  if (s.filtro) Object.assign(fila, s.filtro);
  if ((fila.publicado === false || fila.publicada === false) && !ED.orig) fila.notificar = false;
  if (ED.k === "apartados") {
    fila.descripcion = fila.descripcion || "";
    if (!ED.orig) { // dirección de la pestaña: #ap-comite-de-empresa (no cambia aunque luego se cambie el nombre)
      let base = fila.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36) || "apartado", slug = base, n = 2;
      while ((datos.apartados || []).some(a => a.slug === slug)) slug = base + "-" + n++;
      fila.slug = slug;
    }
  }
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
    if (ED.k === "preguntas" && BUZON_A_PREGUNTA) { await sb.from("buzon").update({ archivado: true, leido: true }).eq("id", BUZON_A_PREGUNTA); BUZON_A_PREGUNTA = null; contarBuzon().then(pintaNav); }
    // Los archivos quitados se conservan: así se pueden recuperar desde el Historial. Se limpian en Ajustes.
    const editado = !!ED.orig, k = ED.k;
    quitarBorrador(); ED.sucio = false; await cerrarEditor();
    if (k === "apartados") { await cargarApartados(); pintaNav(); }
    if (k === "apartados" && !editado && SECCIONES["ap" + guardado.id]) {
      abrir("ap" + guardado.id);
      return aviso("Apartado creado. Ahora pulsa «Publicar» para subir textos, fotos y documentos.");
    }
    abrir(["resumen", "calendario"].includes(actual) ? actual : (s.volver || k));
    if (fila.publicado === false || fila.publicada === false || (k === "convenio" && fila.visible === false)) return aviso(editado ? "Cambios guardados. Está oculto: no se ve en la web." : "Guardado sin publicar: no se ve en la web y no se ha avisado a nadie. Para publicarlo, ábrelo y marca «Se ve en la web».");
    if (editado || s.oculta) return aviso(editado ? "Cambios guardados. Ya se ven en la web." : "Guardado. Ya se ve en la web.");
    // Avisar a los móviles y a Telegram
    let res = null;
    if (fila.notificar !== false && k !== "apartados" && k !== "recurrentes" && !s.oculta) {
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
  if (ED.k === "apartados") {
    const { data: pubs } = await sb.from("publicaciones").select("adjuntos").eq("apartado_id", x.id);
    if ((pubs || []).length) {
      const n = pubs.length, r = prompt(`El apartado «${x.titulo}» tiene ${n} ${n === 1 ? "publicación" : "publicaciones"}. Si lo borras, se ${n === 1 ? "borrará" : "borrarán"} también, con sus fotos y documentos.\n\nSi solo quieres que no se vea, pulsa Cancelar y desmarca «Se ve en la web».\n\nPara borrarlo todo, escribe BORRAR:`);
      if ((r || "").trim().toUpperCase() !== "BORRAR") return aviso("No se ha borrado nada.");
    } else if (!confirm(`¿Borrar el apartado «${x.titulo}»? Está vacío. Desaparecerá de la web.`)) return;
  }
  if (ED.k !== "apartados" && !confirm(`¿Borrar «${(s.tituloDe ? s.tituloDe(x) : x.titulo)}»? Desaparecerá de la web. Si te equivocas, puedes recuperarlo en «Historial».`)) return;
  const { error } = await sb.from(s.tabla).delete().eq("id", x.id);
  if (error) return msg("ed-msg", "No se ha podido borrar: " + error.message);
  // Los archivos se conservan para poder recuperarlo desde el Historial (se limpian en Ajustes > Archivos sin usar).
  ED.sucio = false; const k = ED.k; await cerrarEditor();
  if (k === "apartados") { await cargarApartados(); pintaNav(); }
  aviso("Borrado."); abrir(["resumen", "calendario"].includes(actual) ? actual : (s.volver || k));
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
  if (!window.JSZip) await new Promise((ok, mal) => { const sc = document.createElement("script"); sc.src = "lib/jszip.min.js"; sc.onload = ok; sc.onerror = () => mal(new Error("No se ha podido abrir el Word. Guárdalo como PDF y súbelo otra vez.")); document.head.appendChild(sc); });
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

// ---------- Vista previa en todos los canales (avisos) ----------
// Recorta igual que la función «notificar» del servidor, para que lo que se ve aquí sea lo que llega.
let PREVIA_CANAL = "web";
const LIM_TIT_NOTIF = 45; // letras que se suelen ver del título de una notificación en el móvil
const recortaCanal = (t, n) => { t = String(t || "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
const tituloNotif = (x) => (x.urgente ? "URGENTE: " : "Nuevo aviso: ") + (x.titulo || "Sin título");
function previaCanales(x) {
  const tit = tituloNotif(x), corta = tit.length > LIM_TIT_NOTIF, nAdj = (x.adjuntos || []).length, largo = recortaCanal(x.contenido, 100000);
  const tg = recortaCanal(x.contenido, 700) + (nAdj ? `\n\nArchivos adjuntos: ${nAdj}` : "");
  const wa = textoCompartir((x.urgente ? "URGENTE: " : "") + (x.titulo || ""), x.contenido, x.id ? "aviso-" + x.id : "avisos");
  const notas = [];
  if (corta) notas.push(`El título se cortará en la notificación del móvil: se ven unas ${LIM_TIT_NOTIF} letras y tiene ${tit.length} (contando «${x.urgente ? "URGENTE: " : "Nuevo aviso: "}»).`);
  if (largo.length > 140) notas.push("El texto se corta en la notificación; se lee entero al abrirla.");
  if (x.notificar === false) notas.push("La casilla de avisar está desmarcada: no llegará a los móviles ni a Telegram.");
  if (x.publicar_en && new Date(x.publicar_en) > new Date()) notas.push("Está programado: la notificación y Telegram llegarán cuando se publique.");
  const canal = (k, nom, html) => `<section class="canal-p ${PREVIA_CANAL === k ? "activo" : ""}"><h4>${nom}</h4>${html}</section>`;
  return `<div class="canales-previa">
    ${notas.length ? `<div class="aviso-corte" role="status">${notas.map(n => `<p>${icono("alerta", "p")}<span>${esc(n)}</span></p>`).join("")}</div>` : ""}
    <div class="tabs-canal" role="tablist" aria-label="Ver cómo queda en">${[["web", "Web"], ["movil", "Móvil"], ["telegram", "Telegram"], ["whatsapp", "WhatsApp"]].map(([k, n]) =>
      `<button type="button" role="tab" data-canal="${k}" aria-selected="${PREVIA_CANAL === k}">${n}</button>`).join("")}</div>
    ${canal("web", "En la web", tarjetaAviso({ ...x, id: x.id || 0 }))}
    ${canal("movil", "Notificación en el móvil", `<div class="notif"><img src="icon-192.png" alt=""><div class="notif-txt"><small>CCOO Calsina Carré · ahora</small><b class="${corta ? "corta" : ""}">${esc(tit)}</b><span>${esc(recortaCanal(x.contenido, 140))}</span></div></div>`)}
    ${canal("telegram", "Canal de Telegram", `<div class="chat tg"><div class="burbuja"><b>${esc(tit)}</b>${tg.trim() ? "<br><br>" + esc(tg).replace(/\n/g, "<br>") : ""}</div><div class="tg-boton">Abrir en la web</div></div>`)}
    ${canal("whatsapp", "WhatsApp (lo envías tú con el botón)", `<div class="chat wa"><div class="burbuja">${esc(wa).replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</div></div>`)}
  </div>`;
}
// Aviso bajo el título mientras se escribe
function avisoTitulo(f) {
  const campo = $("f-titulo"); if (!campo) return;
  let p = $("aviso-titulo"); if (!p) { campo.insertAdjacentHTML("afterend", `<p class="ayuda" id="aviso-titulo" aria-live="polite"></p>`); p = $("aviso-titulo"); }
  const n = tituloNotif(f).length;
  p.className = "ayuda" + (n > LIM_TIT_NOTIF ? " corte" : "");
  p.textContent = n > LIM_TIT_NOTIF ? `Demasiado largo para la notificación del móvil: se cortará. Prueba a dejarlo en ${LIM_TIT_NOTIF - (n - (f.titulo || "").length)} letras o menos (ahora ${(f.titulo || "").length}).` : `${(f.titulo || "").length} letras: se leerá entero en la notificación.`;
}
// Campos que solo se ven según otra opción (data-si="campo:valor1,valor2")
function aplicarCondiciones() {
  document.querySelectorAll("#ed-form [data-si]").forEach(d => {
    const [campo, vals] = d.dataset.si.split(":"), el = $("f-" + campo);
    d.classList.toggle("oculto", !!el && !vals.split(",").includes(el.value));
  });
}

// ---------- Avisos que se repiten solos ----------
const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const horaCorta = (h) => String(h || "09:00").slice(0, 5);
function frecTxt(x) {
  if (x.frecuencia === "semanal") return `Cada ${DIAS_SEMANA[(x.dia_semana || 1) - 1]} a las ${horaCorta(x.hora)}`;
  if (x.frecuencia === "anual") return `Cada ${x.dia_mes || 1} de ${MESES[(x.mes || 1) - 1]} a las ${horaCorta(x.hora)}`;
  return `El día ${x.dia_mes || 1} de cada mes a las ${horaCorta(x.hora)}`;
}
// Próxima vez que se publicará (misma regla que la función publicar_recurrentes del servidor)
function proximaVez(x) {
  if (x.activo === false) return "pausado, no se publicará";
  const ahora = new Date(), [hh, mm] = horaCorta(x.hora).split(":").map(Number), hoyIso = isoLocal(ahora);
  for (let i = 0; i < 400; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + i), ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const toca = x.frecuencia === "semanal" ? ((d.getDay() + 6) % 7) + 1 === Number(x.dia_semana || 1)
      : x.frecuencia === "anual" ? d.getMonth() + 1 === Number(x.mes || 1) && d.getDate() === Math.min(Number(x.dia_mes || 1), ultimo)
      : d.getDate() === Math.min(Number(x.dia_mes || 1), ultimo);
    if (!toca) continue;
    if (i === 0 && (x.ultima_publicacion === hoyIso || ahora.getHours() * 60 + ahora.getMinutes() > hh * 60 + mm + 9)) continue; // hoy ya pasó o ya salió
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " a las " + horaCorta(x.hora);
  }
  return "—";
}
SECCIONES.recurrentes = {
  nombre: "Avisos que se repiten", icono: "reloj2", tabla: "avisos_recurrentes", orden: ["id", false], uno: "aviso que se repite", nuevo: "Nuevo aviso que se repite", lista: "aviso", campoColor: "categoria",
  intro: "Avisos que se publican solos cada semana, cada mes o cada año, a la hora que elijas. Por ejemplo: «Recuerda entregar la hoja de horas», el día 25 de cada mes.",
  campos: [
    { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Recuerda entregar la hoja de horas" },
    { k: "categoria", l: "Categoría", t: "select", lista: "aviso" },
    { k: "contenido", l: "Texto del aviso", t: "textarea", formato: true },
    { k: "frecuencia", l: "Cada cuánto se publica", t: "select", ops: [["mensual", "Cada mes"], ["semanal", "Cada semana"], ["anual", "Cada año"]], def: "mensual" },
    { fila: [
      { k: "dia_mes", l: "Día del mes", t: "select", num: true, ops: Array.from({ length: 31 }, (_, i) => [i + 1, String(i + 1)]), def: 1, si: "frecuencia:mensual,anual" },
      { k: "mes", l: "Mes", t: "select", num: true, ops: MESES.map((m, i) => [i + 1, m.charAt(0).toUpperCase() + m.slice(1)]), def: 1, si: "frecuencia:anual" },
      { k: "dia_semana", l: "Día de la semana", t: "select", num: true, ops: DIAS_SEMANA.map((d, i) => [i + 1, d.charAt(0).toUpperCase() + d.slice(1)]), def: 1, si: "frecuencia:semanal" },
      { k: "hora", l: "Hora", t: "time", def: "09:00" },
    ] },
    { checks: [{ k: "activo", l: "Activo (desmárcalo para pausarlo sin borrarlo)", def: true }, { k: "urgente", l: "Urgente: sale en rojo y arriba del todo" }, { k: "notificar", l: "Avisar en los móviles y en Telegram cada vez", def: true }] },
  ],
  ayuda: "Si eliges el día 31 y el mes tiene menos días, se publica el último día del mes.",
  previa: (x) => `<p class="proxima-vez">${icono("reloj2", "p")}<span>${esc(frecTxt(x))}.<br><b>Próxima vez: ${esc(proximaVez(x))}</b></span></p>` + previaCanales({ ...x, fecha: new Date().toISOString(), id: 0 }),
  extracto: (x) => x.contenido, chips: (x) => [frecTxt(x), x.activo === false ? "Pausado" : "Activo", x.ultima_publicacion && "Última vez: " + fechaLarga(x.ultima_publicacion + "T12:00:00")], fechas: (x) => [x.creado, x.actualizado],
};

// ---------- Historial y deshacer ----------
const NOMBRE_TABLA = { comunicados: "el aviso", eventos: "la fecha", convenio_secciones: "el apartado del convenio", actas: "el acta", documentos: "el documento",
  preguntas: "la pregunta frecuente", plantillas: "la plantilla", delegados: "el delegado", enlaces: "el enlace", apartados: "el apartado de la web",
  publicaciones: "la publicación", opciones: "la opción de lista", calc_permisos: "el permiso de la calculadora", calc_categorias: "el precio de horas extra",
  avisos_recurrentes: "el aviso que se repite", buzon: "el mensaje del buzón", paginas: "el texto", calc_ajustes: "el ajuste de la calculadora", admins: "el administrador", restricciones: "el país de restricciones para camiones" };
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
  if (error) { $("lista-hist").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(error.message)}</p>`; return; }
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
    if (e) { b.disabled = false; return aviso(e.message || "No se ha podido.", true); }
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
  } catch (e) { msg("m-limpiar", "No se ha podido: " + (e.message || e)); }
  finally { b.disabled = false; }
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
  } catch (e) { $("lista-arch").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message || e)}</p>`; return; }
  todos.sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
  const clase = (a) => esImagen(a) ? "foto" : /pdf/i.test(a.tipo || "") || /\.pdf$/i.test(a.nombre || "") ? "pdf" : "otro";
  const sinAcentos = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const pinta = () => {
    const q = sinAcentos($("buscar").value.trim());
    const l = todos.filter(a => (FILTRO_ARCH === "todo" || clase(a) === FILTRO_ARCH) && (!q || sinAcentos([a.nombre, a.titulo, a.sec, textoFecha(a.fecha)].join(" ")).includes(q)));
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
      try { if (!datos[a.k]?.some(x => x.id === a.id)) await cargarDatos(a.k); } catch (e) { return aviso("No se ha podido abrir: " + e.message, true); }
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
    msg("ca-msg", error ? "No se ha podido guardar: " + error.message : "Guardado. Ya se usa en la web.", !error);
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
  } catch (e) { $("lista-restricciones").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(e.message)}</p>`; return; }
  $("rv-guardar").onclick = async () => {
    const { error } = await sb.from("paginas").upsert({ slug: "restricciones_revisado", contenido: $("rv-fecha").value, actualizado: new Date().toISOString() });
    msg("rv-msg", error ? "No se ha podido guardar: " + error.message : "Guardado. Ya se ve en la web.", !error);
  };
  const l = datos.restricciones;
  $("lista-restricciones").innerHTML = l.length ? l.map(x => filaOrden("restricciones", x)).join("") : `<div class="panel vacio">${icono("lugar")}No hay ningún país. Pulsa «Añadir país». Sin países, el bloque no sale en la web.</div>`;
  enlazarItems($("lista-restricciones"));
  if (l.length > 1) hacerOrdenable($("lista-restricciones"), "restricciones");
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
  if (error) { $("lista-buzon").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(error.message)}</p>`; return; }
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
    if (r?.error) return aviso("No se ha podido: " + r.error.message, true);
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
    <div class="botones"><button class="btn" id="b-textos">${icono("check", "p")}Guardar textos</button></div>
    <div class="msg" id="m-textos"></div></div>`;
  $("b-textos").onclick = async () => {
    const filas = TEXTOS.map(t => ({ slug: t.slug, contenido: $("t-" + t.slug).value, actualizado: new Date().toISOString() }));
    const { error } = await sb.from("paginas").upsert(filas);
    error ? msg("m-textos", "No se ha podido guardar: " + error.message) : aviso("Textos guardados. Ya se ven en la web.");
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
// ---------- Verificación en dos pasos (Ajustes) ----------
async function pinta2p() {
  const z = $("zona-2p"); if (!z) return;
  const { data, error } = await sb.auth.mfa.listFactors();
  if (error) { z.innerHTML = `<p class="fecha-txt">No se ha podido comprobar. Vuelve a abrir Ajustes en un momento.</p>`; return; }
  const activo = (data.totp || []).find(f => f.status === "verified");
  if (activo) {
    z.innerHTML = `<p class="msg ok" style="margin:0">${icono("check", "p")} Activada desde el ${new Date(activo.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}.</p>
      <p class="ayuda">Si cambias de móvil, desactívala aquí antes y vuelve a activarla con el nuevo.</p>
      <div class="botones" style="margin-top:8px"><button class="btn sec" id="b-2p-quitar">${icono("borrar", "p")}Desactivar</button></div>`;
    $("b-2p-quitar").onclick = async () => {
      if (!confirm("¿Desactivar la verificación en dos pasos? Para entrar solo hará falta la contraseña.")) return;
      const { error } = await sb.auth.mfa.unenroll({ factorId: activo.id });
      if (error) return msg("m-2p", "No se ha podido desactivar. Sal, vuelve a entrar con el código y prueba otra vez.");
      await sb.auth.refreshSession(); msg("m-2p", "Desactivada.", true); pinta2p();
    };
    return;
  }
  z.innerHTML = `<div class="botones"><button class="btn" id="b-2p-activar">${icono("admin", "p")}Activar</button></div>`;
  $("b-2p-activar").onclick = async () => {
    msg("m-2p", "Preparando…", true);
    // Si quedó un intento a medias, se quita antes de empezar otro
    for (const f of (data.all || []).filter(f => f.factor_type === "totp" && f.status !== "verified")) await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data: e, error } = await sb.auth.mfa.enroll({ factorType: "totp", issuer: "CCOO Calsina", friendlyName: "Móvil " + Date.now() });
    if (error) return msg("m-2p", "No se ha podido empezar: " + error.message);
    msg("m-2p", "", true);
    z.innerHTML = `<ol class="pasos-2p">
        <li>Instala en el móvil la app gratuita <b>Google Authenticator</b> (en Play Store o App Store).</li>
        <li>En la app, toca <b>+</b> y <b>Escanear un código QR</b>, y escanea este código:
          <img class="qr-2p" src="${esc(e.totp.qr_code)}" alt="Código QR para la app de códigos">
          Si estás usando el panel en el mismo móvil, toca <b>Introducir clave de configuración</b> y escribe esta clave (nombre: CCOO Calsina):
          <div class="clave-2p" id="clave-2p">${esc(e.totp.secret)}</div>
          <button class="btn sec peq" id="b-2p-copiar" style="margin-top:6px">${icono("copia", "p")}Copiar la clave</button></li>
        <li>Escribe el código de 6 cifras que sale en la app:
          <input id="codigo-2p" inputmode="numeric" autocomplete="one-time-code" maxlength="6" class="codigo-2p" aria-label="Código de 6 cifras"></li>
      </ol>
      <div class="botones"><button class="btn" id="b-2p-ok">${icono("check", "p")}Comprobar y activar</button><button class="btn sec" id="b-2p-no">Cancelar</button></div>`;
    $("b-2p-copiar").onclick = async () => { try { await navigator.clipboard.writeText(e.totp.secret); aviso("Clave copiada"); } catch (_) { aviso("Mantén pulsada la clave para copiarla"); } };
    $("b-2p-no").onclick = async () => { await sb.auth.mfa.unenroll({ factorId: e.id }); msg("m-2p", "", true); pinta2p(); };
    $("b-2p-ok").onclick = async () => {
      const c = $("codigo-2p").value.replace(/\D/g, "");
      if (c.length !== 6) return msg("m-2p", "Escribe las 6 cifras que salen en la app.");
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: e.id, code: c });
      if (error) return msg("m-2p", "Código incorrecto o caducado. Escribe el que sale ahora en la app.");
      msg("m-2p", "Activada. A partir de ahora, al entrar en el panel te pedirá el código de la app.", true); pinta2p();
    };
  };
}

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
    <a href="#ajuste-2p">${icono("admin", "p")}Dos pasos</a>
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
    <div class="panel tarjeta-ajuste" id="ajuste-limpiar">
      <h2>Archivos sin usar</h2>
      <p class="ayuda">Al borrar algo, sus archivos se guardan un tiempo para poder recuperarlo desde «Historial». Aquí se quitan los que ya no usa nada y tienen más de 30 días, para no llenar el espacio gratuito.</p>
      <div class="botones" style="margin-top:10px"><button class="btn sec" id="b-limpiar">${icono("borrar", "p")}Buscar archivos sin usar</button></div>
      <div class="msg" id="m-limpiar"></div>
    </div>
    <div class="panel tarjeta-ajuste" id="ajuste-archivo">
      <h2>Archivo de avisos</h2>
      <p class="ayuda">Los avisos antiguos pasan a la pestaña «Archivo» de la web para que la lista no se llene. Los fijados nunca se archivan.</p>
      <label for="meses-archivo">Archivar los avisos de hace más de…</label>
      <select id="meses-archivo">${[[1, "1 mes"], [2, "2 meses"], [3, "3 meses"], [6, "6 meses"], [12, "1 año"], [0, "Nunca"]].map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>
      <div class="msg" id="m-archivo"></div>
    </div>
    <div class="panel tarjeta-ajuste" id="ajuste-clave">
      <h2>Cambiar mi contraseña</h2>
      <p class="ayuda">Para tu cuenta (${esc(window.MI_EMAIL || "")}). Al menos 10 caracteres, con letras y números. Apúntala en un sitio seguro.</p>
      <label for="clave-nueva">Contraseña nueva</label><input id="clave-nueva" type="password" autocomplete="new-password">
      <label for="clave-repite">Repítela</label><input id="clave-repite" type="password" autocomplete="new-password">
      <div class="botones"><button class="btn" id="b-clave">Guardar la contraseña nueva</button></div>
      <div class="msg" id="m-clave"></div>
    </div>
    <div class="panel tarjeta-ajuste" id="ajuste-rescate">
      <h2>Si te olvidas de la contraseña</h2>
      <p class="ayuda">Genera 8 códigos de rescate y guárdalos en papel, en casa. Si un día no puedes entrar, en la pantalla de entrar pulsa «Tengo un código de rescate» y pon una contraseña nueva al momento, sin email y sin esperar. Cada código sirve una vez.</p>
      <p id="resc-estado" class="fecha-txt">Comprobando…</p>
      <div id="resc-lista"></div>
      <div class="botones"><button class="btn" id="b-generar-resc">Generar códigos de rescate</button></div>
      <div class="msg" id="m-resc"></div>
    </div>
    <div class="panel tarjeta-ajuste" id="ajuste-2p">
      <h2>Verificación en dos pasos</h2>
      <p class="ayuda">Para entrar en el panel, además de la contraseña se pide un código que cambia cada 30 segundos y sale en una app del móvil. Así, aunque alguien sepa la contraseña, no puede publicar. Es para tu cuenta (${esc(window.MI_EMAIL || "")}).</p>
      <div id="zona-2p" style="margin-top:10px"><p class="fecha-txt">Comprobando…</p></div>
      <div class="msg" id="m-2p"></div>
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
  cargarAdmins(); cargarCanales(); prepararCopiaYArchivo(); prepararClave(); prepararRescate();
  $("b-limpiar").onclick = limpiarArchivos;
}
function selColor(v, id) {
  return `<select ${id ? `id="${id}"` : ""} class="sel-color c-${v}" aria-label="Color">
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
// Cambiar la contraseña sin depender del email
function prepararClave() {
  $("b-clave").onclick = async () => {
    const p = $("clave-nueva").value, f = fallaPass(p);
    if (f) return msg("m-clave", f);
    if (p !== $("clave-repite").value) return msg("m-clave", "Las dos contraseñas no coinciden.");
    msg("m-clave", "Guardando…", true);
    const { error } = await sb.auth.updateUser({ password: p });
    if (error) return msg("m-clave", /same|different/i.test(error.message) ? "Es la misma que ya tenías. Escribe otra."
      : /weak|pwned|leaked/i.test(error.message) ? "Esa contraseña aparece en filtraciones de internet. Elige otra."
      : /reauth|recent/i.test(error.message) ? "Por seguridad, sal del panel, vuelve a entrar y cámbiala en seguida." : "No se ha podido cambiar: " + error.message);
    $("clave-nueva").value = $("clave-repite").value = "";
    msg("m-clave", "Contraseña cambiada. La próxima vez entra con la nueva.", true);
  };
}
function prepararRescate() {
  const estado = () => llamaCuenta({ accion: "estado" }).then(r => {
    if (!$("resc-estado")) return;
    $("resc-estado").textContent = r.quedan ? `Te quedan ${r.quedan} códigos sin usar. Si los has perdido, genera otros: los de antes dejarán de valer.` : "Todavía no tienes códigos de rescate.";
    $("b-generar-resc").textContent = r.quedan ? "Generar códigos nuevos" : "Generar códigos de rescate";
  }).catch(() => { if ($("resc-estado")) $("resc-estado").textContent = ""; });
  estado();
  $("b-generar-resc").onclick = async () => {
    if (/nuevos/.test($("b-generar-resc").textContent) && !confirm("Los códigos que tienes ahora dejarán de valer. ¿Generar otros?")) return;
    const b = $("b-generar-resc"); b.disabled = true; msg("m-resc", "Generando…", true);
    try {
      const { codigos } = await llamaCuenta({ accion: "codigos" });
      $("resc-lista").innerHTML = `<p class="ayuda"><b>Apúntalos ahora: no se volverán a enseñar.</b> Guárdalos en papel, lejos del móvil.</p>
        <ol class="codigos-resc">${codigos.map(c => `<li>${esc(c)}</li>`).join("")}</ol>
        <div class="botones"><button class="btn sec" id="b-copiar-resc">${icono("copia", "p")}Copiar los códigos</button></div>`;
      $("b-copiar-resc").onclick = () => {
        const t = `Códigos de rescate del panel CCOO Calsina Carré (${window.MI_EMAIL}). Cada uno sirve una vez:\n` + codigos.join("\n");
        navigator.clipboard?.writeText(t).then(() => aviso("Copiados.")).catch(() => aviso("No se han podido copiar: apúntalos a mano.", true));
      };
      msg("m-resc", ""); estado();
    } catch (e) { msg("m-resc", e.message); }
    finally { b.disabled = false; }
  };
}
// Poner contraseña nueva a otro administrador (por si no puede entrar), sin email
function modalClaveOtro(email) {
  const v = document.createElement("div"); v.className = "modal-velo";
  v.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="clv-t"><h2 id="clv-t">Contraseña nueva</h2>
    <p class="ayuda">Para ${esc(email)}. Dísela en persona; luego puede cambiarla en Ajustes.</p>
    <label for="clv-nueva">Contraseña nueva <small>(10 o más, con letras y números)</small></label><input id="clv-nueva" type="password" autocomplete="new-password">
    <label for="clv-repite">Repítela</label><input id="clv-repite" type="password" autocomplete="new-password">
    <div class="msg" id="m-clv"></div>
    <div class="botones"><button class="btn" data-r="si">Guardar</button><button class="btn sec" data-r="no">Cancelar</button></div></div>`;
  const cerrar = () => v.remove();
  v.querySelector("[data-r=no]").onclick = cerrar;
  v.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });
  v.querySelector("[data-r=si]").onclick = async () => {
    const p = v.querySelector("#clv-nueva").value, f = fallaPass(p);
    if (f) return msg("m-clv", f);
    if (p !== v.querySelector("#clv-repite").value) return msg("m-clv", "Las dos contraseñas no coinciden.");
    msg("m-clv", "Guardando…", true);
    try { await llamaCuenta({ accion: "poner_clave", email, clave: p }); cerrar(); aviso("Contraseña cambiada. Ya puede entrar con ella."); }
    catch (e) { msg("m-clv", e.message); }
  };
  document.body.appendChild(v); v.querySelector("#clv-nueva").focus();
}
async function cargarAdmins() {
  const { data, error } = await sb.from("admins").select("email").order("email");
  if (error) { $("lista-admins").innerHTML = `<p class="msg err">${esc(error.message)}</p>`; return; }
  const yo = (window.MI_EMAIL || "").toLowerCase();
  $("lista-admins").innerHTML = data.map(a => `<div class="panel item"><div class="txt"><b>${esc(a.email)}</b>${a.email.toLowerCase() === yo ? '<span class="etq">Tú</span>' : ""}</div>
      ${a.email.toLowerCase() === yo ? "" : `<button class="btn sec peq" data-clave="${esc(a.email)}">${icono("editar", "p")}Poner contraseña nueva</button><button class="btn peligro peq" data-email="${esc(a.email)}" aria-label="Quitar permiso">${icono("borrar", "p")}</button>`}</div>`).join("");
  $("lista-admins").querySelectorAll("[data-clave]").forEach(b => b.onclick = () => modalClaveOtro(b.dataset.clave));
  $("lista-admins").querySelectorAll("[data-email]").forEach(b => b.onclick = async () => {
    if (!confirm(`¿Quitar el permiso de publicar a ${b.dataset.email}?`)) return;
    const { error } = await sb.from("admins").delete().eq("email", b.dataset.email);
    error ? msg("m-admins", error.message) : (aviso("Permiso quitado."), cargarAdmins());
  });
  pinta2p();
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
  if (/^ap\d+$/.test(k)) { const ap = APARTADOS.find(a => "ap" + a.id === k); return textoCompartir(x.titulo, x.contenido || "", ap ? "ap-" + ap.slug : ""); }
  if (k === "calendario") return textoCompartir(x.titulo, fechaDia(x.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) + (x.hora ? ", " + x.hora : "") + (x.lugar ? " · " + x.lugar : ""), "calendario");
  return textoCompartir(x.titulo, "", "");
}
function trasPublicar(k, x, res) {
  if (k === "recurrentes") return aviso("Guardado. Se publicará solo: " + frecTxt(x).toLowerCase() + ".");
  if (k === "convenio" || k === "apartados") return aviso(k === "apartados" ? "Apartado guardado. Ya sale en el menú del panel y como pestaña en la web." : "Publicado. Ya se ve en la web.");
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
// Botones de año y, dentro del año, de mes (con cuántos hay), igual que en la web
function pintaFechasAdm(items, k, f, repintar) {
  const partes = items.map(x => partesFecha(FECHA_DE[k](x))).filter(Boolean), anyos = [...new Set(partes.map(p => p.a))].sort((a, b) => b - a);
  if (!partes.length) { $("fechas-adm").innerHTML = ""; return; }
  const boton = (dato, valor, texto, activo, n) => `<button class="filtro ${activo ? "activo" : ""}" data-${dato}="${valor}">${texto}${n != null ? ` <span class="cuenta">${n}</span>` : ""}</button>`;
  let html = `<div class="fila-anyos" role="group" aria-label="Año">${boton("a", "", "Todos", !f.a)}${anyos.map(a => boton("a", a, a, f.a == a, partes.filter(p => p.a === a).length)).join("")}</div>`;
  if (f.a) {
    const meses = [...new Set(partes.filter(p => p.a == f.a).map(p => p.m))].sort((a, b) => b - a);
    html += `<div class="fila-meses" role="group" aria-label="Mes">${boton("m", "", "Todo " + f.a, !f.m)}${meses.map(m => boton("m", m, mayus(MESES[m - 1]), f.m == m, partes.filter(p => p.a == f.a && p.m === m).length)).join("")}</div>`;
  }
  $("fechas-adm").innerHTML = html;
  $("fechas-adm").querySelectorAll("[data-a]").forEach(el => el.onclick = () => { f.a = el.dataset.a; f.m = ""; f.d = ""; repintar(); });
  $("fechas-adm").querySelectorAll("[data-m]").forEach(el => el.onclick = () => { f.m = el.dataset.m; repintar(); });
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
const TABLAS_COPIA = ["comunicados", "eventos", "convenio_secciones", "actas", "documentos", "preguntas", "plantillas", "apartados", "publicaciones", "buzon", "avisos_recurrentes", "calc_permisos", "calc_categorias", "calc_ajustes", "restricciones", "paginas", "opciones", "admins"];
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
  await new Promise((ok, mal) => { const sc = document.createElement("script"); sc.src = "lib/jszip.min.js"; sc.onload = ok; sc.onerror = () => mal(new Error("No se ha podido preparar el archivo ZIP. Revisa la conexión.")); document.head.appendChild(sc); });
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
      (copia.tablas.comunicados || []).concat(copia.tablas.actas || [], copia.tablas.convenio_secciones || [], copia.tablas.publicaciones || [])
        .forEach(x => (x.adjuntos || []).forEach(a => urls.set(a.url, a.nombre)));
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
  try { await Promise.all(["calendario", "avisos", "actas"].map(cargarDatos)); } catch (e) { $("cala-dias").innerHTML = `<p class="msg err">${esc(e.message)}</p>`; return; }
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
