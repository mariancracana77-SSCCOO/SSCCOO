// Panel: entrar, contraseña, dos pasos al entrar, navegación y Resumen.
// El panel está repartido en admin-base.js, admin-sesion.js, admin-listas.js, admin-editor.js,
// admin-herramientas.js, admin-ajustes.js y admin-calendario.js, que se cargan en ese orden (comparten variables).

// ---------- Sesión ----------
let iniciado = false, CAMBIANDO_CLAVE = false;
const mostrar = (s) => { ["s-login", "s-olvido", "s-rescate", "s-recuperar", "s-codigo", "s-panel"].forEach(x => $(x).classList.toggle("oculto", x !== s)); document.body.classList.toggle("sin-nav", s !== "s-panel"); };
// Se engancha cuando ya están cargadas todas las partes del panel (admin-*.js): así, al entrar, existen todas sus funciones
document.addEventListener("DOMContentLoaded", () => sb.auth.onAuthStateChange((ev, ses) => {
  if (ev === "PASSWORD_RECOVERY") return mostrar("s-recuperar");
  if (!ses) { iniciado = false; return CAMBIANDO_CLAVE ? null : mostrar("s-login"); }
  if (CAMBIANDO_CLAVE) return; // entrando con el código del email: primero se guarda la contraseña nueva
  // Supabase avisa de nuevo al volver a la pestaña o al refrescar la sesión: el panel solo se monta una vez,
  // así no se pierde lo que se está escribiendo ni los archivos elegidos.
  if (iniciado) return;
  iniciado = true; window.MI_EMAIL = ses.user.email;
  setTimeout(iniciar, 0);
}));
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
  $("problemas-entrar").open = true;
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
    : "No se ha podido enviar: " + errTxt(error));
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
  } catch (e) { msg("m-rescate", errTxt(e)); }
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
  $("problemas-entrar").open = true;
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
const salir = async () => { if (dejarPagina() && await confirmarSalida()) { await sb.auth.signOut(); location.replace(aqui); } };

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
     <button class="solo-pc" id="b-guia">${icono("pregunta")}Guía del panel</button>
     <button class="solo-pc" id="b-salir">${icono("salir")}Salir</button>`;
  $("nav-admin").querySelectorAll("[data-p]").forEach(x => x.onclick = () => abrir(x.dataset.p));
  $("b-mas").onclick = abrirMas;
  $("b-salir").onclick = salir;
  $("b-guia").onclick = () => window.open(GUIA_URL, "_blank", "noopener");
  if ($("b-instalar-pc")) $("b-instalar-pc").onclick = instalarApp;
}
function abrirMas() {
  $("hoja-mas").innerHTML = `<div class="buscador hoja-buscar">${icono("buscar", "p")}<input type="search" id="buscar-menu" placeholder="Buscar sección (actas, PRL, ajustes…)" aria-label="Buscar sección"></div>` +
    Object.keys(PAGINAS).filter(k => !EN_MOVIL.includes(k) || PAGINAS[k].sub).map(k =>
    (PAGINAS[k].cab ? `<p class="hoja-tit hoja-cab">${esc(PAGINAS[k].cab)}</p>` : PAGINAS[k].grupo ? `<div class="hoja-sep"></div>` : "") +
    `<button data-p="${k}" class="${PAGINAS[k].sub ? "sub" : ""}${k === actual ? " actual" : ""}">${icono(esc(PAGINAS[k].icono))}${esc(PAGINAS[k].nombre)}${k === "buzon" && BUZON_SIN_LEER ? `<span class="cuenta-menu">${BUZON_SIN_LEER}</span>` : ""}</button>`).join("") +
    (INSTALADA_A() ? "" : `<button id="m-instalar">${icono("descargar")}Instalar la app</button>`) +
    `<a href="index.html" target="_blank">${icono("ver")}Ver la web</a><a href="${GUIA_URL}" target="_blank" rel="noopener">${icono("pregunta")}Guía del panel</a><button id="m-salir">${icono("salir")}Salir (${esc(window.MI_EMAIL || "")})</button><p class="fecha-txt" style="text-align:center;margin:6px 0 0">Versión ${VERSION_WEB}</p>`;
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

// Textos y los filtros de Ajustes se guardan con un botón: si hay cambios sin guardar, se pregunta antes de irse
let PENDIENTE = null; // función que devuelve la pregunta si hay algo sin guardar, o "" si no
const dejarPagina = () => { const t = PENDIENTE?.(); return !t || confirm(t); };
function abrir(k) {
  if (!dejarPagina()) return;
  PENDIENTE = null;
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
  // Páginas donde no se crea nada (v79): el botón flotante solo tapaba los mensajes
  if (["ortografia", "historial", "textos", "ajustes", "archivos"].includes(k)) $("fab").classList.add("oculto");
  if (!window.ES_ADMIN) { $("zona").innerHTML = `<div class="panel vacio">${icono("alerta")}Esta cuenta (${esc(window.MI_EMAIL)}) no tiene permiso para publicar. Pide a la Sección Sindical que añada tu email en Ajustes.</div>`; return; }
  if (k === "resumen") pintaResumen();
  else if (k === "buzon") pintaBuzon();
  else if (k === "calculadoras") pintaCalculadoras();
  else if (k === "camiones") pintaCamiones();
  else if (k === "ganancias") pintaImportes();
  else if (k === "peajes") pintaPeajes();
  else if (k === "historial") pintaHistorial();
  else if (k === "textos") pintaTextos();
  else if (k === "ajustes") pintaAjustes();
  else if (k === "archivos") pintaTodosArchivos();
  else if (k === "ortografia") pintaOrtografia();
  else pintaSeccion(k);
  vigilaFab();
}
// v86: el botón flotante se esconde mientras se ve el «+ Nuevo» de la cabecera de la sección (hacía lo mismo y tapaba la primera tarjeta)
let OBS_FAB = null;
function vigilaFab() {
  OBS_FAB?.disconnect(); OBS_FAB = null; $("fab").classList.remove("escondido");
  const b = $("b-nuevo"); if (!b || !("IntersectionObserver" in window)) return;
  // Se mira cuánto se ve del botón (isIntersecting es verdadero con cualquier trocito) y se descuenta la cabecera fija
  OBS_FAB = new IntersectionObserver(es => $("fab").classList.toggle("escondido", es[0].intersectionRatio >= 0.6), { threshold: [0, 0.6, 1], rootMargin: "-70px 0px 0px 0px" });
  OBS_FAB.observe(b);
}

// ---------- Resumen ----------
let CUENTAS_HTML = "";
// «Publicar en un apartado»: hoja para elegir en cuál (Comité, Zona Conductores…)
function abrirHojaApartados() {
  $("hoja-mas").innerHTML = `<p class="hoja-tit">¿En qué apartado publicas?</p>` + APARTADOS.map(a =>
    `<button data-pub-ap="${a.id}" class="${padreDe(a) ? "sub" : ""}">${icono(esc(a.icono || "carpeta"))}${esc(a.titulo)}${a.visible === false ? " <small>(oculto)</small>" : ""}</button>`).join("");
  ["velo-mas", "hoja-mas"].forEach(i => $(i).classList.remove("oculto"));
  $("hoja-mas").querySelectorAll("[data-pub-ap]").forEach(b => b.onclick = () => { cerrarMas(); abrirEditor("ap" + b.dataset.pubAp); });
  $("hoja-mas").querySelector("button")?.focus();
}
async function pintaResumen() {
  $("zona").innerHTML = `<div class="sec-cab"><div><h1>Hola</h1><p>¿Qué quieres publicar hoy?</p></div></div>
    <div class="rapidos">
      <button class="panel rapido" data-n="avisos"><span class="ic">${icono("avisos")}</span><span><b>Publicar un aviso</b><small>Con archivos si quieres</small></span></button>
      <button class="panel rapido ia" data-n="actas"><span class="ic">${icono("magia")}</span><span><b>Hacer un acta</b><small>Con el asistente: notas o foto</small></span></button>
      <button class="panel rapido" data-n="calendario"><span class="ic">${icono("calendario")}</span><span><b>Añadir una fecha</b><small>Asamblea, reunión…</small></span></button>
      <button class="panel rapido" data-n="documentos"><span class="ic">${icono("subir")}</span><span><b>Subir un documento</b><small>PDF, Word, Excel, fotos</small></span></button>
      <button class="panel rapido" data-n="convenio"><span class="ic">${icono("convenio")}</span><span><b>Apartado del convenio</b><small>Explicar un derecho</small></span></button>
      ${APARTADOS.length ? `<button class="panel rapido" data-en-apartado><span class="ic">${icono("carpeta")}</span><span><b>Publicar en un apartado</b><small>${esc(APARTADOS.slice(0, 2).map(a => a.titulo).join(", "))}…</small></span></button>` : ""}
      <button class="panel rapido" data-orto><span class="ic">${icono("check")}</span><span><b>Revisar la ortografía</b><small>De todo lo publicado</small></span></button>
      <button class="panel rapido" data-ir="ajustes"><span class="ic">${icono("telegram")}</span><span><b>Telegram y avisos</b><small>Canales y cartel QR</small></span></button>
    </div>
    <div id="aviso-buzon"></div>
    <div id="recordatorio-copia"></div>
    <div id="banda-instalar"></div>
    <div class="resumen-rejilla">
      <div><h2 class="titulo-bloque">Próximos 14 días <a href="#" id="ir-cal">Ver calendario</a></h2><div class="panel proximos" id="proximos"><p class="fecha-txt">Cargando…</p></div></div>
      <div><h2 class="titulo-bloque">Avisos programados</h2><div class="panel proximos" id="programados"><p class="fecha-txt">Cargando…</p></div></div>
    </div>
    <h2 class="titulo-bloque">Lo último que has publicado</h2>
    <div class="lista-adm" id="ultimos"><p class="fecha-txt">Cargando…</p></div>
    <details class="plegable-est" id="det-est">
      <summary><h2 class="titulo-bloque">Visitas y estadísticas</h2><span class="fecha-txt">Toca para ver</span></summary>
    <h2 class="titulo-bloque">Visitas a la web</h2>
    <div class="panel visitas" id="visitas"><p class="fecha-txt">Cargando…</p></div>
    <h2 class="titulo-bloque">Estadísticas</h2>
    <div class="estadisticas">
      <section class="panel graf"><h3>Lo más leído</h3><p class="fecha-txt">Veces que se ha abierto cada cosa en la web. Anónimo: no se sabe quién.</p><div id="est-leido"><p class="fecha-txt">Cargando…</p></div></section>
      <section class="panel graf"><h3>Móviles con avisos activados</h3><p class="fecha-txt">Por semana.</p><div id="est-suscritos"><p class="fecha-txt">Cargando…</p></div></section>
      <section class="panel graf"><h3>Secciones más visitadas</h3><p class="fecha-txt">Últimos 30 días.</p><div id="est-secciones"><p class="fecha-txt">Cargando…</p></div></section>
    </div>
        <div class="cuentas" id="cuentas"></div>
    </details>`;
  $("zona").querySelectorAll("[data-n]").forEach(b => b.onclick = () => abrirEditor(b.dataset.n));
  // Visitas y estadísticas, plegadas al final: solo se cargan al abrirlas (y se recuerda si se dejaron abiertas)
  const det = $("det-est");
  const cargaEst = () => { if (!det.open || det.dataset.cargado) return; det.dataset.cargado = 1; pintaVisitas(); pintaEstadisticas(); };
  try { det.open = localStorage.getItem("ccoo-adm-est") === "1"; } catch (_) {}
  det.ontoggle = () => { try { localStorage.setItem("ccoo-adm-est", det.open ? "1" : "0"); } catch (_) {} cargaEst(); };
  cargaEst();
  pintaBandaInstalar();
  contarBuzon().then(n => {
    if (!n || !$("aviso-buzon")) return;
    $("aviso-buzon").innerHTML = `<button class="panel banda aviso-buzon" id="ir-buzon"><span class="ic">${icono("correo")}</span><span class="txt"><b>${n === 1 ? "Tienes 1 mensaje sin leer" : `Tienes ${n} mensajes sin leer`} en el buzón anónimo</b><p>Preguntas y sugerencias de la plantilla.</p></span>${icono("der")}</button>`;
    $("ir-buzon").onclick = () => abrir("buzon");
  });
  $("zona").querySelector("[data-orto]").onclick = () => abrir("ortografia");
  if ($("zona").querySelector("[data-en-apartado]")) $("zona").querySelector("[data-en-apartado]").onclick = abrirHojaApartados;
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
  CUENTAS_HTML = Object.entries(SECCIONES).filter(([, s]) => !s.oculta).map(([k, s]) => `<span class="etq">${(datos[k] || []).length} ${esc(s.nombre.toLowerCase())}</span>`).join("");
  const todos = Object.entries(SECCIONES).filter(([, s]) => !s.oculta).flatMap(([k, s]) => (datos[k] || []).map(x => ({ k, x, f: s.fechas(x)[1] || s.fechas(x)[0] })))
    .sort((a, b) => new Date(b.f) - new Date(a.f)).slice(0, 6);
  $("ultimos").innerHTML = todos.length ? todos.map(({ k, x }) => itemHTML(k, x, true)).join("") : `<div class="panel vacio">${icono("avisos")}Todavía no has publicado nada.</div>`;
  enlazarItems($("ultimos"));
  resaltaGuardado($("ultimos"));
  if ($("cuentas")) $("cuentas").innerHTML = CUENTAS_HTML;
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

