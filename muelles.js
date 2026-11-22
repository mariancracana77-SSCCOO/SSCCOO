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

  // ---------- Horario de cada cliente (v199, petición n.º 67: «en lugar de EPIs, añadir horario») ----------
  // f.hor = {h24: true} (abierto siempre) o {b: [{d: [1..7] (1 = lunes), t: [[desde, hasta], …]}]} en minutos del día
  // (0–1439; «hasta» menor que «desde» = pasa la medianoche). Hasta 4 grupos de días y 2 turnos por grupo. Lo apunta el
  // conductor: la ficha dice «Abierto ahora» o «Cerrado ahora · abre…» con la hora del móvil. El texto que ya hubiera en
  // «epis» (antes «EPIs que piden») no se toca: sale como «Nota del horario».
  const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
  function limpiaHor(h) {
    if (!h || typeof h !== "object") return null;
    if (h.h24 === true) return { h24: true };
    if (!Array.isArray(h.b)) return null;
    const b = [];
    for (const g of h.b.slice(0, 4)) {
      if (!g || !Array.isArray(g.d) || !Array.isArray(g.t)) continue;
      const d = [...new Set(g.d.map(Number).filter(x => Number.isInteger(x) && x >= 1 && x <= 7))].sort();
      const t = g.t.slice(0, 2).filter(x => Array.isArray(x) && x.length === 2).map(x => x.map(Number))
        .filter(([a, z]) => [a, z].every(v => Number.isInteger(v) && v >= 0 && v < 1440) && a !== z);
      if (d.length && t.length) b.push({ d, t });
    }
    return b.length ? { b } : null;
  }
  const hhmm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  // Tramos abiertos de un día de la semana (1–7): [[desde, hasta]] con hasta hasta 1440
  function tramos(h, dia) {
    const r = [];
    for (const g of h.b || []) for (const [a, z] of g.t) {
      if (z > a) { if (g.d.includes(dia)) r.push([a, z]); }
      else { if (g.d.includes(dia)) r.push([a, 1440]); if (g.d.includes(dia === 1 ? 7 : dia - 1)) r.push([0, z]); }
    }
    return r.sort((x, y) => x[0] - y[0]);
  }
  // Estado a una hora dada: {abierto, cierra: {dia: 0|1, m}, abre: {dentro: días, dia, m}} o null sin horario
  function estado(h, fecha) {
    if (!h) return null;
    if (h.h24) return { abierto: true, h24: true };
    const hoy = ((fecha.getDay() + 6) % 7) + 1, m = fecha.getHours() * 60 + fecha.getMinutes();
    const dia = (k) => ((hoy - 1 + k) % 7) + 1;
    const ya = tramos(h, hoy).find(([a, z]) => a <= m && m < z);
    if (ya) {
      let cierra = { dentro: 0, m: ya[1] };
      if (ya[1] === 1440) { const sig = tramos(h, dia(1)).find(([a]) => a === 0); cierra = sig ? { dentro: 1, m: sig[1] === 1440 ? 0 : sig[1] } : { dentro: 1, m: 0 }; }
      return { abierto: true, cierra };
    }
    for (let k = 0; k <= 7; k++) {
      const t = tramos(h, dia(k)).find(([a]) => k > 0 || a > m);
      if (t) return { abierto: false, abre: { dentro: k, dia: dia(k), m: t[0] } };
    }
    return { abierto: false };
  }
  // «L–V 6:00–14:00 y 15:00–20:00 · S 6:00–12:00»
  function horTexto(h) {
    if (!h) return "";
    if (h.h24) return "24 h";
    const dias = (d) => {
      const tr = []; let i = 0;
      while (i < d.length) { let j = i; while (j + 1 < d.length && d[j + 1] === d[j] + 1) j++; tr.push(j - i >= 2 ? `${DIAS[d[i] - 1]}–${DIAS[d[j] - 1]}` : d.slice(i, j + 1).map(x => DIAS[x - 1]).join(", ")); i = j + 1; }
      return tr.join(", ");
    };
    return h.b.map(g => `${dias(g.d)} ${g.t.map(([a, z]) => `${hhmm(a)}–${hhmm(z)}`).join(" y ")}`).join(" · ");
  }

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
    const h = limpiaHor(f.hor);
    if (h) r.hor = h;
    r.cambiado = typeof f.cambiado === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f.cambiado) ? f.cambiado : new Date().toISOString().slice(0, 10);
    // v202: «Recibida de un compañero» (solo una marca, sin nombres): la pone `importa` en las fichas nuevas que entran
    if (f.rec === 1 || f.rec === true) r.rec = 1;
    return r;
  }
  // Libreta a texto para otro móvil, y al revés (añade, no quita nada; lo repetido no se duplica)
  // v195 (petición n.º 63): con `fotos` (id -> «data:image/jpeg;base64,…», ya pequeña), cada ficha lleva también su foto
  const FOTO_OK = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, FOTO_MAX = 120000;
  // v205: el primer elemento dice cuántas fichas lleva (y la parte, si va en varias): así al otro lado se sabe si ha llegado
  // todo («Llegaron 40 de 52»). Las versiones de antes lo ignoran (no tiene nombre ni «Cómo entrar»).
  const exporta = (l, fotos, parte) => {
    const fs = l.map(f => { const r = limpia(f); if (r) delete r.rec; if (r && fotos && fotos[f.id]) r.foto = fotos[f.id]; return r; }).filter(Boolean);
    const cab = Object.assign({ libreta: "ccoo-muelles", total: fs.length }, parte || {});
    return PREFIJO + JSON.stringify([cab].concat(fs));
  };
  // v202 (arreglo urgente: a los compañeros no se les cargaba el archivo): se lee aunque venga con BOM, caracteres
  // invisibles, saltos de línea de Windows, comillas «tipográficas» (las cambian algunos teclados y apps al pegar),
  // el prefijo en minúsculas o sin él (solo la lista), o con texto de más detrás. Nunca falla en silencio: devuelve
  // `error` = "vacio" | "codigo" (no es una libreta) | "cortado" (empieza bien pero no llega entero) | "nada" (no hay
  // ninguna ficha que se pueda leer). Las fichas nuevas entran con la marca `rec` (recibida).
  const COMILLAS = /[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g;
  // v205 (arreglo urgente: «El archivo no ha llegado entero» y no se cargaba NADA). Ahora se lee ficha a ficha: cada
  // ficha completa vale aunque lo de detrás venga cortado (WhatsApp corta los mensajes largos) o mezclado con otros
  // mensajes (un chat de WhatsApp exportado llega como ZIP con un .txt: fecha, nombre y el texto, y más mensajes
  // detrás). También varias libretas en el mismo texto. Devuelve {datos, total, cortado} o {error}.
  // Recorre una lista JSON desde `ini` (el «[») y saca cada objeto de primer nivel que esté entero
  function objetos(t, ini) {
    const sale = []; let prof = 0, enTxt = false, esc2 = false, desde = -1, i = ini + 1, cerrada = false;
    for (; i < t.length; i++) {
      const c = t[i];
      if (enTxt) {
        if (esc2) esc2 = false; else if (c === "\\") esc2 = true; else if (c === '"') enTxt = false; else if (c === "\n") break;
        continue;
      }
      if (c === '"') { enTxt = true; continue; }
      if (c === "{" || c === "[") { if (prof === 0 && c === "{") desde = i; prof++; continue; }
      if (c === "}" || c === "]") {
        if (prof === 0) { if (c === "]") cerrada = true; break; }
        prof--;
        if (prof === 0 && desde >= 0) { try { sale.push(JSON.parse(t.slice(desde, i + 1))); } catch (e) { /* esta no */ } desde = -1; }
        continue;
      }
      if (prof === 0 && !/[\s,]/.test(c)) break;
    }
    return { sale, cerrada };
  }
  function leeTrozos(t) {
    const T2 = t.toUpperCase(), datos = [];
    let total = 0, cortado = false, alguna = false, pos = 0;
    const lee = (ini) => { const r = objetos(t, ini); alguna = true; if (!r.cerrada) cortado = true; for (const o of r.sale) { if (o && o.libreta === "ccoo-muelles") total = Math.max(total, Number(o.partes > 1 ? o.todas : o.total) || 0); else datos.push(o); } };
    for (;;) {
      const i = T2.indexOf(PREFIJO, pos); if (i < 0) break;
      const j = t.slice(i + PREFIJO.length).search(/\S/), k = i + PREFIJO.length + j;
      if (j >= 0 && t[k] === "[") lee(k); else if (j >= 0 && t[k] === "{") { const r = objetos("[" + t.slice(k), 0); alguna = true; if (!r.cerrada && !r.sale.length) cortado = true; datos.push(...r.sale); }
      pos = i + PREFIJO.length;
    }
    if (!alguna) { const m = /\[\s*\{/.exec(t); if (m) lee(m.index); else if (/^\{/.test(t)) { try { datos.push(JSON.parse(t)); alguna = true; } catch (e) { /* no */ } } }
    return { datos, total, cortado, alguna };
  }
  function leeDatos(texto) {
    const t = String(texto || "").replace(/[\uFEFF\u200B-\u200D\u2060\u00AD]/g, "").replace(/\r\n?/g, "\n").trim();
    if (!t) return { error: "vacio" };
    let r = leeTrozos(t);
    if (!r.datos.length) { const r2 = leeTrozos(t.replace(COMILLAS, '"')); if (r2.datos.length || r2.total) r = r2; }
    if (!r.alguna) return { error: "codigo" };
    if (!r.datos.length) return { error: r.cortado || r.total ? "cortado" : "nada" };
    return { datos: r.datos, total: r.total, cortado: r.cortado };
  }
  function importa(texto, actual) {
    const ld = leeDatos(texto);
    if (ld.error) return { error: ld.error };
    const datos = ld.datos;
    const leidas = datos.filter(d => limpia(d)).length;
    if (!leidas) return { error: "nada" };
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
      f.rec = 1;
      ids.add(f.id); l.push(f); nuevas++;
      if (foto(d)) fotos.push({ id: f.id, data: foto(d) });
    }
    return { lista: l, nuevas, repes, sobran, fotos, leidas, total: ld.total || 0, cortado: !!ld.cortado };
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
  // v205: un archivo muy grande (muchas fichas con fotos) se descarga en varias partes, cada una es una libreta entera
  // que se lee sola; al otro lado se eligen todas a la vez. Sin fotos nunca hace falta (300 fichas son unos 100 KB).
  const PARTE_MAX = 6 * 1024 * 1024;
  function trozos(l, fo) {
    const t = exporta(l, fo);
    if (new Blob([t]).size <= PARTE_MAX) return [t];
    const grupos = [[]]; let tam = 0;
    for (const f of l) {
      const n = new Blob([JSON.stringify(limpia(f) || {})]).size + (fo && fo[f.id] ? fo[f.id].length : 0) + 2;
      if (tam + n > PARTE_MAX && grupos[grupos.length - 1].length) { grupos.push([]); tam = 0; }
      grupos[grupos.length - 1].push(f); tam += n;
    }
    const todas = l.map(limpia).filter(Boolean).length;
    return grupos.map((g, i) => exporta(g, fo, { parte: i + 1, partes: grupos.length, todas }));
  }
  window.MuellesCuentas = { trozos, PARTE_MAX, limpia, exporta, importa, leeDatos, busca, mapa, rutas, repetidas, limpiaHor, estado, horTexto, TOPE, PREFIJO };

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
  const NOMBRE_DATO = { maniobra: "Maniobra", dormir: "Dormir", banos: "Baños", espera: "Espera", epis: "Nota del horario", hor: "Horario" };
  /* fin textos */

  const NOMBRE_DIA = ["el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado", "el domingo"];
  // v199: «Abierto ahora · cierra a las 14:00» / «Cerrado ahora · abre mañana a las 6:00»
  function estadoTexto(f) {
    const e = estado(f.hor, new Date());
    if (!e) return null;
    if (e.h24) return { abierto: true, t: T("Abierto 24 h") };
    if (e.abierto) return { abierto: true, t: e.cierra.dentro ? T("Abierto ahora · cierra mañana a las {h}", { h: hhmm(e.cierra.m) }) : T("Abierto ahora · cierra a las {h}", { h: hhmm(e.cierra.m) }) };
    if (!e.abre) return { abierto: false, t: T("Cerrado ahora") };
    const cuando = e.abre.dentro === 0 ? T("hoy") : e.abre.dentro === 1 ? T("mañana") : T(NOMBRE_DIA[e.abre.dia - 1]);
    return { abierto: false, t: T("Cerrado ahora · abre {c} a las {h}", { c: cuando, h: hhmm(e.abre.m) }) };
  }
  let fichas = [], filtro = "", borrando = null, editando = null, soloAbiertos = false;
  // v202: qué fichas se pasan a un compañero (todas o las elegidas); solo mientras la página está abierta
  let pasaTodas = true;
  const PASA = new Set();
  const elegidas = () => pasaTodas ? fichas : fichas.filter(f => PASA.has(f.id));
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
    const nr = fichas.filter(f => f.rec).length;
    if (filtro === "rec" && !nr) filtro = "";
    $("mue-niveles").innerHTML = ["", ...NIVELES].map(k =>
      `<button type="button" class="zc-chip${filtro === k ? " activa" : ""}" data-nivel="${k}" aria-pressed="${filtro === k}">${k ? senal(k) : ""}${esc(k ? T(NOMBRE_NIVEL[k]) : T("Todos"))} (${n(k)})</button>`).join("")
      // v202: las que han llegado de un compañero, para revisarlas o borrarlas
      + (nr ? `<button type="button" class="zc-chip${filtro === "rec" ? " activa" : ""}" data-nivel="rec" aria-pressed="${filtro === "rec"}">${esc(T("Recibidas"))} (${nr})</button>` : "");
    pintaPasa();
  }
  function ficha(f) {
    const datos = ["maniobra", "dormir", "banos"].filter(k => f[k]).map(k => [k, T(NOMBRE_OPC[k][f[k]])])
      .concat(f.hor ? [["hor", horTexto(f.hor)]] : [])
      .concat(["espera", "epis"].filter(k => f[k]).map(k => [k, f[k]]));
    const r = rutas(f), et = estadoTexto(f);
    const conf = borrando === f.id ? `<div class="zc-aviso mue-conf" role="alert"><b>${esc(T("¿Borrar esta ficha? No se puede deshacer."))}</b>
      <div class="mue-bots"><button type="button" class="btn mue-si" data-si="${esc(f.id)}">${esc(T("Sí, borrarla"))}</button><button type="button" class="btn sec" data-no="1">${esc(T("No"))}</button></div></div>` : "";
    // v193 (petición n.º 61): cada ficha sale plegada (nombre, nivel y sitio); al tocarla se ven los detalles.
    // Lo abierto se recuerda mientras la página está abierta (ABIERTAS) para que no se cierre al repintar.
    const abierta = ABIERTAS.has(f.id) || borrando === f.id;
    return `<details class="panel mue-ficha ${f.nivel}" id="mue-${esc(f.id)}" data-ficha="${esc(f.id)}"${abierta ? " open" : ""}>
      <summary class="mue-cab"><span class="mue-cab-t">${nivelHTML(f.nivel)}<h3 translate="no">${esc(f.nombre)}</h3>${f.lugar ? `<p class="mue-lugar" translate="no">${esc(f.lugar)}</p>` : ""}${f.rec ? `<p class="mue-rec">${esc(T("Recibida de un compañero"))}</p>` : ""}${et ? `<p class="mue-estado ${et.abierto ? "abierto" : "cerrado"}">${esc(et.t)}</p>` : ""}</span>
        <span class="mue-abre">${icono("abajo", "p")}<span class="mue-abre-t">${esc(T("Ver detalles"))}</span><span class="mue-cierra-t">${esc(T("Cerrar"))}</span></span></summary>
      <div class="mue-cuerpo">${FOTOS.has(f.id) ? `<figure class="mue-foto"><img alt="${esc(T("Foto de {n}", { n: f.nombre }))}" data-foto-de="${esc(f.id)}"${URLS.has(f.id) ? ` src="${esc(URLS.get(f.id))}"` : ""}></figure>` : ""}<div class="mue-truco"><b>${esc(T("Cómo entrar y maniobrar"))}</b><p translate="no">${esc(f.truco).replace(/\n/g, "<br>")}</p></div>
      ${f.hor ? `<p class="zc-pista mue-hor-pista">${esc(T("Horario apuntado por ti con la hora de este móvil: puede cambiar en festivos."))}</p>` : ""}${datos.length ? `<dl class="mue-datos">${datos.map(([k, v]) => `<div><dt>${esc(T(NOMBRE_DATO[k]))}</dt><dd${["espera", "epis", "hor"].includes(k) ? ' translate="no"' : ""}>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
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
        ${f.rec ? `<button type="button" class="btn sec" data-quitarec="${esc(f.id)}">${esc(T("Ya la he revisado: quitar la marca"))}</button>` : ""}
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
    const l = busca(fichas, $("mue-q").value, filtro === "rec" ? "" : filtro).filter(f => filtro !== "rec" || f.rec).filter(f => !soloAbiertos || (estadoTexto(f) || {}).abierto).sort((a, b) => NIVELES.indexOf(a.nivel) - NIVELES.indexOf(b.nivel) || a.nombre.localeCompare(b.nombre, "es"));
    if ($("mue-q").value.trim() && l.length === 1) ABIERTAS.add(l[0].id); // al buscar y salir solo uno, se abre
    $("mue-cuenta").textContent = fichas.length ? T("{n} de {t} clientes", { n: l.length, t: fichas.length }) : "";
    $("mue-lista").innerHTML = !fichas.length
      ? `<div class="panel mue-vacio"><b>${esc(T("Tu libreta está vacía."))}</b><p>${esc(T("Cuando descargues en un sitio difícil, apunta aquí cómo se entra para la próxima vez."))}</p>
        <p>${esc(T("¿Te ha pasado un compañero su libreta? Pulsa aquí y elige el archivo:"))}</p>
        <div class="mue-bots"><button type="button" class="btn zc-btn" data-cargar="1">${icono("subir", "p")}${esc(T("Cargar archivo de libreta"))}</button></div></div>`
      : l.length ? l.map(ficha).join("") : `<p class="mue-vacio">${esc(T("No hay ningún cliente con eso. Prueba con otra palabra o quita el filtro."))}</p>`;
    $("mue-buscar").hidden = !fichas.length;
    const conHor = fichas.some(f => f.hor);
    $("mue-abiertos").hidden = !conHor && !soloAbiertos;
    $("mue-abiertos").setAttribute("aria-pressed", String(soloAbiertos));
    $("mue-abiertos").classList.toggle("activa", soloAbiertos);
    pintaPasa();
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
  // v199: horario en el formulario. HB = grupos de días que se están escribiendo [{d: Set, t: [["06:00","14:00"], ["",""]]}]
  let HB = [];
  const aMin = (v) => { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ""); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };
  const nuevoGrupo = () => ({ d: new Set(), t: [["", ""], ["", ""]] });
  function pintaHor() {
    const h24 = $("mue-h24").checked;
    $("mue-hor-bloques").hidden = $("mue-hor-mas").hidden = h24;
    $("mue-hor-mas").hidden = h24 || HB.length >= 4;
    $("mue-hor-bloques").innerHTML = HB.map((g, i) => `<div class="mue-hor-g" data-g="${i}">
      <div class="mue-hor-dias" role="group" aria-label="${esc(T("Días"))}">${DIAS.map((x, j) => `<button type="button" class="zc-chip${g.d.has(j + 1) ? " activa" : ""}" data-hd="${j + 1}" aria-pressed="${g.d.has(j + 1)}" aria-label="${esc(T(NOMBRE_DIA[j].replace(/^el /, "")))}">${esc(T(x))}</button>`).join("")}</div>
      ${g.t.map((t, k) => `<div class="mue-hor-t"><span>${esc(k ? T("Tarde (si cierra a mediodía)") : T("Abre y cierra"))}</span><input type="time" data-ht="${k}" data-hx="0" value="${esc(t[0])}" aria-label="${esc(T("Abre"))}"><span aria-hidden="true">–</span><input type="time" data-ht="${k}" data-hx="1" value="${esc(t[1])}" aria-label="${esc(T("Cierra"))}"></div>`).join("")}
      ${HB.length > 1 ? `<button type="button" class="btn sec mue-hor-quita" data-hq="${i}">${esc(T("Quitar estos días"))}</button>` : ""}</div>`).join("");
  }
  function leeHor() {
    if ($("mue-h24").checked) return { h24: true };
    return limpiaHor({ b: HB.map(g => ({ d: [...g.d], t: g.t.map(t => t.map(aMin)).filter(t => t[0] !== null && t[1] !== null) })) });
  }
  function horIncompleto() {
    if ($("mue-h24").checked) return false;
    return HB.some(g => { const algo = g.d.size || g.t.some(t => t[0] || t[1]); const t1 = g.t.some(t => aMin(t[0]) !== null && aMin(t[1]) !== null && aMin(t[0]) !== aMin(t[1])); return algo && (!g.d.size || !t1); });
  }
  function abre(f) {
    editando = f ? f.id : null;
    for (const k of CAMPOS) $("mue-" + k).value = f && f[k] != null ? f[k] : (k === "nivel" ? "cuidado" : "");
    $("mue-h24").checked = !!(f && f.hor && f.hor.h24);
    HB = f && f.hor && f.hor.b ? f.hor.b.map(g => ({ d: new Set(g.d), t: [0, 1].map(k => g.t[k] ? g.t[k].map(hhmm).map(x => x.padStart(5, "0")) : ["", ""]) })) : [nuevoGrupo()];
    $("mue-hor-msg").textContent = "";
    pintaHor();
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
    if (horIncompleto()) { $("mue-hor-msg").textContent = T("Al horario le falta algo: marca los días y pon a qué hora abre y cierra (o déjalo vacío)."); $("mue-hor-msg").scrollIntoView({ block: "center" }); return; }
    $("mue-hor-msg").textContent = "";
    d.hor = leeHor();
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
  $("mue-h24").addEventListener("change", pintaHor);
  $("mue-hor-mas").addEventListener("click", () => { if (HB.length < 4) { HB.push(nuevoGrupo()); pintaHor(); } });
  $("mue-hor-bloques").addEventListener("click", (e) => {
    const g = e.target.closest("[data-g]"); if (!g) return; const grupo = HB[+g.dataset.g];
    const d = e.target.closest("[data-hd]");
    if (d) { const n = +d.dataset.hd; grupo.d.has(n) ? grupo.d.delete(n) : grupo.d.add(n); pintaHor(); return; }
    const q = e.target.closest("[data-hq]");
    if (q) { HB.splice(+q.dataset.hq, 1); pintaHor(); }
  });
  $("mue-hor-bloques").addEventListener("input", (e) => {
    const i = e.target.closest("[data-ht]"), g = e.target.closest("[data-g]"); if (!i || !g) return;
    HB[+g.dataset.g].t[+i.dataset.ht][+i.dataset.hx] = i.value;
  });
  $("mue-abiertos").addEventListener("click", () => { soloAbiertos = !soloAbiertos; lista(); });
  $("mue-niveles").addEventListener("click", (e) => { const b = e.target.closest("[data-nivel]"); if (!b) return; filtro = b.dataset.nivel; chips(); lista(); });
  $("mue-lista").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const f = fichas.find(x => x.id === (b.dataset.copia || b.dataset.edita || b.dataset.borra || b.dataset.si));
    if (b.dataset.vermapa) { const g = fichas.find(x => x.id === b.dataset.vermapa); if (g) { $("mue-mapa-caja").scrollIntoView({ block: "start", behavior: "smooth" }); verMapa(g); } return; }
    if (b.dataset.foto) { if (fichas.some(x => x.id === b.dataset.foto)) { fotoPara = b.dataset.foto; $("mue-foto-in").click(); } return; }
    if (b.dataset.quitafoto) { quitaFoto(b.dataset.quitafoto); return; }
    if (b.dataset.cargar) { $("mue-archivo-in").click(); return; }
    if (b.dataset.quitarec) {
      const g = fichas.find(x => x.id === b.dataset.quitarec); if (!g) return;
      delete g.rec;
      if (!guarda()) { g.rec = 1; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
      chips(); lista(); aviso(T("Hecho: ya no sale como recibida.")); return;
    }
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
  // (texto corto) y «Copiar con fotos» (dice el tamaño). Al otro lado: pegar el texto o cargar el archivo.
  // v200 (petición n.º 67, ampliación pasada por Lorena: «quiere que se pueda DESCARGAR, no mandar»): «Descargar archivo»
  // (con fotos) y «Descargar sin fotos» guardan el archivo directamente en Descargas (Blob + <a download>), sin el menú de
  // compartir. Antes de descargar se comprueba que el archivo se vuelve a leer entero (`importa` con la libreta vacía:
  // nuevas + repetidas + las que no caben = todas las fichas; las repetidas cuentan porque la libreta puede tenerlas).
  // «Compartir» (menú del móvil) queda aparte; si el móvil no deja, lo dice y remite a «Descargar archivo».
  // El archivo es el mismo texto que «Copiar»: sirve para pasarla a otro móvil y como copia de seguridad.
  const kb = (t) => Math.max(1, Math.round(new Blob([t]).size / 1024));
  // v202 (lo pidió Lorena: «es más que nada para pasárselo a los compañeros»): se puede pasar TODA la libreta o solo
  // las fichas que elijas (casillas). Por defecto el archivo va SIN fotos (pequeño: cabe en WhatsApp y Telegram);
  // «Descargar con fotos» aparte. Lo elegido solo vive mientras la página está abierta: no se guarda nada nuevo.
  const conFotos = (l) => l.some(f => FOTOS.has(f.id)) ? (aviso(T("Preparando las fotos…")), fotosParaPasar(l)) : Promise.resolve(null);
  const hoyTxt = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const nombreArchivo = (fotos, n) => "libreta-muelles-" + hoyTxt() + (pasaTodas ? "" : "-" + n + (n === 1 ? "-ficha" : "-fichas")) + (fotos ? "-con-fotos" : "") + ".txt";
  // El archivo se tiene que poder volver a leer entero antes de darlo por bueno
  const archivoBien = (t, l) => { const r = importa(t, []); return !r.error && !r.cortado && r.nuevas > 0 && (l ? r.nuevas + r.repes + r.sobran === l.map(limpia).filter(Boolean).length : r.leidas === Number((JSON.parse(t.slice(PREFIJO.length))[0] || {}).total)); };
  const puedeDescargar = () => "download" in document.createElement("a") && typeof URL.createObjectURL === "function";
  function pintaPasa() {
    if (!$("mue-pasa-lista")) return;
    for (const id of [...PASA]) if (!fichas.some(f => f.id === id)) PASA.delete(id);
    const l = elegidas(), conF = l.some(f => FOTOS.has(f.id));
    $("mue-pasa-quien").innerHTML = [[true, T("Toda la libreta ({n})", { n: fichas.length })], [false, T("Elegir fichas")]].map(([v, t]) =>
      `<button type="button" class="zc-chip${pasaTodas === v ? " activa" : ""}" data-pasa-todas="${v ? 1 : 0}" aria-pressed="${pasaTodas === v}">${esc(t)}</button>`).join("");
    $("mue-pasa-elige").hidden = pasaTodas;
    if (!pasaTodas) {
      const orden = fichas.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      $("mue-pasa-lista").innerHTML = orden.map(f => `<label class="mue-pasa-f"><input type="checkbox" data-pasa="${esc(f.id)}"${PASA.has(f.id) ? " checked" : ""}><span translate="no">${esc(f.nombre)}${f.lugar ? " · " + esc(f.lugar) : ""}</span></label>`).join("");
    }
    $("mue-pasa-n").textContent = !fichas.length ? "" : T("Vas a pasar {n} de {t} fichas.", { n: l.length, t: fichas.length });
    $("mue-exporta").hidden = $("mue-descarga-fotos").hidden = $("mue-foto-pista").hidden = !conF;
    const el = $("mue-tam");
    if (!l.length) { el.hidden = true; return; }
    const sin = Math.max(1, Math.round(new Blob([exporta(l)]).size / 1024)), nf = l.filter(f => FOTOS.has(f.id)).length;
    el.textContent = nf
      ? T("Tamaño del archivo: sin fotos, unos {s} KB; con fotos ({f}), hasta unos {c} KB.", { s: sin, f: nf, c: sin + nf * 40 })
      : T("Tamaño del archivo: unos {s} KB.", { s: sin });
    el.hidden = false;
  }
  $("mue-pasa-quien").addEventListener("click", (e) => { const b = e.target.closest("[data-pasa-todas]"); if (!b) return; pasaTodas = b.dataset.pasaTodas === "1"; pintaPasa(); });
  $("mue-pasa-lista").addEventListener("change", (e) => { const c = e.target.closest("[data-pasa]"); if (!c) return; c.checked ? PASA.add(c.dataset.pasa) : PASA.delete(c.dataset.pasa); pintaPasa(); });
  $("mue-pasa-todas").addEventListener("click", () => { fichas.forEach(f => PASA.add(f.id)); pintaPasa(); });
  $("mue-pasa-ninguna").addEventListener("click", () => { PASA.clear(); pintaPasa(); });
  // Lo que se va a pasar; si no hay nada, lo dice y devuelve null
  function aPasar() {
    if (!fichas.length) { aviso(T("Tu libreta está vacía."), true); return null; }
    const l = elegidas();
    if (!l.length) { aviso(T("No has elegido ninguna ficha. Marca las que quieras pasar."), true); return null; }
    return l;
  }
  function descarga(l, fo) {
    const conF = !!(fo && Object.keys(fo).length), ts = trozos(l, fo);
    if (!ts.every((t, i) => archivoBien(t, ts.length > 1 ? null : l))) { aviso(T("No se ha podido preparar bien el archivo. No se ha descargado nada: prueba otra vez."), true); return; }
    if (!puedeDescargar()) { aviso(T("Este navegador no deja descargar archivos. Prueba con «Compartir» o con «Copiar»."), true); return; }
    const nombres = ts.map((t, i) => { const n = nombreArchivo(conF, l.length); return ts.length > 1 ? n.replace(/\.txt$/, "-parte-" + (i + 1) + "-de-" + ts.length + ".txt") : n; });
    try {
      ts.forEach((t, i) => setTimeout(() => {
        const u = URL.createObjectURL(new Blob([t], { type: "text/plain" })), a = document.createElement("a");
        a.href = u; a.download = nombres[i]; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 30000);
      }, i * 700));
    } catch (e) { aviso(T("Este navegador no deja descargar archivos. Prueba con «Compartir» o con «Copiar»."), true); return; }
    const kbT = ts.reduce((s2, t) => s2 + kb(t), 0);
    if (ts.length > 1) aviso(T("Con las fotos es muy grande: se ha descargado en {p} partes ({n} KB en total). Mándale a tu compañero todas las partes como documento; él las elige todas a la vez en «Cargar archivo de libreta».", { p: ts.length, n: kbT }));
    else aviso(T("Descargado «{f}» ({n} KB). Lo tienes en la carpeta Descargas del móvil: desde ahí mándalo por WhatsApp, Telegram o correo como documento. Tu compañero lo guarda y pulsa «Cargar archivo de libreta».", { f: nombres[0], n: kbT }));
  }
  $("mue-exporta-sin").addEventListener("click", () => {
    const l = aPasar(); if (!l) return;
    copia(exporta(l), T("Copiado sin fotos. Pégalo en «Pasar fichas» del otro móvil."));
  });
  $("mue-exporta").addEventListener("click", () => {
    const l = aPasar(); if (!l) return;
    conFotos(l).then(fo => {
      const t = exporta(l, fo);
      copia(t, T("Copiado con las fotos ({n} KB). Pégalo en «Pasar fichas» del otro móvil.", { n: kb(t) }) + (t.length > 60000 ? " " + T("Si WhatsApp o Telegram no lo aceptan, usa «Descargar archivo» y manda el archivo.") : ""));
    });
  });
  $("mue-descarga").addEventListener("click", () => { const l = aPasar(); if (l) descarga(l, null); });
  $("mue-descarga-fotos").addEventListener("click", () => { const l = aPasar(); if (l) conFotos(l).then(fo => descarga(l, fo)); });
  $("mue-archivo").addEventListener("click", async () => {
    const l = aPasar(); if (!l) return;
    const t = exporta(l), nombre = nombreArchivo(false, l.length);
    let arch = null;
    try { arch = new File([t], nombre, { type: "text/plain" }); } catch (e) { /* navegador viejo */ }
    if (!(arch && navigator.canShare && navigator.canShare({ files: [arch] }))) { aviso(T("Este móvil no deja compartir archivos desde aquí. Usa «Descargar archivo» y mándalo desde la carpeta Descargas."), true); return; }
    try { await navigator.share({ files: [arch], title: T("Mi libreta de Accesos y muelles") }); aviso(T("Listo. Tu compañero lo guarda en el móvil y pulsa «Cargar archivo de libreta».")); }
    catch (e) { if (!e || e.name !== "AbortError") aviso(T("No se ha podido compartir. Usa «Descargar archivo» y mándalo desde la carpeta Descargas."), true); }
  });
  // ---------- Recibir (v202, arreglo urgente) ----------
  // Se acepta CUALQUIER archivo (sin «accept»: WhatsApp, Telegram o el correo pueden cambiarle el nombre o el tipo) y se
  // mira por dentro. Se lee como bytes: UTF-16 con BOM o UTF-8. Fotos, PDF y ZIP se reconocen y se dice qué pasa.
  const MAL_ARCHIVO = {
    vacio: "Ese archivo está vacío. Pide a tu compañero que te lo mande otra vez.",
    codigo: "Ese archivo no es una libreta de Accesos y muelles. Elige el archivo que se llama «libreta-muelles-…».",
    cortado: "El archivo llegó cortado y no se ha podido leer ninguna ficha. Pide a tu compañero que pulse «Descargar archivo» y te lo mande como documento (con el clip, «Documento»).",
    nada: "En ese archivo no hay ninguna ficha que se pueda leer.",
    foto: "Has elegido una foto, no la libreta. Elige el archivo que se llama «libreta-muelles-…».",
    pdf: "Has elegido un PDF, no la libreta. Elige el archivo que se llama «libreta-muelles-…».",
    zipvacio: "Dentro de ese archivo comprimido no hay ninguna libreta. Pide a tu compañero que te la mande otra vez como archivo, o que te la pegue como texto.",
    zipmal: "Ese archivo comprimido está estropeado y no se puede abrir. Pide a tu compañero que te lo mande otra vez como archivo.",
    zipsin: "No se ha podido abrir el archivo comprimido sin conexión. Conéctate a internet y vuelve a pulsar «Cargar archivo de libreta».",
    grande: "Ese archivo es demasiado grande para ser una libreta. Pide a tu compañero que te la mande sin fotos.",
    leer: "No se ha podido abrir el archivo. Si está en WhatsApp o Telegram, guárdalo antes en el móvil (Descargas) y vuelve a pulsar «Cargar archivo de libreta».",
  };
  const MAL_TEXTO = {
    vacio: "No has pegado nada. Mantén pulsado el cuadro y elige «Pegar».",
    codigo: "Ese texto no es una libreta ni una ficha de Accesos y muelles.",
    cortado: "El texto llegó cortado y no se ha podido leer ninguna ficha. Pide a tu compañero que pulse «Descargar archivo» y te lo mande como documento.",
    nada: "En ese texto no hay ninguna ficha que se pueda leer.",
  };
  const bytes = (a) => typeof a.arrayBuffer === "function" ? a.arrayBuffer()
    : new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(r.error); r.readAsArrayBuffer(a); });
  // v204 (arreglo urgente, lo vio el padre): lo que llega por WhatsApp puede venir comprimido (ZIP). Se abre aquí mismo con
  // lib/jszip.min.js (se carga solo al hacer falta) y se leen todos los archivos de dentro (también en subcarpetas y ZIP
  // dentro de ZIP, un nivel): los que sean libreta se cargan todos. El conductor no tiene que descomprimir nada.
  const ZIP_MAX = 60 * 1024 * 1024, DENTRO_MAX = 25 * 1024 * 1024;
  const esZip = (b) => b[0] === 0x50 && b[1] === 0x4B && (b[2] === 0x03 || b[2] === 0x05) && (b[3] === 0x04 || b[3] === 0x06);
  let zipLib = null;
  const cargaZip = () => window.JSZip ? Promise.resolve(window.JSZip) : (zipLib = zipLib || new Promise((ok, mal) => {
    const sc = document.createElement("script"); sc.src = "lib/jszip.min.js?v=" + encodeURIComponent(window.VERSION_WEB || "");
    sc.onload = () => window.JSZip ? ok(window.JSZip) : mal(new Error("sin JSZip"));
    sc.onerror = () => { zipLib = null; sc.remove(); mal(new Error("sin red")); };
    document.head.appendChild(sc);
  }));
  // Bytes → texto (UTF-16 con BOM o UTF-8); null si es una foto, un PDF o algo que no es texto
  function bytesATexto(b) {
    const empieza = (...x) => x.every((v, i) => b[i] === v);
    try {
      if (empieza(0xFF, 0xFE)) return new TextDecoder("utf-16le").decode(b.subarray(2));
      if (empieza(0xFE, 0xFF)) return new TextDecoder("utf-16be").decode(b.subarray(2));
      return new TextDecoder("utf-8").decode(b);
    } catch (e) { return null; }
  }
  async function abreZip(b, nivel) {
    let JSZip;
    try { JSZip = await cargaZip(); } catch (e) { return { error: "zipsin" }; }
    let z;
    try { z = await JSZip.loadAsync(b); } catch (e) { return { error: "zipmal" }; }
    const textos = [];
    let total = 0;
    for (const e of Object.values(z.files)) {
      if (e.dir || /(^|\/)(__MACOSX\/|\.)/.test(e.name)) continue;
      let d;
      try { d = await e.async("uint8array"); } catch (err) { continue; }
      total += d.length;
      if (d.length > DENTRO_MAX || total > ZIP_MAX) return { error: "grande" };
      if (esZip(d)) { if (nivel < 1) { const r = await abreZip(d, nivel + 1); if (r.textos) textos.push(...r.textos); } continue; }
      const t = bytesATexto(d);
      if (t && /CCOO-MUELLES:|\[\s*\{/i.test(t)) textos.push(t);
    }
    return textos.length ? { textos } : { error: "zipvacio" };
  }
  async function leeArchivo(a) {
    if (!a.size) return { error: "vacio" };
    if (a.size > ZIP_MAX) return { error: "grande" };
    let b;
    try { b = new Uint8Array(await bytes(a)); } catch (e) { return { error: "leer" }; }
    const empieza = (...x) => x.every((v, i) => b[i] === v);
    if (esZip(b)) return abreZip(b, 0);
    if (empieza(0xFF, 0xD8, 0xFF) || empieza(0x89, 0x50, 0x4E, 0x47) || (empieza(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57) || empieza(0x47, 0x49, 0x46) || /^image\//.test(a.type || "")) return { error: "foto" };
    if (empieza(0x25, 0x50, 0x44, 0x46)) return { error: "pdf" };
    if (b.length > 20 * 1024 * 1024) return { error: "grande" };
    const t = bytesATexto(b);
    return t == null ? { error: "leer" } : { textos: [t] };
  }
  // Mete lo leído en la libreta y SIEMPRE dice qué ha pasado
  // v205: si no ha llegado todo (cortado, o menos fichas de las que dice el archivo), se carga lo que vale y se dice
  function falta(r) {
    const menos = r.total > r.leidas;
    if (!r.cortado && !menos) return "";
    return " " + (menos ? T("Llegaron {n} de {t} fichas: el archivo llegó cortado o faltan partes.", { n: r.leidas, t: r.total }) : T("El archivo llegó cortado: faltan fichas."))
      + " " + T("Para el resto, pide a tu compañero que pulse «Descargar archivo» y te lo mande como documento (si son varias partes, elígelas todas a la vez).");
  }
  function mete(t, deArchivo) {
    const r = importaVarios(Array.isArray(t) ? t : [t]);
    if (r.error) { aviso(T((deArchivo ? MAL_ARCHIVO : MAL_TEXTO)[r.error] || MAL_TEXTO.codigo), true); return; }
    const fa = falta(r);
    if (!r.nuevas) {
      aviso((r.repes === 1 ? T("No había nada nuevo: ya tenías ese cliente.") : T("No había nada nuevo: ya tenías los {n} clientes.", { n: r.repes })) + fa, !!fa);
      if (r.fotos.length) guardaFotosPegadas(r.fotos).then(n => { if (n) { lista(); aviso(n === 1 ? T("Ya tenías ese cliente. Se ha añadido la foto que le faltaba.") : T("Ya tenías esos clientes. Se han añadido {n} fotos que te faltaban.", { n })); } });
      return;
    }
    const copiaL = fichas; fichas = r.lista;
    if (!guarda()) { fichas = copiaL; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    $("mue-texto").value = ""; chips(); lista();
    const msg = (r.nuevas === 1 ? T("Se ha añadido 1 cliente nuevo.") : T("Se han añadido {n} clientes nuevos.", { n: r.nuevas }))
      + " " + T("Salen marcados como «Recibida de un compañero»: revísalos.")
      + (r.repes ? " " + (r.repes === 1 ? T("1 ya lo tenías.") : T("{n} ya los tenías.", { n: r.repes })) : "")
      + (r.sobran ? " " + T("{n} no caben (máximo {t}).", { n: r.sobran, t: TOPE }) : "") + fa;
    avisoRec(msg);
    $("mue-msg").scrollIntoView({ block: "center", behavior: "smooth" });
    if (r.fotos.length) guardaFotosPegadas(r.fotos).then(n => { if (n) { lista(); avisoRec(msg + " " + (n === 1 ? T("Con su foto.") : T("Con {n} fotos.", { n }))); } });
  }
  // Varios textos (los archivos de un ZIP): se cargan uno detrás de otro y se suman; si ninguno vale, el primer motivo.
  function importaVarios(textos) {
    let base = fichas, error = null;
    const r = { nuevas: 0, repes: 0, sobran: 0, fotos: [], leidas: 0, total: 0, cortado: false };
    for (const t of textos) {
      const x = importa(t, base);
      if (x.error) { error = error || x.error; if (x.error === "cortado") r.cortado = true; continue; }
      base = x.lista; r.nuevas += x.nuevas; r.repes += x.repes; r.sobran += x.sobran; r.fotos.push(...x.fotos); r.vale = true;
      r.leidas += x.leidas; r.total = Math.max(r.total, x.total); if (x.cortado) r.cortado = true;
    }
    return r.vale ? Object.assign(r, { lista: base }) : { error: error || "codigo" };
  }
  // Aviso de lo recibido con el botón «Ver las recibidas» (filtra la lista para revisarlas o borrarlas)
  function avisoRec(msg) {
    aviso(msg);
    $("mue-msg").insertAdjacentHTML("beforeend", ` <button type="button" class="btn sec mue-ver-rec" id="mue-ver-rec">${esc(T("Ver las recibidas"))}</button>`);
  }
  $("mue-abre-archivo").addEventListener("click", () => $("mue-archivo-in").click());
  $("mue-archivo-in").addEventListener("change", () => {
    // v205: se pueden elegir varios archivos a la vez (las partes de una libreta grande): se cargan todos juntos
    const as = Array.from($("mue-archivo-in").files || []).slice(0, 20);
    $("mue-archivo-in").value = "";
    if (!as.length) return;
    aviso(T("Leyendo el archivo…"));
    Promise.all(as.map(a => leeArchivo(a).catch(() => ({ error: "leer" })))).then(rs => {
      const textos = [].concat(...rs.filter(r => r.textos).map(r => r.textos));
      if (!textos.length) { const e = rs.find(r => r.error) || {}; aviso(T(MAL_ARCHIVO[e.error] || MAL_ARCHIVO.leer), true); return; }
      mete(textos, true);
    }).catch(() => aviso(T(MAL_ARCHIVO.leer), true));
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
    if (e.target.closest("#mue-ver-rec")) { filtro = "rec"; $("mue-q").value = ""; chips(); lista(); $("mue-niveles").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (!e.target.closest("#mue-deshacer")) return;
    let c = null;
    try { c = JSON.parse(localStorage.getItem(KEY_COPIA) || "null"); } catch (e2) { /* sin copia */ }
    if (!c || !Array.isArray(c.fichas)) { aviso(T("No se ha podido deshacer."), true); return; }
    const copiaL = fichas; fichas = c.fichas.map(limpia).filter(Boolean);
    if (!guarda()) { fichas = copiaL; aviso(T("No se ha podido guardar en este móvil. Mira si el navegador está en modo privado o sin espacio."), true); return; }
    chips(); lista(); aviso(T("Hecho: vuelven a estar todas."));
  });
  $("mue-importa").addEventListener("click", () => mete($("mue-texto").value, false));
})();
