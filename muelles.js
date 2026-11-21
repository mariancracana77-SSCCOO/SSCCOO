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
  // v195 (petición n.º 63): con `fotos` (id -> «data:image/jpeg;base64,…», ya pequeña), cada ficha lleva también su foto
  const FOTO_OK = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, FOTO_MAX = 120000;
  const exporta = (l, fotos) => PREFIJO + JSON.stringify(l.map(f => { const r = limpia(f); if (r && fotos && fotos[f.id]) r.foto = fotos[f.id]; return r; }).filter(Boolean));
  function importa(texto, actual) {
    const t = String(texto || "").trim(), i = t.indexOf(PREFIJO);
    if (i < 0) return { error: "codigo" };
    let datos;
    try { datos = JSON.parse(t.slice(i + PREFIJO.length)); } catch (e) { return { error: "codigo" }; }
    if (!Array.isArray(datos)) return { error: "codigo" };
    const l = actual.slice(), ids = new Set(l.map(f => f.id));
    // v197 (fichas repetidas que vio el padre): la misma ficha (mismo id y mismo nombre) que ya tienes no se vuelve a
    // añadir aunque se haya cambiado «Cómo entrar» en un móvil o en el otro (se queda la tuya, no se pisa nada), y al
    // comparar el texto no cuentan los espacios, las mayúsculas ni los acentos.
    const igual = (a, b) => ["nombre", "lugar", "truco"].every(k => norm(a[k]) === norm(b[k]));
    let nuevas = 0, repes = 0, sobran = 0;
    // Fotos que venían en lo pegado: {id de la ficha aquí, data, siFalta (cliente que ya tenías: solo si no tiene foto)}
    const fotos = [];
    const foto = (d) => typeof d.foto === "string" && d.foto.length <= FOTO_MAX && FOTO_OK.test(d.foto) ? d.foto : null;
    for (const d of datos) {
      const f = limpia(d);
      if (!f) continue;
      const ya = l.find(x => x.id === f.id && norm(x.nombre) === norm(f.nombre)) || l.find(x => igual(x, f));
      if (ya) { repes++; if (foto(d)) fotos.push({ id: ya.id, data: foto(d), siFalta: true }); continue; }
      if (l.length >= TOPE) { sobran++; continue; }
      if (ids.has(f.id)) f.id = nuevoId();
      ids.add(f.id); l.push(f); nuevas++;
      if (foto(d)) fotos.push({ id: f.id, data: foto(d) });
    }
    return { lista: l, nuevas, repes, sobran, fotos };
  }
  const plano = (s) => String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const norm = (s) => plano(s).replace(/\s+/g, " ").trim();
  // v197: fichas repetidas que ya están en la libreta (nombre, sitio y «Cómo entrar» iguales). De cada grupo se queda la
  // que tiene foto (conFoto: Set de ids) o, si no, la cambiada más tarde. Devuelve los ids que sobran (no borra nada).
  function repetidas(l, conFoto) {
    const grupos = new Map();
    for (const f of l) { const k = ["nombre", "lugar", "truco"].map(c => norm(f[c])).join("|"); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(f); }
    const sobran = [];
    for (const g of grupos.values()) {
      if (g.length < 2) continue;
      const tiene = (f) => conFoto && conFoto.has(f.id) ? 1 : 0;
      const queda = g.slice().sort((a, b) => tiene(b) - tiene(a) || String(b.cambiado).localeCompare(String(a.cambiado)))[0];
      for (const f of g) if (f !== queda) sobran.push(f.id);
    }
    return sobran;
  }
  const busca = (l, q, nivel) => {
    const p = plano(q).split(/\s+/).filter(Boolean);
    return l.filter(f => (!nivel || f.nivel === nivel) && p.every(w => plano([f.nombre, f.lugar, f.truco, f.epis].join(" ")).includes(w)));
  };
  // Enlace al mapa solo con números ya comprobados (y aun así pasa por urlSegura al pintarlo)
  const mapa = (f) => f.lat != null && f.lon != null ? `https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lon}` : "";
  // v190 (Lorena: «añade la 1 y la 2»): «Ir allí» con la app que elija el conductor. Solo enlaces https (urlSegura no deja
  // geo:): en el móvil, Google Maps y Waze abren su app si está instalada.
  const rutas = (f) => f.lat == null || f.lon == null ? null : {
    google: `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}&travelmode=driving`,
    waze: `https://waze.com/ul?ll=${f.lat},${f.lon}&navigate=yes`,
    osm: `https://www.openstreetmap.org/directions?to=${f.lat}%2C${f.lon}`,
  };
  window.MuellesCuentas = { limpia, exporta, importa, busca, mapa, rutas, repetidas, TOPE, PREFIJO };

  const $ = (i) => document.getElementById(i);
  if (!$("v-muelles")) return;
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("muelles", "v-muelles", () => { const n = document.getElementById("mue-no-traduce"); if (n) n.hidden = !miIdioma(); leyenda(); chips(); lista(); }) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m) };
  const T = Z.T;
  /* textos */
  const NOMBRE_NIVEL = { dificil: "Difícil", cuidado: "Con cuidado", facil: "Fácil" };
  const NOMBRE_OPC = {
    maniobra: { mano: "De mano (lado del conductor)", contramano: "A contramano (lado ciego)", atras: "Marcha atrás desde la calle", facil: "Muelle amplio, fácil" },
    dormir: { prohibido: "Prohibido dormir fuera", calle: "Se puede dormir en la calle o el polígono", dentro: "Aparcamiento dentro del recinto" },
    banos: { bano: "Baño, sin ducha", ducha: "Baño y ducha", no: "No dejan usar el baño" },
  };
  const NOMBRE_DATO = { maniobra: "Maniobra", dormir: "Dormir", banos: "Baños", espera: "Espera", epis: "Horario" };
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
        '<rect class="mue-d-col" x="218" y="22" width="14" height="14"/><rect class="mue-d-ofi" x="36" y="144" width="198" height="22" rx="3"/>' +
        '<path class="mue-d-ojo" d="M310 110h-90q-30 0-30-74"/><path class="mue-d-flecha ojo" d="m190 30-5 10h10Z"/>' +
        t(135, 46, T("MUELLES")) + t(262, 56, T("Columna: ángulo ciego"), "mal") + t(135, 159, T("Coches: poco sitio para girar"), "claro") + t(290, 100, T("Entra despacio"));
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
    const r = rutas(f);
    const conf = borrando === f.id ? `<div class="zc-aviso mue-conf" role="alert"><b>${esc(T("¿Borrar esta ficha? No se puede deshacer."))}</b>
      <div class="mue-bots"><button type="button" class="btn mue-si" data-si="${esc(f.id)}">${esc(T("Sí, borrarla"))}</button><button type="button" class="btn sec" data-no="1">${esc(T("No"))}</button></div></div>` : "";
    // v193 (petición n.º 61): cada ficha sale plegada (nombre, nivel y sitio); al tocarla se ven los detalles.
    // Lo abierto se recuerda mientras la página está abierta (ABIERTAS) para que no se cierre al repintar.
    const abierta = ABIERTAS.has(f.id) || borrando === f.id;
    return `<details class="panel mue-ficha ${f.nivel}" id="mue-${esc(f.id)}" data-ficha="${esc(f.id)}"${abierta ? " open" : ""}>
      <summary class="mue-cab"><span class="mue-cab-t">${nivelHTML(f.nivel)}<h3 translate="no">${esc(f.nombre)}</h3>${f.lugar ? `<p class="mue-lugar" translate="no">${esc(f.lugar)}</p>` : ""}</span>
        <span class="mue-abre">${icono("abajo", "p")}<span class="mue-abre-t">${esc(T("Ver detalles"))}</span><span class="mue-cierra-t">${esc(T("Cerrar"))}</span></span></summary>
      <div class="mue-cuerpo">${FOTOS.has(f.id) ? `<figure class="mue-foto"><img alt="${esc(T("Foto de {n}", { n: f.nombre }))}" data-foto-de="${esc(f.id)}"${URLS.has(f.id) ? ` src="${esc(URLS.get(f.id))}"` : ""}></figure>` : ""}<div class="mue-truco"><b>${esc(T("Cómo entrar y maniobrar"))}</b><p translate="no">${esc(f.truco).replace(/\n/g, "<br>")}</p></div>
      ${datos.length ? `<dl class="mue-datos">${datos.map(([k, v]) => `<div><dt>${esc(T(NOMBRE_DATO[k]))}</dt><dd${["espera", "epis"].includes(k) ? ' translate="no"' : ""}>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
      ${f.dibujo ? `<details class="mue-ver"><summary>${esc(T("Ver el dibujo de la maniobra"))}</summary>${dibujo(f.dibujo)}<p class="zc-pista">${esc(T("Dibujo de ejemplo: no es el plano de este cliente."))}</p></details>` : ""}
      ${r ? `<details class="mue-ir"><summary>${icono("lugar", "p")}${esc(T("Ir allí"))}</summary>
        <p class="zc-pista">${esc(T("Elige con qué app quieres ir. Sigue siempre las señales y el GPS de camión: estas apps pueden llevarte por donde no cabe un camión."))}</p>
        <div class="mue-bots">${[["google", "Google Maps"], ["waze", "Waze"], ["osm", "OpenStreetMap"]].map(([k, n]) => `<a class="btn sec" href="${esc(urlSegura(r[k]))}" target="_blank" rel="noopener noreferrer" translate="no">${esc(n)}</a>`).join("")}</div></details>` : ""}
      <div class="mue-bots">
        ${r ? `<button type="button" class="btn sec" data-vermapa="${esc(f.id)}">${icono("lugar", "p")}${esc(T("Ver en el mapa"))}</button>` : ""}
        <button type="button" class="btn sec" data-foto="${esc(f.id)}">${icono("camara", "p")}${esc(FOTOS.has(f.id) ? T("Cambiar la foto") : T("Añadir una foto"))}</button>
        ${FOTOS.has(f.id) ? `<button type="button" class="btn sec" data-quitafoto="${esc(f.id)}">${icono("borrar", "p")}${esc(T("Quitar la foto"))}</button>` : ""}
        <button type="button" class="btn sec" data-copia="${esc(f.id)}">${icono("copia", "p")}${esc(T("Copiar para un compañero"))}</button>
        <button type="button" class="btn sec" data-edita="${esc(f.id)}">${icono("editar", "p")}${esc(T("Cambiar"))}</button>
        <button type="button" class="btn sec" data-borra="${esc(f.id)}">${icono("borrar", "p")}${esc(T("Borrar"))}</button>
      </div>${conf}</div></details>`;
  }
  // ---------- Foto de cada cliente (v195, petición n.º 63) ----------
  // La foto se guarda SOLO en este móvil, en IndexedDB (base «ccoo-muelles-fotos», almacén «fotos», clave = id de la ficha),
  // aparte de la libreta: «ccoo-muelles» de localStorage no cambia nada (ni su formato ni sus claves), y si el móvil no deja
  // usar IndexedDB la libreta sigue igual y solo se avisa. Antes de guardarla se reduce con un canvas a 1280 px en JPEG, lo
  // que también quita los datos de la foto (EXIF, posición GPS). Al borrar la ficha, se borra su foto.
  // El padre pidió (mensajes 3 y 5 de la petición) que la foto pase con la ficha: «Copiar para un compañero» y «Copiar mi
  // libreta» meten la foto en el texto, más pequeña (480 px o menos, como mucho 40.000 letras), en el campo `foto` de cada
  // ficha (`fotosParaPasar`). Al pegar, `importa` solo acepta «data:image/…;base64» de hasta FOTO_MAX y `guardaFotosPegadas`
  // la vuelve a dibujar en un canvas antes de guardarla (solo entra una imagen limpia). La libreta (`limpia`) nunca guarda `foto`.
  const FOTOS = new Set(), URLS = new Map();
  let fotoPara = null, fotoBD = null;
  function bd() {
    if (fotoBD) return fotoBD;
    fotoBD = new Promise((ok, mal) => {
      try {
        const r = indexedDB.open("ccoo-muelles-fotos", 1);
        r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains("fotos")) r.result.createObjectStore("fotos"); };
        r.onsuccess = () => ok(r.result);
        r.onerror = () => mal(r.error);
      } catch (e) { mal(e); }
    });
    fotoBD.catch(() => { fotoBD = null; });
    return fotoBD;
  }
  async function fotoOp(modo, fn) {
    const db = await bd();
    return new Promise((ok, mal) => {
      const tx = db.transaction("fotos", modo), st = tx.objectStore("fotos");
      let res; const r = fn(st); if (r) r.onsuccess = () => { res = r.result; };
      tx.oncomplete = () => ok(res); tx.onerror = () => mal(tx.error); tx.onabort = () => mal(tx.error);
    });
  }
  const fotoLee = (id) => fotoOp("readonly", st => st.get(id));
  const fotoPon = (id, blob) => fotoOp("readwrite", st => st.put(blob, id));
  const fotoQuita = (id) => fotoOp("readwrite", st => st.delete(id));
  function soltarURL(id) { const u = URLS.get(id); if (u) { URL.revokeObjectURL(u); URLS.delete(id); } }
  async function cargaFotos() {
    try {
      const ids = await fotoOp("readonly", st => st.getAllKeys());
      // Solo cuentan las de fichas que existen; las demás no se tocan (nunca se borra nada al abrir la página)
      FOTOS.clear(); (ids || []).forEach(id => { if (fichas.some(f => f.id === id)) FOTOS.add(id); });
    } catch (e) { FOTOS.clear(); }
  }
  // Pone las fotos en las fichas pintadas (se leen solo cuando hace falta)
  async function pintaFotos() {
    for (const img of $("mue-lista").querySelectorAll("img[data-foto-de]")) {
      const id = img.dataset.fotoDe;
      if (!URLS.has(id)) {
        try { const b = await fotoLee(id); if (!b) continue; URLS.set(id, URL.createObjectURL(b)); } catch (e) { continue; }
      }
      if (img.isConnected && img.getAttribute("src") !== URLS.get(id)) img.src = URLS.get(id);
    }
  }
  function reduceFoto(archivo, lado = 1280, calidad = 0.82) {
    return new Promise((ok, mal) => {
      const u = URL.createObjectURL(archivo), im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(u);
        const k = Math.min(1, lado / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(b => b ? ok(b) : mal(new Error("sin foto")), "image/jpeg", calidad);
      };
      im.onerror = () => { URL.revokeObjectURL(u); mal(new Error("no es una foto")); };
      im.src = u;
    });
  }
  async function fotoElegida() {
    const inp = $("mue-foto-in"), archivo = inp.files && inp.files[0], id = fotoPara;
    inp.value = ""; fotoPara = null;
    if (!archivo || !id || !fichas.some(f => f.id === id)) return;
    if (!/^image\//.test(archivo.type || "image/")) { aviso(T("Ese archivo no es una foto."), true); return; }
    aviso(T("Preparando la foto…"));
    let b;
    try { b = await reduceFoto(archivo); } catch (e) { aviso(T("No se ha podido abrir esa foto. Prueba con otra."), true); return; }
    try { await fotoPon(id, b); } catch (e) { aviso(T("No se ha podido guardar la foto en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    soltarURL(id); FOTOS.add(id); ABIERTAS.add(id); lista();
    aviso(T("Foto guardada. Solo está en este móvil."));
    $("mue-" + id)?.querySelector("[data-foto]")?.focus();
  }
  // Para pasar la foto con la ficha: más pequeña (que quepa en un mensaje), como texto «data:image/jpeg;base64,…»
  const aTexto = (b) => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => mal(r.error); r.readAsDataURL(b); });
  async function fotosParaPasar(lista) {
    const fotos = {};
    for (const f of lista) {
      if (!FOTOS.has(f.id)) continue;
      try {
        const b = await fotoLee(f.id); if (!b) continue;
        for (const [lado, cal] of [[480, 0.6], [360, 0.5], [260, 0.45]]) {
          const t = await aTexto(await reduceFoto(b, lado, cal));
          if (t.length <= 40000) { fotos[f.id] = t; break; }
        }
      } catch (e) { /* sin foto: la ficha pasa igual */ }
    }
    return fotos;
  }
  // Guarda las fotos que venían en lo pegado (se vuelven a dibujar en un canvas: solo entra una imagen limpia)
  async function guardaFotosPegadas(lista) {
    let n = 0;
    for (const x of lista || []) {
      if (x.siFalta && FOTOS.has(x.id)) continue;
      try {
        // Sin fetch (la CSP no deja leer «data:»): se pasa el base64 a bytes a mano
        const [cab, b64] = x.data.split(","), bin = atob(b64), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const b = new Blob([u8], { type: cab.slice(5, cab.indexOf(";")) });
        await fotoPon(x.id, await reduceFoto(b));
        soltarURL(x.id); FOTOS.add(x.id); n++;
      } catch (e) { /* esa foto no se ha podido leer: la ficha se queda sin foto */ }
    }
    return n;
  }
  async function quitaFoto(id) {
    try { await fotoQuita(id); } catch (e) { aviso(T("No se ha podido quitar la foto."), true); return; }
    soltarURL(id); FOTOS.delete(id); lista();
    aviso(T("Foto quitada."));
    $("mue-" + id)?.querySelector("[data-foto]")?.focus();
  }

  const ABIERTAS = new Set();
  function lista() {
    const l = busca(fichas, $("mue-q").value, filtro).sort((a, b) => NIVELES.indexOf(a.nivel) - NIVELES.indexOf(b.nivel) || a.nombre.localeCompare(b.nombre, "es"));
    if ($("mue-q").value.trim() && l.length === 1) ABIERTAS.add(l[0].id); // al buscar y salir solo uno, se abre
    $("mue-cuenta").textContent = fichas.length ? T("{n} de {t} clientes", { n: l.length, t: fichas.length }) : "";
    $("mue-lista").innerHTML = !fichas.length
      ? `<div class="panel mue-vacio"><b>${esc(T("Tu libreta está vacía."))}</b><p>${esc(T("Cuando descargues en un sitio difícil, apunta aquí cómo se entra para la próxima vez."))}</p></div>`
      : l.length ? l.map(ficha).join("") : `<p class="mue-vacio">${esc(T("No hay ningún cliente con eso. Prueba con otra palabra o quita el filtro."))}</p>`;
    $("mue-buscar").hidden = !fichas.length;
    $("mue-exporta").hidden = $("mue-foto-pista").hidden = !FOTOS.size;
    pintaRepes();
    cajaMapa();
    if (FOTOS.size) pintaFotos();
  }

  // ---------- Mapa de mis clientes (v190, Lorena: «añade la 1 y la 2») ----------
  // Como en «Aparcamientos en mi ruta»: Leaflet alojado aquí (lib/leaflet.js) y el mapa de OpenStreetMap
  // (tile.openstreetmap.org, ya en la CSP). Solo se carga al tocar «Ver el mapa»; sin internet lo dice y la libreta sigue.
  // Solo salen las fichas con posición apuntada (nunca se inventa una). Al tocar un punto se abre su ficha.
  let LEAF = null, MAPA = null;
  const conCoord = () => fichas.filter(f => f.lat != null && f.lon != null);
  function cargaLeaflet() {
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (LEAF) return LEAF;
    return (LEAF = new Promise((ok, mal) => {
      const v = typeof VERSION_WEB !== "undefined" ? VERSION_WEB : "";
      if (!document.querySelector('link[href^="lib/leaflet.css"]')) { const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "lib/leaflet.css?v=" + v; document.head.appendChild(css); }
      const js = document.createElement("script"); js.src = "lib/leaflet.js?v=" + v;
      js.onload = () => ok(window.L); js.onerror = () => { LEAF = null; js.remove(); mal(new Error("sin-mapa")); };
      document.head.appendChild(js);
    }));
  }
  function mapaMsg(t) { const m = $("mue-mapa-msg"); m.textContent = t || ""; m.hidden = !t; }
  function leyenda() {
    $("mue-ley").innerHTML = NIVELES.map(n => `<li class="mue-nivel ${n}">${senal(n)}${esc(T(NOMBRE_NIVEL[n]))}</li>`).join("");
  }
  // Se llama cada vez que cambia la libreta: esconde la caja si no hay posiciones y repinta los puntos si el mapa está abierto
  function cajaMapa() {
    const l = conCoord();
    $("mue-mapa-caja").hidden = !l.length;
    if (!l.length && MAPA) cierraMapa(false);
    if (MAPA && !$("mue-mapa").hidden) puntos(false);
  }
  function puntos(encuadra) {
    const L = window.L, l = conCoord();
    MAPA.capa.clearLayers();
    for (const f of l) {
      const nombre = f.nombre.length > 22 ? f.nombre.slice(0, 21) + "…" : f.nombre;
      const ic = L.divIcon({ className: "mue-pin-w", html: `<span class="mue-pin ${f.nivel}">${senal(f.nivel)}<b translate="no">${esc(nombre)}</b></span>`, iconSize: null, iconAnchor: [14, 14] });
      const mk = L.marker([f.lat, f.lon], { icon: ic, title: f.nombre + " · " + T(NOMBRE_NIVEL[f.nivel]), alt: f.nombre, keyboard: true, riseOnHover: true });
      mk.on("click", () => { pantalla(false); abreFicha(f.id); });
      mk.addTo(MAPA.capa);
    }
    if (encuadra && l.length) {
      if (l.length === 1) MAPA.mapa.setView([l[0].lat, l[0].lon], 14);
      else MAPA.mapa.fitBounds(l.map(f => [f.lat, f.lon]), { padding: [40, 40], maxZoom: 14 });
    }
  }
  async function verMapa(centro) {
    const caja = $("mue-mapa");
    if (navigator.onLine === false) { mapaMsg(T("Sin internet no se puede ver el mapa. La libreta sí funciona.")); return; }
    mapaMsg(T("Cargando el mapa…"));
    let L; try { L = await cargaLeaflet(); } catch (e) { mapaMsg(T("No se ha podido cargar el mapa. Comprueba que tienes internet. La libreta sí funciona.")); return; }
    mapaMsg("");
    caja.hidden = false;
    $("mue-ver-mapa").hidden = true;
    $("mue-cierra-mapa").hidden = false;
    if (!MAPA) {
      const tactil = L.Browser.mobile || "ontouchstart" in window;
      const mapa = L.map(caja, { zoomControl: true, dragging: !tactil, tap: true });
      mapa.attributionControl.setPrefix(false);
      let fallos = 0;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' })
        .on("tileerror", () => { if (++fallos === 3) mapaMsg(T("El mapa no se ve bien: parece que no hay internet. Los puntos de tus clientes siguen ahí.")); })
        .on("tileload", () => { if (fallos) { fallos = 0; mapaMsg(""); } })
        .addTo(mapa);
      MAPA = { mapa, capa: L.layerGroup().addTo(mapa), tactil, btn: null };
      // v193 (petición n.º 61): «Pantalla completa», como en «Aparcamientos en mi ruta»: el mapa ocupa toda la pantalla
      // y se mueve con un dedo; «Cerrar mapa», Esc o cambiar de apartado vuelven a como estaba.
      const Grande = L.Control.extend({ options: { position: "topright" }, onAdd() {
        const b = L.DomUtil.create("button", "apc-yo-btn mue-grande-btn"); b.type = "button";
        L.DomEvent.disableClickPropagation(b); L.DomEvent.on(b, "click", () => pantalla(!caja.classList.contains("completa")));
        MAPA.btn = b; pintaGrande(); return b;
      } });
      new Grande().addTo(mapa);
      if (tactil) {
        const av = L.DomUtil.create("div", "apc-dos-dedos", caja); av.textContent = T("Usa dos dedos para mover el mapa, o toca «Pantalla completa»");
        let t = null;
        caja.addEventListener("touchmove", (e) => { if (e.touches.length !== 1 || caja.classList.contains("completa")) return; av.classList.add("ver"); clearTimeout(t); t = setTimeout(() => av.classList.remove("ver"), 1600); }, { passive: true });
      }
      puntos(true);
    } else { MAPA.mapa.invalidateSize(); puntos(!centro); }
    if (centro) MAPA.mapa.setView([centro.lat, centro.lon], 15);
  }
  function pintaGrande() {
    const b = MAPA && MAPA.btn; if (!b) return;
    const g = $("mue-mapa").classList.contains("completa");
    b.innerHTML = g ? icono("cerrar", "p") + `<span>${esc(T("Cerrar mapa"))}</span>` : icono("grande", "p") + `<span>${esc(T("Pantalla completa"))}</span>`;
    b.setAttribute("aria-pressed", String(g));
  }
  function pantalla(g) {
    const caja = $("mue-mapa");
    if (!MAPA || caja.classList.contains("completa") === g) return;
    caja.classList.toggle("completa", g); document.documentElement.classList.toggle("mapa-completo", g);
    if (MAPA.tactil) g ? MAPA.mapa.dragging.enable() : MAPA.mapa.dragging.disable();
    pintaGrande(); setTimeout(() => MAPA.mapa.invalidateSize(), 80);
    if (g) MAPA.btn?.focus(); else caja.scrollIntoView({ block: "center" });
  }
  // v194 (petición n.º 62): «Cerrar el mapa» debajo del mapa. Lo esconde (sale de pantalla completa si hace falta)
  // y vuelve «Ver el mapa». El mapa no se destruye: al volver a abrirlo sale enseguida.
  function cierraMapa(foco) {
    pantalla(false);
    $("mue-mapa").hidden = true; $("mue-cierra-mapa").hidden = true; $("mue-ver-mapa").hidden = false;
    if (foco) { $("mue-ver-mapa").focus({ preventScroll: true }); $("mue-mapa-caja").scrollIntoView({ block: "nearest" }); }
  }
  // Desde el mapa a la ficha: quita búsqueda y filtro si la escondían, la abre, la enseña y la resalta un momento
  function abreFicha(id) {
    ABIERTAS.add(id);
    let el = $("mue-" + id);
    if (!el) { filtro = ""; $("mue-q").value = ""; chips(); lista(); el = $("mue-" + id); }
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
    el.classList.add("mue-resalta"); setTimeout(() => el.classList.remove("mue-resalta"), 2200);
    el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true });
  }

  // Formulario (añadir o cambiar)
  const CAMPOS = ["nombre", "lugar", "nivel", "truco", "maniobra", "dormir", "banos", "espera", "epis", "dibujo", "lat", "lon"];
  function abre(f) {
    editando = f ? f.id : null;
    for (const k of CAMPOS) $("mue-" + k).value = f && f[k] != null ? f[k] : (k === "nivel" ? "cuidado" : "");
    $("mue-form-t").textContent = f ? T("Cambiar la ficha") : T("Añadir un cliente");
    $("mue-gps-msg").textContent = "";
    cierraElige();
    $("mue-form").hidden = false;
    $("mue-nuevo").hidden = true;
    $("mue-msg").hidden = true;
    $("mue-nombre").focus();
    $("mue-form").scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function cierra() { cierraElige(); $("mue-form").hidden = true; $("mue-nuevo").hidden = false; editando = null; }
  function guardaForm(e) {
    e.preventDefault();
    const d = {}; for (const k of CAMPOS) d[k] = $("mue-" + k).value;
    const lat = d.lat.trim(), lon = d.lon.trim();
    if ((lat || lon) && (coord(lat, 90) === null || coord(lon, 180) === null)) { $("mue-gps-msg").textContent = T("La posición no está bien escrita: déjala vacía o pulsa «Usar mi posición ahora» o «Elegir en el mapa»."); $("mue-lat").focus(); return; }
    const antes = fichas.find(f => f.id === editando);
    if (!antes && fichas.length >= TOPE) { aviso(T("Ya tienes {n} clientes: borra alguno para poder añadir más.", { n: TOPE }), true); return; }
    const f = limpia({ ...d, id: editando || nuevoId(), cambiado: "" });
    if (!f) { aviso(T("Falta el nombre del cliente o cómo se entra."), true); return; }
    const copia = fichas.slice();
    if (antes) fichas[fichas.indexOf(antes)] = f; else fichas.push(f);
    if (!guarda()) { fichas = copia; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    ABIERTAS.add(f.id); cierra(); chips(); lista();
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
      sigueNumeros();
    }, () => { msg.textContent = T("No se ha podido saber tu posición. Puedes dejarlo vacío."); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }

  // v192 (petición n.º 60): «Elegir en el mapa». Mapa pequeño dentro del formulario (el mismo Leaflet y las mismas
  // teselas que «Ver el mapa»): al tocar se pone el punto (se puede arrastrar) y se rellenan latitud y longitud.
  // No guarda nada por su cuenta: se guarda con «Guardar», como siempre. Sin internet lo dice y se pueden escribir los números.
  let ELIGE = null;
  function puntoForm() {
    const lat = coord($("mue-lat").value, 90), lon = coord($("mue-lon").value, 180);
    return lat !== null && lon !== null ? { lat, lon } : null;
  }
  function ponPunto(lat, lon) {
    const L = window.L;
    if (ELIGE.punto) ELIGE.punto.setLatLng([lat, lon]);
    else {
      const icon = L.divIcon({ className: "mue-pin-puerta", html: "<span></span>", iconSize: [34, 44], iconAnchor: [17, 42] });
      ELIGE.punto = L.marker([lat, lon], { icon, draggable: true, keyboard: true, title: T("Puerta de camiones"), alt: T("Puerta de camiones") }).addTo(ELIGE.mapa);
      ELIGE.punto.on("dragend", () => { const p = ELIGE.punto.getLatLng(); rellena(p.lat, p.lng); });
    }
  }
  function rellena(lat, lon) {
    $("mue-lat").value = coord(lat, 90); $("mue-lon").value = coord(lon, 180);
    $("mue-gps-msg").textContent = T("Punto puesto. Comprueba que es la puerta de camiones y pulsa «Guardar».");
  }
  function quitaPunto() {
    if (ELIGE?.punto) { ELIGE.punto.remove(); ELIGE.punto = null; }
    $("mue-lat").value = ""; $("mue-lon").value = "";
    $("mue-gps-msg").textContent = T("Punto quitado.");
  }
  function cierraElige() {
    $("mue-elige").hidden = true;
    $("mue-elegir").setAttribute("aria-expanded", "false");
  }
  async function elige() {
    if (!$("mue-elige").hidden) { cierraElige(); return; }
    const msg = $("mue-gps-msg");
    if (navigator.onLine === false) { msg.textContent = T("Sin internet no se puede ver el mapa. Puedes escribir la latitud y la longitud a mano."); return; }
    msg.textContent = T("Cargando el mapa…");
    let L; try { L = await cargaLeaflet(); } catch (e) { msg.textContent = T("No se ha podido cargar el mapa. Comprueba que tienes internet o escribe la latitud y la longitud a mano."); return; }
    msg.textContent = "";
    $("mue-elige").hidden = false;
    $("mue-elegir").setAttribute("aria-expanded", "true");
    const p = puntoForm(), otro = conCoord().slice(-1)[0];
    if (!ELIGE) {
      const tactil = L.Browser.mobile || "ontouchstart" in window;
      const mapa = L.map($("mue-elige-mapa"), { zoomControl: true, dragging: !tactil, tap: true });
      mapa.attributionControl.setPrefix(false);
      let fallos = 0;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' })
        .on("tileerror", () => { if (++fallos === 3) msg.textContent = T("El mapa no se ve bien: parece que no hay internet. Puedes escribir la latitud y la longitud a mano."); })
        .on("tileload", () => { if (fallos) { fallos = 0; msg.textContent = ""; } })
        .addTo(mapa);
      mapa.on("click", (e) => { ponPunto(e.latlng.lat, e.latlng.lng); rellena(e.latlng.lat, e.latlng.lng); });
      ELIGE = { mapa, punto: null };
      if (tactil) {
        const caja = $("mue-elige-mapa"), av = L.DomUtil.create("div", "apc-dos-dedos", caja); av.textContent = T("Usa dos dedos para mover el mapa");
        let t = null;
        caja.addEventListener("touchmove", (e) => { if (e.touches.length !== 1) return; av.classList.add("ver"); clearTimeout(t); t = setTimeout(() => av.classList.remove("ver"), 1600); }, { passive: true });
      }
    } else ELIGE.mapa.invalidateSize();
    // Dónde empieza: el punto ya escrito; si no, el último cliente con posición; si no, España entera
    if (p) { ponPunto(p.lat, p.lon); ELIGE.mapa.setView([p.lat, p.lon], 16); }
    else {
      if (ELIGE.punto) { ELIGE.punto.remove(); ELIGE.punto = null; }
      if (otro) ELIGE.mapa.setView([otro.lat, otro.lon], 12); else ELIGE.mapa.setView([40.2, -3.6], 5);
    }
    $("mue-elige").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  // Si se escriben los números a mano con el mapa abierto, el punto se mueve
  function sigueNumeros() {
    if (!ELIGE || $("mue-elige").hidden) return;
    const p = puntoForm();
    if (p) { ponPunto(p.lat, p.lon); ELIGE.mapa.panTo([p.lat, p.lon]); }
  }

  // Copiar: si el móvil no deja, se enseña el texto para copiarlo a mano
  async function copia(t, ok) {
    try { await navigator.clipboard.writeText(t); aviso(ok); }
    catch (e) { $("mue-texto").value = t; $("mue-pasar").open = true; $("mue-texto").focus(); $("mue-texto").select(); aviso(T("No se ha podido copiar solo: mantén pulsado el texto de abajo y cópialo."), true); }
  }
  function textoFicha(f, fotos) {
    const l = [f.nombre + (f.lugar ? " (" + f.lugar + ")" : ""), T("Nivel") + ": " + T(NOMBRE_NIVEL[f.nivel]), T("Cómo entrar y maniobrar") + ": " + f.truco];
    for (const k of ["maniobra", "dormir", "banos"]) if (f[k]) l.push(T(NOMBRE_DATO[k]) + ": " + T(NOMBRE_OPC[k][f[k]]));
    for (const k of ["espera", "epis"]) if (f[k]) l.push(T(NOMBRE_DATO[k]) + ": " + f[k]);
    if (mapa(f)) l.push(T("Mapa") + ": " + mapa(f));
    return l.join("\n") + "\n\n" + T("Apuntado por un conductor, sin comprobar. Para meterlo en tu libreta de la web de CCOO:") + "\n" + exporta([f], fotos);
  }

  lee(); leyenda(); chips(); lista();
  cargaFotos().then(() => { if (FOTOS.size) lista(); });
  // Recordar qué fichas están abiertas (el evento «toggle» no sube: se escucha en la fase de captura)
  $("mue-lista").addEventListener("toggle", (e) => {
    const d = e.target; if (!d.matches || !d.matches("details.mue-ficha")) return;
    if (d.open) ABIERTAS.add(d.dataset.ficha); else ABIERTAS.delete(d.dataset.ficha);
  }, true);
  addEventListener("keydown", (e) => { if (e.key === "Escape") pantalla(false); });
  addEventListener("hashchange", () => pantalla(false));
  $("mue-ver-mapa").addEventListener("click", () => verMapa(null));
  $("mue-cierra-mapa").addEventListener("click", () => cierraMapa(true));
  $("mue-nuevo").addEventListener("click", () => abre(null));
  $("mue-foto-in").addEventListener("change", fotoElegida);
  $("mue-cancela").addEventListener("click", cierra);
  $("mue-form").addEventListener("submit", guardaForm);
  $("mue-gps").addEventListener("click", posicion);
  $("mue-elegir").addEventListener("click", elige);
  $("mue-quita-punto").addEventListener("click", quitaPunto);
  $("mue-elige-cierra").addEventListener("click", cierraElige);
  $("mue-lat").addEventListener("change", sigueNumeros);
  $("mue-lon").addEventListener("change", sigueNumeros);
  $("mue-q").addEventListener("input", lista);
  $("mue-niveles").addEventListener("click", (e) => { const b = e.target.closest("[data-nivel]"); if (!b) return; filtro = b.dataset.nivel; chips(); lista(); });
  $("mue-lista").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const f = fichas.find(x => x.id === (b.dataset.copia || b.dataset.edita || b.dataset.borra || b.dataset.si));
    if (b.dataset.vermapa) { const g = fichas.find(x => x.id === b.dataset.vermapa); if (g) { $("mue-mapa-caja").scrollIntoView({ block: "start", behavior: "smooth" }); verMapa(g); } return; }
    if (b.dataset.foto) { if (fichas.some(x => x.id === b.dataset.foto)) { fotoPara = b.dataset.foto; $("mue-foto-in").click(); } return; }
    if (b.dataset.quitafoto) { quitaFoto(b.dataset.quitafoto); return; }
    if (b.dataset.edita && f) abre(f);
    else if (b.dataset.copia && f) {
      if (!FOTOS.has(f.id)) copia(textoFicha(f), T("Copiado. Pégalo en un mensaje para tu compañero."));
      else fotosParaPasar([f]).then(fo => copia(textoFicha(f, fo), fo[f.id] ? T("Copiado con la foto. Pégalo en un mensaje para tu compañero.") : T("Copiado sin la foto (no se ha podido preparar). Pégalo en un mensaje para tu compañero.")));
    }
    else if (b.dataset.borra && f) { borrando = f.id; lista(); $("mue-lista").querySelector(".mue-si")?.focus(); }
    else if (b.dataset.no) { const id = borrando; borrando = null; lista(); $("mue-lista").querySelector(`[data-borra="${CSS.escape(id || "")}"]`)?.focus(); }
    else if (b.dataset.si && f) {
      const copiaL = fichas.slice(); fichas = fichas.filter(x => x !== f); borrando = null;
      if (!guarda()) { fichas = copiaL; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); }
      else {
        aviso(T("Ficha borrada."));
        if (FOTOS.has(f.id)) { FOTOS.delete(f.id); soltarURL(f.id); fotoQuita(f.id).catch(() => {}); }
      }
      chips(); lista();
    }
  });
  // v197 (lo pidió el padre: con fotos el texto era tan largo que WhatsApp y Telegram no lo aceptaban): «Copiar sin fotos»
  // (texto corto), «Copiar con fotos» (dice el tamaño) y «Mandar como archivo» (con fotos, por el menú de compartir del
  // móvil; si el navegador no deja, se descarga el archivo). Al otro lado: pegar el texto o «Abrir un archivo».
  const kb = (t) => Math.max(1, Math.round(new Blob([t]).size / 1024));
  const conFotos = () => FOTOS.size ? (aviso(T("Preparando las fotos…")), fotosParaPasar(fichas)) : Promise.resolve(null);
  $("mue-exporta-sin").addEventListener("click", () => {
    if (!fichas.length) { aviso(T("Tu libreta está vacía."), true); return; }
    copia(exporta(fichas), T("Copiado sin fotos. Pégalo en «Pasar mi libreta» del otro móvil."));
  });
  $("mue-exporta").addEventListener("click", () => {
    if (!fichas.length) { aviso(T("Tu libreta está vacía."), true); return; }
    conFotos().then(fo => {
      const t = exporta(fichas, fo);
      copia(t, T("Copiado con las fotos ({n} KB). Pégalo en «Pasar mi libreta» del otro móvil.", { n: kb(t) }) + (t.length > 60000 ? " " + T("Si WhatsApp o Telegram no lo aceptan, pásala sin fotos o con «Mandar como archivo».") : ""));
    });
  });
  $("mue-archivo").addEventListener("click", () => {
    if (!fichas.length) { aviso(T("Tu libreta está vacía."), true); return; }
    conFotos().then(async fo => {
      const t = exporta(fichas, fo), nombre = "libreta-muelles-" + new Date().toISOString().slice(0, 10) + ".txt";
      let arch = null;
      try { arch = new File([t], nombre, { type: "text/plain" }); } catch (e) { /* navegador viejo */ }
      if (arch && navigator.canShare && navigator.canShare({ files: [arch] })) {
        try { await navigator.share({ files: [arch], title: T("Mi libreta de Accesos y muelles") }); aviso(T("Listo. En el otro móvil, abre «Pasar mi libreta» y pulsa «Abrir un archivo».")); return; }
        catch (e) { if (e && e.name === "AbortError") return; }
      }
      const u = URL.createObjectURL(new Blob([t], { type: "text/plain" })), a = document.createElement("a");
      a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 10000);
      aviso(T("Se ha guardado el archivo «{f}» ({n} KB) en tus descargas. Mándalo por WhatsApp o Telegram como documento.", { f: nombre, n: kb(t) }));
    });
  });
  $("mue-abre-archivo").addEventListener("click", () => $("mue-archivo-in").click());
  $("mue-archivo-in").addEventListener("change", () => {
    const a = $("mue-archivo-in").files && $("mue-archivo-in").files[0];
    $("mue-archivo-in").value = "";
    if (!a) return;
    if (a.size > 20 * 1024 * 1024) { aviso(T("Ese archivo es demasiado grande."), true); return; }
    a.text().then(t => { $("mue-texto").value = t; $("mue-importa").click(); }).catch(() => aviso(T("No se ha podido leer el archivo."), true));
  });
  // v197: fichas repetidas que ya están en la libreta (de antes del arreglo). Se quitan solo si el conductor lo confirma,
  // con copia antes (localStorage «ccoo-muelles-copia») y «Deshacer».
  const KEY_COPIA = "ccoo-muelles-copia";
  function pintaRepes() {
    const n = repetidas(fichas, FOTOS).length;
    $("mue-repes").hidden = !n;
    if (n) $("mue-repes-t").textContent = n === 1 ? T("Tienes 1 ficha repetida (igual que otra).") : T("Tienes {n} fichas repetidas (iguales que otra).", { n });
    $("mue-repes-bots").hidden = false; $("mue-repes-seguro").hidden = true;
  }
  $("mue-repes-quita").addEventListener("click", () => { $("mue-repes-bots").hidden = true; $("mue-repes-seguro").hidden = false; $("mue-repes-si").focus(); });
  $("mue-repes-no").addEventListener("click", pintaRepes);
  $("mue-repes-si").addEventListener("click", () => {
    const sobran = new Set(repetidas(fichas, FOTOS));
    if (!sobran.size) { pintaRepes(); return; }
    try { localStorage.setItem(KEY_COPIA, JSON.stringify({ v: 1, fichas })); } catch (e) { aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    const copiaL = fichas; fichas = fichas.filter(f => !sobran.has(f.id));
    if (!guarda()) { fichas = copiaL; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    chips(); lista();
    aviso(sobran.size === 1 ? T("Quitada 1 ficha repetida.") : T("Quitadas {n} fichas repetidas.", { n: sobran.size }));
    $("mue-msg").insertAdjacentHTML("beforeend", ` <button type="button" class="btn sec mue-deshacer" id="mue-deshacer">${esc(T("Deshacer"))}</button>`);
  });
  $("mue-msg").addEventListener("click", (e) => {
    if (!e.target.closest("#mue-deshacer")) return;
    let c = null;
    try { c = JSON.parse(localStorage.getItem(KEY_COPIA) || "null"); } catch (e2) { /* sin copia */ }
    if (!c || !Array.isArray(c.fichas)) { aviso(T("No se ha podido deshacer."), true); return; }
    const copiaL = fichas; fichas = c.fichas.map(limpia).filter(Boolean);
    if (!guarda()) { fichas = copiaL; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    chips(); lista(); aviso(T("Hecho: vuelven a estar todas."));
  });
  $("mue-importa").addEventListener("click", () => {
    const r = importa($("mue-texto").value, fichas);
    if (r.error) { aviso(T("Ese texto no es una libreta ni una ficha de Accesos y muelles."), true); return; }
    if (!r.nuevas) {
      aviso(T("No había nada nuevo: ya tenías todo eso."));
      if (r.fotos.length) guardaFotosPegadas(r.fotos).then(n => { if (n) { lista(); aviso(n === 1 ? T("Ya tenías ese cliente. Se ha añadido la foto que le faltaba.") : T("Ya tenías esos clientes. Se han añadido {n} fotos que te faltaban.", { n })); } });
      return;
    }
    const copiaL = fichas; fichas = r.lista;
    if (!guarda()) { fichas = copiaL; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    $("mue-texto").value = ""; chips(); lista();
    const msg = T("Añadidos {n} clientes.", { n: r.nuevas }) + (r.repes ? " " + T("{n} ya los tenías.", { n: r.repes }) : "") + (r.sobran ? " " + T("{n} no caben (máximo {t}).", { n: r.sobran, t: TOPE }) : "");
    aviso(msg);
    if (r.fotos.length) guardaFotosPegadas(r.fotos).then(n => { if (n) { lista(); aviso(msg + " " + (n === 1 ? T("Con su foto.") : T("Con {n} fotos.", { n }))); } });
  });
})();
