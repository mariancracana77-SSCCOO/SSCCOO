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
      && !confirm("Este aviso ya se ve en la web. Con «Programar la publicación» desaparecerá de la web hasta ese día.\n\nSi solo quieres que salga urgente o fijado ese día, pulsa «Cancelar», borra la fecha de «Programar» y usa «Destacar desde».\n\n¿Esconderlo hasta ese día?")) { btn.disabled = false; return msg("ed-msg", ""); }
    if (fila.destacar_desde && fila.destacar_hasta && new Date(fila.destacar_hasta) <= new Date(fila.destacar_desde)) { btn.disabled = false; return msg("ed-msg", "«Destacar hasta» tiene que ser después de «Destacar desde».", false); }
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
const NO_CUENTA = ["notificado", "actualizado", "ultima_publicacion", "orden"];
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

