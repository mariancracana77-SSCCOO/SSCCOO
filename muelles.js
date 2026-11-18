// Accesos y muelles (Zona Conductores > Utilidades en ruta, petición n.º 58 del padre, v190). Es la idea de su
// archivo «Accesos y Muelles Difíciles» hecha libreta PERSONAL del conductor: lo que apunta se guarda solo en su móvil
// (localStorage «ccoo-muelles» {v: 1, fichas: [...]}), nada va a Supabase. Del archivo se ha quitado: los 5 clientes
// inventados (algunos eran empresas reales), los autores, las coordenadas falsas (el GPS ya no se inventa nada si
// falla), el «publicar» que no guardaba, la cabecera con un logo dibujado, los emojis, Tailwind/Google Fonts y el
// código en línea (CSP). Todo lo escrito por el conductor se pinta con esc() y lleva translate="no".
// Textos con T("...") (zona-idioma.js: la función «traducir», grupo «muelles», saca de aquí los textos).
// Cuentas sin pantalla en «MuellesCuentas» (las prueba pruebas/muelles.cjs).
(function () {
  const KEY = "ccoo-muelles", TOPE = 300, PREFIJO = "CCOO-MUELLES:";
  const NIVELES = ["dificil", "cuidado", "facil"];
  const LARGO = { nombre: 80, lugar: 80, truco: 800, espera: 40, epis: 80 };
  const OPC = {
    maniobra: ["", "mano", "contramano", "atras", "facil"],
    dormir: ["", "prohibido", "calle", "dentro"],
    banos: ["", "bano", "ducha", "no"],
    dibujo: ["", "atras", "porteria", "patio"],
  };
  const txt = (x, n) => String(x ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, n);
  const coord = (x, max) => { const n = parseFloat(String(x ?? "").replace(",", ".")); return isFinite(n) && Math.abs(n) <= max ? Math.round(n * 1e6) / 1e6 : null; };
  const nuevoId = () => "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Deja una ficha solo con lo que se espera (lo que venga de fuera, de un móvil viejo o pegado, pasa por aquí)
  function limpia(f) {
    if (!f || typeof f !== "object") return null;
    const r = { id: /^[a-z0-9]{4,40}$/.test(String(f.id || "")) ? String(f.id) : nuevoId() };
    for (const k of Object.keys(LARGO)) r[k] = txt(f[k], LARGO[k]);
    if (!r.nombre || !r.truco) return null;
    r.nivel = NIVELES.includes(f.nivel) ? f.nivel : "cuidado";
    for (const k of Object.keys(OPC)) r[k] = OPC[k].includes(f[k]) ? f[k] : "";
    const lat = coord(f.lat, 90), lon = coord(f.lon, 180);
    if (lat !== null && lon !== null) { r.lat = lat; r.lon = lon; }
    r.cambiado = typeof f.cambiado === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f.cambiado) ? f.cambiado : new Date().toISOString().slice(0, 10);
    return r;
  }
  // Libreta a texto para otro móvil, y al revés (añade, no quita nada; lo repetido no se duplica)
  const exporta = (l) => PREFIJO + JSON.stringify(l.map(f => limpia(f)).filter(Boolean));
  function importa(texto, actual) {
    const t = String(texto || "").trim(), i = t.indexOf(PREFIJO);
    if (i < 0) return { error: "codigo" };
    let datos;
    try { datos = JSON.parse(t.slice(i + PREFIJO.length)); } catch (e) { return { error: "codigo" }; }
    if (!Array.isArray(datos)) return { error: "codigo" };
    const l = actual.slice(), ids = new Set(l.map(f => f.id));
    const igual = (a, b) => ["nombre", "lugar", "truco"].every(k => a[k] === b[k]);
    let nuevas = 0, repes = 0, sobran = 0;
    for (const d of datos) {
      const f = limpia(d);
      if (!f) continue;
      if (l.some(x => igual(x, f))) { repes++; continue; }
      if (l.length >= TOPE) { sobran++; continue; }
      if (ids.has(f.id)) f.id = nuevoId();
      ids.add(f.id); l.push(f); nuevas++;
    }
    return { lista: l, nuevas, repes, sobran };
  }
  const plano = (s) => String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const busca = (l, q, nivel) => {
    const p = plano(q).split(/\s+/).filter(Boolean);
    return l.filter(f => (!nivel || f.nivel === nivel) && p.every(w => plano([f.nombre, f.lugar, f.truco, f.epis].join(" ")).includes(w)));
  };
  // Enlace al mapa solo con números ya comprobados (y aun así pasa por urlSegura al pintarlo)
  const mapa = (f) => f.lat != null && f.lon != null ? `https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lon}` : "";
  window.MuellesCuentas = { limpia, exporta, importa, busca, mapa, TOPE, PREFIJO };

  const $ = (i) => document.getElementById(i);
  if (!$("v-muelles")) return;
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("muelles", "v-muelles", () => { chips(); lista(); }) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m) };
  const T = Z.T;
  /* textos */
  const NOMBRE_NIVEL = { dificil: "Difícil", cuidado: "Con cuidado", facil: "Fácil" };
  const NOMBRE_OPC = {
    maniobra: { mano: "De mano (lado del conductor)", contramano: "A contramano (lado ciego)", atras: "Marcha atrás desde la calle", facil: "Muelle amplio, fácil" },
    dormir: { prohibido: "Prohibido dormir fuera", calle: "Se puede dormir en la calle o el polígono", dentro: "Aparcamiento dentro del recinto" },
    banos: { bano: "Baño, sin ducha", ducha: "Baño y ducha", no: "No dejan usar el baño" },
  };
  const NOMBRE_DATO = { maniobra: "Maniobra", dormir: "Dormir", banos: "Baños", espera: "Espera", epis: "EPIs" };
  /* fin textos */

  let fichas = [], filtro = "", borrando = null, editando = null;
  function lee() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      fichas = d && Array.isArray(d.fichas) ? d.fichas.map(limpia).filter(Boolean).slice(0, TOPE) : [];
    } catch (e) { fichas = []; }
  }
  // Devuelve false si el móvil no deja guardar: entonces no se dice «guardado»
  function guarda() {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, fichas })); return true; } catch (e) { return false; }
  }
  function aviso(t, mal) {
    const a = $("mue-msg");
    a.className = mal ? "zc-aviso" : "zc-ok";
    a.textContent = t;
    a.hidden = false;
  }

  // La forma también dice el nivel (no solo el color): triángulo con «!», rombo y círculo con marca
  function senal(n) {
    const s = n === "dificil" ? '<path d="M12 3 22 20H2Z"/><path class="mue-s-l" d="M12 9v5M12 16.6v.4"/>'
      : n === "cuidado" ? '<path d="M12 2.5 21.5 12 12 21.5 2.5 12Z"/><path class="mue-s-l" d="M8 12h8"/>'
        : '<circle cx="12" cy="12" r="9.5"/><path class="mue-s-l" d="m7.5 12.3 3 3 6-6.3"/>';
    return `<svg class="mue-s" viewBox="0 0 24 24" aria-hidden="true">${s}</svg>`;
  }
  const nivelHTML = (n) => `<span class="mue-nivel ${n}">${senal(n)}${esc(T(NOMBRE_NIVEL[n]))}</span>`;

  // Dibujos genéricos de la maniobra (como los del archivo del padre, sin datos de ningún cliente)
  function dibujo(tipo) {
    const t = (x, y, s, c) => `<text class="mue-d-t${c ? " " + c : ""}" x="${x}" y="${y}">${esc(s)}</text>`;
    let s = `<svg class="mue-dib" viewBox="0 0 360 190" role="img" aria-label="${esc(T("Dibujo de la maniobra"))}">`;
    if (tipo === "atras") {
      s += '<rect class="mue-d-calle" x="0" y="95" width="360" height="36"/><path class="mue-d-raya" d="M0 113h360"/>' +
        '<rect class="mue-d-calle" x="190" y="28" width="34" height="67"/><rect class="mue-d-nave" x="140" y="6" width="134" height="24" rx="3"/>' +
        '<circle class="mue-d-calle" cx="315" cy="113" r="24"/><circle class="mue-d-isla" cx="315" cy="113" r="8"/>' +
        '<path class="mue-d-bien" d="M20 122h270q42 0 42-9t-42-10h-70"/><path class="mue-d-ojo" d="M218 103q-11-8-11-69"/><path class="mue-d-flecha ojo" d="m207 28-5 10h10Z"/>' +
        t(207, 22, T("MUELLE"), "claro") + t(315, 152, T("Rotonda: cambia de sentido")) + t(120, 70, T("Entra marcha atrás")) + t(90, 150, T("Ruta buena"));
    } else if (tipo === "porteria") {
      s += '<rect class="mue-d-calle" x="0" y="110" width="360" height="34"/><path class="mue-d-raya" d="M0 127h360"/>' +
        '<rect class="mue-d-calle" x="220" y="38" width="30" height="72"/><rect class="mue-d-ofi" x="36" y="52" width="100" height="36" rx="4"/>' +
        '<rect class="mue-d-ok" x="180" y="8" width="112" height="30" rx="4"/>' +
        '<path class="mue-d-bien" d="M16 132h219V46"/><path class="mue-d-flecha" d="m235 38-6 10h12Z"/>' +
        t(86, 74, T("OFICINAS"), "claro") + t(86, 102, T("No entres aquí"), "mal") + t(236, 27, T("PUERTA CAMIONES"), "claro") + t(150, 168, T("Sigue recto pasadas las oficinas"));
    } else if (tipo === "patio") {
      s += '<rect class="mue-d-patio" x="20" y="14" width="320" height="162" rx="8"/>' +
        '<rect class="mue-d-nave" x="60" y="14" width="40" height="14"/><rect class="mue-d-nave" x="115" y="14" width="40" height="14"/><rect class="mue-d-nave" x="170" y="14" width="40" height="14"/>' +
        '<rect class="mue-d-col" x="218" y="22" width="14" height="14"/><rect class="mue-d-ofi" x="60" y="146" width="150" height="20" rx="3"/>' +
        '<path class="mue-d-ojo" d="M310 110h-90q-30 0-30-74"/><path class="mue-d-flecha ojo" d="m190 30-5 10h10Z"/>' +
        t(135, 46, T("MUELLES")) + t(285, 31, T("Columna: ángulo ciego"), "mal") + t(135, 160, T("Coches: poco sitio para girar"), "claro") + t(290, 100, T("Entra despacio"));
    }
    return s + "</svg>";
  }

  function chips() {
    const n = (k) => k ? fichas.filter(f => f.nivel === k).length : fichas.length;
    $("mue-niveles").innerHTML = ["", ...NIVELES].map(k =>
      `<button type="button" class="zc-chip${filtro === k ? " activa" : ""}" data-nivel="${k}" aria-pressed="${filtro === k}">${k ? senal(k) : ""}${esc(k ? T(NOMBRE_NIVEL[k]) : T("Todos"))} (${n(k)})</button>`).join("");
  }
  function ficha(f) {
    const datos = ["maniobra", "dormir", "banos"].filter(k => f[k]).map(k => [k, T(NOMBRE_OPC[k][f[k]])])
      .concat(["espera", "epis"].filter(k => f[k]).map(k => [k, f[k]]));
    const m = mapa(f);
    const conf = borrando === f.id ? `<div class="zc-aviso mue-conf" role="alert"><b>${esc(T("¿Borrar esta ficha? No se puede deshacer."))}</b>
      <div class="mue-bots"><button type="button" class="btn mue-si" data-si="${esc(f.id)}">${esc(T("Sí, borrarla"))}</button><button type="button" class="btn sec" data-no="1">${esc(T("No"))}</button></div></div>` : "";
    return `<article class="panel mue-ficha ${f.nivel}" id="mue-${esc(f.id)}">
      <div class="mue-cab">${nivelHTML(f.nivel)}<h3 translate="no">${esc(f.nombre)}</h3>${f.lugar ? `<p class="mue-lugar" translate="no">${esc(f.lugar)}</p>` : ""}</div>
      <div class="mue-truco"><b>${esc(T("Cómo entrar y maniobrar"))}</b><p translate="no">${esc(f.truco).replace(/\n/g, "<br>")}</p></div>
      ${datos.length ? `<dl class="mue-datos">${datos.map(([k, v]) => `<div><dt>${esc(T(NOMBRE_DATO[k]))}</dt><dd${["espera", "epis"].includes(k) ? ' translate="no"' : ""}>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
      ${f.dibujo ? `<details class="mue-ver"><summary>${esc(T("Ver el dibujo de la maniobra"))}</summary>${dibujo(f.dibujo)}<p class="zc-pista">${esc(T("Dibujo de ejemplo: no es el plano de este cliente."))}</p></details>` : ""}
      <div class="mue-bots">
        ${m ? `<a class="btn sec" href="${esc(urlSegura(m))}" target="_blank" rel="noopener noreferrer">${icono("lugar", "p")}${esc(T("Ver en el mapa"))}</a>` : ""}
        <button type="button" class="btn sec" data-copia="${esc(f.id)}">${icono("copia", "p")}${esc(T("Copiar para un compañero"))}</button>
        <button type="button" class="btn sec" data-edita="${esc(f.id)}">${icono("editar", "p")}${esc(T("Cambiar"))}</button>
        <button type="button" class="btn sec" data-borra="${esc(f.id)}">${icono("borrar", "p")}${esc(T("Borrar"))}</button>
      </div>${conf}</article>`;
  }
  function lista() {
    const l = busca(fichas, $("mue-q").value, filtro).sort((a, b) => NIVELES.indexOf(a.nivel) - NIVELES.indexOf(b.nivel) || a.nombre.localeCompare(b.nombre, "es"));
    $("mue-cuenta").textContent = fichas.length ? T("{n} de {t} clientes", { n: l.length, t: fichas.length }) : "";
    $("mue-lista").innerHTML = !fichas.length
      ? `<div class="panel mue-vacio"><b>${esc(T("Tu libreta está vacía."))}</b><p>${esc(T("Cuando descargues en un sitio difícil, apunta aquí cómo se entra para la próxima vez."))}</p></div>`
      : l.length ? l.map(ficha).join("") : `<p class="mue-vacio">${esc(T("No hay ningún cliente con eso. Prueba con otra palabra o quita el filtro."))}</p>`;
    $("mue-buscar").hidden = !fichas.length;
  }

  // Formulario (añadir o cambiar)
  const CAMPOS = ["nombre", "lugar", "nivel", "truco", "maniobra", "dormir", "banos", "espera", "epis", "dibujo", "lat", "lon"];
  function abre(f) {
    editando = f ? f.id : null;
    for (const k of CAMPOS) $("mue-" + k).value = f && f[k] != null ? f[k] : (k === "nivel" ? "cuidado" : "");
    $("mue-form-t").textContent = f ? T("Cambiar la ficha") : T("Añadir un cliente");
    $("mue-gps-msg").textContent = "";
    $("mue-form").hidden = false;
    $("mue-nuevo").hidden = true;
    $("mue-msg").hidden = true;
    $("mue-nombre").focus();
    $("mue-form").scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function cierra() { $("mue-form").hidden = true; $("mue-nuevo").hidden = false; editando = null; }
  function guardaForm(e) {
    e.preventDefault();
    const d = {}; for (const k of CAMPOS) d[k] = $("mue-" + k).value;
    const lat = d.lat.trim(), lon = d.lon.trim();
    if ((lat || lon) && (coord(lat, 90) === null || coord(lon, 180) === null)) { $("mue-gps-msg").textContent = T("La posición no está bien escrita: déjala vacía o pulsa «Usar mi posición ahora»."); $("mue-lat").focus(); return; }
    const antes = fichas.find(f => f.id === editando);
    if (!antes && fichas.length >= TOPE) { aviso(T("Ya tienes {n} clientes: borra alguno para poder añadir más.", { n: TOPE }), true); return; }
    const f = limpia({ ...d, id: editando || nuevoId(), cambiado: "" });
    if (!f) { aviso(T("Falta el nombre del cliente o cómo se entra."), true); return; }
    const copia = fichas.slice();
    if (antes) fichas[fichas.indexOf(antes)] = f; else fichas.push(f);
    if (!guarda()) { fichas = copia; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    cierra(); chips(); lista();
    aviso(antes ? T("Ficha cambiada. Está guardada en este móvil.") : T("Cliente añadido. Está guardado en este móvil."));
    $("mue-" + f.id)?.scrollIntoView({ block: "center" });
  }
  function posicion() {
    const msg = $("mue-gps-msg");
    if (!("geolocation" in navigator)) { msg.textContent = T("Este móvil no deja saber dónde estás. Puedes dejarlo vacío."); return; }
    msg.textContent = T("Buscando tu posición…");
    navigator.geolocation.getCurrentPosition(p => {
      $("mue-lat").value = coord(p.coords.latitude, 90); $("mue-lon").value = coord(p.coords.longitude, 180);
      msg.textContent = T("Hecho. Comprueba que estás en la puerta de camiones.");
    }, () => { msg.textContent = T("No se ha podido saber tu posición. Puedes dejarlo vacío."); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }

  // Copiar: si el móvil no deja, se enseña el texto para copiarlo a mano
  async function copia(t, ok) {
    try { await navigator.clipboard.writeText(t); aviso(ok); }
    catch (e) { $("mue-texto").value = t; $("mue-pasar").open = true; $("mue-texto").focus(); $("mue-texto").select(); aviso(T("No se ha podido copiar solo: mantén pulsado el texto de abajo y cópialo."), true); }
  }
  function textoFicha(f) {
    const l = [f.nombre + (f.lugar ? " (" + f.lugar + ")" : ""), T("Nivel") + ": " + T(NOMBRE_NIVEL[f.nivel]), T("Cómo entrar y maniobrar") + ": " + f.truco];
    for (const k of ["maniobra", "dormir", "banos"]) if (f[k]) l.push(T(NOMBRE_DATO[k]) + ": " + T(NOMBRE_OPC[k][f[k]]));
    for (const k of ["espera", "epis"]) if (f[k]) l.push(T(NOMBRE_DATO[k]) + ": " + f[k]);
    if (mapa(f)) l.push(T("Mapa") + ": " + mapa(f));
    return l.join("\n") + "\n\n" + T("Apuntado por un conductor, sin comprobar. Para meterlo en tu libreta de la web de CCOO:") + "\n" + exporta([f]);
  }

  lee(); chips(); lista();
  $("mue-nuevo").addEventListener("click", () => abre(null));
  $("mue-cancela").addEventListener("click", cierra);
  $("mue-form").addEventListener("submit", guardaForm);
  $("mue-gps").addEventListener("click", posicion);
  $("mue-q").addEventListener("input", lista);
  $("mue-niveles").addEventListener("click", (e) => { const b = e.target.closest("[data-nivel]"); if (!b) return; filtro = b.dataset.nivel; chips(); lista(); });
  $("mue-lista").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const f = fichas.find(x => x.id === (b.dataset.copia || b.dataset.edita || b.dataset.borra || b.dataset.si));
    if (b.dataset.edita && f) abre(f);
    else if (b.dataset.copia && f) copia(textoFicha(f), T("Copiado. Pégalo en un mensaje para tu compañero."));
    else if (b.dataset.borra && f) { borrando = f.id; lista(); $("mue-lista").querySelector(".mue-si")?.focus(); }
    else if (b.dataset.no) { const id = borrando; borrando = null; lista(); $("mue-lista").querySelector(`[data-borra="${CSS.escape(id || "")}"]`)?.focus(); }
    else if (b.dataset.si && f) {
      const copiaL = fichas.slice(); fichas = fichas.filter(x => x !== f); borrando = null;
      if (!guarda()) { fichas = copiaL; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); }
      else aviso(T("Ficha borrada."));
      chips(); lista();
    }
  });
  $("mue-exporta").addEventListener("click", () => {
    if (!fichas.length) { aviso(T("Tu libreta está vacía."), true); return; }
    copia(exporta(fichas), T("Copiado. Pégalo en «Pasar mi libreta» del otro móvil."));
  });
  $("mue-importa").addEventListener("click", () => {
    const r = importa($("mue-texto").value, fichas);
    if (r.error) { aviso(T("Ese texto no es una libreta ni una ficha de Accesos y muelles."), true); return; }
    if (!r.nuevas) { aviso(T("No había nada nuevo: ya tenías todo eso.")); return; }
    const copiaL = fichas; fichas = r.lista;
    if (!guarda()) { fichas = copiaL; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    $("mue-texto").value = ""; chips(); lista();
    aviso(T("Añadidos {n} clientes.", { n: r.nuevas }) + (r.repes ? " " + T("{n} ya los tenías.", { n: r.repes }) : "") + (r.sobran ? " " + T("{n} no caben (máximo {t}).", { n: r.sobran, t: TOPE }) : ""));
  });
})();
