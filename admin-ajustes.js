// Panel: Ajustes (dos pasos, canales, plantillas, copia de seguridad, instalar).
// El panel está repartido en admin-base.js, admin-sesion.js, admin-listas.js, admin-editor.js,
// admin-herramientas.js, admin-ajustes.js y admin-calendario.js, que se cargan en ese orden (comparten variables).

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
    if (error) return msg("m-2p", "No se ha podido empezar: " + errTxt(error));
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
  filasLista = {}; LISTAS_SUCIAS.clear();
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
    $("nn-" + k).value = ""; LISTAS_SUCIAS.add(k); pintaLista(k); msg("m-" + k, "Añadida. Pulsa «Guardar cambios» para que se guarde.", true);
  });
  document.querySelectorAll("[data-guardar]").forEach(b => b.onclick = () => guardarLista(b.dataset.guardar));
  document.querySelectorAll("[id^=nn-]").forEach(i => i.onkeydown = (e) => { if (e.key === "Enter") document.querySelector(`[data-anadir="${i.id.slice(3)}"]`).click(); });
  PENDIENTE = pendienteAjustes;
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
    f.querySelector("select").onchange = (e) => { LISTAS_SUCIAS.add(k); o.color = e.target.value; e.target.className = "sel-color c-" + o.color; };
    f.querySelector("input").oninput = (e) => { LISTAS_SUCIAS.add(k); o.nombre = e.target.value; };
    f.querySelectorAll("[data-mov]").forEach(b => b.onclick = () => {
      const vis = filasLista[k].filter(x => !x.borrar), i = vis.indexOf(o), j = i + +b.dataset.mov;
      const a = filasLista[k].indexOf(vis[i]), c = filasLista[k].indexOf(vis[j]);
      [filasLista[k][a], filasLista[k][c]] = [filasLista[k][c], filasLista[k][a]]; LISTAS_SUCIAS.add(k); pintaLista(k);
    });
    f.querySelector("[data-quitar]").onclick = () => { o.borrar = true; LISTAS_SUCIAS.add(k); pintaLista(k); msg("m-" + k, "Quitada. Pulsa «Guardar cambios» para confirmar.", true); };
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
  } catch (e) { msg("m-" + k, "No se ha podido guardar: " + errTxt(e)); }
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
    } catch (e) { msg("m-resc", errTxt(e)); }
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
    catch (e) { msg("m-clv", errTxt(e)); }
  };
  document.body.appendChild(v); v.querySelector("#clv-nueva").focus();
}
async function cargarAdmins() {
  const { data, error } = await sb.from("admins").select("email").order("email");
  if (error) { $("lista-admins").innerHTML = `<p class="msg err">${esc(errTxt(error))}</p>`; return; }
  const yo = (window.MI_EMAIL || "").toLowerCase();
  $("lista-admins").innerHTML = data.map(a => `<div class="panel item"><div class="txt"><b>${esc(a.email)}</b>${a.email.toLowerCase() === yo ? '<span class="etq">Tú</span>' : ""}</div>
      ${a.email.toLowerCase() === yo ? "" : `<button class="btn sec peq" data-clave="${esc(a.email)}">${icono("editar", "p")}Poner contraseña nueva</button><button class="btn peligro peq" data-email="${esc(a.email)}" aria-label="Quitar permiso">${icono("borrar", "p")}</button>`}</div>`).join("");
  $("lista-admins").querySelectorAll("[data-clave]").forEach(b => b.onclick = () => modalClaveOtro(b.dataset.clave));
  $("lista-admins").querySelectorAll("[data-email]").forEach(b => b.onclick = async () => {
    if (!confirm(`¿Quitar el permiso de publicar a ${b.dataset.email}?`)) return;
    const { error } = await sb.from("admins").delete().eq("email", b.dataset.email);
    error ? msg("m-admins", errTxt(error)) : (aviso("Permiso quitado."), cargarAdmins());
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
    error ? msg("m-wa", errTxt(error)) : (msg("m-wa", ""), aviso(v ? "Enlace guardado. Ya sale en la web." : "Enlace quitado."));
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
    error ? msg("m-archivo", errTxt(error)) : aviso("Guardado. Ya se aplica en la web.");
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
  } catch (e) { msg("m-copia", "No se ha podido hacer la copia: " + errTxt(e)); }
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

