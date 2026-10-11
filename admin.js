// ===== Panel de publicación =====
const $ = (id) => document.getElementById(id);
const aqui = location.origin + location.pathname;
const msg = (id, t, ok) => { const el = $(id); if (!el) return; el.textContent = t; el.className = "msg " + (ok ? "ok" : "err"); };
$("ver-web").innerHTML = icono("ver", "p");
$("b-salir").innerHTML = icono("salir", "p") + "Salir";

// ---------- Definición de cada sección ----------
const FORMATO = `<div class="formato">Para dar formato: deja una línea en blanco entre párrafos, empieza una línea con <code>- </code> para hacer una lista y escribe <code>**así**</code> para poner negrita. Los enlaces se activan solos.</div>`;
const SECCIONES = {
  avisos: {
    nombre: "Avisos", icono: "avisos", tabla: "comunicados", orden: ["fecha", false], nuevo: "Nuevo aviso", titulo: "aviso",
    campos: [
      { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Convocatoria de asamblea" },
      { k: "categoria", l: "Categoría", t: "select", op: () => nombres("aviso") },
      { k: "contenido", l: "Texto del aviso", t: "textarea", formato: true },
      { k: "pdf_url", l: "Documento adjunto", t: "pdf", opc: true },
      { k: "urgente", l: "Marcar como urgente (sale en rojo y arriba del todo en Inicio)", t: "check" },
      { k: "fijado", l: "Fijar arriba de la lista de avisos", t: "check" },
    ],
    linea: (x) => [x.titulo, [fechaLarga(x.fecha), x.categoria, x.urgente && "Urgente", x.fijado && "Fijado", x.pdf_url && "Con PDF"]],
  },
  calendario: {
    nombre: "Calendario", icono: "calendario", tabla: "eventos", orden: ["fecha", false], nuevo: "Nueva fecha", titulo: "fecha",
    campos: [
      { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Asamblea de trabajadores" },
      { k: "tipo", l: "Tipo", t: "select", op: () => nombres("evento") },
      { k: "fecha", l: "Día", t: "date", req: true },
      { fila: [{ k: "hora", l: "Hora de inicio", t: "time", opc: true }, { k: "hora_fin", l: "Hora de fin", t: "time", opc: true }] },
      { k: "lugar", l: "Lugar", t: "text", opc: true, ph: "Ej: Comedor de la nave 2" },
      { k: "descripcion", l: "Descripción", t: "textarea", opc: true, corto: true },
    ],
    linea: (x) => [x.titulo, [fechaLarga(x.fecha + "T12:00:00"), x.tipo, x.hora]],
  },
  convenio: {
    nombre: "Convenio", icono: "convenio", tabla: "convenio_secciones", orden: ["orden", true], nuevo: "Nuevo apartado", titulo: "apartado",
    campos: [
      { k: "titulo", l: "Título del apartado", t: "text", req: true, ph: "Ej: Permisos retribuidos" },
      { fila: [{ k: "categoria", l: "Categoría", t: "select", op: () => nombres("convenio") }, { k: "articulo", l: "Artículo", t: "text", opc: true, ph: "Ej: Art. 24" }] },
      { k: "resumen", l: "Resumen en una frase", t: "text", opc: true, ph: "Se ve sin abrir el apartado" },
      { k: "contenido", l: "Explicación completa", t: "textarea", formato: true },
      { k: "orden", l: "Posición en la lista", t: "number", ayuda: "1 sale primero, 2 después… Así ordenas los apartados." },
    ],
    linea: (x) => [x.titulo, [x.categoria, x.articulo, "Posición " + x.orden]],
  },
  actas: {
    nombre: "Actas", icono: "actas", tabla: "actas", orden: ["fecha", false], nuevo: "Nueva acta", titulo: "acta",
    campos: [
      { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Reunión ordinaria del comité" },
      { fila: [{ k: "tipo", l: "Tipo de reunión", t: "select", op: () => nombres("acta") }, { k: "fecha", l: "Fecha de la reunión", t: "date", req: true }] },
      { k: "resumen", l: "Resumen", t: "textarea", opc: true, corto: true, ayuda: "De qué se habló, en pocas líneas." },
      { k: "acuerdos", l: "Acuerdos", t: "textarea", opc: true, formato: true, ayuda: "Mejor en lista: una línea por acuerdo empezando con «- »." },
      { k: "pdf_url", l: "Acta completa en PDF", t: "pdf", opc: true },
    ],
    linea: (x) => [x.titulo, [fechaLarga(x.fecha + "T12:00:00"), x.tipo, x.pdf_url && "Con PDF"]],
  },
  documentos: {
    nombre: "Documentos", icono: "carpeta", tabla: "documentos", orden: ["fecha", false], nuevo: "Nuevo documento", titulo: "documento",
    campos: [
      { k: "titulo", l: "Nombre del documento", t: "text", req: true, ph: "Ej: Convenio colectivo 2025-2027" },
      { k: "categoria", l: "Categoría", t: "select", op: () => nombres("documento") },
      { k: "url", l: "Archivo PDF", t: "pdf", req: true },
    ],
    ayuda: "Los documentos salen en la columna «Documentos» de la sección Convenio.",
    linea: (x) => [x.titulo, [x.categoria, fechaLarga(x.fecha)]],
  },
  textos: { nombre: "Textos", icono: "texto" },
  ajustes: { nombre: "Ajustes", icono: "ajustes" },
};
const TEXTOS = [
  { slug: "inicio", l: "Bienvenida (Inicio)", ayuda: "Sale debajo de «Hola, compañero/a»." },
  { slug: "convenio", l: "Introducción del convenio", ayuda: "Sale arriba de los apartados: qué convenio es, vigencia, etc." },
  { slug: "quienes", l: "Quiénes somos" },
  { slug: "contacto", l: "Contacto", ayuda: "Email, teléfono de la sección, horario, delegados…" },
];

let actual = "avisos", editando = null, datos = [];

// ---------- Sesión ----------
const mostrar = (s) => ["s-login", "s-recuperar", "s-panel"].forEach(x => $(x).classList.toggle("oculto", x !== s));
sb.auth.onAuthStateChange(async (ev, ses) => {
  if (ev === "PASSWORD_RECOVERY") return mostrar("s-recuperar");
  if (!ses) return mostrar("s-login");
  mostrar("s-panel");
  $("quien").innerHTML = icono("admin", "p") + esc(ses.user.email);
  const { data } = await sb.rpc("is_admin");
  $("no-admin").classList.toggle("oculto", !!data);
  await cargarOpciones(); window.MI_EMAIL = ses.user.email;
  pintaPestanas(); abrir(actual);
});
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
$("b-salir").onclick = () => sb.auth.signOut();

// ---------- PDFs ----------
async function subirPdf(file) {
  if (file.type !== "application/pdf") throw new Error("El archivo tiene que ser un PDF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("El PDF pesa más de 10 MB.");
  const nombre = Date.now() + "-" + file.name.normalize("NFD").replace(/[^\w.-]+/g, "_");
  const { error } = await sb.storage.from("documentos").upload(nombre, file, { contentType: "application/pdf" });
  if (error) throw error;
  return sb.storage.from("documentos").getPublicUrl(nombre).data.publicUrl;
}
async function borrarPdf(url) {
  const n = url && decodeURIComponent(url.split("/documentos/")[1] || "");
  if (n) await sb.storage.from("documentos").remove([n]);
}

// ---------- Pestañas ----------
function pintaPestanas() {
  $("pestanas").innerHTML = Object.entries(SECCIONES).map(([k, s]) =>
    `<button data-k="${k}" class="${k === actual ? "activa" : ""}">${icono(s.icono, "p")}${s.nombre}</button>`).join("");
  $("pestanas").querySelectorAll("button").forEach(b => b.onclick = () => abrir(b.dataset.k));
}
function abrir(k) {
  actual = k; editando = null; pintaPestanas();
  k === "textos" ? pintaTextos() : k === "ajustes" ? pintaAjustes() : pintaSeccion();
}

// ---------- Formulario genérico ----------
function campoHTML(c, v) {
  const id = "f-" + c.k, opc = c.opc ? " <small>(opcional)</small>" : "";
  const ayuda = c.ayuda ? `<p class="ayuda">${c.ayuda}</p>` : "";
  if (c.t === "check") return `<label class="check"><input type="checkbox" id="${id}" ${v ? "checked" : ""}>${c.l}</label>`;
  if (c.t === "select") {
    const ops = c.op(); if (v && !ops.includes(v)) ops.push(v); // conserva un valor antiguo aunque ya no esté en la lista
    return `<label for="${id}">${c.l}</label><select id="${id}">${ops.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
      <p class="ayuda">¿Falta alguna opción? Añádela en la pestaña Ajustes.</p>${ayuda}`;
  }
  if (c.t === "textarea") return `<label for="${id}">${c.l}${opc}</label><textarea id="${id}" ${c.corto ? 'style="min-height:90px"' : ""}>${esc(v || "")}</textarea>${ayuda}${c.formato ? FORMATO : ""}`;
  if (c.t === "pdf") return `<label for="${id}">${c.l}${opc}</label><input type="file" id="${id}" accept="application/pdf">
    ${v ? `<div class="pdf-actual">${icono("pdf", "p")}<a href="${esc(v)}" target="_blank" rel="noopener">PDF actual</a>
      <label class="check" style="margin:0;font-weight:500"><input type="checkbox" id="${id}-quitar">Quitar el PDF</label></div>
      <p class="ayuda">Si eliges otro archivo, sustituye al actual.</p>` : `<p class="ayuda">Máximo 10 MB.</p>`}`;
  return `<label for="${id}">${c.l}${opc}</label><input id="${id}" type="${c.t}" value="${esc(v ?? "")}" ${c.ph ? `placeholder="${esc(c.ph)}"` : ""}>${ayuda}`;
}
const camposPlanos = (s) => s.campos.flatMap(c => c.fila || [c]);

function pintaSeccion() {
  const s = SECCIONES[actual], x = editando || {};
  const def = {};
  $("zona").innerHTML = `<div class="zona">
    <div class="panel formulario">
      ${actual === "actas" && !editando ? `<div class="asistente">
        <h3>${icono("magia", "p")}Hacer el acta con el asistente</h3>
        <p class="ayuda">Pega las notas o el resumen de la reunión, tal cual. El asistente rellena el formulario de abajo y tú lo revisas antes de publicar. No publica nada solo.</p>
        <p class="ayuda"><b>Importante:</b> las notas se envían a la IA gratuita de Google (Gemini), que puede usarlas para mejorar sus productos. No pongas nombres de compañeros ni datos personales, ni información confidencial de la empresa.</p>
        <textarea id="notas-ia" style="min-height:120px" placeholder="Ej: Reunión del comité el martes 6. Asistentes: ... Se habló de las horas extra de septiembre, la empresa se compromete a pagarlas en la nómina de octubre. Ropa de invierno antes del 30..."></textarea>
        <div class="botones" style="margin-top:10px"><button class="btn azul" id="b-ia">${icono("magia", "p")}Generar acta</button></div>
        <div class="msg" id="m-ia"></div>
      </div>` : ""}
      <h2>${editando ? "Editar " + s.titulo : s.nuevo}${editando ? '<span class="modo">Editando</span>' : ""}</h2>
      ${s.ayuda ? `<p class="ayuda">${s.ayuda}</p>` : ""}
      ${s.campos.map(c => c.fila ? `<div class="fila">${c.fila.map(f => `<div>${campoHTML(f, x[f.k])}</div>`).join("")}</div>`
        : campoHTML(c, x[c.k] ?? def[c.k])).join("")}
      <div class="botones">
        <button class="btn" id="b-guardar">${icono(editando ? "check" : "subir", "p")}${editando ? "Guardar cambios" : "Publicar"}</button>
        ${editando ? `<button class="btn sec" id="b-cancelar">Cancelar</button>` : ""}
      </div>
      <div class="msg" id="m-form"></div>
    </div>
    <div class="lista"><h2>Publicado</h2><div id="lista"><p class="fecha-txt">Cargando…</p></div></div>
  </div>`;
  $("b-guardar").onclick = guardar;
  if ($("b-ia")) $("b-ia").onclick = generarActa;
  if (editando) $("b-cancelar").onclick = () => { editando = null; pintaSeccion(); };
  cargarLista();
}

async function cargarLista() {
  const s = SECCIONES[actual];
  const { data, error } = await sb.from(s.tabla).select("*").order(s.orden[0], { ascending: s.orden[1] }).order("id", { ascending: false });
  if (error) { $("lista").innerHTML = `<p class="msg err">No se ha podido cargar: ${esc(error.message)}</p>`; return; }
  datos = data;
  if (!editando && $("f-orden")) $("f-orden").value = Math.max(0, ...data.map(d => d.orden || 0)) + 1;
  $("lista").innerHTML = data.length ? data.map(x => {
    const [t, sub] = s.linea(x);
    return `<div class="panel item"><div class="txt"><b>${esc(t)}</b><div class="sub">${sub.filter(Boolean).map(v => `<span class="etq">${esc(v)}</span>`).join("")}</div></div>
      <div class="acc">
        <button class="btn sec peq" data-ed="${x.id}" aria-label="Editar">${icono("editar", "p")}</button>
        <button class="btn peligro peq" data-bo="${x.id}" aria-label="Borrar">${icono("borrar", "p")}</button>
      </div></div>`;
  }).join("") : `<div class="panel vacio">${icono(s.icono)}Todavía no hay nada. Rellena el formulario para publicar lo primero.</div>`;
  $("lista").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => {
    editando = datos.find(d => d.id == b.dataset.ed); pintaSeccion(); window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("lista").querySelectorAll("[data-bo]").forEach(b => b.onclick = () => borrar(datos.find(d => d.id == b.dataset.bo)));
}

async function guardar() {
  const s = SECCIONES[actual], fila = {}, btn = $("b-guardar");
  try {
    for (const c of camposPlanos(s)) {
      const el = $("f-" + c.k);
      if (c.t === "check") fila[c.k] = el.checked;
      else if (c.t === "number") fila[c.k] = parseInt(el.value || "0", 10);
      else if (c.t === "pdf") {
        const antes = editando?.[c.k] || null, quitar = $("f-" + c.k + "-quitar")?.checked;
        if (el.files[0]) { btn.disabled = true; msg("m-form", "Subiendo el PDF…", true); fila[c.k] = await subirPdf(el.files[0]); if (antes) await borrarPdf(antes); }
        else if (quitar) { fila[c.k] = null; await borrarPdf(antes); }
        else fila[c.k] = antes;
        if (c.req && !fila[c.k]) throw new Error("Falta elegir el PDF.");
      } else {
        const v = el.value.trim();
        if (c.req && !v) throw new Error("Falta rellenar: " + c.l.toLowerCase() + ".");
        fila[c.k] = v || (c.opc ? null : "");
      }
    }
    btn.disabled = true; msg("m-form", "Guardando…", true);
    const q = editando ? sb.from(s.tabla).update(fila).eq("id", editando.id) : sb.from(s.tabla).insert(fila);
    const { error } = await q;
    if (error) throw error;
    const eraEdicion = !!editando; editando = null; pintaSeccion();
    msg("m-form", eraEdicion ? "Cambios guardados. Ya se ven en la web." : "Publicado. Ya se ve en la web.", true);
  } catch (e) { msg("m-form", e.message); btn.disabled = false; }
}

async function borrar(x) {
  const s = SECCIONES[actual];
  if (!confirm(`¿Borrar «${s.linea(x)[0]}»? No se puede deshacer.`)) return;
  const { error } = await sb.from(s.tabla).delete().eq("id", x.id);
  if (error) return alert("No se ha podido borrar: " + error.message);
  for (const c of camposPlanos(s)) if (c.t === "pdf") await borrarPdf(x[c.k]);
  if (editando?.id === x.id) editando = null;
  pintaSeccion();
}

// ---------- Textos fijos ----------
async function pintaTextos() {
  const { data } = await sb.from("paginas").select("*");
  const p = Object.fromEntries((data || []).map(x => [x.slug, x.contenido]));
  $("zona").innerHTML = `<div class="panel formulario" style="max-width:760px">
    <h2>Textos de la web</h2><p class="ayuda">Los textos que cambian poco. Edita y pulsa «Guardar textos».</p>
    ${TEXTOS.map(t => `<label for="t-${t.slug}">${t.l}</label><textarea id="t-${t.slug}" style="min-height:100px">${esc(p[t.slug] || "")}</textarea>${t.ayuda ? `<p class="ayuda">${t.ayuda}</p>` : ""}`).join("")}
    ${FORMATO}
    <div class="botones"><button class="btn" id="b-textos">${icono("check", "p")}Guardar textos</button></div>
    <div class="msg" id="m-form"></div></div>`;
  $("b-textos").onclick = async () => {
    const filas = TEXTOS.map(t => ({ slug: t.slug, contenido: $("t-" + t.slug).value, actualizado: new Date().toISOString() }));
    const { error } = await sb.from("paginas").upsert(filas);
    error ? msg("m-form", "No se ha podido guardar: " + error.message) : msg("m-form", "Textos guardados. Ya se ven en la web.", true);
  };
}

// ---------- Ajustes: listas editables y personas que publican ----------
const LISTAS = {
  aviso: { l: "Categorías de los avisos", ayuda: "Son los filtros de la sección Avisos.", tabla: "comunicados", col: "categoria" },
  evento: { l: "Tipos del calendario", ayuda: "Cada tipo tiene su color en el calendario.", tabla: "eventos", col: "tipo" },
  acta: { l: "Tipos de acta", ayuda: "Son los filtros de la sección Actas.", tabla: "actas", col: "tipo" },
  convenio: { l: "Categorías del convenio", ayuda: "Son los filtros de la sección Convenio.", tabla: "convenio_secciones", col: "categoria" },
  documento: { l: "Categorías de documentos", ayuda: "Sirven para ordenar los PDF del convenio.", tabla: "documentos", col: "categoria" },
};
let filasLista = {};

async function pintaAjustes() {
  await cargarOpciones();
  const todas = window.OPC_FILAS || [];
  filasLista = {};
  Object.keys(LISTAS).forEach(k => filasLista[k] = todas.filter(o => o.lista === k).map(o => ({ ...o, original: o.nombre })));
  $("zona").innerHTML = `<div class="zona">
    <div>${Object.entries(LISTAS).map(([k, L]) => `
      <div class="panel formulario" style="margin-bottom:16px;position:static">
        <h2>${L.l}</h2><p class="ayuda">${L.ayuda} Si cambias un nombre, se cambia también en todo lo ya publicado.</p>
        <div id="lista-${k}" style="margin-top:12px"></div>
        <div class="fila-op nueva">
          ${selColor("gris", `nc-${k}`)}
          <input id="nn-${k}" placeholder="Nueva opción" aria-label="Nueva opción">
          <button class="btn sec peq" data-anadir="${k}">${icono("mas", "p")}Añadir</button>
        </div>
        <div class="botones"><button class="btn" data-guardar="${k}">${icono("check", "p")}Guardar cambios</button></div>
        <div class="msg" id="m-${k}"></div>
      </div>`).join("")}</div>
    <div>
      <div class="panel formulario">
        <h2>Quién puede publicar</h2>
        <p class="ayuda">Añade el email de otro delegado. Después, esa persona entra en esta página y pulsa «Primera vez: crear la cuenta».</p>
        <div id="lista-admins" style="margin-top:12px"><p class="fecha-txt">Cargando…</p></div>
        <div class="fila-op nueva" style="grid-template-columns:1fr auto">
          <input id="nuevo-admin" type="email" placeholder="email@ejemplo.com" aria-label="Email del nuevo delegado">
          <button class="btn sec peq" id="b-admin">${icono("mas", "p")}Añadir</button>
        </div>
        <div class="msg" id="m-admins"></div>
      </div>
    </div>
  </div>`;
  Object.keys(LISTAS).forEach(pintaLista);
  document.querySelectorAll("[data-anadir]").forEach(b => b.onclick = () => {
    const k = b.dataset.anadir, n = $("nn-" + k).value.trim();
    if (!n) return msg("m-" + k, "Escribe el nombre de la nueva opción.");
    if (filasLista[k].some(o => o.nombre.toLowerCase() === n.toLowerCase())) return msg("m-" + k, "Esa opción ya existe.");
    filasLista[k].push({ lista: k, nombre: n, color: $("nc-" + k).value, nuevo: true });
    $("nn-" + k).value = ""; pintaLista(k); msg("m-" + k, "Añadida. Pulsa «Guardar cambios» para que se guarde.", true);
  });
  document.querySelectorAll("[data-guardar]").forEach(b => b.onclick = () => guardarLista(b.dataset.guardar));
  document.querySelectorAll("[id^=nn-]").forEach(i => i.onkeydown = (e) => { if (e.key === "Enter") document.querySelector(`[data-anadir="${i.id.slice(3)}"]`).click(); });
  cargarAdmins();
}
function selColor(v, id) {
  return `<select ${id ? `id="${id}"` : ""} class="sel-color c-${v}" aria-label="Color" onchange="this.className='sel-color c-'+this.value">
    ${Object.entries(COLORES).map(([c, n]) => `<option value="${c}" ${c === v ? "selected" : ""}>${n}</option>`).join("")}</select>`;
}
function pintaLista(k) {
  const l = filasLista[k].filter(o => !o.borrar);
  $("lista-" + k).innerHTML = l.length ? l.map((o, i) => `<div class="fila-op" data-k="${k}" data-i="${filasLista[k].indexOf(o)}">
      ${selColor(o.color)}
      <input value="${esc(o.nombre)}" aria-label="Nombre">
      <div class="acc">
        <button class="btn sec peq" data-mov="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">${icono("arriba", "p")}</button>
        <button class="btn sec peq" data-mov="1" ${i === l.length - 1 ? "disabled" : ""} aria-label="Bajar">${icono("abajo", "p")}</button>
        <button class="btn peligro peq" data-quitar aria-label="Quitar">${icono("borrar", "p")}</button>
      </div></div>`).join("") : `<p class="fecha-txt">No hay opciones. Añade la primera abajo.</p>`;
  $("lista-" + k).querySelectorAll(".fila-op").forEach(f => {
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
  const nombresV = vis.map(o => o.nombre.trim().toLowerCase());
  if (new Set(nombresV).size !== nombresV.length) return msg("m-" + k, "Hay dos opciones con el mismo nombre.");
  msg("m-" + k, "Guardando…", true);
  try {
    // Borrar las quitadas (lo publicado con esa opción se queda como está)
    for (const o of filas.filter(o => o.borrar && !o.nuevo)) {
      const { count } = await sb.from(L.tabla).select("id", { count: "exact", head: true }).eq(L.col, o.original);
      if (count && !confirm(`«${o.original}» se usa en ${count} elemento(s) publicado(s). Se quedarán con ese nombre, pero ya no saldrá en la lista. ¿Quitarla?`)) continue;
      const r = await sb.from("opciones").delete().eq("id", o.id); if (r.error) throw r.error;
    }
    // Renombrar: primero se libera el nombre antiguo para evitar choques
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
    await pintaAjustes();
    msg("m-" + k, "Guardado. Ya se ve en la web.", true);
  } catch (e) { msg("m-" + k, "No se ha podido guardar: " + e.message); }
}
async function cargarAdmins() {
  const { data, error } = await sb.from("admins").select("email").order("email");
  if (error) { $("lista-admins").innerHTML = `<p class="msg err">${esc(error.message)}</p>`; return; }
  const yo = (window.MI_EMAIL || "").toLowerCase();
  $("lista-admins").innerHTML = data.map(a => `<div class="panel item" style="box-shadow:none">
      <div class="txt"><b>${esc(a.email)}</b>${a.email.toLowerCase() === yo ? '<div class="sub"><span class="etq">Tú</span></div>' : ""}</div>
      ${a.email.toLowerCase() === yo ? "" : `<button class="btn peligro peq" data-email="${esc(a.email)}" aria-label="Quitar permiso">${icono("borrar", "p")}</button>`}
    </div>`).join("");
  $("lista-admins").querySelectorAll("[data-email]").forEach(b => b.onclick = async () => {
    if (!confirm(`¿Quitar el permiso de publicar a ${b.dataset.email}?`)) return;
    const { error } = await sb.from("admins").delete().eq("email", b.dataset.email);
    error ? msg("m-admins", error.message) : (msg("m-admins", "Permiso quitado.", true), cargarAdmins());
  });
  $("b-admin").onclick = async () => {
    const e = $("nuevo-admin").value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return msg("m-admins", "Escribe un email válido.");
    const { error } = await sb.from("admins").insert({ email: e });
    if (error) return msg("m-admins", /duplicate/i.test(error.message) ? "Ese email ya tiene permiso." : error.message);
    $("nuevo-admin").value = ""; msg("m-admins", "Añadido. Ya puede crear su cuenta en esta página.", true); cargarAdmins();
  };
}

// ---------- Asistente de actas ----------
async function generarActa() {
  const notas = $("notas-ia").value.trim(), btn = $("b-ia");
  if (notas.length < 20) return msg("m-ia", "Escribe un poco más de las notas de la reunión.");
  btn.disabled = true; msg("m-ia", "Redactando el acta… (tarda unos segundos)", true);
  try {
    const { data, error } = await sb.functions.invoke("generar-acta", { body: { notas, tipos: nombres("acta"), hoy: hoyISO() } });
    if (error) {
      let m = "No se ha podido generar el acta.";
      try { m = (await error.context.json()).error || m; } catch (_) {}
      throw new Error(m);
    }
    const a = data.acta;
    $("f-titulo").value = a.titulo || "";
    const sel = $("f-tipo");
    if (a.tipo && ![...sel.options].some(o => o.value === a.tipo)) sel.add(new Option(a.tipo, a.tipo));
    if (a.tipo) sel.value = a.tipo;
    if (a.fecha) $("f-fecha").value = a.fecha;
    $("f-resumen").value = a.resumen || "";
    $("f-acuerdos").value = a.acuerdos || "";
    const falta = [!a.fecha && "la fecha", a.avisos].filter(Boolean).join(". ");
    msg("m-ia", "Hecho. Revisa el formulario de abajo" + (falta ? " (ojo: " + falta + ")" : "") + " y pulsa «Publicar».", true);
    $("f-titulo").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (e) { msg("m-ia", e.message); }
  btn.disabled = false;
}
