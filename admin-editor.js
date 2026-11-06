// Panel: editor, corrector, asistente de actas, vista previa y avisos que se repiten.
// El panel está repartido en admin-base.js, admin-sesion.js, admin-listas.js, admin-editor.js,
// admin-herramientas.js, admin-ajustes.js y admin-calendario.js, que se cargan en ese orden (comparten variables).

// ---------- Editor ----------
const TABLAS_AVISO = ["comunicados", "eventos", "actas", "documentos", "publicaciones", "encuestas"]; // las que sabe avisar la función «notificar»
let ED = null; // { k, orig, pendientes:[File], existentes:[adj], quitar:[url], sucio }
function campoHTML(c, v) {
  const id = "f-" + c.k, opc = c.opc ? " <small>(opcional)</small>" : "", ayuda = c.ayuda ? `<p class="ayuda">${c.ayuda}</p>` : "";
  if (c.t === "select" && c.ops) return `<label for="${id}">${c.l}</label><select id="${id}">${c.ops.map(([val, txt]) => `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(txt)}</option>`).join("")}</select>${ayuda}`;
  if (c.t === "select") {
    const ops = nombres(c.lista); if (v && !ops.includes(v)) ops.push(v);
    return `<label for="${id}">${c.l}</label><select id="${id}">${ops.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
      <p class="ayuda">¿Falta una opción? Añádela en Ajustes.</p>`;
  }
  if (c.t === "textarea") return `<label for="${id}">${c.l}${opc}</label>${c.formato ? `<div class="fmt-barra" role="toolbar" aria-label="Formato del texto"><button type="button" class="btn sec peq" data-fmt="negrita" data-para="${id}"><b>N</b> Negrita</button><button type="button" class="btn sec peq" data-fmt="lista" data-para="${id}">• Lista</button></div>` : ""}<textarea id="${id}" class="crece" spellcheck="true" autocapitalize="sentences" autocorrect="on" ${c.corto ? 'style="min-height:90px"' : ""}>${esc(v || "")}</textarea>${ayuda}${c.formato ? `<details class="formato-mas"><summary>¿Cómo dar formato al texto?</summary>${FORMATO}</details>` : ""}`;
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
    const atajos = c.atajos ? `<div class="atajos-hora" role="group" aria-label="Atajos">${ATAJOS_HORA.map(([t], i) => `<button type="button" class="btn sec peq" data-atajo="${i}" data-para="${id}">${t}</button>`).join("")}<button type="button" class="btn sec peq" data-atajo="" data-para="${id}">Ahora (sin programar)</button></div>` : "";
    return `<label for="${id}">${c.l}${opc}</label><input id="${id}" type="datetime-local" value="${loc}">${atajos}${ayuda}`;
  }
  return `<label for="${id}">${c.l}${opc}</label><input id="${id}" type="${c.t}" value="${esc(v ?? "")}" ${c.t === "text" ? 'spellcheck="true" autocapitalize="sentences" autocorrect="on"' : ""} ${c.ph ? `placeholder="${esc(c.ph)}"` : ""} ${c.paso ? `step="${c.paso}" min="0" inputmode="decimal"` : ""}>${ayuda}`;
}
// Atajos para programar: el campo de fecha y hora es incómodo en el móvil
const aLas8 = (d) => { d.setHours(8, 0, 0, 0); return d; };
const ATAJOS_HORA = [
  ["Mañana a las 8:00", () => { const d = new Date(); d.setDate(d.getDate() + 1); return aLas8(d); }],
  ["El lunes a las 8:00", () => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return aLas8(d); }],
];
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-atajo]"); if (!b) return;
  const el = $(b.dataset.para); if (!el) return;
  const d = b.dataset.atajo === "" ? null : ATAJOS_HORA[+b.dataset.atajo][1]();
  el.value = d ? new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "";
  el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
});
const camposPlanos = (s) => s.campos.flatMap(c => c.nota ? [] : c.fila || c.checks?.map(x => ({ ...x, t: "check" })) || [c]);

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
  $("ed-guardar").disabled = false; msg("ed-msg", ""); // el texto del botón lo pone actualizarPrevia (dice si va a avisar)
  const web = orig ? enLaWeb(k, orig) : "";
  $("ed-ver-web").classList.toggle("oculto", !web);
  if (web) { $("ed-ver-web").href = "index.html#" + web; $("ed-ver-web").innerHTML = icono("ver", "p") + "<span>Ver en la web</span>"; $("ed-ver-web").title = "Abre la web en otra pestaña, justo aquí"; }

  $("ed-form").innerHTML =
    (k === "apartados" && orig ? `<div class="aviso-ajustes"><p>Aquí solo cambias el nombre y el aspecto. Para subir documentos y fotos, pulsa «Abrir y publicar contenido».</p>
      <button class="btn" type="button" id="ed-abrir-ap">${icono("carpeta", "p")}Abrir y publicar contenido</button></div>` : "") +
    (s.ayuda ? `<p class="ayuda" style="margin-top:14px">${s.ayuda}</p>` : "") +
    (k === "avisos" && !orig ? `<div class="desde-plantilla oculto" id="desde-plantilla">${icono("plantilla", "p")}<label for="sel-plantilla">Empezar desde una plantilla</label>
      <select id="sel-plantilla"><option value="">— En blanco —</option></select></div>` : "") +
    (s.asistente && !orig ? asistenteHTML() : "") +
    (s.asistente && !orig ? `<div class="separador">Revisa el acta y publícala</div>` : "") +
    s.campos.map(c => {
      if (c.nota) return `<p class="ayuda">${esc(c.nota)}</p>`; // v101: texto de ayuda suelto entre campos
      if (c.fila) return `<div class="fila">${c.fila.map(f => `<div${f.si ? ` data-si="${f.si}"` : ""}>${campoHTML(f, x[f.k] ?? def[f.k] ?? f.def)}</div>`).join("")}</div>`;
      if (c.checks) {
        const v = c.checks.filter(ch => !(ch.soloNuevo && orig));
        // Al editar algo que ya avisó: casilla para avisar otra vez (por ejemplo, si cambia la hora de una asamblea)
        const re = orig && c.checks.some(ch => ch.k === "notificar") && TABLAS_AVISO.includes(s.tabla) ? `<label class="check"><input type="checkbox" id="f-reavisar">Avisar otra vez de este cambio en los móviles y en Telegram</label>` : "";
        if (re) return `<div class="grupo-check">${v.map(ch => `<label class="check"><input type="checkbox" id="f-${ch.k}" ${(x[ch.k] ?? ch.def) ? "checked" : ""}>${ch.l}</label>`).join("")}${re}</div>`;
        return v.length ? `<div class="grupo-check">${v.map(ch => `<label class="check"><input type="checkbox" id="f-${ch.k}" ${(x[ch.k] ?? ch.def) ? "checked" : ""}>${ch.l}</label>`).join("")}</div>` : ""; }
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
  if (orig?.destacar_desde && $("f-destacar_dia")) $("f-destacar_dia").value = isoLocal(new Date(orig.destacar_desde)); // v102
  // v137: las horas del destacado (si no era el día entero)
  if (orig?.destacar_desde && orig?.destacar_hasta && $("f-destacar_hora_desde") && horasDestacado(orig)) {
    $("f-destacar_hora_desde").value = horaDestacado(orig.destacar_desde); $("f-destacar_hora_hasta").value = horaDestacado(orig.destacar_hasta);
  }
  // v103: botón para quitar el día destacado (en el móvil cuesta vaciar una fecha): borra el día y desmarca «Urgente»
  if ($("f-destacar_dia")) {
    $("f-destacar_dia").insertAdjacentHTML("afterend", `<button type="button" class="btn sec quitar-destacar" id="b-quitar-destacar">${icono("borrar", "p")}Quitar el destacado</button>`);
    const qd = $("b-quitar-destacar"), ver = () => qd.classList.toggle("oculto", !$("f-destacar_dia").value);
    ver(); $("f-destacar_dia").addEventListener("input", ver); $("f-destacar_dia").addEventListener("change", ver);
    qd.onclick = () => { $("f-destacar_dia").value = ""; ["f-destacar_hora_desde", "f-destacar_hora_hasta"].forEach(i => { if ($(i)) $(i).value = ""; }); if ($("f-urgente")) $("f-urgente").checked = false; ver(); ED.sucio = true; actualizarPrevia(); msg("ed-msg", "Quitado el destacado. Pulsa el botón de guardar para que se aplique.", true); };
  }
  ofrecerBorrador();
  $("ed-form").querySelectorAll("textarea.crece").forEach(t => { if (t.style.minHeight) t.classList.add("corta"); requestAnimationFrame(() => creceTexto(t)); });
  if (s.asistente && !orig) prepararAsistente();
  if (k === "avisos" && !orig) prepararPlantillas();
  actualizarPrevia();
  cambiarPestana("form");
  ["velo-ed", "editor"].forEach(i => $(i).classList.remove("oculto"));
  document.body.style.overflow = "hidden";
  if (!history.state?.editor) history.pushState({ editor: 1 }, ""); // el botón «atrás» del móvil cierra el editor
  setTimeout(() => (!orig && !s.asistente ? $("ed-form").querySelector("input:not([type=file]), textarea") : null)?.focus(), 50);
}

// Cajas de texto que crecen con lo escrito (en el móvil no hay que deslizar dentro de una caja pequeña)
const creceTexto = (t) => { t.style.height = "auto"; t.style.height = Math.min(Math.max(t.scrollHeight + 2, t.classList.contains("corta") ? 90 : 140), innerHeight * 0.7) + "px"; };
document.addEventListener("input", (e) => { if (e.target.matches?.("textarea.crece")) creceTexto(e.target); });
// Botones de formato: «Negrita» pone **…** a lo elegido (o a la palabra donde está el cursor); «Lista» pone «- » al principio de las líneas
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-fmt]"); if (!b) return;
  e.preventDefault();
  const t = $(b.dataset.para); if (!t) return;
  let i = t.selectionStart, f = t.selectionEnd; const v = t.value;
  if (b.dataset.fmt === "negrita") {
    if (i === f) { while (i > 0 && /\S/.test(v[i - 1])) i--; while (f < v.length && /\S/.test(v[f])) f++; }
    const sel = v.slice(i, f);
    const nuevo = /^\*\*[\s\S]*\*\*$/.test(sel) ? sel.slice(2, -2) : "**" + (sel || "texto") + "**";
    t.setRangeText(nuevo, i, f, "select");
  } else {
    const ini = v.lastIndexOf("\n", i - 1) + 1, fin = v.indexOf("\n", f) < 0 ? v.length : v.indexOf("\n", f);
    const lineas = v.slice(ini, fin).split("\n"), todas = lineas.every(l => /^- /.test(l));
    t.setRangeText(lineas.map(l => todas ? l.replace(/^- /, "") : /^- /.test(l) ? l : "- " + l).join("\n"), ini, fin, "select");
  }
  t.focus(); t.dispatchEvent(new Event("input", { bubbles: true }));
});
function prepararArchivos(c) {
  const input = $("f-" + c.k), dz = $("dz-" + c.k), multi = c.t === "archivos";
  const añadir = (files) => {
    const lista = [...files];
    if (!multi) { ED.pendientes = []; if (ED.existentes[0]) { ED.quitar.push(ED.existentes[0].url); ED.existentes = []; } }
    lista.slice(0, multi ? 20 : 1).forEach(f => ED.pendientes.push({ file: f, error: validarArchivo(f), vista: f.type.startsWith("image/") ? URL.createObjectURL(f) : null }));
    if (!multi && lista[0] && !$("f-titulo").value.trim()) $("f-titulo").value = lista[0].name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    ED.sucio = true; input.value = ""; quitaFalta(dz); pintaArchivos(c); actualizarPrevia();
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
const TEXTO_LIBRE = ["text", "textarea", "url", "email", "tel"];
function leerFormulario() {
  const s = SECCIONES[ED.k], fila = {};
  for (const c of camposPlanos(s)) {
    if (c.t === "archivos" || c.t === "archivo") continue;
    const el = $("f-" + c.k); if (!el) continue;
    if (c.t === "check") fila[c.k] = el.checked;
    else if (c.t === "datetime-local") fila[c.k] = el.value ? new Date(el.value).toISOString() : null;
    else if (c.num) fila[c.k] = parseInt(el.value, 10) || 1;
    else if (c.t === "number") fila[c.k] = c.dec ? (parseFloat(String(el.value).replace(",", ".")) || 0) : parseInt(el.value || "0", 10);
    // v111: un texto opcional vacío se guarda como "" (muchas columnas de texto no admiten null y no dejaba guardar si no se escribía algo);
    // fechas, horas y desplegables opcionales vacíos siguen siendo null
    else { const v = el.value.trim(); fila[c.k] = v || (c.opc && !TEXTO_LIBRE.includes(c.t || "text") ? null : ""); }
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
  if (!$("ed-guardar").disabled) { const [ic, txt] = textoGuardar(f); $("ed-guardar").innerHTML = icono(ic, "p") + esc(txt); }
  $("ed-previa").innerHTML = s.previa(x);
  $("ed-previa").querySelectorAll("[data-canal]").forEach(b => b.onclick = () => { PREVIA_CANAL = b.dataset.canal; actualizarPrevia(); });
  aplicarCondiciones();
  $("ed-form").querySelectorAll("textarea.crece").forEach(t => { if (t.offsetParent && t !== document.activeElement) creceTexto(t); }); // p. ej. tras el asistente o un borrador
  if (["avisos", "recurrentes"].includes(ED.k)) avisoTitulo(f);
  $("ed-previa").querySelectorAll("a").forEach(a => a.onclick = (e) => { if (a.getAttribute("href") === "#" || a.href.startsWith("blob:")) e.preventDefault(); });
}
// El botón de guardar dice lo que va a pasar: un aviso a los móviles no se puede retirar, así que se ve antes de pulsar
// Encuestas: con votos, las opciones que ya había deben seguir en el mismo sitio (los votos van por posición)
function opcionesSeguras(orig, fila) {
  const v = VOTOS[orig.id] || {};
  if (!Object.values(v).some(n => n > 0)) return true;
  const antes = opcionesEncuesta(orig), ahora = opcionesEncuesta(fila);
  return antes.every((o, i) => ahora[i] === o);
}
function textoGuardar(f) {
  if (ED.orig) return $("f-reavisar")?.checked ? ["campana", "Guardar y avisar del cambio"] : ["check", "Guardar cambios"];
  if (f.publicado === false || f.publicada === false || f.visible === false) return ["check", "Guardar sin publicar"];
  const avisa = "notificar" in f && ED.k !== "recurrentes";
  if (f.publicar_en && new Date(f.publicar_en) > new Date()) return ["reloj", avisa ? (f.notificar ? "Programar y avisar" : "Programar sin avisar") : "Programar"];
  const base = ED.k === "documentos" ? "Subir" : "Publicar";
  return ["subir", avisa ? base + (f.notificar ? " y avisar" : " sin avisar") : base];
}
// Dónde se ve en la web lo que se está editando (para el botón «Ver en la web»). Vacío si no se ve todavía.
function enLaWeb(k, x) {
  if (x.publicado === false || x.publicada === false || x.visible === false) return "";
  if (x.publicar_en && new Date(x.publicar_en) > new Date()) return "";
  if (k === "avisos") return "aviso-" + x.id;
  if (/^ap\d+$/.test(k)) return "pub-" + x.id;
  if (k === "encuestas") return "encuesta-" + x.id;
  if (k === "apartados") return x.slug ? "ap-" + x.slug : "";
  return { calendario: "calendario", actas: "actas", convenio: "convenio", documentos: "documentos", preguntas: "preguntas", delegados: "delegados", enlaces: "info" }[k] || "";
}
// Campo que falta o está mal: borde rojo y la frase debajo del propio campo (en el pie casi no se veía en el móvil)
function marcaFalta(id, texto) {
  msg("ed-msg", texto); cambiarPestana("form");
  const el = $(id); if (!el) return;
  el.classList.add("falta"); el.setAttribute("aria-invalid", "true");
  let p = $(id + "-falta");
  if (!p) { p = document.createElement("p"); p.id = id + "-falta"; p.className = "falta-txt"; el.after(p); }
  p.innerHTML = icono("alerta", "p") + esc(texto); el.setAttribute("aria-describedby", p.id);
  el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (el.matches("input, textarea, select")) el.focus({ preventScroll: true });
}
function quitaFalta(el) {
  if (!el?.classList?.contains("falta")) return;
  el.classList.remove("falta"); el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby");
  $(el.id + "-falta")?.remove(); msg("ed-msg", "");
}
document.addEventListener("input", (e) => quitaFalta(e.target));
document.addEventListener("change", (e) => quitaFalta(e.target));
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
window.addEventListener("beforeunload", (e) => { if (ED?.sucio || PENDIENTE?.()) { e.preventDefault(); e.returnValue = ""; } });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && ED) cerrarEditor(); });

$("ed-guardar").onclick = async () => {
  const s = SECCIONES[ED.k], btn = $("ed-guardar"), fila = leerFormulario();
  // v102: «Destacar en Inicio el día» se guarda como destacar_desde/hasta (ese día entero) y lo pone urgente
  if ("destacar_dia" in fila) { const d = fila.destacar_dia; delete fila.destacar_dia;
    // v137 (petición n.º 10): «Destacado desde las / hasta las» para destacarlo solo unas horas de ese día
    const hd = fila.destacar_hora_desde || "", hh = fila.destacar_hora_hasta || ""; delete fila.destacar_hora_desde; delete fila.destacar_hora_hasta;
    if (d && hd && hh && hh <= hd) return marcaFalta("f-destacar_hora_hasta", "La hora de «hasta las» tiene que ser después de «desde las».");
    if (!d && (hd || hh)) return marcaFalta("f-destacar_dia", "Para destacarlo unas horas, elige también el día en «Destacar en Inicio el día».");
    Object.assign(fila, d ? { destacar_desde: new Date(d + "T" + (hd || "00:00") + ":00").toISOString(), destacar_hasta: new Date(d + "T" + (hh ? hh + ":00" : "23:59:59")).toISOString(), urgente: true } : { destacar_desde: null, destacar_hasta: null });
    // v103: si se quita el día y la casilla «Urgente» no se ha tocado, deja de ser urgente (lo puso el día destacado)
    if (!d && ED.orig?.destacar_desde && fila.urgente === !!ED.orig.urgente) fila.urgente = false;
    // Ese día se avisa a los móviles («DESTACADO HOY», tarea de la función notificar). Si cambia el día, se vuelve a avisar;
    // si es un aviso nuevo para hoy que ya avisa al publicarse, no se manda dos veces.
    if (d && (!ED.orig || isoLocal(new Date(ED.orig.destacar_desde || 0)) !== d)) fila.destacado_avisado = !ED.orig && d === isoLocal(new Date()) && fila.notificar !== false; }
  for (const c of camposPlanos(s)) {
    if (c.req && c.t !== "archivo" && c.t !== "archivos" && !fila[c.k]) return marcaFalta("f-" + c.k, "Falta: " + c.l.toLowerCase() + ".");
  }
  if (["avisos"].includes(ED.k) && /\[[^\]]{1,30}\]/.test((fila.titulo || "") + (fila.contenido || "")) && !confirm("El aviso todavía tiene partes entre [corchetes] sin rellenar. ¿Publicar igualmente?")) return;
  if (ED.k === "encuestas") {
    const n = opcionesEncuesta(fila).length;
    if (n < 2 || n > 6) return marcaFalta("f-opciones", "Pon de 2 a 6 opciones, una por línea.");
  }
  if (ED.k === "calendario" && fila.hora && fila.hora_fin && fila.hora_fin < fila.hora
    && !confirm(`La hora de fin (${fila.hora_fin}) es antes que la de inicio (${fila.hora}). ¿Guardar igualmente?`)) return marcaFalta("f-hora_fin", "Revisa la hora de fin: es antes que la de inicio.");
  if (ED.k === "encuestas" && ED.orig && !opcionesSeguras(ED.orig, fila)
    && !confirm("Esta encuesta ya tiene votos y has quitado o cambiado de sitio alguna opción. Los votos van por posición: pasarían a la opción que ahora ocupa ese lugar.\n\nSi solo has corregido una falta, puedes guardar. ¿Guardar igualmente?")) return marcaFalta("f-opciones", "Deja las opciones con votos en su sitio; las nuevas, al final.");
  if (s.valida) { const m = s.valida(fila); if (m) return marcaFalta("f-" + m[0], m[1]); }
  if (!(await revisarOrtografia(s, fila))) return;
  if (["enlaces", "restricciones", "prohibiciones"].includes(ED.k) && fila.url && !/^https?:\/\//.test(fila.url)) fila.url = "https://" + fila.url;
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
  if (ED.k === "documentos" && !ED.existentes.length && !ED.pendientes.length) return marcaFalta("dz-archivo", "Falta elegir el archivo.");
  btn.disabled = true;
  const subidos = [];
  try {
    if (ED.orig?.id != null && !(await sinCambiosDeOtro(s))) { btn.disabled = false; return msg("ed-msg", ""); }
    for (const [i, p] of ED.pendientes.entries()) {
      msg("ed-msg", `Subiendo archivo ${i + 1} de ${ED.pendientes.length}…`, true);
      subidos.push(await subirArchivo(p.file));
    }
    msg("ed-msg", "Guardando…", true);
    const adj = [...ED.existentes, ...subidos];
    if (ED.k === "documentos") { const a = adj[0]; Object.assign(fila, { url: a.url, nombre_archivo: a.nombre, tipo_archivo: a.tipo, tamano: a.tamano || null }); }
    else if (s.campos.some(c => c.t === "archivos")) fila.adjuntos = adj;
    // v101: un aviso que ya se ve en la web y al que se le pone fecha de publicación futura desaparece hasta ese día: preguntar
    if (ED.k === "avisos" && ED.orig && fila.publicar_en && new Date(fila.publicar_en) > new Date() && !(ED.orig.publicar_en && new Date(ED.orig.publicar_en) > new Date())
      && !confirm("Este aviso ya se ve en la web. Con «Programar la publicación» desaparecerá de la web hasta ese día.\n\nSi solo quieres que salga destacado en Inicio ese día, pulsa «Cancelar», borra la fecha de «Programar» y usa «Destacar en Inicio el día».\n\n¿Esconderlo hasta ese día?")) { btn.disabled = false; return msg("ed-msg", ""); }
    if (fila.publicar_en && new Date(fila.publicar_en) < new Date(Date.now() - 60000)) { if (!confirm("La fecha programada ya ha pasado. ¿Publicar ahora?")) { btn.disabled = false; return msg("ed-msg", ""); } fila.publicar_en = null; }
    const reavisar = !!(ED.orig && $("f-reavisar")?.checked);
    if (reavisar) Object.assign(fila, { notificar: true, notificado: false });
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
    RESALTAR = { k, id: guardado.id };
    abrir(["resumen", "calendario"].includes(actual) ? actual : (s.volver || k));
    if (fila.publicado === false || fila.publicada === false || (k === "convenio" && fila.visible === false)) return aviso(editado ? "Cambios guardados. Está oculto: no se ve en la web." : "Guardado sin publicar: no se ve en la web y no se ha avisado a nadie. Para publicarlo, ábrelo y marca «Se ve en la web».");
    if (reavisar) {
      const r = await sb.functions.invoke("notificar", { body: { modo: "publicado", tabla: s.tabla, id: guardado.id, cambio: true } }).catch(() => null);
      return trasPublicar(k, guardado, r?.data || null);
    }
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
    msg("ed-msg", errTxt(e)); btn.disabled = false;
    if (/sesión/.test(errTxt(e))) { // sesión caducada: se guarda el borrador y se ofrece volver a entrar sin perderlo
      guardarBorrador();
      const b = document.createElement("button"); b.type = "button"; b.className = "btn sec"; b.textContent = "Volver a entrar";
      b.onclick = () => { ED.sucio = false; location.reload(); };
      $("ed-msg").append(" ", b);
    }
  }
};
// Con dos administradores (o el panel abierto en dos sitios), comprueba que nadie ha cambiado esto mientras se editaba
const NO_CUENTA = ["notificado", "actualizado", "ultima_publicacion", "orden", "destacado_avisado"];
async function sinCambiosDeOtro(s) {
  const { data: ahora, error } = await sb.from(s.tabla).select("*").eq("id", ED.orig.id).maybeSingle();
  if (error) return true; // si no se puede comprobar, se guarda como siempre
  if (!ahora) { msg("ed-msg", "Mientras lo editabas, otra persona lo ha borrado. Puedes recuperarlo en «Historial»."); return false; }
  const otro = Object.keys(ahora).some(k => !NO_CUENTA.includes(k) && k in ED.orig && JSON.stringify(ahora[k]) !== JSON.stringify(ED.orig[k]));
  return !otro || confirm("Mientras lo editabas, otra persona (o el panel abierto en otro sitio) ha cambiado esto.\n\nSi guardas, tus cambios sustituyen a los suyos (los suyos quedan en «Historial»). ¿Guardar los tuyos?");
}
$("ed-borrar").onclick = async () => {
  const s = SECCIONES[ED.k], x = ED.orig;
  if (ED.k === "apartados") {
    const { data: pubs } = await sb.from("publicaciones").select("adjuntos").eq("apartado_id", x.id);
    if ((pubs || []).length) {
      const n = pubs.length, r = prompt(`El apartado «${x.titulo}» tiene ${n} ${n === 1 ? "publicación" : "publicaciones"}. Si lo borras, se ${n === 1 ? "borrará" : "borrarán"} también, con sus fotos y documentos.\n\nSi solo quieres que no se vea, pulsa Cancelar y desmarca «Se ve en la web».\n\nPara borrarlo todo, escribe BORRAR:`);
      if ((r || "").trim().toUpperCase() !== "BORRAR") return aviso("No se ha borrado nada.");
    } else if (!confirm(`¿Borrar el apartado «${x.titulo}»? Está vacío. Desaparecerá de la web.`)) return;
  }
  // Lo demás se borra sin preguntar: sale «Deshacer» unos segundos (y siempre se puede recuperar en «Historial»)
  const { error } = await sb.from(s.tabla).delete().eq("id", x.id);
  if (error) return msg("ed-msg", "No se ha podido borrar: " + errTxt(error));
  // Los archivos se conservan para poder recuperarlo desde el Historial (se limpian en Ajustes > Archivos sin usar).
  ED.sucio = false; const k = ED.k, volver = ["resumen", "calendario"].includes(actual) ? actual : (s.volver || k); await cerrarEditor();
  if (k === "apartados") { await cargarApartados(); pintaNav(); }
  abrir(volver);
  const { data: h } = await sb.from("historial").select("id").eq("tabla", s.tabla).eq("clave", String(x.id)).eq("accion", "borrar").order("cuando", { ascending: false }).limit(1).maybeSingle();
  if (!h) return aviso("Borrado. Si te has equivocado, recupéralo en «Historial».");
  avisoDeshacer(`Borrado «${s.tituloDe ? s.tituloDe(x) : x.titulo}».`, async () => {
    const { error: e } = await sb.rpc("recuperar_cambio", { p_id: h.id });
    if (e) return aviso(errTxt(e), true);
    if (k === "apartados") { await cargarApartados(); pintaNav(); }
    aviso("Recuperado. Ya vuelve a estar como antes."); abrir(volver);
  });
};
// Aviso abajo con un botón «Deshacer» (8 s)
function avisoDeshacer(texto, deshacer) {
  const t = $("toast");
  t.innerHTML = icono("check", "p") + esc(texto) + ` <button type="button" class="toast-deshacer">Deshacer</button>`;
  t.style.background = "";
  t.querySelector(".toast-deshacer").onclick = () => { t.classList.remove("ver"); deshacer(); };
  t.classList.add("ver"); clearTimeout(aviso.t); aviso.t = setTimeout(() => t.classList.remove("ver"), 8000);
}

// ---------- Asistente de actas (a partir de fotos y archivos) ----------
// Foto de las notas (aunque sean a mano), PDF o Word → función «generar-acta» (IA gratuita de Google, Gemini) → rellena
// título, tipo, fecha, resumen y acuerdos. Nunca publica solo: se revisa y se pulsa «Publicar».
// v132, tapar datos (traído del comité, su v12; lo pidió Lorena: que no vaya a Google lo importante). Todo en el propio dispositivo:
//  - Texto (notas, Word, PDF con texto): `tapaTexto` cambia nombres por [PERSONA n] (y `devuelveNombres` los vuelve a poner al
//    recibir el borrador: Google nunca los ve) y tapa sin vuelta DNI/NIE, teléfonos, emails, cuentas, matrículas y n.º de la Seg. Social.
//    Nombres: los de los delegados, la lista «Nombres que se tapan siempre» (solo en este dispositivo, localStorage ccoo-ia-tapar)
//    y los que vienen detrás de «Sr.», «compañero», etc. o dos o tres palabras en mayúscula seguidas que no estén en `NO_NOMBRES`.
//  - Fotos y PDF escaneados (páginas convertidas en foto con pdf.js, lib/pdfjs, 4.10.38 legacy, Apache 2.0, cargado con import()
//    solo al usarlo): `abreTapador`, se tapa con el dedo y se envía la imagen ya pintada (sin datos ocultos de la foto).
//  - Antes de enviar, «Esto es lo que se enviará» (`#ia-revision`, `revisaEnvio`) con lo tapado marcado; luego `generarActa`.
let IA_ARCHIVOS = [], IA_ENVIO = null;
const IA_MAX = 6;
const CLAVE_TAPAR = "ccoo-ia-tapar";
const leeTapar = () => { try { return localStorage.getItem(CLAVE_TAPAR) || ""; } catch (_) { return ""; } };
const guardaTapar = (v) => { try { localStorage.setItem(CLAVE_TAPAR, v); } catch (_) {} };
function asistenteHTML() {
  return `<div class="asistente">
    <h3>${icono("magia", "p")}Hacer el acta con el asistente</h3>
    <p class="ayuda">Haz una <b>foto de tus notas</b> (aunque sean a mano) o sube el <b>PDF o Word</b> de la reunión. El asistente rellena el acta de abajo y tú la revisas antes de publicar.</p>
    <p class="ia-protege">${icono("escudo", "p")}<span><b>Los datos importantes se tapan antes de enviar.</b> En el texto se tapan solos los nombres, DNI, teléfonos, emails y cuentas. En las fotos, los tapas tú con el dedo. Antes de enviar ves exactamente lo que sale.</span></p>
    <div class="ia-botones">
      <label class="ia-boton">${icono("camara")}<b>Hacer foto</b><span>con la cámara</span>
        <input type="file" id="f-ia-cam" accept="image/*" capture="environment"></label>
      <label class="ia-boton">${icono("subir")}<b>Elegir archivos</b><span>fotos, PDF, Word</span>
        <input type="file" id="f-ia" multiple accept="image/*,application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"></label>
    </div>
    <div class="archivos" id="lista-ia"></div>
    <details class="nota-ia"><summary>Añadir una nota escrita (opcional)</summary>
      <textarea id="notas-ia" placeholder="Algo que no esté en los archivos: quién asistió, la fecha…"></textarea></details>
    <details class="nota-ia"><summary>Nombres que se tapan siempre</summary>
      <p class="ayuda">Uno por línea: compañeros, jefes, clientes… Se guardan solo en este dispositivo. Los nombres de los delegados se tapan solos.</p>
      <textarea id="tapar-ia" placeholder="Juan Pérez García&#10;Transportes Ejemplo"></textarea></details>
    <p class="ayuda"><b>Importante:</b> lo que se envía va a la IA gratuita de Google (Gemini), que puede usarlo para mejorar sus productos. Por eso se tapa antes lo importante.</p>
    <div class="botones" style="margin-top:12px"><button class="btn azul" id="b-ia" disabled>${icono("magia", "p")}Preparar y revisar</button></div>
    <div id="ia-revision" hidden></div>
    <div class="msg" id="m-ia"></div>
  </div>`;
}

// ---- Tapar en el texto ----
const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const VOCALES = { a: "aáàâä", e: "eéèêë", i: "iíìîï", o: "oóòôö", u: "uúùûü" };
// «Pérez» también tapa «Perez» (y al revés)
const patronNombre = (n) => escRe(n.trim()).replace(/\s+/g, "\\s+").replace(/[aeiouáéíóúàèìòùâêîôûäëïöü]/gi, (c) => {
  const base = c.normalize("NFD")[0].toLowerCase(); return VOCALES[base] ? "[" + VOCALES[base] + "]" : c; });
const BORDE_I = "(?<![\\p{L}\\p{N}])", BORDE_D = "(?![\\p{L}\\p{N}])";
// Palabras con mayúscula que no son nombres de personas (no se tapan aunque vayan dos seguidas)
const NO_NOMBRES = new Set(("calsina carré carre comité comite empresa recursos humanos seguridad social convenio reunión reunion acta asamblea orden día dia " +
  "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre lunes martes miércoles miercoles jueves viernes sábado sabado domingo " +
  "españa espana cataluña cataluna girona barcelona francia italia alemania europa ccoo ugt cgt usoc csif sección seccion sindical sindicato el la los las del de y en por para con se que no si " +
  "nave almacén almacen oficina dirección direccion gerencia prevención prevencion riesgos laborales salud laboral ett mutua inspección inspeccion trabajo " +
  "turno turnos tráfico trafico taller gasolinera muelle punto puntos acuerdos acuerdo resumen asistentes asisten presidente presidenta secretario secretaria delegado delegada delegados").split(/\s+/));
async function nombresATapar() {
  const propios = leeTapar().split(/\n+/).map(x => x.trim()).filter(x => x.length >= 2);
  let deleg = [];
  try { const { data } = await sb.from("delegados").select("nombre"); deleg = (data || []).map(m => m.nombre).filter(Boolean); } catch (_) {}
  const todos = new Set();
  [...propios, ...deleg].forEach(n => { todos.add(n); n.split(/\s+/).filter(p => p.length >= 3 && !NO_NOMBRES.has(p.toLowerCase())).forEach(p => todos.add(p)); });
  return [...todos].sort((x, y) => y.length - x.length); // primero los largos («Juan Pérez» antes que «Juan»)
}
function tapaTexto(texto, nombres) {
  const mapa = {}, cuenta = {}, porValor = new Map();
  let n = 0, t = texto;
  const persona = (orig) => { const k = orig.replace(/\s+/g, " ").trim(); if (!porValor.has(k.toLowerCase())) { n++; porValor.set(k.toLowerCase(), n); mapa[n] = k; } cuenta.nombre = (cuenta.nombre || 0) + 1; return "[PERSONA " + porValor.get(k.toLowerCase()) + "]"; };
  const fijo = (tipo, marca) => () => { cuenta[tipo] = (cuenta[tipo] || 0) + 1; return "[" + marca + "]"; };
  // Datos que no vuelven: se quedan tapados también en el acta
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, fijo("email", "EMAIL TAPADO"));
  t = t.replace(/\b[A-Z]{2}\d{2}(?:[ -]?[A-Z0-9]{4}){4,7}\b/gi, fijo("cuenta", "CUENTA TAPADA"));
  t = t.replace(/\b(?:\d[ -]?){15,18}\d\b/g, fijo("cuenta", "NÚMERO TAPADO"));
  t = t.replace(/\b\d{2}[ /-]?\d{8}[ /-]?\d{2}\b/g, fijo("ss", "N.º SEG. SOCIAL TAPADO"));
  t = t.replace(/\b[XYZxyz][ -]?\d{7}[ -]?[A-Za-z]\b/g, fijo("dni", "DNI TAPADO"));
  t = t.replace(/\b\d{8}[ -]?[A-Za-z]\b/g, fijo("dni", "DNI TAPADO"));
  t = t.replace(/(?:\+|00)\d{2}[ .-]?\d{3}[ .-]?\d{2,3}[ .-]?\d{2,3}[ .-]?\d{0,3}\b/g, fijo("tel", "TELÉFONO TAPADO"));
  t = t.replace(/\b[6789]\d{2}(?:[ .-]?\d{2,3}){2,3}\b/g, (m) => m.replace(/\D/g, "").length === 9 ? fijo("tel", "TELÉFONO TAPADO")(m) : m);
  t = t.replace(/\b\d{4}[ -]?[BCDFGHJKLMNPRSTVWXYZ]{3}\b/g, fijo("matricula", "MATRÍCULA TAPADA"));
  // Nombres de las listas (se devuelven al recibir el borrador)
  nombres.forEach(nom => { t = t.replace(new RegExp(BORDE_I + patronNombre(nom) + BORDE_D, "giu"), persona); });
  // Detrás de tratamientos y palabras como «compañero»: hasta 3 palabras con mayúscula
  const MAY = "\\p{Lu}[\\p{L}'-]+";
  t = t.replace(new RegExp("(" + BORDE_I + "(?:Sr\\.?|Sra\\.?|Srta\\.?|D\\.|Dña\\.?|Don|Doña|señor|señora|compañer[oa]s?|trabajador(?:a|es|as)?|conductor(?:a|es|as)?|jef[ea]|encargad[oa]|mecánic[oa])\\s+)(" + MAY + "(?:\\s+" + MAY + "){0,2})", "gu"),
    (m, pre, nom) => NO_NOMBRES.has(nom.split(/\s+/)[0].toLowerCase()) ? m : pre + persona(nom));
  // Dos o tres palabras seguidas con mayúscula que no son de la lista de palabras normales (Nombre Apellido)
  t = t.replace(new RegExp(BORDE_I + "(" + MAY + "(?:\\s+" + MAY + "){1,2})" + BORDE_D, "gu"), (m) =>
    m.split(/\s+/).some(p => NO_NOMBRES.has(p.toLowerCase())) || /^\[|PERSONA|TAPAD/.test(m) ? m : persona(m));
  return { texto: t, mapa, cuenta };
}
const devuelveNombres = (t, mapa) => String(t || "").replace(/\[?\s*PERSONA\s+(\d+)\s*\]?/gi, (m, k) => mapa[k] || m);

// ---- Tapar en las fotos, con el dedo ----
const cargaImagen = (blob) => new Promise((ok, mal) => { const u = URL.createObjectURL(blob), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => { URL.revokeObjectURL(u); mal(new Error("No se ha podido abrir esa foto. Prueba con JPG o PNG.")); }; i.src = u; });
function abreTapador(img, titulo) {
  return new Promise((ok) => {
    const r = Math.min(1, 2000 / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const W = Math.round((img.naturalWidth || img.width) * r), H = Math.round((img.naturalHeight || img.height) * r);
    const v = document.createElement("div"); v.className = "tapador"; v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "Tapar datos de la foto");
    v.innerHTML = `<div class="tapador-cab"><b>${esc(titulo)}</b><span>Pasa el dedo por encima de nombres, DNI, teléfonos… Lo que pintes en negro no se envía.</span></div>
      <div class="tapador-lienzo"><canvas width="${W}" height="${H}"></canvas></div>
      <div class="tapador-herr">
        <span class="tapador-grosor" role="group" aria-label="Grosor">${[["Fino", 0.025], ["Medio", 0.045], ["Gordo", 0.08]].map(([l, g], i) => `<button type="button" data-grosor="${g}" aria-pressed="${i === 1}">${l}</button>`).join("")}</span>
        <button type="button" class="btn sec peq" data-tap="deshacer">${icono("recuperar", "p")}Deshacer</button>
        <button type="button" class="btn sec peq" data-tap="todo">${icono("borrar", "p")}Quitar lo pintado</button>
      </div>
      <div class="tapador-pie"><button type="button" class="btn sec" data-tap="cancelar">No usar esta foto</button><button type="button" class="btn azul" data-tap="listo">${icono("check", "p")}Listo</button></div>`;
    document.body.appendChild(v); document.body.classList.add("sin-scroll");
    const cv = v.querySelector("canvas"), cx = cv.getContext("2d"), trazos = [];
    let grosor = 0.045, actual = null;
    const pinta = () => {
      cx.drawImage(img, 0, 0, W, H); cx.lineCap = "round"; cx.lineJoin = "round"; cx.strokeStyle = "#000";
      trazos.forEach(t => { cx.lineWidth = t.g * Math.max(W, H); cx.beginPath(); t.p.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y)); if (t.p.length === 1) cx.lineTo(t.p[0][0] + 0.1, t.p[0][1]); cx.stroke(); });
    };
    const punto = (e) => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height]; };
    cv.addEventListener("pointerdown", (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); actual = { g: grosor, p: [punto(e)] }; trazos.push(actual); pinta(); });
    cv.addEventListener("pointermove", (e) => { if (!actual) return; actual.p.push(punto(e)); pinta(); });
    const suelta = () => { actual = null; };
    cv.addEventListener("pointerup", suelta); cv.addEventListener("pointercancel", suelta);
    const cierra = (res) => { v.remove(); document.body.classList.remove("sin-scroll"); ok(res); };
    v.addEventListener("click", (e) => {
      const g = e.target.closest("[data-grosor]");
      if (g) { grosor = +g.dataset.grosor; v.querySelectorAll("[data-grosor]").forEach(b => b.setAttribute("aria-pressed", String(b === g))); return; }
      const b = e.target.closest("[data-tap]"); if (!b) return;
      if (b.dataset.tap === "deshacer") { trazos.pop(); pinta(); }
      if (b.dataset.tap === "todo") { trazos.length = 0; pinta(); }
      if (b.dataset.tap === "cancelar") cierra(null);
      if (b.dataset.tap === "listo") { pinta(); cv.toBlob(bl => cierra(bl ? { blob: bl, tapado: trazos.length } : null), "image/jpeg", 0.85); }
    });
    v.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); cierra(null); } });
    pinta(); v.querySelector('[data-tap="listo"]').focus();
  });
}

// ---- PDF: texto si lo tiene; si es escaneado, cada página como foto (para taparla) ----
let PDFJS = null;
async function cargaPdfjs() {
  if (PDFJS) return PDFJS;
  PDFJS = await import("./lib/pdfjs/pdf.min.mjs");
  PDFJS.GlobalWorkerOptions.workerSrc = "lib/pdfjs/pdf.worker.min.mjs";
  return PDFJS;
}
async function leePdf(f) {
  const pj = await cargaPdfjs();
  const doc = await pj.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise;
  const n = Math.min(doc.numPages, 20); let texto = "";
  for (let i = 1; i <= n; i++) { const c = await (await doc.getPage(i)).getTextContent(); texto += c.items.map(x => x.str + (x.hasEOL ? "\n" : " ")).join("") + "\n\n"; }
  if (texto.replace(/\s/g, "").length >= 40 * n) return { texto: texto.trim(), paginas: doc.numPages };
  const imgs = [];
  for (let i = 1; i <= Math.min(doc.numPages, IA_MAX); i++) {
    const p = await doc.getPage(i), v1 = p.getViewport({ scale: 1 }), vp = p.getViewport({ scale: 1600 / Math.max(v1.width, v1.height) });
    const cv = document.createElement("canvas"); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
    await p.render({ canvasContext: cx, viewport: vp }).promise; imgs.push(cv);
  }
  return { imgs, paginas: doc.numPages };
}
// Saca el texto de un Word (.docx) en el propio navegador
async function textoDeWord(f) {
  if (!window.JSZip) await new Promise((ok, mal) => { const sc = document.createElement("script"); sc.src = "lib/jszip.min.js"; sc.onload = ok; sc.onerror = () => mal(new Error("No se ha podido abrir el Word. Guárdalo como PDF y súbelo otra vez.")); document.head.appendChild(sc); });
  const zip = await JSZip.loadAsync(f), xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error(`«${f.name}» no parece un Word válido.`);
  return xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
}

function prepararAsistente() {
  IA_ARCHIVOS = []; IA_ENVIO = null;
  $("tapar-ia").value = leeTapar();
  const olvida = () => { $("ia-revision").hidden = true; IA_ENVIO = null; };
  const pinta = () => {
    $("lista-ia").innerHTML = IA_ARCHIVOS.map((x, i) => `<div class="archivo-fila"><span class="ic">${x.blob ? `<img src="${URL.createObjectURL(x.blob)}" alt="">` : icono("texto", "p")}</span>
        <span class="txt"><b>${esc(x.nombre)}</b><small class="ok">${x.blob ? (x.tapado ? "foto con " + x.tapado + (x.tapado === 1 ? " zona tapada" : " zonas tapadas") : "foto sin tapar nada") : "texto: los datos se tapan solos"}</small></span>
        ${x.blob ? `<button type="button" class="btn sec peq" data-tapar-ia="${i}">${icono("editar", "p")}Tapar</button>` : ""}
        <button type="button" class="btn-ic" data-q="${i}" aria-label="Quitar ${esc(x.nombre)}">${icono("cerrar", "p")}</button></div>`).join("");
    $("b-ia").disabled = !IA_ARCHIVOS.length && $("notas-ia").value.trim().length < 20;
    olvida();
  };
  const fotos = () => IA_ARCHIVOS.filter(x => x.blob).length;
  const añadeFoto = async (fuente, nombre) => {
    if (fotos() >= IA_MAX) throw new Error("como mucho " + IA_MAX + " fotos o páginas");
    const r = await abreTapador(fuente, nombre); if (r) IA_ARCHIVOS.push({ nombre, blob: r.blob, tapado: r.tapado });
  };
  const añadir = async (files) => {
    const malos = [];
    for (const f of files) {
      const t = mimeDe(f), ext = extDe(f.name);
      try {
        if (t.startsWith("image/")) await añadeFoto(await cargaImagen(f), f.name);
        else if (t === "application/pdf" || ext === "pdf") {
          msg("m-ia", "Leyendo el PDF…", true);
          const p = await leePdf(f);
          if (p.texto) IA_ARCHIVOS.push({ nombre: f.name, texto: p.texto });
          else { msg("m-ia", "Es un PDF escaneado: tapa lo que no quieras enviar en cada página.", true); for (const [i, c] of p.imgs.entries()) await añadeFoto(c, `${f.name} · página ${i + 1}${p.paginas > p.imgs.length ? " de " + p.paginas : ""}`); }
        } else if (ext === "docx") IA_ARCHIVOS.push({ nombre: f.name, texto: (await textoDeWord(f)).slice(0, 25000) });
        else if (ext === "txt" || t === "text/plain") IA_ARCHIVOS.push({ nombre: f.name, texto: (await f.text()).slice(0, 25000) });
        else malos.push(f.name);
      } catch (e) { malos.push(f.name + " (" + errTxt(e) + ")"); }
    }
    msg("m-ia", malos.length ? "No se pueden usar: " + malos.join(", ") + ". Usa fotos, PDF o Word (.docx)." : "", !malos.length);
    $("f-ia").value = ""; $("f-ia-cam").value = ""; pinta();
  };
  $("f-ia").onchange = () => añadir([...$("f-ia").files]);
  $("f-ia-cam").onchange = () => añadir([...$("f-ia-cam").files]);
  $("notas-ia").oninput = pinta;
  $("tapar-ia").oninput = () => { guardaTapar($("tapar-ia").value); olvida(); };
  $("lista-ia").onclick = async (e) => {
    const q = e.target.closest("[data-q]"), t = e.target.closest("[data-tapar-ia]");
    if (q) { e.preventDefault(); IA_ARCHIVOS.splice(+q.dataset.q, 1); pinta(); }
    if (t) { e.preventDefault(); const x = IA_ARCHIVOS[+t.dataset.taparIa]; const r = await abreTapador(await cargaImagen(x.blob), x.nombre); if (r) { x.blob = r.blob; x.tapado = (x.tapado || 0) + r.tapado; } pinta(); }
  };
  const zona = $("ed-form").querySelector(".asistente");
  zona.ondragover = (e) => { e.preventDefault(); zona.classList.add("encima"); };
  zona.ondragleave = () => zona.classList.remove("encima");
  zona.ondrop = (e) => { e.preventDefault(); zona.classList.remove("encima"); añadir([...e.dataTransfer.files]); };
  $("b-ia").onclick = (e) => { e.preventDefault(); revisaEnvio(); };
  $("ia-revision").onclick = (e) => {
    if (e.target.closest("[data-ia-enviar]")) { e.preventDefault(); generarActa(); }
    if (e.target.closest("[data-ia-volver]")) { e.preventDefault(); olvida(); }
  };
}
// Paso 1: tapa y enseña exactamente lo que va a salir
async function revisaEnvio() {
  const notas = $("notas-ia").value.trim();
  if (notas.length < 20 && !IA_ARCHIVOS.length) return msg("m-ia", "Añade una foto o un archivo con las notas de la reunión.");
  let texto = notas;
  IA_ARCHIVOS.filter(x => x.texto).forEach(x => { texto += `\n\nContenido de «${x.nombre}»:\n` + x.texto; });
  const { texto: tapado, mapa, cuenta } = tapaTexto(texto.trim(), await nombresATapar());
  const imgs = IA_ARCHIVOS.filter(x => x.blob), nNom = Object.keys(mapa).length;
  IA_ENVIO = { texto: tapado, mapa, imgs };
  const partes = [nNom && nNom + (nNom === 1 ? " nombre" : " nombres"), cuenta.dni && cuenta.dni + " DNI/NIE", cuenta.tel && cuenta.tel + (cuenta.tel === 1 ? " teléfono" : " teléfonos"),
    cuenta.email && cuenta.email + " email", cuenta.cuenta && cuenta.cuenta + " n.º de cuenta", cuenta.ss && cuenta.ss + " n.º Seg. Social", cuenta.matricula && cuenta.matricula + " matrícula"].filter(Boolean);
  const sinTapar = imgs.filter(x => !x.tapado).length;
  const marca = (t) => esc(t).replace(/\[(PERSONA \d+|[^\]]*TAPAD[OA])\]/g, "<mark>[$1]</mark>");
  $("ia-revision").innerHTML = `<div class="ia-rev">
    <b>Esto es lo que se enviará a la IA de Google</b>
    <p class="ayuda">${partes.length ? "Se han tapado: " + esc(partes.join(", ")) + ". Los nombres vuelven a su sitio al recibir el borrador; lo demás se queda tapado." : "En el texto no se ha encontrado nada que tapar."} Si ves algo que no quieres enviar, pulsa «Volver», añádelo a «Nombres que se tapan siempre» o bórralo de la nota.</p>
    ${tapado ? `<pre class="ia-texto">${marca(tapado)}</pre>` : ""}
    ${imgs.length ? `<div class="ia-fotos">${imgs.map(x => `<img src="${URL.createObjectURL(x.blob)}" alt="${esc(x.nombre)}">`).join("")}</div>` : ""}
    ${sinTapar ? `<p class="ia-ojo">${icono("alerta", "p")}<span>${sinTapar === 1 ? "Hay 1 foto en la que no has tapado nada" : "Hay " + sinTapar + " fotos en las que no has tapado nada"}. Si sale algún nombre o dato, pulsa «Volver» y luego «Tapar».</span></p>` : ""}
    <div class="botones"><button type="button" class="btn sec" data-ia-volver>Volver</button><button type="button" class="btn azul" data-ia-enviar>${icono("magia", "p")}Enviar y hacer el acta</button></div>
  </div>`;
  $("ia-revision").hidden = false; msg("m-ia", "", true);
  $("ia-revision").scrollIntoView({ behavior: "smooth", block: "start" });
}
const blobABase64 = (blob) => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = mal; r.readAsDataURL(blob); });
// Paso 2: envía lo tapado y vuelve a poner los nombres en el borrador
async function generarActa() {
  const env = IA_ENVIO; if (!env) return;
  const btn = $("ia-revision").querySelector("[data-ia-enviar]"); btn.disabled = true;
  try {
    const archivos = [];
    for (const x of env.imgs) archivos.push({ mime: "image/jpeg", data: await blobABase64(x.blob), nombre: x.nombre.replace(/\.[^.]+$/, "") + ".jpg" });
    const nota = Object.keys(env.mapa).length ? "Nota: los nombres de personas se han cambiado por marcas como [PERSONA 1]. Usa esas marcas tal cual donde haga falta un nombre. Lo que pone TAPADO no se puede leer.\n\n" : "";
    msg("m-ia", "Leyendo las notas y redactando el acta… (puede tardar unos segundos)", true);
    const { data, error } = await sb.functions.invoke("generar-acta", { body: { notas: (nota + env.texto).trim(), tipos: nombres("acta"), hoy: hoyISO(), archivos } });
    if (error) { let m = "No se ha podido generar el acta."; try { m = (await error.context.json()).error || m; } catch (_) {} throw new Error(m); }
    const a = data.acta, vuelve = (t) => devuelveNombres(t, env.mapa);
    $("f-titulo").value = vuelve(a.titulo);
    const sel = $("f-tipo");
    if (a.tipo && ![...sel.options].some(o => o.value === a.tipo)) sel.add(new Option(a.tipo, a.tipo));
    if (a.tipo) sel.value = a.tipo;
    if (a.fecha) $("f-fecha").value = a.fecha;
    $("f-resumen").value = vuelve(a.resumen);
    $("f-acuerdos").value = vuelve(a.acuerdos);
    ED.sucio = true; actualizarPrevia();
    $("ia-revision").hidden = true;
    const falta = [!a.fecha && "pon la fecha de la reunión", a.avisos && vuelve(a.avisos)].filter(Boolean).join(". ");
    msg("m-ia", "Hecho. Revisa el acta abajo" + (falta ? " (ojo: " + falta + ")" : "") + " y pulsa «Publicar».", true);
    $("f-titulo").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (e) { msg("m-ia", errTxt(e)); }
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
  if (x.frecuencia === "diaria") return `Cada día a las ${horaCorta(x.hora)}` + (x.hasta ? `, hasta el ${fechaLarga(x.hasta + "T12:00:00")}` : "");
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
    if (x.hasta && isoLocal(d) > x.hasta) return "ya no se publicará más (terminó el " + fechaLarga(x.hasta + "T12:00:00") + ")"; // v102
    const toca = x.frecuencia === "diaria" ? true : x.frecuencia === "semanal" ? ((d.getDay() + 6) % 7) + 1 === Number(x.dia_semana || 1)
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
  intro: "Avisos que se publican solos cada día, cada semana, cada mes o cada año, a la hora que elijas, hasta el día que quieras. Por ejemplo: «Recuerda entregar la hoja de horas», el día 25 de cada mes.",
  campos: [
    { k: "titulo", l: "Título", t: "text", req: true, ph: "Ej: Recuerda entregar la hoja de horas" },
    { k: "categoria", l: "Categoría", t: "select", lista: "aviso" },
    { k: "contenido", l: "Texto del aviso", t: "textarea", formato: true },
    { k: "frecuencia", l: "Cada cuánto se publica", t: "select", ops: [["mensual", "Cada mes"], ["semanal", "Cada semana"], ["diaria", "Cada día"], ["anual", "Cada año"]], def: "mensual" },
    { fila: [
      { k: "dia_mes", l: "Día del mes", t: "select", num: true, ops: Array.from({ length: 31 }, (_, i) => [i + 1, String(i + 1)]), def: 1, si: "frecuencia:mensual,anual" },
      { k: "mes", l: "Mes", t: "select", num: true, ops: MESES.map((m, i) => [i + 1, m.charAt(0).toUpperCase() + m.slice(1)]), def: 1, si: "frecuencia:anual" },
      { k: "dia_semana", l: "Día de la semana", t: "select", num: true, ops: DIAS_SEMANA.map((d, i) => [i + 1, d.charAt(0).toUpperCase() + d.slice(1)]), def: 1, si: "frecuencia:semanal" },
      { k: "hora", l: "Hora", t: "time", def: "09:00" },
    ] },
    { k: "hasta", l: "Repetir hasta", t: "date", opc: true, ayuda: "El último día en que se publica. Déjalo vacío para que se repita siempre." },
    { checks: [{ k: "activo", l: "Activo (desmárcalo para pausarlo sin borrarlo)", def: true }, { k: "urgente", l: "Urgente: sale en rojo y arriba del todo" }, { k: "notificar", l: "Avisar en los móviles y en Telegram cada vez", def: true }] },
  ],
  ayuda: "Si eliges el día 31 y el mes tiene menos días, se publica el último día del mes.",
  previa: (x) => `<p class="proxima-vez">${icono("reloj2", "p")}<span>${esc(frecTxt(x))}.<br><b>Próxima vez: ${esc(proximaVez(x))}</b></span></p>` + previaCanales({ ...x, fecha: new Date().toISOString(), id: 0 }),
  extracto: (x) => x.contenido, chips: (x) => [frecTxt(x), x.activo === false ? "Pausado" : x.hasta && x.hasta < isoLocal(new Date()) ? "Terminado" : "Activo", x.ultima_publicacion && "Última vez: " + fechaLarga(x.ultima_publicacion + "T12:00:00")], fechas: (x) => [x.creado, x.actualizado],
};

