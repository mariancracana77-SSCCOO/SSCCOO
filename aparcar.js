// «Aparcamientos en mi ruta» (Zona Conductores, vista #aparcar). Lo pidió el padre para usarlo durante el trayecto:
// los aparcamientos de camiones que hay POR DELANTE en tu ruta y los abiertos a la hora a la que llegas.
// Solo información, sin navegador (el padre ya usa uno de pago). El conductor decide dónde para.
// v90: sin gratis/de pago (los datos de precio de OpenStreetMap fallaban y al padre no le servía); lo que importa son las
// plazas para camiones. Se buscan hasta a 3 km de la ruta.
// v90: el padre no quiere avisos de compañeros (nadie los pondría): solo información para consultar. Al calcular la ruta, lo primero son los CERRADOS.
// (La tabla avisos_aparcamiento y la RPC avisar_aparcamiento quedan en Supabase sin usar.)
// - Ruta para camión (alto, ancho, largo, peso, ADR): función «ruta» (Valhalla de OpenStreetMap, sin claves; no guarda nada).
// - Aparcamientos: tabla «aparcamientos» (OpenStreetMap, se renueva sola cada mes). Se baja por países enteros y se busca
//   en el móvil: la ubicación no sale del móvil mientras conduces. Sin conexión, usa la última lista guardada.
// - Modo «sin destino»: los que hay delante en la dirección en la que vas.
(() => {
  const $ = (id) => document.getElementById(id);
  if (!$("v-aparcar")) return;
  const CLAVE = "ccoo-aparcar", CAJA = "ccoo-aparcamientos";
  const DEF = () => ({ camion: { alto: "4", ancho: "2,55", largo: "16,5", peso: "40", adr: false }, voz: false, cerrados: false, desde: "", hasta: "", cpDesde: "", cpHasta: "", vista: "lista" });
  const lee = () => { try { const d = JSON.parse(localStorage.getItem(CLAVE) || "null") || {}; return { ...DEF(), ...d, camion: { ...DEF().camion, ...(d.camion || {}) } }; } catch (_) { return DEF(); } };
  let AJ = lee();
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(AJ)); } catch (_) {} };

  // ---------- Mis aparcamientos (v106, lo pidió el padre) ----------
  // El conductor añade en el mapa los aparcamientos que encuentra. Se guardan en este móvil («ccoo-aparcar-mios») y, si quiere,
  // se proponen a la sección (RPC anónima proponer_aparcamiento). Desde la v111 salen a todos enseguida (estado «aprobado»); el padre puede quitarlos en el panel (tabla aparcamientos_compas).
  const CLAVE_MIOS = "ccoo-aparcar-mios";
  let MIOS = (() => { try { const l = JSON.parse(localStorage.getItem(CLAVE_MIOS) || "[]"); return Array.isArray(l) ? l.filter(x => x && x.id && Number.isFinite(+x.lat) && Number.isFinite(+x.lon)) : []; } catch (_) { return []; } })();
  const guardaMios = () => { try { localStorage.setItem(CLAVE_MIOS, JSON.stringify(MIOS)); } catch (_) {} };
  let COMPAS = null;
  async function cargaCompas() {
    if (COMPAS) return COMPAS;
    try {
      const { data, error } = await sb.from("aparcamientos_compas").select("id,lat,lon,nombre,nota,plazas,vigilado,duchas,aseos").eq("estado", "aprobado").limit(5000);
      if (error) throw error;
      COMPAS = data || [];
      try { localStorage.setItem("ccoo-aparcar-compas", JSON.stringify(COMPAS)); } catch (_) {}
    } catch (_) { try { COMPAS = JSON.parse(localStorage.getItem("ccoo-aparcar-compas") || "[]"); } catch (_) { COMPAS = []; } }
    return COMPAS;
  }
  const comoApc = (x, extra) => ({ lat: +x.lat, lon: +x.lon, nombre: x.nombre, nota: x.nota || "", plazas: +x.plazas > 0 ? +x.plazas : null, vigilado: !!x.vigilado, duchas: !!x.duchas, aseos: !!x.aseos, horario: null, area: false, camion: true, cerca: null, ...extra });
  const cercaDe = (a, b) => Math.abs(a.lat - b.lat) < 0.0006 && Math.abs(a.lon - b.lon) < 0.0009; // unos 60 m
  async function extras() {
    const co = (await cargaCompas()).filter(c => !MIOS.some(m => cercaDe(m, c)));
    return [...MIOS.map(x => comoApc(x, { osm: x.id, mio: true })), ...co.map(c => comoApc(c, { osm: "co:" + c.id, compa: true }))];
  }

  // ---------- Horario (opening_hours de OpenStreetMap, lo más corriente) ----------
  // true abierto, false cerrado, null no se sabe
  const DIA = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };
  function diasDe(txt) {
    const r = new Set();
    for (const parte of txt.split(",")) {
      const m = parte.trim().match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?$/);
      if (!m) return null;
      const a = DIA[m[1]], b = m[2] ? DIA[m[2]] : a;
      for (let i = a, n = 0; n < 7; i = (i + 1) % 7, n++) { r.add(i); if (i === b) break; }
    }
    return r;
  }
  function abierto(h, cuando = new Date()) {
    if (!h) return null;
    const s = h.trim();
    if (s === "24/7") return true;
    const dia = cuando.getDay(), min = cuando.getHours() * 60 + cuando.getMinutes();
    let res = null, entendido = false;
    for (const regla of s.split(";")) {
      const r = regla.trim();
      if (!r || /^PH\b/.test(r)) continue;
      const m = r.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:\s*,\s*(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)?\s*(.*)$/);
      const dias = m && m[1] ? diasDe(m[1].replace(/\s/g, "")) : new Set([0, 1, 2, 3, 4, 5, 6]);
      if (!m || !dias) return null;
      const resto = m[2].trim();
      entendido = true;
      if (!dias.has(dia)) continue;
      if (/^(off|closed)$/i.test(resto)) { res = false; continue; }
      if (resto === "24/7" || resto === "00:00-24:00") { res = true; continue; }
      let dentro = false;
      for (const t of resto.split(",")) {
        const x = t.trim().match(/^(\d{1,2}):(\d\d)-(\d{1,2}):(\d\d)$/);
        if (!x) return null;
        const a = +x[1] * 60 + +x[2], b = +x[3] * 60 + +x[4];
        if (b > a ? min >= a && min < b : min >= a || min < b) dentro = true;
      }
      res = dentro;
    }
    return entendido ? res ?? false : null;
  }
  // Estado a la hora de llegar: «si», «no», «siempre» (área de autopista sin horario) o «nose»
  // Avisos de los compañeros: el último de cada aparcamiento que siga valiendo (cerrado 12 h, lleno 3 h, abierto 12 h)
  const VALE_H = { cerrado: 12, lleno: 3, abierto: 12 };
  let AVISOS = {};
  const avisoDe = (x) => { const v = AVISOS[x.osm]; return v && Date.now() - v.t < VALE_H[v.tipo] * 36e5 ? v : null; };
  async function cargaAvisos() {
    try {
      const { data, error } = await sb.from("avisos_aparcamiento").select("osm,tipo,cuando").order("cuando", { ascending: false }).limit(1000);
      if (error || !Array.isArray(data)) return;
      const m = {};
      for (const r of data) if (!m[r.osm]) m[r.osm] = { tipo: r.tipo, t: Date.parse(r.cuando) };
      AVISOS = m;
    } catch (_) { /* sin conexión: los de antes */ }
  }
  const haceTxt = (t) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`; };
  const estadoA = (x, cuando) => {
    const av = avisoDe(x);
    if (av?.tipo === "cerrado") return "no";
    if (av?.tipo === "abierto") return "si";
    const a = abierto(x.horario, cuando); if (a === true) return "si"; if (a === false) return "no"; return x.area && !x.horario ? "siempre" : "nose";
  };

  // Precio legible: «2 EUR/hour» → «2 €/hora»
  const precioTxt = (c) => String(c || "").replace(/\s*(EUR|eur|euros?)\b/g, " €").replace(/€\s*(\d)/g, "$1 €")
    .replace(/\/\s*(hour|h)\b/gi, "/hora").replace(/\/\s*(day|24h|24 h)\b/gi, "/día").replace(/\/\s*night\b/gi, "/noche").replace(/\s+/g, " ").trim();

  // ---------- Aparcamientos por países (caja del móvil para usarlo sin cobertura) ----------
  const PAISES = { ES: [35.9, 43.9, -9.4, 4.4], FR: [41.3, 51.2, -5.2, 9.6], IT: [36.6, 47.1, 6.6, 18.6], PT: [36.9, 42.2, -9.6, -6.1], AD: [42.4, 42.7, 1.4, 1.8],
    DE: [47.2, 55.1, 5.8, 15.1], CH: [45.8, 47.9, 5.9, 10.5], BE: [49.5, 51.6, 2.5, 6.4], NL: [50.7, 53.6, 3.3, 7.3], LU: [49.4, 50.2, 5.7, 6.6], AT: [46.3, 49.1, 9.5, 17.2], GB: [49.9, 60.9, -8.7, 1.8] };
  const paisesDe = (puntos) => Object.keys(PAISES).filter(p => { const [a, b, c, d] = PAISES[p]; return puntos.some(([la, lo]) => la >= a - 0.2 && la <= b + 0.2 && lo >= c - 0.2 && lo <= d + 0.2); });
  const MEM = {};
  async function delPais(p) {
    if (MEM[p]) return MEM[p];
    let caja = null; try { caja = await caches.open(CAJA); } catch (_) {}
    const clave = location.origin + "/__aparcamientos2/" + p; // «2»: desde la v90 trae «cerca»
    const guardado = caja ? await caja.match(clave).then(r => r && r.json()).catch(() => null) : null;
    if (guardado && Date.now() - guardado.t < 7 * 864e5 && Array.isArray(guardado.l)) return (MEM[p] = guardado.l);
    try {
      const l = [];
      for (let i = 0; i < 40000; i += 1000) {
        const { data, error } = await sb.from("aparcamientos").select("osm,lat,lon,nombre,horario,vigilado,duchas,aseos,plazas,area,camion,cerca").eq("pais", p).order("osm").range(i, i + 999);
        if (error) throw error;
        l.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      if (caja && l.length) try { await caja.put(clave, new Response(JSON.stringify({ t: Date.now(), l }), { headers: { "Content-Type": "application/json" } })); } catch (_) {}
      return (MEM[p] = l.length ? l : guardado?.l || []);
    } catch (_) { return (MEM[p] = guardado?.l || []); }
  }
  async function cargaPaises(ps) { const ls = await Promise.all(ps.map(delPais)); const vistos = new Set(); const [corr, ops] = await Promise.all([cargaCorrecciones(), cargaOpiniones()]); return aplicaOpiniones(aplicaCorrecciones([...ls.flatMap((l, i) => l.map(x => ({ ...x, pais: ps[i] }))).filter(x => !vistos.has(x.osm) && vistos.add(x.osm)), ...(await extras())], corr), ops); }

  // ---------- Avisos de aparcamientos que están mal (v108, lo pidió el padre) ----------
  // Cualquiera avisa (RPC anónima corregir_aparcamiento); el padre lo revisa en el panel y, si lo pone en «Aplicado», se cumple en todos los móviles:
  // «ya no existe» o «no se puede con camión» lo quitan, «otras plazas» cambia las plazas y «otra cosa» sale como aviso de la sección en la tarjeta.
  let CORRECCIONES = null;
  async function cargaCorrecciones() {
    if (CORRECCIONES) return CORRECCIONES;
    try {
      const { data, error } = await sb.from("aparcamientos_correcciones").select("osm,tipo,plazas,nota").eq("estado", "aplicado").limit(5000);
      if (error) throw error;
      CORRECCIONES = data || [];
      try { localStorage.setItem("ccoo-aparcar-correcciones", JSON.stringify(CORRECCIONES)); } catch (_) {}
    } catch (_) { try { CORRECCIONES = JSON.parse(localStorage.getItem("ccoo-aparcar-correcciones") || "[]"); } catch (_) { CORRECCIONES = []; } }
    return CORRECCIONES;
  }
  function aplicaCorrecciones(lista, corr) {
    if (!corr.length) return lista;
    const por = new Map(); corr.forEach(c => { if (!por.has(c.osm)) por.set(c.osm, []); por.get(c.osm).push(c); });
    const res = [];
    for (const x of lista) {
      const cs = por.get(x.osm); if (!cs) { res.push(x); continue; }
      if (cs.some(c => c.tipo === "no_existe" || c.tipo === "no_camiones")) continue;
      const y = { ...x }, pl = cs.find(c => c.tipo === "plazas");
      if (pl) y.plazas = +pl.plazas > 0 ? +pl.plazas : null;
      const notas = cs.filter(c => c.tipo === "otro" && c.nota).map(c => c.nota);
      if (notas.length) y.avisoSec = notas.join(" · ");
      res.push(y);
    }
    return res;
  }

  // ---------- Opiniones de los compañeros (v111, lo pidió el padre) ----------
  // Cualquiera confirma un aparcamiento («Lo confirmo») o dice qué tiene (aseos, duchas, vigilado, bar). RPC anónima opinar_aparcamiento →
  // tabla aparcamientos_opiniones; la web lee los recuentos con la RPC opiniones_aparcamientos (último año). Manda la mayoría: más «sí» que «no» lo pone, al revés lo quita.
  // Lo que ha dicho este móvil va en «ccoo-aparcar-opino» ({osm: {c: ms de la confirmación, s: {servicio: true/false}}}).
  const SERVICIOS = [["aseos", "Aseos"], ["duchas", "Duchas"], ["vigilado", "Vigilado"], ["comida", "Bar o restaurante"]];
  const CLAVE_OPINO = "ccoo-aparcar-opino";
  const OPINO = (() => { try { const o = JSON.parse(localStorage.getItem(CLAVE_OPINO) || "{}"); return o && typeof o === "object" ? o : {}; } catch (_) { return {}; } })();
  const guardaOpino = () => { try { localStorage.setItem(CLAVE_OPINO, JSON.stringify(OPINO)); } catch (_) {} };
  const yaConfirmado = (osm) => Date.now() - (+OPINO[osm]?.c || 0) < 30 * 864e5;
  let OPINIONES = null;
  async function cargaOpiniones() {
    if (OPINIONES) return OPINIONES;
    try {
      const { data, error } = await sb.rpc("opiniones_aparcamientos2"); // v113: con las plazas (la de antes sigue para la web publicada)
      if (error) throw error;
      OPINIONES = Array.isArray(data) ? data : [];
      try { localStorage.setItem("ccoo-aparcar-opiniones", JSON.stringify(OPINIONES)); } catch (_) {}
    } catch (_) { try { OPINIONES = JSON.parse(localStorage.getItem("ccoo-aparcar-opiniones") || "[]"); } catch (_) { OPINIONES = []; } }
    return OPINIONES;
  }
  function aplicaOpiniones(lista, ops) {
    if (!ops.length) return lista;
    const por = new Map(ops.map(o => [o.osm, o]));
    return lista.map(x => {
      const o = por.get(x.osm); if (!o) return x;
      const y = { ...x, confirman: +o.confirman || 0, confUlt: o.ultima || "" };
      for (const [k] of SERVICIOS) { const si = +o[k + "_si"] || 0, no = +o[k + "_no"] || 0; if (si > no) y[k] = true; else if (no > si) y[k] = false; }
      // v113 (lo pidió el padre): «Solo aparcamiento» si la mayoría dice que no tiene nada; plazas: la mediana de lo que dicen los compañeros
      y.soloAparc = SERVICIOS.every(([k]) => (+o[k + "_no"] || 0) > (+o[k + "_si"] || 0));
      if (+o.plazas_n > 0 && o.plazas != null) { y.plazas = +o.plazas > 0 ? +o.plazas : null; y.plazasCompas = +o.plazas_n; }
      return y;
    });
  }
  const confirmaTxt = (x) => {
    if (!(x.confirman > 0)) return "";
    const d = x.confUlt ? Math.round((Date.now() - new Date(x.confUlt + "T12:00:00")) / 864e5) : null;
    const cuando = d == null ? "" : d <= 0 ? " · el último, hoy" : d === 1 ? " · el último, ayer" : ` · el último, hace ${d} días`;
    return `Lo ${x.confirman === 1 ? "confirma 1 compañero" : `confirman ${x.confirman} compañeros`}${cuando}`;
  };

  // ---------- Geometría ----------
  const R = Math.PI / 180;
  const km = (a1, o1, a2, o2) => { const x = Math.sin((a2 - a1) * R / 2) ** 2 + Math.cos(a1 * R) * Math.cos(a2 * R) * Math.sin((o2 - o1) * R / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const rumbo = (a1, o1, a2, o2) => { const y = Math.sin((o2 - o1) * R) * Math.cos(a2 * R), x = Math.cos(a1 * R) * Math.sin(a2 * R) - Math.sin(a1 * R) * Math.cos(a2 * R) * Math.cos((o2 - o1) * R); return (Math.atan2(y, x) / R + 360) % 360; };
  // Para cada aparcamiento, el punto de la ruta más cercano (los puntos van cada ~1,5 km). Hasta 3 km de la ruta (lo pidió el padre: más distancia)
  const ANCHO_RUTA = 3;
  // Lado de la ruta: el tramo más cercano de «fina» (la ruta a ~8 m) y a qué lado queda el aparcamiento (producto vectorial)
  function ladoDe(x, fina) {
    const k = Math.cos(x.lat * R) * 111.32, m = 110.54; let mejor = 1e9, cruz = 0;
    for (let i = 0; i < fina.length - 1; i++) {
      const [a1, o1] = fina[i], [a2, o2] = fina[i + 1];
      if (Math.min(a1, a2) > x.lat + 0.02 || Math.max(a1, a2) < x.lat - 0.02 || Math.min(o1, o2) > x.lon + 0.03 || Math.max(o1, o2) < x.lon - 0.03) continue;
      const dx = (o2 - o1) * k, dy = (a2 - a1) * m, px = (x.lon - o1) * k, py = (x.lat - a1) * m, l2 = dx * dx + dy * dy;
      const t = l2 ? Math.max(0, Math.min(1, (px * dx + py * dy) / l2)) : 0, d = Math.hypot(px - t * dx, py - t * dy);
      if (d < mejor) { mejor = d; cruz = dx * py - dy * px; }
    }
    return { d: mejor, izq: cruz > 0 };
  }
  // ¿Está en el otro sentido de la autopista? (lo pidió el padre: «no me sirve uno al que solo llego dando la vuelta»)
  // Solo en autopista y si está pegado a ella (≤ 350 m): más lejos se llega por una salida desde los dos sentidos.
  // Si está casi encima (< 25 m, p. ej. un área que da a los dos lados) se deja. En Reino Unido e Irlanda se conduce por la izquierda.
  function otroSentido(x, ruta, kmR) {
    if (!ruta.fina || !ruta.autopista?.some(([a, z]) => kmR >= a - 0.5 && kmR <= z + 0.5)) return false;
    const l = ladoDe(x, ruta.fina);
    if (l.d > 0.35 || l.d < 0.025) return false;
    return l.izq !== (x.pais === "GB" || x.pais === "IE");
  }
  function enRuta(lista, puntos, ruta) {
    const res = []; let contrario = 0;
    const caja = puntos.reduce((b, [la, lo]) => [Math.min(b[0], la), Math.max(b[1], la), Math.min(b[2], lo), Math.max(b[3], lo)], [90, -90, 180, -180]);
    for (const x of lista) {
      if (x.lat < caja[0] - 0.05 || x.lat > caja[1] + 0.05 || x.lon < caja[2] - 0.07 || x.lon > caja[3] + 0.07) continue;
      let mejor = 1e9, idx = -1;
      for (let i = 0; i < puntos.length; i++) { const d = km(x.lat, x.lon, puntos[i][0], puntos[i][1]); if (d < mejor) { mejor = d; idx = i; } }
      if (mejor > ANCHO_RUTA) continue;
      if (ruta && otroSentido(x, ruta, puntos[idx][2])) { contrario++; continue; }
      res.push({ ...x, desvio: mejor, kmRuta: puntos[idx][2], minRuta: puntos[idx][3] });
    }
    res.contrario = contrario;
    return res.sort((a, b) => a.kmRuta - b.kmRuta);
  }

  // ---------- Estado del viaje ----------
  let FILTRO = "todos", SALIDA = "", PINTADO = 0; // lista de toda la ruta: abiertos / cerrados / todos, y hora de salida (vacía = ahora)
  let RUTA = null, EN_RUTA = [], VIAJE = null, VIGIA = null, CANDADO = null, ULT_VOZ = "", CERCA = [], ANTES = null;
  const estado = (t, err) => { const m = $("apc-estado"); m.textContent = t || ""; m.classList.toggle("err", !!err); };
  const hora = (d) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const kmTxt = (n) => n < 10 ? n.toFixed(1).replace(".", ",") : String(Math.round(n));
  const durTxt = (m) => { const h = Math.floor(m / 60), mm = Math.round(m % 60); return h ? `${h} h${mm ? " " + mm + " min" : ""}` : `${mm} min`; };
  // Nombre: el de OpenStreetMap; si no tiene, el oficial (Alemania); si tampoco, «Área en la AP-7, cerca de La Jonquera» (lo pidió el padre)
  const viaEnKm = (k) => { if (!RUTA?.tramos || k == null) return ""; let ac = 0; for (const t of RUTA.tramos) { ac += t.km; if (k <= ac + 0.5) return t.via || ""; } return ""; };
  const nombre = (x) => {
    if (x.nombre) return x.nombre;
    const via = x.kmRuta != null ? viaEnKm(x.kmRuta) : "";
    return (x.area ? "Área" : "Aparcamiento de camiones") + (via ? " en la " + via : "") + (x.cerca ? ", cerca de " + x.cerca : "");
  };

  // Plazas para camiones: lo más importante para el padre (capacity:hgv de OpenStreetMap)
  const plazasHTML = (x) => x.plazas ? `<span class="apc-plazas"${x.plazasCompas ? ` title="Según ${x.plazasCompas === 1 ? "1 compañero" : x.plazasCompas + " compañeros"}"` : ""}><b>${x.plazas}</b> ${x.plazas === 1 ? "plaza" : "plazas"} camión</span>` : `<span class="apc-plazas nose">Plazas sin apuntar</span>`;
  function abreHTML(x, cuando) {
    const av = avisoDe(x);
    if (av?.tipo === "cerrado") return `<span class="apc-abre no">Cerrado</span> <span class="apc-aviso-comp">avisado por un compañero ${haceTxt(av.t)}</span>`;
    if (av?.tipo === "abierto") return `<span class="apc-abre si">Abierto</span> <span class="apc-aviso-comp">avisado por un compañero ${haceTxt(av.t)}</span>`;
    const e = estadoA(x, cuando);
    if (e === "si") return `<span class="apc-abre si">Abierto cuando llegues</span>`;
    if (e === "no") return `<span class="apc-abre no">Cerrado cuando llegues</span>${x.horario ? ` <small>${esc(x.horario)}</small>` : ""}`;
    if (e === "siempre") return `<span class="apc-abre si">Área de autopista: abierta siempre</span>`;
    return `<small>Horario sin apuntar</small>`;
  }
  // «Llevarme aquí» (lo pidió el padre): abre SU navegador del móvil (iGO u otro) con el aparcamiento de destino.
  // Android: enlace geo: (el móvil pregunta con qué aplicación); iPhone: el mapa de Apple. Sin Google. Se monta solo con números y el nombre codificado.
  const ES_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  function llevarHref(x) {
    const la = (+x.lat).toFixed(6), lo = (+x.lon).toFixed(6);
    if (!Number.isFinite(+la) || !Number.isFinite(+lo)) return "";
    return ES_IOS ? `https://maps.apple.com/?daddr=${la},${lo}&dirflg=d` : `geo:${la},${lo}?q=${la},${lo}(${encodeURIComponent(nombre(x))})`;
  }
  function tarjeta(x, faltaKm, llegada) {
    const extras = [x.soloAparc ? "Solo aparcamiento" : "", x.camion ? "Para camiones" : "", x.vigilado ? "Vigilado" : "", x.duchas ? "Duchas" : "", x.aseos ? "Aseos" : "", x.comida ? "Bar o restaurante" : "", x.desvio > 0.6 ? `A ${kmTxt(x.desvio)} km de la ruta` : ""].filter(Boolean);
    return `<li class="apc${estadoA(x, llegada) === "no" ? " cerrado" : ""}">
      <div class="apc-cab"><span class="apc-dist">a ${kmTxt(faltaKm)} km${llegada ? ` · llegas ${hora(llegada)}` : ""}</span>${plazasHTML(x)}</div>
      <b class="apc-nom">${esc(nombre(x))}</b>
      ${x.mio ? `<div class="apc-mio-etq">${esc(MIO_TXT[MIOS.find(m => m.id === x.osm)?.propuesto] || MIO_TXT[""])}</div>` : x.compa ? `<div class="apc-mio-etq compa">Lo añadió un compañero</div>` : ""}
      <div class="apc-hor">${abreHTML(x, llegada || new Date())}</div>
      ${x.nota ? `<p class="apc-nota-c">${esc(x.nota)}</p>` : ""}
      ${x.avisoSec ? `<p class="apc-aviso-sec"><b>Aviso de la sección:</b> ${esc(x.avisoSec)}</p>` : ""}
      ${avisoDe(x)?.tipo === "lleno" ? `<div class="apc-lleno">Lleno · avisado por un compañero ${haceTxt(avisoDe(x).t)}</div>` : ""}
      ${extras.length ? `<div class="apc-extra">${extras.map(e => `<span>${esc(e)}</span>`).join("")}</div>` : ""}
      ${confirmaTxt(x) ? `<div class="apc-confirma">${icono("check", "p")}${esc(confirmaTxt(x))}</div>` : ""}
      ${llevarHref(x) ? `<a class="btn sec apc-llevar" href="${esc(llevarHref(x))}">${icono("lugar", "p")}Llevarme aquí</a>` : ""}
      ${x.mio ? accionesMio(x.osm) : (VISTOS.set(x.osm, x), `<div class="apc-opina"><button type="button" class="btn sec${yaConfirmado(x.osm) ? " apc-conf-ya" : ""}" data-confirma="${esc(x.osm)}">${yaConfirmado(x.osm) ? `${icono("check", "p")}Lo has confirmado · quitar` : "Lo confirmo: está bien"}</button><button type="button" class="btn sec" data-servicios="${esc(x.osm)}">Decir qué tiene</button></div><button type="button" class="btn-txt apc-mal" data-mal="${esc(x.osm)}">¿Algo está mal en este aparcamiento?</button>`)}
    </li>`;
  }

  // ---------- Formulario ----------
  function pintaFormulario() {
    const c = AJ.camion;
    $("apc-desde").value = AJ.desde; $("apc-hasta").value = AJ.hasta; $("apc-desde-cp").value = AJ.cpDesde; $("apc-hasta-cp").value = AJ.cpHasta;
    $("apc-alto").value = c.alto; $("apc-ancho").value = c.ancho; $("apc-largo").value = c.largo; $("apc-peso").value = c.peso; $("apc-adr").checked = !!c.adr;
    $("apc-voz").checked = !!AJ.voz; $("apc-cerrados").checked = !!AJ.cerrados;
  }
  function leeFormulario() {
    AJ.desde = $("apc-desde").value.trim(); AJ.hasta = $("apc-hasta").value.trim(); AJ.cpDesde = $("apc-desde-cp").value.trim(); AJ.cpHasta = $("apc-hasta-cp").value.trim();
    AJ.camion = { alto: $("apc-alto").value.trim(), ancho: $("apc-ancho").value.trim(), largo: $("apc-largo").value.trim(), peso: $("apc-peso").value.trim(), adr: $("apc-adr").checked };
    guarda();
  }
  const posicion = () => new Promise((ok, mal) => {
    if (!("geolocation" in navigator)) return mal(new Error("Este móvil no deja saber dónde estás."));
    navigator.geolocation.getCurrentPosition(p => ok({ lat: p.coords.latitude, lon: p.coords.longitude }),
      e => mal(new Error(e.code === 1 ? "No has dado permiso para saber dónde estás. Escribe el sitio de salida o da permiso de ubicación a la app." : "No se ha podido saber dónde estás. Escribe el sitio de salida.")),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 });
  });

  async function buscaRuta() {
    leeFormulario();
    if (!AJ.hasta && !AJ.cpHasta) { estado("Escribe adónde vas.", true); $("apc-hasta").focus(); return; }
    $("apc-elegir").innerHTML = "";
    $("apc-buscar").disabled = true; estado("Calculando la ruta para tu camión…");
    try {
      const desde = ELEGIDO.desde || ((AJ.desde || AJ.cpDesde) ? AJ.desde : await posicion().then(p => ({ ...p, nombre: "Tu ubicación" })));
      const { data, error } = await sb.functions.invoke("ruta", { body: { desde, hasta: ELEGIDO.hasta || AJ.hasta, cp_desde: AJ.cpDesde, cp_hasta: AJ.cpHasta, camion: AJ.camion, elegir: true } });
      if (data?.elegir) { estado(""); pintaElegir(data.elegir); return; }
      if (error || !data || data.error) throw new Error(data?.error || "No se ha podido calcular la ruta. Comprueba que tienes internet.");
      // La principal y hasta 2 alternativas (lo pidió el padre: «como cualquier navegador»)
      RUTAS = [data, ...(data.alternativas || []).map(a => ({ ...a, desde: data.desde, hasta: data.hasta, camion: data.camion }))];
      await eligeRuta(0);
      $("apc-ruta").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) { estado(e.message || String(e), true); }
    finally { $("apc-buscar").disabled = false; }
  }

  // Varios pueblos con el mismo nombre (lo pidió el padre: con el código postal sale el exacto; si no, se pregunta)
  let ELEGIDO = { desde: null, hasta: null };
  function pintaElegir(e) {
    const caja = $("apc-elegir"), lados = [["desde", "salida"], ["hasta", "destino"]].filter(([k]) => e[k]?.length);
    caja.innerHTML = lados.map(([k, txt]) => `<div class="apc-elegir" data-lado="${k}"><h3>Hay varios sitios con ese nombre. ¿Cuál es el de ${txt}?</h3>
      ${e[k].map((x, i) => `<button type="button" class="btn sec" data-i="${i}"><b>${esc(x.nombre)}</b><small>${esc(x.detalle || "")}</small></button>`).join("")}
      <p class="apc-nota">Si no está, escribe el código postal arriba.</p></div>`).join("");
    caja.querySelectorAll(".apc-elegir").forEach(d => d.querySelectorAll("button").forEach(b => b.onclick = () => {
      const x = e[d.dataset.lado][+b.dataset.i];
      ELEGIDO[d.dataset.lado] = { lat: x.lat, lon: x.lon, nombre: [x.nombre, x.cp].filter(Boolean).join(" · ") };
      d.remove();
      if (!caja.querySelector(".apc-elegir")) buscaRuta();
    }));
    caja.querySelector("button")?.focus();
  }

  let RUTAS = [];
  async function eligeRuta(i) {
    RUTA = RUTAS[i] || RUTAS[0];
    estado("Buscando aparcamientos en la ruta…");
    const [lista, oficiales] = await Promise.all([cargaPaises(paisesDe(RUTA.puntos)), cargaOficiales(RUTA)]);
    EN_RUTA = enRuta(juntaOficiales(lista, oficiales), RUTA.puntos, RUTA);
    CORTES = await cargaCortes(RUTA);
    // Peajes aproximados de todas las rutas (para compararlas), con el país de cada tramo
    const tabla = await cargaPeajes(), indice = indicePaises(lista);
    for (const r of RUTAS) r.costes = calculaPeajes(r, indice, tabla);
    RUTA.tramosPais = tramosPais(RUTA, indice);
    PROHIB = await cargaProhibiciones();
    estado("");
    pintaRuta();
    guardaUltima();
  }

  // ---------- Última ruta guardada en el móvil (v108, lo pidió el padre: para usarla sin cobertura) ----------
  const CLAVE_RUTA = "ccoo-aparcar-ruta";
  function guardaUltima() {
    if (!RUTA) return;
    const { costes, tramosPais, alternativas, ...r } = RUTA;
    try { localStorage.setItem(CLAVE_RUTA, JSON.stringify({ t: Date.now(), r })); } catch (_) { try { localStorage.setItem(CLAVE_RUTA, JSON.stringify({ t: Date.now(), r: { ...r, fina: null } })); } catch (_) {} }
    pintaUltima();
  }
  const leeUltima = () => { try { const u = JSON.parse(localStorage.getItem(CLAVE_RUTA) || "null"); return u?.r?.puntos?.length ? u : null; } catch (_) { return null; } };
  function pintaUltima() {
    const b = $("apc-ultima"), u = leeUltima(); if (!b) return;
    b.hidden = !u; if (!u) return;
    b.innerHTML = `Abrir la última ruta: <b>${esc(u.r.desde?.nombre || "")} → ${esc(u.r.hasta?.nombre || "")}</b><small>Calculada el ${esc(new Date(u.t).toLocaleString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}. Sirve aunque no tengas cobertura.</small>`;
  }
  async function abreUltima() {
    const u = leeUltima(); if (!u) return;
    const b = $("apc-ultima"); b.disabled = true;
    try { RUTAS = [u.r]; await eligeRuta(0); $("apc-ruta").scrollIntoView({ behavior: "smooth", block: "start" }); }
    catch (e) { estado("No se ha podido abrir la última ruta.", true); }
    finally { b.disabled = false; }
  }

  // ---------- Peajes aproximados (lo pidió el padre: «precio aproximado», camión de 5 ejes, 40 t) ----------
  // Tabla «peajes_paises» (la edita el padre en el panel, «Peajes camión»): por país, qué se paga (solo los tramos de peaje,
  // todas las autopistas o todas las carreteras) y cuántos € por km. Los km de peaje y de autopista los da la función «ruta».
  let PEAJES = null;
  async function cargaPeajes() {
    if (PEAJES) return PEAJES;
    try {
      const { data, error } = await sb.from("peajes_paises").select("pais,nombre,cobra,precio_km,nota,visible").order("orden");
      if (error) throw error;
      PEAJES = (data || []).filter(x => x.visible !== false);
      try { localStorage.setItem("ccoo-peajes", JSON.stringify(PEAJES)); } catch (_) {}
    } catch (_) { try { PEAJES = JSON.parse(localStorage.getItem("ccoo-peajes") || "[]"); } catch (_) { PEAJES = []; } }
    return PEAJES;
  }
  // País de un punto: si solo cae en la caja de un país, ese; si cae en varias (cerca de una frontera), el del aparcamiento más cercano
  function indicePaises(lista) {
    const g = new Map();
    for (const x of lista) { if (!x.pais) continue; const k = Math.floor(x.lat * 4) + "," + Math.floor(x.lon * 4); if (!g.has(k)) g.set(k, []); g.get(k).push(x); }
    return g;
  }
  function paisDe(la, lo, indice) {
    const cajas = Object.keys(PAISES).filter(p => { const [a, b, c, d] = PAISES[p]; return la >= a && la <= b && lo >= c && lo <= d; });
    if (cajas.length === 1) return cajas[0];
    let mejor = null, dm = 1e9; const ka = Math.floor(la * 4), ko = Math.floor(lo * 4);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const x of indice.get((ka + i) + "," + (ko + j)) || []) { const d = km(la, lo, x.lat, x.lon); if (d < dm) { dm = d; mejor = x.pais; } }
    return mejor || cajas[0] || "?";
  }
  function calculaPeajes(r, indice, tabla) {
    const en = (rangos, k) => (rangos || []).some(([a, z]) => k >= a - 0.3 && k <= z + 0.3);
    const pts = r.puntos, por = new Map();
    for (let i = 0; i < pts.length - 1; i++) {
      const d = pts[i + 1][2] - pts[i][2]; if (!(d > 0)) continue;
      const k = (pts[i][2] + pts[i + 1][2]) / 2, p = paisDe((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2, indice);
      if (!por.has(p)) por.set(p, { km: 0, peaje: 0, autopista: 0 });
      const o = por.get(p); o.km += d; if (en(r.peajes, k)) o.peaje += d; if (en(r.autopista, k)) o.autopista += d;
    }
    let total = 0, faltan = 0;
    const filas = [...por].map(([pais, o]) => {
      const t = tabla.find(x => x.pais === pais), precio = Number(t?.precio_km) || 0;
      const kmPago = !t ? 0 : t.cobra === "peaje" ? o.peaje : t.cobra === "autopista" ? o.autopista : t.cobra === "todo" ? o.km : 0;
      const sinDato = !t || (t.cobra !== "nada" && !(precio > 0) && kmPago > 0.5);
      const euros = sinDato ? null : kmPago * precio;
      if (euros) total += euros; if (sinDato) faltan++;
      return { pais, nombre: t?.nombre || pais, km: o.km, kmPago, cobra: t?.cobra || "", euros, sinDato, nota: t?.nota || "" };
    });
    return { total, faltan, filas, conDatos: r.peajes !== undefined };
  }
  const euros = (n) => Math.round(n).toLocaleString("es-ES") + " €";
  const COBRA_TXT = { peaje: "km de peaje", autopista: "km de autopista", todo: "km (todas las carreteras)", nada: "no se paga por km" };
  function peajesHTML() {
    const c = RUTA?.costes; if (!c) return "";
    if (!c.conDatos) return "";
    return `<section class="apc-peajes apc-sec" id="apc-sec-peajes" aria-labelledby="apc-peajes-tit"><h2 id="apc-peajes-tit">Peajes aproximados</h2>
      <p class="apc-peaje-total"><b>${c.total > 0 ? "≈ " + euros(c.total) : "0 €"}</b><span>camión de 5 ejes, 40 t, Euro 6${c.faltan ? ` · falta el precio de ${c.faltan === 1 ? "1 país" : c.faltan + " países"}` : ""}</span></p>
      <details class="apc-peajes-paises"><summary>Ver por países</summary><div class="tabla-scroll"><table class="apc-peajes-tabla"><thead><tr><th scope="col">País</th><th scope="col">Se paga</th><th scope="col">Precio</th></tr></thead><tbody>
      ${c.filas.map(f => `<tr><th scope="row">${esc(f.nombre)}<small>${Math.round(f.km)} km en total</small></th>
        <td>${f.cobra === "nada" || !f.cobra ? esc(COBRA_TXT.nada) : `${Math.round(f.kmPago)} ${esc(COBRA_TXT[f.cobra])}`}</td>
        <td>${f.sinDato ? "Sin precio" : f.euros ? "≈ " + euros(f.euros) : "0 €"}</td></tr>`).join("")}</tbody></table></div></details>
      <details class="apc-peajes-notas"><summary>De dónde salen estos precios</summary><ul>${c.filas.filter(f => f.nota).map(f => `<li><b>${esc(f.nombre)}:</b> ${esc(f.nota)}</li>`).join("")}</ul></details>
      <p class="apc-nota">Es un precio orientativo, no el ticket exacto: cada autopista tiene su tarifa y el total depende de tu camión (ejes, Euro, CO2). No incluye túneles de pago (Fréjus, Mont-Blanc…), ferris ni viñetas.</p></section>`;
  }

  // Aparcamientos oficiales (Autobahn GmbH): ponen nombre y plazas a los de OpenStreetMap que estén a ≤ 300 m; los que no están, se añaden
  async function cargaOficiales(ruta) {
    const c = ruta.puntos.reduce((b, [la, lo]) => [Math.min(b[0], la), Math.max(b[1], la), Math.min(b[2], lo), Math.max(b[3], lo)], [90, -90, 180, -180]);
    try {
      const { data, error } = await sb.from("aparcamientos_oficiales").select("id,pais,nombre,via,lat,lon,plazas")
        .gte("lat", c[0] - 0.05).lte("lat", c[1] + 0.05).gte("lon", c[2] - 0.07).lte("lon", c[3] + 0.07).limit(5000);
      return error ? [] : data || [];
    } catch (_) { return []; }
  }
  function juntaOficiales(lista, oficiales) {
    if (!oficiales.length) return lista;
    const res = lista.map(x => ({ ...x }));
    for (const o of oficiales) {
      let mejor = null, d = 0.3;
      for (const x of res) { if (Math.abs(x.lat - o.lat) > 0.005 || Math.abs(x.lon - o.lon) > 0.007) continue; const k = km(x.lat, x.lon, o.lat, o.lon); if (k < d) { d = k; mejor = x; } }
      if (mejor) { if (!mejor.nombre && o.nombre) mejor.nombre = o.nombre; if (!mejor.plazas && o.plazas) mejor.plazas = o.plazas; mejor.camion = true; }
      else res.push({ osm: "of:" + o.id, pais: o.pais, lat: o.lat, lon: o.lon, nombre: o.nombre, horario: null, vigilado: false, duchas: false, aseos: false, plazas: o.plazas, area: true, camion: true, cerca: null });
    }
    return res;
  }

  // ---------- Cortes oficiales en tiempo real (lo pidió el padre: «como Bison Futé») ----------
  // Tabla «cortes», la llena cada 15 min la función «cortes» con la DGT, el Servei Català de Trànsit y Autobahn GmbH.
  let CORTES = null; // los de la ruta elegida ({ ...corte, kmRuta, minRuta }); null = no se ha podido consultar
  const TIPO_CORTE = { cortada: "Carretera cortada", sentido: "Cortada en un sentido", accidente: "Accidente", restriccion: "Restricción de peso",
    carril: "Carril cortado", obstaculo: "Obstáculo en la vía", retencion: "Retención", obras: "Obras", aviso: "Aviso" };
  const GRAVE = ["cortada", "sentido", "accidente", "restriccion"];
  const FUENTE_CORTE = { dgt: "DGT", sct: "Servei Català de Trànsit", autobahn: "Autobahn GmbH (Alemania)" };
  async function cargaCortes(ruta) {
    const pts = ruta.puntos, fina = ruta.fina || pts.map(q => [q[0], q[1]]);
    const c = pts.reduce((b, [la, lo]) => [Math.min(b[0], la), Math.max(b[1], la), Math.min(b[2], lo), Math.max(b[3], lo)], [90, -90, 180, -180]);
    try {
      const { data, error } = await sb.from("cortes").select("id,pais,fuente,tipo,via,lat,lon,lat2,lon2,rumbo,texto,inicio,fin")
        .gte("lat", c[0] - 0.05).lte("lat", c[1] + 0.05).gte("lon", c[2] - 0.07).lte("lon", c[3] + 0.07).limit(5000);
      if (error) throw error;
      const res = [];
      for (const x of data || []) {
        if (x.fin && Date.parse(x.fin) < Date.now()) continue;
        // Que esté EN la carretera de la ruta (no en una que la cruza): un punto a ≤ 80 m, o un tramo con los dos extremos a ≤ 150 m
        const d1 = ladoDe(x, fina).d, d2 = x.lat2 != null ? ladoDe({ lat: x.lat2, lon: x.lon2 }, fina).d : null;
        if (!(d1 <= 0.08 || (d2 != null && d1 <= 0.15 && d2 <= 0.15))) continue;
        let mejor = 1e9, idx = 0;
        for (let i = 0; i < pts.length; i++) { const d = km(x.lat, x.lon, pts[i][0], pts[i][1]); if (d < mejor) { mejor = d; idx = i; } }
        // Si la fuente dice hacia dónde afecta, que sea nuestro sentido
        if (x.rumbo != null && idx < pts.length - 1) {
          const rb = rumbo(pts[idx][0], pts[idx][1], pts[idx + 1][0], pts[idx + 1][1]);
          if (Math.abs(((x.rumbo - rb + 540) % 360) - 180) > 100) continue;
        }
        res.push({ ...x, kmRuta: pts[idx][2], minRuta: pts[idx][3] });
      }
      return res.sort((u, v) => u.kmRuta - v.kmRuta);
    } catch (_) { return null; }
  }
  const fechaCorta = (t) => new Date(t).toLocaleString("es-ES", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
  function corteHTML(x, faltaKm) {
    const cuando = [x.inicio && Date.parse(x.inicio) > Date.now() ? "Desde el " + fechaCorta(x.inicio) : "", x.fin ? "Hasta el " + fechaCorta(x.fin) : ""].filter(Boolean).join(" · ");
    return `<li class="apc-corte${GRAVE.includes(x.tipo) ? " grave" : ""}">
      <div class="apc-cab"><span class="apc-dist">km ${Math.round(faltaKm)}</span>${x.via ? `<span class="apc-via">${esc(x.via)}</span>` : ""}</div>
      <b>${esc(TIPO_CORTE[x.tipo] || "Aviso")}</b>
      ${x.texto ? `<small>${esc(x.texto)}</small>` : ""}
      <small class="apc-corte-fuente">${cuando ? esc(cuando) + " · " : ""}Fuente: ${esc(FUENTE_CORTE[x.fuente] || x.fuente)}</small></li>`;
  }
  function cortesHTML() {
    const nota = `<p class="apc-nota">Datos oficiales de la DGT, el Servei Català de Trànsit y las autopistas de Alemania, renovados cada 15 minutos. De Francia, Italia y otros países todavía no.</p>`;
    if (CORTES == null) return `<section class="apc-cortes-sec apc-sec" id="apc-sec-cortes"><h2>Cortes y avisos en tu ruta</h2><p class="msg err">No se han podido consultar los cortes. Comprueba que tienes internet.</p></section>`;
    const graves = CORTES.filter(x => GRAVE.includes(x.tipo)), otros = CORTES.filter(x => !GRAVE.includes(x.tipo));
    return `<section class="apc-cortes-sec apc-sec" id="apc-sec-cortes" aria-labelledby="apc-cortes-tit"><h2 id="apc-cortes-tit">Cortes y avisos en tu ruta</h2>
      ${graves.length ? `<ul class="apc-lista apc-cortes">${graves.map(x => corteHTML(x, x.kmRuta)).join("")}</ul>` : `<p class="apc-sin-cortes">Ahora no hay carreteras cortadas ni accidentes en tu ruta.</p>`}
      ${otros.length ? `<details class="panel apc-cortes-mas"><summary>Carriles cortados, obras y retenciones (${otros.length})</summary><ul class="apc-lista apc-cortes">${otros.map(x => corteHTML(x, x.kmRuta)).join("")}</ul></details>` : ""}
      ${nota}</section>`;
  }
  // Las carreteras principales de una ruta (las de más km, en el orden en que se pasan)
  const viasDe = (r) => { const v = [...r.tramos].filter(t => t.via).sort((a, b) => b.km - a.km).slice(0, 4).map(t => t.via); return r.tramos.map(t => t.via).filter((x, i, a) => v.includes(x) && a.indexOf(x) === i); };
  function rutasHTML() {
    if (RUTAS.length < 2) return "";
    const mejor = Math.min(...RUTAS.map(r => r.min));
    return `<section class="apc-rutas apc-sec" id="apc-sec-rutas" aria-labelledby="apc-rutas-tit"><h2 id="apc-rutas-tit">Otras rutas</h2><p class="apc-nota">Toca una para verla. La marcada es la que estás viendo.</p>${RUTAS.map((r, i) => `
      <button type="button" class="apc-ruta-op${r === RUTA ? " activa" : ""}" data-ruta="${i}" aria-pressed="${r === RUTA}">
        <b>Ruta ${i + 1}${r.min === mejor ? " · la más rápida" : ` · ${durTxt(r.min - mejor)} más`}</b>
        <span>${r.km} km · ${durTxt(r.min)}${r.costes?.conDatos ? (r.costes.total > 0 ? ` · peajes ≈ ${euros(r.costes.total)}` : " · sin peajes") : r.peaje ? " · con peajes" : " · sin peajes"}${r.ferry ? " · con ferry" : ""}</span>
        <small>${viasDe(r).map(esc).join(" → ") || "Carreteras locales"}</small></button>`).join("")}</section>`;
  }

  // v110 (lo pidió el padre): «Borrar ruta» en vez de «Cambiar ruta». Quita la ruta calculada y el destino y deja el
  // formulario listo para otra. El origen y las medidas del camión se quedan; la ruta sigue en «Abrir la última ruta».
  function borraRuta() {
    RUTA = null; RUTAS = []; EN_RUTA = []; CORTES = null; PARADAS = []; ELEGIDO.hasta = null;
    $("apc-hasta").value = ""; $("apc-hasta-cp").value = ""; leeFormulario();
    pintaRuta(); pintaUltima();
    $("apc-form").scrollIntoView({ behavior: "smooth", block: "start" }); $("apc-hasta").focus({ preventScroll: true });
  }

  // v92 (lo pidió Lorena: «que sea todo fácil», hay compañeros mayores): lo importante arriba. Resumen y «Empezar viaje»,
  // botones grandes para saltar a cada parte, y en este orden: aparcamientos, cortes, peajes y otras rutas.
  // Al calcular, el formulario se recoge («Borrar ruta» lo vuelve a abrir vacío) y la página baja sola al resultado.
  function pintaRuta() {
    const caja = $("apc-ruta");
    $("apc-preparar").classList.toggle("con-ruta", !!RUTA);
    if (!RUTA) { caja.innerHTML = ""; return; }
    planParadas();
    const graves = (CORTES || []).filter(x => GRAVE.includes(x.tipo)).length, c = RUTA.costes;
    const salto = (id, txt, cls = "") => `<button type="button" class="apc-salto${cls}" data-salto="${id}">${txt}</button>`;
    caja.innerHTML = `
      <div class="apc-res"><b>${esc(RUTA.desde.nombre)} → ${esc(RUTA.hasta.nombre)}</b><span>${RUTA.km} km · ${durTxt(RUTA.min)} conduciendo${RUTA.ferry ? " · con ferry" : ""}</span>
        <button type="button" class="apc-cambiar" id="apc-cambiar">Borrar ruta</button></div>
      <button type="button" class="btn apc-grande" id="apc-empezar">${icono("lugar")}Empezar viaje</button>
      <p class="apc-nota">Con «Empezar viaje» te enseño los aparcamientos que tienes por delante mientras conduces.</p>
      <label class="apc-salida">Salgo a las <input type="time" id="apc-salida" value="${esc(SALIDA)}"> <small>(vacío = ahora)</small></label>
      <nav class="apc-saltos" aria-label="Ir a una parte">
        ${salto("apc-sec-prohib", prohibicionesRuta().length ? `Prohibiciones <b>${prohibicionesRuta().length}</b>` : "Prohibiciones: ninguna", prohibicionesRuta().length ? " alerta" : "")}
        ${salto("apc-sec-paradas", PARADAS.length ? `Paradas <b>${PARADAS.length}</b>` : "Paradas: ninguna")}
        ${salto("apc-sec-aparc", `Aparcamientos <b>${EN_RUTA.length}</b>`)}
        ${CORTES == null ? "" : salto("apc-sec-cortes", graves ? `Cortes <b>${graves}</b>` : "Cortes: ninguno", graves ? " alerta" : "")}
        ${c?.conDatos ? salto("apc-sec-peajes", c.total > 0 ? `Peajes <b>≈ ${euros(c.total)}</b>` : "Peajes: 0 €") : ""}
        ${RUTAS.length > 1 ? salto("apc-sec-rutas", `Otras rutas <b>${RUTAS.length - 1}</b>`) : ""}
      </nav>
      <div id="apc-prohib-caja">${prohibicionesHTML()}</div>
      <section class="apc-paradas apc-sec" id="apc-sec-paradas" aria-labelledby="apc-paradas-tit"></section>
      <section class="apc-todos apc-sec" id="apc-sec-aparc" aria-labelledby="apc-todos-tit">
        <h2 id="apc-todos-tit">Aparcamientos en tu ruta</h2>
        ${filtrosHTML()}
        <div id="apc-todos"></div>
      </section>
      ${cortesHTML()}
      ${peajesHTML()}
      ${rutasHTML()}
      <p class="apc-camion">Ruta calculada para tu camión: ${esc(AJ.camion.alto)} m de alto, ${esc(AJ.camion.peso)} t${AJ.camion.adr ? ", con ADR" : ""}.</p>
      <details class="panel apc-tramos"><summary>Carreteras de la ruta (${RUTA.tramos.length})</summary>
        <ol class="apc-linea">${RUTA.tramos.map(t => `<li><b>${t.via ? `<span class="apc-via">${esc(t.via)}</span>` : "Carreteras locales"}</b>${t.hacia ? ` hacia ${esc(t.hacia)}` : ""}<small>${t.km} km</small></li>`).join("")}</ol></details>`;
    $("apc-empezar").onclick = empiezaViaje;
    $("apc-cambiar").onclick = borraRuta;
    caja.querySelectorAll("[data-salto]").forEach(b => b.onclick = () => { const d = $(b.dataset.salto); if (!d) return; if (d.tagName === "DETAILS") d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); });
    caja.querySelectorAll("[data-ruta]").forEach(b => b.onclick = () => eligeRuta(+b.dataset.ruta));
    $("apc-salida").onchange = () => { SALIDA = $("apc-salida").value; refrescaParadas(); };
    enlazaFiltros();
    pintaParadas();
    pintaTodos();
  }

  // ---------- Prohibiciones de circular en la ruta (v108, lo pidió el padre) ----------
  // Tabla «prohibiciones_camion» (la edita el padre en el panel): por país, semanales (día y hora, opcional por meses; sin día = todos los días)
  // o con fecha (festivos). Se mira a qué hora pasas por cada país (con las pausas) y si coincide con alguna.
  let PROHIB = [];
  const PAIS_NOMBRE = { ES: "España", FR: "Francia", IT: "Italia", PT: "Portugal", AD: "Andorra", DE: "Alemania", CH: "Suiza", BE: "Bélgica", NL: "Países Bajos", LU: "Luxemburgo", AT: "Austria", GB: "Reino Unido" };
  async function cargaProhibiciones() {
    try {
      const { data, error } = await sb.from("prohibiciones_camion").select("pais,motivo,tipo,dia_desde,hora_desde,dia_hasta,hora_hasta,mes_desde,mes_hasta,inicio,fin,nota,url,visible").order("orden");
      if (error) throw error;
      const l = (data || []).filter(x => x.visible !== false);
      try { localStorage.setItem("ccoo-prohibiciones", JSON.stringify(l)); } catch (_) {}
      return l;
    } catch (_) { try { return JSON.parse(localStorage.getItem("ccoo-prohibiciones") || "[]"); } catch (_) { return []; } }
  }
  // Por dónde va la ruta: trozos seguidos en el mismo país, con los minutos de conducción de entrada y salida
  function tramosPais(r, indice) {
    const pts = r.puntos, res = [];
    for (let i = 0; i < pts.length; i++) {
      const p = paisDe(pts[i][0], pts[i][1], indice), ult = res[res.length - 1];
      if (ult && ult.pais === p) { ult.minHasta = pts[i][3]; ult.kmHasta = pts[i][2]; }
      else res.push({ pais: p, minDesde: pts[i][3], minHasta: pts[i][3], kmDesde: pts[i][2], kmHasta: pts[i][2] });
    }
    return res.filter(t => t.pais && t.pais !== "?");
  }
  const aMin = (h) => { const [a, b] = String(h || "00:00").split(":").map(Number); return a * 60 + (b || 0) + (String(h).startsWith("23:59") ? 1 : 0); };
  const enMeses = (x, d) => { if (!x.mes_desde || !x.mes_hasta) return true; const m = d.getMonth() + 1; return x.mes_desde <= x.mes_hasta ? m >= x.mes_desde && m <= x.mes_hasta : m >= x.mes_desde || m <= x.mes_hasta; };
  // Periodos [inicio, fin] de una prohibición entre dos momentos
  function periodos(x, desde, hasta) {
    if (x.tipo === "fecha") { const a = Date.parse(x.inicio), b = Date.parse(x.fin); return a && b && b > desde && a < hasta ? [[a, b]] : []; }
    const res = [], d = new Date(desde); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 7);
    for (; d.getTime() < hasta; d.setDate(d.getDate() + 1)) {
      if (x.dia_desde != null && d.getDay() !== x.dia_desde) continue;
      if (!enMeses(x, d)) continue;
      const a = d.getTime() + aMin(x.hora_desde) * 60000;
      let dias = x.dia_desde != null && x.dia_hasta != null ? (x.dia_hasta - x.dia_desde + 7) % 7 : 0;
      if (!dias && aMin(x.hora_hasta) <= aMin(x.hora_desde)) dias = x.dia_desde != null && x.dia_hasta != null && x.dia_hasta === x.dia_desde ? 7 : 1;
      const b = d.getTime() + (dias * 1440 + aMin(x.hora_hasta)) * 60000;
      if (b > desde && a < hasta) res.push([a, b]);
    }
    return res;
  }
  const fechaHora = (t) => new Date(t).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  function prohibicionesRuta() {
    if (!RUTA?.tramosPais || !PROHIB.length) return [];
    const t0 = horaSalida(), res = [];
    for (const tr of RUTA.tramosPais) {
      const a = llegaA(t0, tr.minDesde).getTime(), b = llegaA(t0, tr.minHasta).getTime() + 60000;
      for (const x of PROHIB.filter(z => z.pais === tr.pais)) for (const [pa, pb] of periodos(x, a, b)) res.push({ x, tr, pa, pb, entra: a, sale: b });
    }
    return res;
  }
  function prohibicionesHTML() {
    const l = prohibicionesRuta(), paises = [...new Set((RUTA?.tramosPais || []).map(t => t.pais))];
    const conReglas = paises.filter(p => PROHIB.some(x => x.pais === p));
    return `<section class="apc-prohib apc-sec${l.length ? " hay" : ""}" id="apc-sec-prohib" aria-labelledby="apc-prohib-tit">
      <h2 id="apc-prohib-tit">Prohibiciones de circular</h2>
      ${l.length ? `<ul class="apc-lista">${l.map(o => `<li class="apc apc-prohib-una"><b class="apc-nom">${esc(PAIS_NOMBRE[o.x.pais] || o.x.pais)}: ${esc(o.x.motivo)}</b>
          <p>Prohibido de ${esc(fechaHora(o.pa))} a ${esc(fechaHora(o.pb))}. Según la hora de salida, pasas por ${esc(PAIS_NOMBRE[o.tr.pais] || o.tr.pais)} entre el km ${Math.round(o.tr.kmDesde)} y el ${Math.round(o.tr.kmHasta)} (${esc(hora(new Date(o.entra)))}–${esc(hora(new Date(o.sale)))}).</p>
          ${o.x.nota ? `<p class="apc-nota">${esc(o.x.nota)}</p>` : ""}${o.x.url ? `<a href="${esc(urlSegura(o.x.url))}" target="_blank" rel="noopener">Ver la web oficial</a>` : ""}</li>`).join("")}</ul>`
        : `<p>${conReglas.length ? "Con la hora de salida que has puesto, no te pilla ninguna prohibición de las que tiene apuntadas la sección." : "La sección no tiene apuntadas prohibiciones para los países de esta ruta."}</p>`}
      <p class="apc-nota">Orientativo: las horas dependen de las pausas y del tráfico, y puede haber festivos locales o restricciones que no están apuntados. Mira también «Restricciones para camiones» en Zona Conductores.</p></section>`;
  }

  // ---------- Dónde te toca parar (v108, lo pidió el padre) ----------
  // Reglamento (CE) 561/2006: pausa de 45 min después de 4 h 30 de conducción; como mucho 9 h de conducción al día
  // (10 h dos veces por semana) y después el descanso diario (11 h; 9 h si es reducido). Los minutos son los de conducción de la ruta.
  // Lo que ya lleva conducido hoy lo pone el conductor (AJ.llevoDia, AJ.llevoBloque, en minutos).
  let PARADAS = [];
  function planParadas() {
    PARADAS = [];
    if (!RUTA) return PARADAS;
    const max = AJ.diezHoras ? 600 : 540, desc = AJ.reducido ? 540 : 660, total = RUTA.min;
    let t = 0, dia = Math.max(0, +AJ.llevoDia || 0), bloque = Math.min(Math.max(0, +AJ.llevoBloque || 0), dia), extra = 0;
    for (let n = 0; n < 60; n++) {
      const paso = Math.max(0, Math.min(270 - bloque, max - dia));
      if (t + paso >= total) break;
      t += paso; dia += paso; bloque += paso;
      const diario = dia >= max;
      PARADAS.push({ tipo: diario ? "diario" : "pausa", min: t, antes: extra, dura: diario ? desc : 45, km: kmEnMin(t) });
      extra += diario ? desc : 45;
      if (diario) dia = 0;
      bloque = 0;
    }
    return PARADAS;
  }
  // Km de la ruta a los «m» minutos de conducción (entre los puntos de la ruta)
  function kmEnMin(m) {
    const p = RUTA.puntos;
    for (let i = 1; i < p.length; i++) if (p[i][3] >= m) { const a = p[i - 1], b = p[i], f = b[3] > a[3] ? (m - a[3]) / (b[3] - a[3]) : 0; return a[2] + f * (b[2] - a[2]); }
    return p[p.length - 1][2];
  }
  // Minutos de pausas y descansos que hay antes de llegar a «minRuta»
  const retraso = (minRuta) => PARADAS.filter(q => q.min <= minRuta).reduce((s, q) => s + q.dura, 0);
  const llegaA = (t0, minRuta) => new Date(t0 + (minRuta + retraso(minRuta)) * 60000);
  const diaHora = (d) => { const hoy = new Date(); hoy.setHours(0, 0, 0, 0); const dd = new Date(d); dd.setHours(0, 0, 0, 0); const dif = Math.round((dd - hoy) / 864e5);
    return (dif === 0 ? "hoy" : dif === 1 ? "mañana" : d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" })) + " a las " + hora(d); };
  const hmTxt = (m) => durTxt(m);
  const campoHM = (k, txt) => { const v = +AJ[k] || 0; return `<label class="apc-hm-campo"><span>${txt}</span><span class="apc-hm"><input inputmode="numeric" maxlength="2" data-hm="${k}" data-p="h" value="${Math.floor(v / 60) || ""}" placeholder="0" aria-label="${txt}: horas"><small>h</small><input inputmode="numeric" maxlength="2" data-hm="${k}" data-p="m" value="${v % 60 || ""}" placeholder="0" aria-label="${txt}: minutos"><small>min</small></span></label>`; };
  function pintaParadas() {
    const caja = $("apc-sec-paradas"); if (!caja || !RUTA) return;
    planParadas();
    const t0 = horaSalida(), fin = llegaA(t0, RUTA.min + 0.001), nP = PARADAS.filter(q => q.tipo === "pausa").length, nD = PARADAS.length - nP;
    const candidatos = (q) => EN_RUTA.filter(x => x.kmRuta <= q.km + 0.5 && x.kmRuta >= q.km - 40).sort((a, b) => b.kmRuta - a.kmRuta).slice(0, 3);
    caja.innerHTML = `<h2 id="apc-paradas-tit">Dónde te toca parar</h2>
      <p class="apc-nota">Según las normas de tiempos de conducción: pausa de 45 min cada 4 h 30 de conducción y descanso diario después de ${AJ.diezHoras ? "10" : "9"} h. Es orientativo: manda tu tacógrafo.</p>
      <details class="apc-llevo"${(+AJ.llevoDia || +AJ.llevoBloque || AJ.diezHoras || AJ.reducido) ? " open" : ""}><summary>¿Ya has conducido hoy?</summary>
        <div class="apc-llevo-campos">${campoHM("llevoDia", "Hoy llevo conducido")}${campoHM("llevoBloque", "Desde mi última pausa")}</div>
        <label class="check"><input type="checkbox" id="apc-diez"${AJ.diezHoras ? " checked" : ""}> Hoy puedo conducir 10 h (dos veces por semana)</label>
        <label class="check"><input type="checkbox" id="apc-reducido"${AJ.reducido ? " checked" : ""}> Mi descanso diario será reducido (9 h)</label>
      </details>
      <p class="apc-llegada">Llegas a ${esc(RUTA.hasta.nombre)} <b>${esc(diaHora(fin))}</b>${PARADAS.length ? ` con ${[nP ? (nP === 1 ? "1 pausa" : nP + " pausas") : "", nD ? (nD === 1 ? "1 descanso diario" : nD + " descansos diarios") : ""].filter(Boolean).join(" y ")}` : ", sin parar"}.</p>
      ${PARADAS.length ? `<ol class="apc-paradas-lista">${PARADAS.map(q => { const ll = new Date(t0 + (q.min + q.antes) * 60000), c = candidatos(q);
        return `<li class="apc-parada ${q.tipo}"><div class="apc-parada-cab"><b>${q.tipo === "pausa" ? "Pausa de 45 min" : `Descanso diario (${q.dura / 60} h)`}</b><span>km ${Math.round(q.km)} · ${esc(diaHora(ll))}</span></div>
          ${c.length ? `<p class="apc-nota">Aparcamientos en los 40 km de antes:</p><ul class="apc-lista">${c.map(x => tarjeta(x, x.kmRuta, llegaA(t0, x.minRuta))).join("")}</ul>`
            : `<p class="apc-nota">No hay aparcamientos apuntados en los 40 km de antes: busca sitio un poco antes.</p>`}</li>`; }).join("")}</ol>`
        : `<p class="apc-nota">Con lo que llevas conducido, haces esta ruta sin tener que parar.</p>`}`;
    caja.querySelectorAll("[data-hm]").forEach(i => i.onchange = () => {
      const k = i.dataset.hm, h = caja.querySelector(`[data-hm="${k}"][data-p=h]`).value, m = caja.querySelector(`[data-hm="${k}"][data-p=m]`).value;
      AJ[k] = Math.min(Math.max(0, (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0)), 15 * 60); guarda(); refrescaParadas();
    });
    $("apc-diez").onchange = () => { AJ.diezHoras = $("apc-diez").checked; guarda(); refrescaParadas(); };
    $("apc-reducido").onchange = () => { AJ.reducido = $("apc-reducido").checked; guarda(); refrescaParadas(); };
  }
  function refrescaParadas() {
    const abierto = $("apc-sec-paradas")?.querySelector(".apc-llevo")?.open;
    pintaParadas(); pintaTodos();
    const d = $("apc-sec-paradas")?.querySelector(".apc-llevo"); if (d && abierto) d.open = true;
    const s = document.querySelector('[data-salto="apc-sec-paradas"]'); if (s) s.innerHTML = PARADAS.length ? `Paradas <b>${PARADAS.length}</b>` : "Paradas: ninguna";
    if ($("apc-prohib-caja")) $("apc-prohib-caja").innerHTML = prohibicionesHTML();
    const sp = document.querySelector('[data-salto="apc-sec-prohib"]'), np = prohibicionesRuta().length;
    if (sp) { sp.innerHTML = np ? `Prohibiciones <b>${np}</b>` : "Prohibiciones: ninguna"; sp.classList.toggle("alerta", !!np); }
  }
  function ponFiltro(f) { FILTRO = f; pintaTodos(); }
  // Hora de salida: la que pone el conductor (si ya ha pasado hace rato, la de mañana) o ahora
  function horaSalida() {
    if (!SALIDA) return Date.now();
    const [h, m] = SALIDA.split(":").map(Number), d = new Date(); d.setHours(h, m, 0, 0);
    if (d.getTime() < Date.now() - 30 * 60000) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  // Todos los de la ruta, desde la salida: abiertos, cerrados (los que lo estarán cuando pases) o todos
  // ---------- Buscar y filtrar la lista (y el mapa) (lo pidió Lorena) ----------
  const FILT_VACIO = () => ({ texto: "", plazas: 0, vigilado: false, duchas: false, aseos: false, area: false, desde: "", hasta: "" });
  let FILT = FILT_VACIO();
  const CHIPS_F = [["vigilado", "Vigilado"], ["duchas", "Duchas"], ["aseos", "Aseos"], ["area", "Áreas de autopista"]];
  const filtrosActivos = () => [FILT.texto.trim(), FILT.plazas, ...CHIPS_F.map(([k]) => FILT[k]), FILT.desde !== "", FILT.hasta !== ""].filter(Boolean).length;
  function filtrosHTML() {
    return `<div class="apc-filtros">
      <label class="apc-f-texto"><span>Buscar en la lista</span><input type="search" id="apc-f-texto" placeholder="Nombre, pueblo o carretera (ej. A9)" autocomplete="off" value="${esc(FILT.texto)}"></label>
      <details class="apc-f-mas"${filtrosActivos() > (FILT.texto.trim() ? 1 : 0) ? " open" : ""}><summary>Más filtros</summary>
        <div class="apc-f-chips" role="group" aria-label="Filtros">${CHIPS_F.map(([k, t]) => `<button type="button" class="apc-f-chip${FILT[k] ? " activa" : ""}" data-f="${k}" aria-pressed="${FILT[k]}">${t}</button>`).join("")}</div>
        <label class="apc-f-plazas">Plazas para camión <select id="apc-f-plazas">${[[0, "Cualquiera"], [1, "Con plazas apuntadas"], [10, "10 o más"], [20, "20 o más"], [50, "50 o más"]].map(([v, t]) => `<option value="${v}"${FILT.plazas === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
        <div class="apc-f-km"><label>Del km <input type="number" id="apc-f-desde" inputmode="numeric" min="0" value="${esc(FILT.desde)}"></label><label>al km <input type="number" id="apc-f-hasta" inputmode="numeric" min="0" value="${esc(FILT.hasta)}"></label></div>
      </details>
      <p class="apc-f-cuenta" id="apc-f-cuenta" aria-live="polite"></p>
    </div>`;
  }
  function pasaFiltro(x) {
    if (FILT.texto.trim() && !coincide([nombre(x), x.cerca, viaEnKm(x.kmRuta)].filter(Boolean).join(" "), FILT.texto)) return false;
    if (FILT.plazas && !(Number(x.plazas) >= FILT.plazas)) return false;
    if (FILT.vigilado && !x.vigilado) return false;
    if (FILT.duchas && !x.duchas) return false;
    if (FILT.aseos && !x.aseos) return false;
    if (FILT.area && !x.area) return false;
    if (FILT.desde !== "" && x.kmRuta < Number(FILT.desde)) return false;
    if (FILT.hasta !== "" && x.kmRuta > Number(FILT.hasta)) return false;
    return true;
  }
  function enlazaFiltros() {
    const caja = $("apc-ruta"), t = $("apc-f-texto"); if (!t) return;
    let espera = null;
    t.oninput = () => { clearTimeout(espera); espera = setTimeout(() => { FILT.texto = t.value; pintaTodos(); }, 250); };
    caja.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { FILT[b.dataset.f] = !FILT[b.dataset.f]; b.classList.toggle("activa", FILT[b.dataset.f]); b.setAttribute("aria-pressed", FILT[b.dataset.f]); pintaTodos(); });
    $("apc-f-plazas").onchange = () => { FILT.plazas = Number($("apc-f-plazas").value) || 0; pintaTodos(); };
    // Mientras se escribe (no al salir del campo: si no, el primer toque en otro botón se perdía al repintar la lista)
    ["desde", "hasta"].forEach(k => { const c = $("apc-f-" + k); let t2 = null; c.oninput = () => { clearTimeout(t2); t2 = setTimeout(() => { FILT[k] = c.value.trim(); pintaTodos(); }, 400); }; });
  }
  function quitaFiltros() {
    FILT = FILT_VACIO();
    const f = document.querySelector("#apc-ruta .apc-filtros"); if (f) { f.outerHTML = filtrosHTML(); enlazaFiltros(); }
    pintaTodos();
  }

  function pintaTodos() {
    const caja = $("apc-todos"); if (!caja) return;
    const t0 = horaSalida();
    const total = EN_RUTA.length, nF = filtrosActivos();
    const cuenta = $("apc-f-cuenta");
    const lista = EN_RUTA.filter(pasaFiltro).map(x => ({ x, llega: llegaA(t0, x.minRuta), e: null })).map(y => ({ ...y, e: estadoA(y.x, y.llega) }));
    // Cerrados: los que estarán cerrados cuando pases. Abiertos: los que se sabe que estarán abiertos (horario o área de autopista).
    // Sin horario: no se sabe. Así no se confunde «no sé» con «abierto».
    const cerrados = lista.filter(y => y.e === "no"), abiertos = lista.filter(y => y.e === "si" || y.e === "siempre"), sinHorario = lista.filter(y => y.e === "nose");
    const ver = { cerrados, abiertos, nose: sinHorario, todos: lista }[FILTRO] || cerrados;
    const cifra = (k, cls, n, txt) => `<button type="button" class="apc-cifra ${cls}${FILTRO === k ? " activa" : ""}" data-filtro="${k}" aria-pressed="${FILTRO === k}"><b>${n}</b>${txt}</button>`;
    caja.innerHTML = `<div class="apc-resumen" role="group" aria-label="Qué aparcamientos ver">
        ${cifra("cerrados", "cerr", cerrados.length, cerrados.length === 1 ? "cerrado" : "cerrados")}${cifra("abiertos", "abie", abiertos.length, abiertos.length === 1 ? "abierto" : "abiertos")}${cifra("nose", "nose", sinHorario.length, "sin horario")}</div>
      <button type="button" class="btn sec apc-ver-todos${FILTRO === "todos" ? " activa" : ""}" data-filtro="todos" aria-pressed="${FILTRO === "todos"}">Ver todos (${lista.length}), del primero al último</button>
      ${vistaHTML()}
      <p class="apc-cuenta">Abierto o cerrado a la hora a la que pasas. Solo salen los de tu lado de la autopista.${sinHorario.length ? " «Sin horario»: no se sabe si estará abierto." : ""}</p>`
      + (AJ.vista === "mapa" ? `${buscaSitioHTML("apc-mapa")}<div id="apc-mapa" class="apc-mapa" role="region" aria-label="Mapa de la ruta con los aparcamientos"></div>`
        : ver.length ? listaPorTramos(ver)
        : nF && !lista.length ? `<p class="desc-vacio">Ningún aparcamiento cumple los filtros. <button type="button" class="btn-txt" data-quitar-f>Quitar filtros</button></p>`
        : `<p class="desc-vacio">${FILTRO === "cerrados" ? "Según los horarios apuntados, ninguno estará cerrado cuando pases." + (sinHorario.length ? ` Mira también «Sin horario» (${sinHorario.length}): de esos no se sabe.` : "") : "No hay ninguno."}</p>`);
    caja.querySelectorAll("[data-filtro]").forEach(b => b.onclick = () => ponFiltro(b.dataset.filtro));
    caja.querySelector("[data-quitar-f]")?.addEventListener("click", quitaFiltros);
    if (cuenta) {
      cuenta.innerHTML = nF ? `Salen <b>${lista.length}</b> de ${total} con ${nF === 1 ? "1 filtro" : nF + " filtros"}. <button type="button" class="btn-txt" id="apc-f-quitar">Quitar filtros</button>` : "";
      $("apc-f-quitar")?.addEventListener("click", quitaFiltros);
    }
    if (AJ.vista === "mapa") { pintaMapa("apc-mapa", ver); enlazaBuscaSitio(caja); }
  }

  // ---------- Mapa (lo pidió Lorena: «versión mapa y versión lista») ----------
  // Leaflet alojado aquí (lib/leaflet.js, sin CDN) y el mapa de OpenStreetMap (tile.openstreetmap.org, está en la CSP).
  // Se carga solo al tocar «Mapa». El servidor del mapa ve la zona que se mira (lo dice el aviso de privacidad de la vista).
  const vistaHTML = () => `<div class="apc-vista" role="group" aria-label="Ver como">${[["lista", "Lista"], ["mapa", "Mapa"]].map(([k, t]) =>
    `<button type="button" class="${AJ.vista === k ? "activa" : ""}" data-apc-vista="${k}" aria-pressed="${AJ.vista === k}">${t}</button>`).join("")}</div>`;
  let LEAFLET = null;
  function cargaLeaflet() {
    if (LEAFLET) return LEAFLET;
    return (LEAFLET = new Promise((ok, mal) => {
      const v = typeof VERSION_WEB !== "undefined" ? VERSION_WEB : "";
      const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "lib/leaflet.css?v=" + v; document.head.appendChild(css);
      const js = document.createElement("script"); js.src = "lib/leaflet.js?v=" + v;
      js.onload = () => ok(window.L); js.onerror = () => { LEAFLET = null; js.remove(); mal(new Error("No se ha podido cargar el mapa.")); };
      document.head.appendChild(js);
    }));
  }
  const MAPAS = {};
  // Pinta en el div «id» la ruta y los aparcamientos (cada uno con sus plazas para camiones; al tocarlo, su tarjeta)
  async function pintaMapa(id, items, opc = {}) {
    let L; try { L = await cargaLeaflet(); } catch (e) { const c = $(id); if (c) c.innerHTML = `<p class="msg err">${esc(e.message)} Comprueba que tienes internet.</p>`; return; }
    const caja = $(id); if (!caja || caja.hidden) return;
    let m = MAPAS[id];
    if (!m || m.div !== caja) {
      try { m?.mapa.remove(); } catch (_) {}
      // En el móvil (v92): con un dedo se baja por la página y el mapa se mueve con dos dedos (o en pantalla completa con uno)
      const tactil = L.Browser.mobile || "ontouchstart" in window;
      const mapa = L.map(caja, { zoomControl: true, dragging: !tactil });
      mapa.attributionControl.setPrefix(false);
      // v113: con una ventanita abierta se esconden los botones de la derecha (la tapaban) y vuelven al cerrarla
      mapa.on("popupopen", () => caja.classList.add("apc-popup-abierto")); mapa.on("popupclose", () => caja.classList.remove("apc-popup-abierto"));
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(mapa);
      m = MAPAS[id] = { div: caja, mapa, capa: L.layerGroup().addTo(mapa), zona: L.layerGroup().addTo(mapa), ruta: null, rutaDe: null, yo: null, encuadrado: false };
      // Botón «Dónde estoy» (lo pidió Lorena): centra el mapa en tu posición; en el mapa sin ruta, enseña los aparcamientos de alrededor
      const Yo = L.Control.extend({ options: { position: "topright" }, onAdd() {
        const b = L.DomUtil.create("button", "apc-yo-btn"); b.type = "button"; b.title = "Dónde estoy"; b.setAttribute("aria-label", "Dónde estoy");
        b.innerHTML = icono("lugar") + "<span>Dónde estoy</span>";
        L.DomEvent.disableClickPropagation(b); L.DomEvent.on(b, "click", () => dondeEstoy(id, b));
        return b;
      } });
      new Yo().addTo(mapa);
      // «Pantalla completa»: el mapa ocupa toda la pantalla y se maneja con un dedo; «Cerrar mapa» vuelve
      const Grande = L.Control.extend({ options: { position: "topright" }, onAdd() {
        const b = L.DomUtil.create("button", "apc-yo-btn apc-grande-btn"); b.type = "button";
        const pinta = () => { const g = caja.classList.contains("completa"); b.innerHTML = g ? "<span>Cerrar mapa</span>" : "<span>Pantalla completa</span>"; b.setAttribute("aria-pressed", g); };
        pinta();
        L.DomEvent.disableClickPropagation(b);
        L.DomEvent.on(b, "click", () => {
          const g = !caja.classList.contains("completa");
          caja.classList.toggle("completa", g); document.documentElement.classList.toggle("mapa-completo", g);
          if (tactil) g ? mapa.dragging.enable() : mapa.dragging.disable();
          pinta(); setTimeout(() => mapa.invalidateSize(), 80);
          if (!g) caja.scrollIntoView({ block: "center" });
        });
        caja._cierraGrande = () => { if (caja.classList.contains("completa")) b.click(); };
        return b;
      } });
      new Grande().addTo(mapa);
      // v106: «Añadir aparcamiento» (lo pidió el padre): se toca el sitio en el mapa y se rellena el formulario de debajo
      const Anade = L.Control.extend({ options: { position: "topright" }, onAdd() {
        const b = L.DomUtil.create("button", "apc-yo-btn apc-anade-btn"); b.type = "button";
        b.innerHTML = icono("mas") + "<span>Añadir aparcamiento</span>";
        L.DomEvent.disableClickPropagation(b); L.DomEvent.on(b, "click", () => empiezaAnadir(id));
        return b;
      } });
      new Anade().addTo(mapa);
      mapa.on("click", (e) => { if (MAPAS[id]?.anadiendo) ponSitio(id, e.latlng.lat, e.latlng.lng); });
      if (tactil) {
        const aviso = L.DomUtil.create("div", "apc-dos-dedos", caja); aviso.textContent = "Usa dos dedos para mover el mapa, o toca «Pantalla completa»";
        let t = null;
        caja.addEventListener("touchmove", (e) => {
          if (e.touches.length !== 1 || caja.classList.contains("completa")) return;
          aviso.classList.add("ver"); clearTimeout(t); t = setTimeout(() => aviso.classList.remove("ver"), 1600);
        }, { passive: true });
      }
    }
    const conRuta = opc.ruta !== false && RUTA, linea = (r) => r.fina || r.puntos.map(q => [q[0], q[1]]);
    if (conRuta && m.rutaDe !== RUTA) m.encuadrado = false;
    // Primero se coloca el mapa (Leaflet no deja dibujar líneas en un mapa sin vista)
    if (!m.encuadrado) {
      m.encuadrado = true;
      if (opc.yo) m.mapa.setView(opc.yo, 10);
      else if (conRuta) m.mapa.fitBounds(L.latLngBounds(linea(RUTA)), { padding: [24, 24] });
      else if (items.length) m.mapa.fitBounds(items.map(y => [y.x.lat, y.x.lon]), { padding: [24, 24], maxZoom: 12 });
      else m.mapa.setView([46, 4], 5);
    }
    if (!conRuta && m.ruta) { m.ruta.remove(); m.ruta = null; m.rutaDe = null; }
    if (!conRuta && m.otras) { m.otras.remove(); m.otras = null; }
    // Las otras rutas, en gris y antes que la elegida para que esta quede encima (el mapa se rehace al cambiar de ruta)
    if (!m.otras && conRuta && RUTAS.length > 1 && !VIAJE) {
      m.otras = L.layerGroup().addTo(m.mapa);
      RUTAS.forEach((r, i) => { if (r !== RUTA) L.polyline(linea(r), { color: "#6b7078", weight: 5, opacity: .7, dashArray: "8 8" })
        .bindTooltip(`Ruta ${i + 1}: ${r.km} km · ${durTxt(r.min)}. Tócala para elegirla.`).on("click", () => eligeRuta(i)).addTo(m.otras); });
    }
    if (conRuta && m.rutaDe !== RUTA) {
      m.ruta?.remove();
      m.ruta = L.polyline(linea(RUTA), { color: "#AB1012", weight: 5, opacity: .85 }).addTo(m.mapa);
      m.rutaDe = RUTA;
    }
    m.capa.clearLayers();
    for (const y of items) {
      const e = estadoA(y.x, y.llega), cls = (e === "no" ? "no" : e === "nose" ? "nose" : "si") + (y.x.mio ? " mio" : "");
      const icon = L.divIcon({ className: "apc-pin " + cls, html: `<span>${y.x.plazas ? y.x.plazas : "P"}</span>`, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -16] });
      L.marker([y.x.lat, y.x.lon], { icon, title: nombre(y.x) + (y.x.plazas ? `, ${y.x.plazas} plazas` : "") })
        .bindPopup(`<ul class="apc-lista apc-popup">${tarjeta(y.x, y.falta ?? y.x.kmRuta, y.llega)}</ul>`, POPUP_OP()).addTo(m.capa);
    }
    for (const x of (conRuta && CORTES) || []) {
      if (opc.desdeKm != null && x.kmRuta < opc.desdeKm) continue;
      const icon = L.divIcon({ className: "apc-pin-corte" + (GRAVE.includes(x.tipo) ? " grave" : ""), html: "<span>!</span>", iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14] });
      L.marker([x.lat, x.lon], { icon, title: TIPO_CORTE[x.tipo] || "Aviso", zIndexOffset: GRAVE.includes(x.tipo) ? 500 : 0 })
        .bindPopup(`<ul class="apc-lista apc-popup">${corteHTML(x, opc.desdeKm != null ? x.kmRuta - opc.desdeKm : x.kmRuta)}</ul>`, POPUP_OP()).addTo(m.capa);
    }
    if (opc.yo) { if (m.yo) m.yo.setLatLng(opc.yo); else m.yo = L.circleMarker(opc.yo, { radius: 9, color: "#fff", weight: 3, fillColor: "#1E4F9C", fillOpacity: 1 }).addTo(m.mapa); }
    setTimeout(() => m.mapa.invalidateSize(), 60);
  }
  // Tu posición en el mapa «id» (no sale del móvil)
  function dondeEstoy(id, boton) {
    const m = MAPAS[id]; if (!m) return;
    if (!("geolocation" in navigator)) { avisoMapa(id, "Este móvil no deja saber dónde estás."); return; }
    boton?.classList.add("buscando");
    navigator.geolocation.getCurrentPosition((p) => {
      boton?.classList.remove("buscando");
      const yo = [p.coords.latitude, p.coords.longitude];
      if (m.yo) m.yo.setLatLng(yo); else m.yo = window.L.circleMarker(yo, { radius: 9, color: "#fff", weight: 3, fillColor: "#1E4F9C", fillOpacity: 1 }).bindTooltip("Estás aquí").addTo(m.mapa);
      m.mapa.setView(yo, Math.max(m.mapa.getZoom() || 0, 11));
      if (id === "apc-mapa-libre") muestraZona(id, yo[0], yo[1], "Estás aquí");
    }, (e) => { boton?.classList.remove("buscando"); avisoMapa(id, e.code === 1 ? "No has dado permiso para saber dónde estás. Dale permiso de ubicación a la app o busca un sitio." : "No se ha podido saber dónde estás. Comprueba que la ubicación está encendida."); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  }
  function avisoMapa(id, t) { const c = document.querySelector(`.apc-busca-res[data-mapa="${id}"]`); if (c) c.innerHTML = `<p class="msg err">${esc(t)}</p>`; }
  // Aparcamientos a menos de 30 km de un punto (sitio buscado o tu posición), en otra capa del mapa
  async function muestraZona(id, la, lo, etiqueta) {
    const m = MAPAS[id]; if (!m) return;
    m.ultZona = [la, lo, etiqueta];
    const L = window.L, lista = await cargaPaises(paisesDe([[la, lo]]));
    const cerca = lista.map(x => ({ x, d: km(la, lo, x.lat, x.lon) })).filter(y => y.d <= 30).sort((a, b) => a.d - b.d);
    m.zona.clearLayers();
    L.marker([la, lo], { icon: L.divIcon({ className: "apc-pin-sitio", html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 11] }), title: etiqueta }).bindTooltip(etiqueta).addTo(m.zona);
    for (const { x, d } of cerca) {
      const e = estadoA(x, new Date()), cls = (e === "no" ? "no" : e === "nose" ? "nose" : "si") + (x.mio ? " mio" : "");
      L.marker([x.lat, x.lon], { icon: L.divIcon({ className: "apc-pin " + cls, html: `<span>${x.plazas ? x.plazas : "P"}</span>`, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -16] }), title: nombre(x) })
        .bindPopup(`<ul class="apc-lista apc-popup">${tarjeta(x, d, null)}</ul>`, POPUP_OP()).addTo(m.zona);
    }
    const c = document.querySelector(`.apc-busca-res[data-mapa="${id}"]`);
    if (c) c.innerHTML = `<p class="apc-nota">${cerca.length ? `${cerca.length === 1 ? "1 aparcamiento" : cerca.length + " aparcamientos"} a menos de 30 km de ${esc(etiqueta === "Estás aquí" ? "donde estás" : etiqueta)}. Tócalos en el mapa para ver sus datos.` : `No hay aparcamientos de camiones apuntados a menos de 30 km de ${esc(etiqueta === "Estás aquí" ? "donde estás" : etiqueta)}.`}</p>`;
  }
  // Buscador de sitios encima del mapa (lo pidió Lorena): pueblo, ciudad o código postal. Pasa por la función «ruta» sin guardarse.
  const buscaSitioHTML = (id) => `<form class="apc-busca-sitio" data-mapa="${id}" role="search">
    <input type="search" placeholder="Buscar un sitio: pueblo, ciudad o código postal" autocomplete="off" aria-label="Buscar un sitio en el mapa" enterkeyhint="search">
    <button type="submit" class="btn sec">Buscar</button></form><div class="apc-busca-res" data-mapa="${id}" aria-live="polite"></div>`;
  function enlazaBuscaSitio(caja) {
    caja.querySelectorAll(".apc-busca-sitio").forEach(f => f.onsubmit = async (e) => {
      e.preventDefault();
      const id = f.dataset.mapa, q = f.querySelector("input").value.trim(), res = document.querySelector(`.apc-busca-res[data-mapa="${id}"]`);
      if (q.length < 2) return;
      res.innerHTML = `<p class="apc-nota">Buscando…</p>`;
      try {
        const { data, error } = await sb.functions.invoke("ruta", { body: { buscar: q } });
        if (error || !data || data.error) throw new Error(data?.error || "error");
        const l = data.lugares || [];
        if (!l.length) { res.innerHTML = `<p class="msg err">No encuentro «${esc(q)}». Prueba con el nombre y el país, o con el código postal.</p>`; return; }
        const ir = (x) => { MAPAS[id]?.mapa.setView([x.lat, x.lon], 11); muestraZona(id, x.lat, x.lon, x.nombre); };
        if (l.length === 1) { ir(l[0]); return; }
        res.innerHTML = `<div class="apc-elegir"><h3>¿Cuál es?</h3>${l.map((x, i) => `<button type="button" class="btn sec" data-i="${i}"><b>${esc(x.nombre)}</b><small>${esc(x.detalle || "")}</small></button>`).join("")}</div>`;
        res.querySelectorAll("[data-i]").forEach(b => b.onclick = () => ir(l[+b.dataset.i]));
      } catch (_) { res.innerHTML = `<p class="msg err">No se ha podido buscar. Comprueba que tienes internet.</p>`; }
    });
  }
  // Formulario «¿Algo está mal?» (ventana)
  const VISTOS = new Map();
  const MAL_TIPOS = [["no_existe", "Ya no existe o está cerrado para siempre"], ["no_camiones", "No se puede aparcar con camión"], ["plazas", "Tiene otras plazas para camiones"], ["otro", "Otra cosa (explícalo en la nota)"]];
  function abreMal(osm) {
    const x = VISTOS.get(osm); if (!x) return;
    document.querySelector(".apc-mal-velo")?.remove();
    const v = document.createElement("div"); v.className = "modal-velo apc-mal-velo";
    v.innerHTML = `<form class="modal apc-mal-form" role="dialog" aria-modal="true" novalidate><h2>¿Qué está mal?</h2>
      <p class="apc-nota"><b>${esc(nombre(x))}</b></p>
      <fieldset class="apc-mal-tipos"><legend class="sr-only">Qué está mal</legend>${MAL_TIPOS.map(([k, t], i) => `<label class="check"><input type="radio" name="tipo" value="${k}"${i ? "" : " checked"}> ${t}</label>`).join("")}</fieldset>
      <label class="apc-mal-plazas">Plazas para camiones que tiene <small>(si lo sabes)</small><input name="plazas" inputmode="numeric" maxlength="3" placeholder="Ej: 20"></label>
      <label>Nota<textarea name="nota" maxlength="300" rows="2" placeholder="Opcional. Ej: lo han vallado; ahora es solo para coches"></textarea></label>
      <p class="apc-nota">Le llega a la sección sin saber quién lo manda. Si está bien, lo corrigen para todos. No pongas teléfonos ni nombres de personas.</p>
      <p class="msg" role="status" aria-live="polite"></p>
      <div class="botones"><button type="submit" class="btn">Enviar</button><button type="button" class="btn sec" data-no>Cancelar</button></div></form>`;
    document.body.appendChild(v);
    const f = v.querySelector("form"), msg = f.querySelector(".msg"), cierra = () => v.remove();
    v.onclick = (e) => { if (e.target === v) cierra(); };
    f.querySelector("[data-no]").onclick = cierra;
    // v113 (lo pidió el padre): las plazas se preguntan siempre, sea cual sea el problema
    f.onsubmit = async (e) => {
      e.preventDefault();
      const tipo = f.tipo.value, pl = parseInt(f.plazas.value, 10), nota = f.nota.value.trim(), err = (t) => { msg.textContent = t; msg.classList.add("err"); };
      if (tipo === "plazas" && !(pl >= 0 && pl <= 500)) return err("Pon cuántas plazas para camiones tiene (de 0 a 500).");
      if (f.plazas.value.trim() && !(pl >= 0 && pl <= 500)) return err("Las plazas tienen que ser un número entre 0 y 500.");
      if (tipo === "otro" && nota.length < 5) return err("Explica en la nota qué está mal.");
      const b = f.querySelector("[type=submit]"); b.disabled = true; msg.classList.remove("err"); msg.textContent = "Enviando…";
      try {
        const { data, error } = await sb.rpc("corregir_aparcamiento", { p_osm: x.osm, p_nombre: nombre(x), p_lat: x.lat, p_lon: x.lon, p_tipo: tipo, p_plazas: pl >= 0 && pl <= 500 ? pl : null, p_nota: nota });
        if (error) throw new Error(error.message);
        f.innerHTML = `<h2>Gracias</h2><p>${data === "ya" ? "Otro compañero ya había avisado de lo mismo. La sección lo revisará." : "Enviado a la sección. Cuando lo revisen, se corregirá para todos."}</p><div class="botones"><button type="button" class="btn" data-no>Cerrar</button></div>`;
        f.querySelector("[data-no]").onclick = cierra; f.querySelector("[data-no]").focus();
      } catch (er) { b.disabled = false; err(/Failed to fetch|NetworkError|Load failed/i.test(er.message) ? "No hay conexión. Prueba cuando tengas internet." : er.message); }
    };
  }

  // v113: la ventanita del mapa no se sale de la pantalla ni queda bajo los botones de arriba a la derecha
  const POPUP_OP = () => ({ maxWidth: Math.min(290, innerWidth - 60), minWidth: Math.min(220, innerWidth - 60), autoPanPaddingTopLeft: [12, 12], autoPanPaddingBottomRight: [12, 12], autoPanPadding: [12, 12], className: "apc-popup-caja" });
  // «Lo confirmo» y «Decir qué tiene» (v111)
  // v113: se puede quitar lo dicho (lo pidió el padre): RPC quitar_opinion_aparcamiento borra una opinión igual de ese aparcamiento
  async function quitarOpinion(x, tipo, valor) {
    const { error } = await sb.rpc("quitar_opinion_aparcamiento", { p_osm: x.osm, p_tipo: tipo, p_valor: valor });
    if (error) throw new Error(error.message);
  }
  async function opinar(x, op) {
    if (op.confirma || op.plazas != null || SERVICIOS.some(([k]) => op[k] != null)) await opinarRPC(x, op);
    const o = OPINO[x.osm] = OPINO[x.osm] || {};
    if (op.confirma) o.c = Date.now();
    if (op.plazas != null) o.p = op.plazas;
    for (const [k] of SERVICIOS) if (op[k] != null) (o.s = o.s || {})[k] = op[k];
    guardaOpino(); OPINIONES = null;
  }
  async function opinarRPC(x, op) {
    const { error } = await sb.rpc("opinar_aparcamiento2", { p_osm: x.osm, p_nombre: nombre(x), p_lat: x.lat, p_lon: x.lon, p_confirma: !!op.confirma, p_plazas: op.plazas ?? null,
      p_aseos: op.aseos ?? null, p_duchas: op.duchas ?? null, p_vigilado: op.vigilado ?? null, p_comida: op.comida ?? null });
    if (error) throw new Error(error.message);
  }
  const errRed = (e) => /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? "No hay conexión. Prueba cuando tengas internet." : e.message;
  async function confirmaApc(b) {
    const x = VISTOS.get(b.dataset.confirma); if (!x) return;
    b.disabled = true; const antes = b.innerHTML; b.textContent = "Enviando…";
    try {
      if (yaConfirmado(x.osm)) { await quitarOpinion(x, "confirma", true); delete OPINO[x.osm].c; guardaOpino(); OPINIONES = null; b.textContent = "Quitada tu confirmación"; }
      else { await opinar(x, { confirma: true }); b.textContent = "Confirmado. Gracias"; }
      setTimeout(refrescaMios, 1200);
    }
    catch (e) { b.disabled = false; b.innerHTML = antes; avisoOpina(b, errRed(e)); }
  }
  function avisoOpina(b, t) { const p = document.createElement("p"); p.className = "msg err"; p.textContent = t; b.closest(".apc-opina")?.after(p); setTimeout(() => p.remove(), 6000); }
  function abreServicios(osm) {
    const x = VISTOS.get(osm); if (!x) return;
    document.querySelector(".apc-mal-velo")?.remove();
    const mio = OPINO[osm]?.s || {}, ya = yaConfirmado(osm), miasPl = OPINO[osm]?.p;
    const v = document.createElement("div"); v.className = "modal-velo apc-mal-velo";
    v.innerHTML = `<form class="modal apc-mal-form apc-serv-form" role="dialog" aria-modal="true" novalidate><h2>¿Qué tiene este aparcamiento?</h2>
      <p class="apc-nota"><b>${esc(nombre(x))}</b></p>
      <button type="button" class="btn sec apc-solo" data-solo>No tiene nada: solo aparcamiento</button>
      ${SERVICIOS.map(([k, t]) => { const m = mio[k] === true ? "si" : mio[k] === false ? "no" : ""; return `<div class="apc-serv" role="radiogroup" aria-label="${esc(t)}"><b class="apc-serv-tit">${esc(t)}</b><div class="apc-serv-ops">${[["si", "Sí"], ["no", "No"], ["", "No lo sé"]].map(([val, tt]) => `<label class="check"><input type="radio" name="${k}" value="${val}"${val === m ? " checked" : ""}> ${tt}</label>`).join("")}</div></div>`; }).join("")}
      <label class="apc-serv-pl">Plazas para camiones <small>(si lo sabes)</small><input name="plazas" inputmode="numeric" maxlength="3" placeholder="Ej: 20" value="${miasPl != null ? esc(String(miasPl)) : ""}"></label>
      ${ya ? "" : `<label class="check"><input type="checkbox" name="confirma"> También confirmo que existe y se puede aparcar con camión</label>`}
      <p class="apc-nota">Sale enseguida para todos, sin saber quién lo manda. Si varios compañeros dicen cosas distintas, sale lo que diga la mayoría. Para quitar lo que dijiste, elige «No lo sé» o borra las plazas.</p>
      <p class="msg" role="status" aria-live="polite"></p>
      <div class="botones"><button type="submit" class="btn">Enviar</button><button type="button" class="btn sec" data-no>Cancelar</button></div></form>`;
    document.body.appendChild(v);
    const f = v.querySelector("form"), msg = f.querySelector(".msg"), cierra = () => v.remove();
    v.onclick = (e) => { if (e.target === v) cierra(); };
    f.querySelector("[data-no]").onclick = cierra;
    f.querySelector("[data-solo]").onclick = () => SERVICIOS.forEach(([k]) => { const r = f.querySelector(`[name=${k}][value=no]`); if (r) r.checked = true; });
    f.onsubmit = async (e) => {
      e.preventDefault();
      const op = { confirma: !!f.confirma?.checked }, quita = [];
      const plT = f.plazas.value.trim(), pl = parseInt(plT, 10);
      if (plT && !(String(pl) === plT && pl >= 0 && pl <= 500)) { msg.textContent = "Las plazas tienen que ser un número entre 0 y 500."; msg.classList.add("err"); f.plazas.focus(); return; }
      const quitaPl = miasPl != null && (plT === "" || pl !== miasPl); if (plT && pl !== miasPl) op.plazas = pl;
      for (const [k] of SERVICIOS) { const r = f.querySelector(`[name=${k}]:checked`)?.value; if (r === "si") op[k] = true; else if (r === "no") op[k] = false; }
      // Solo se manda lo que ha cambiado respecto a lo que ya dijo este móvil; si cambia o pasa a «No lo sé», se quita lo de antes
      for (const [k] of SERVICIOS) { if (op[k] != null && mio[k] === op[k]) delete op[k]; else if (typeof mio[k] === "boolean") quita.push(k); }
      if (!op.confirma && !quita.length && !quitaPl && op.plazas == null && !SERVICIOS.some(([k]) => op[k] != null)) { msg.textContent = "Marca «Sí» o «No» en algo, o pon las plazas, antes de enviar."; msg.classList.add("err"); return; }
      const b = f.querySelector("[type=submit]"); b.disabled = true; msg.classList.remove("err"); msg.textContent = "Enviando…";
      try {
        for (const k of quita) { await quitarOpinion(x, k, mio[k]); delete OPINO[x.osm].s[k]; }
        if (quitaPl) { await quitarOpinion(x, "plazas", true); delete OPINO[x.osm].p; }
        await opinar(x, op);
        f.innerHTML = `<h2>Gracias</h2><p>Ya sale para todos los compañeros.</p><div class="botones"><button type="button" class="btn" data-no>Cerrar</button></div>`;
        f.querySelector("[data-no]").onclick = () => { cierra(); refrescaMios(); }; f.querySelector("[data-no]").focus();
      } catch (er) { b.disabled = false; msg.textContent = errRed(er); msg.classList.add("err"); }
    };
  }

  // ---------- Añadir un aparcamiento desde el mapa (v106) ----------
  const MIO_TXT = { "": "Tuyo · solo en este móvil", ok: "Tuyo · propuesto a la sección", ya: "Tuyo · ya lo había propuesto otro compañero" };
  const accionesMio = (idm) => { const m = MIOS.find(z => z.id === idm); if (!m) return "";
    return `<div class="apc-mio-acc">${m.propuesto ? "" : `<button type="button" class="btn sec" data-mio-propone="${esc(idm)}">Proponer a los compañeros</button>`}<button type="button" class="btn sec" data-mio-borra="${esc(idm)}">Borrar</button></div>`; };
  const formAnadirHTML = (id) => `<form class="panel apc-nuevo" data-mapa="${id}" autocomplete="off" novalidate>
    <h3>Añadir un aparcamiento</h3>
    <p class="apc-nota apc-nuevo-sitio">Toca en el mapa el sitio del aparcamiento, o usa tu posición si estás en él.</p>
    <button type="button" class="btn sec" data-nuevo-yo>${icono("lugar", "p")}Estoy aquí: usar mi posición</button>
    <label>Nombre<input name="nombre" maxlength="80" placeholder="Ej: Gasolinera de la salida 12" enterkeyhint="next"></label>
    <label>Plazas para camiones (si lo sabes)<input name="plazas" inputmode="numeric" maxlength="3" placeholder="Opcional"></label>
    <div class="apc-nuevo-checks"><label class="check"><input type="checkbox" name="vigilado"> Vigilado</label><label class="check"><input type="checkbox" name="duchas"> Duchas</label><label class="check"><input type="checkbox" name="aseos"> Aseos</label></div>
    <label>Nota<textarea name="nota" maxlength="300" rows="2" placeholder="Opcional. Ej: se llena a partir de las 19 h; la entrada está detrás"></textarea></label>
    <label class="check"><input type="checkbox" name="proponer"> Proponerlo también a los compañeros</label>
    <p class="apc-nota">Se guarda en este móvil. Si lo propones, sale enseguida en el mapa de todos. No se envía quién eres: no pongas teléfonos ni nombres de personas.</p>
    <div class="apc-nuevo-bot"><button type="submit" class="btn">Guardar</button><button type="button" class="btn sec" data-nuevo-no>Cancelar</button></div>
    <p class="msg" role="status" aria-live="polite"></p>
  </form>`;
  function empiezaAnadir(id) {
    const m = MAPAS[id]; if (!m) return;
    m.anadiendo = true; m.div.classList.add("apc-anadiendo");
    let f = document.querySelector(`.apc-nuevo[data-mapa="${id}"]`);
    if (!f) {
      m.div.insertAdjacentHTML("afterend", formAnadirHTML(id));
      f = document.querySelector(`.apc-nuevo[data-mapa="${id}"]`);
      f.querySelector("[data-nuevo-no]").onclick = () => terminaAnadir(id);
      f.querySelector("[data-nuevo-yo]").onclick = () => {
        const b = f.querySelector("[data-nuevo-yo]"); b.disabled = true;
        posicion().then(p => { ponSitio(id, p.lat, p.lon); MAPAS[id]?.mapa.setView([p.lat, p.lon], 16); })
          .catch(e => msgAnadir(id, e.message, true)).finally(() => { b.disabled = false; });
      };
      f.onsubmit = (e) => { e.preventDefault(); guardaAnadir(id); };
    }
    // No se baja al formulario: primero hay que tocar el mapa, que se queda a la vista
    let av = m.div.querySelector(".apc-anade-aviso");
    if (!av) { av = document.createElement("div"); av.className = "apc-anade-aviso"; av.textContent = "Toca en el mapa el sitio del aparcamiento"; m.div.appendChild(av); }
  }
  function ponSitio(id, la, lo) {
    const m = MAPAS[id], f = document.querySelector(`.apc-nuevo[data-mapa="${id}"]`); if (!m || !f) return;
    if (la < 34 || la > 72 || lo < -25 || lo > 45) { msgAnadir(id, "El sitio tiene que estar en Europa.", true); return; }
    f.dataset.lat = la.toFixed(6); f.dataset.lon = lo.toFixed(6);
    const L = window.L, icon = L.divIcon({ className: "apc-pin mio nuevo", html: "<span>+</span>", iconSize: [36, 36], iconAnchor: [18, 18] });
    if (m.nuevo) m.nuevo.setLatLng([la, lo]); else m.nuevo = L.marker([la, lo], { icon, title: "Aparcamiento nuevo" }).addTo(m.mapa);
    f.querySelector(".apc-nuevo-sitio").textContent = "Sitio marcado en el mapa. Si no es ese, toca otra vez en el mapa.";
    m.div.querySelector(".apc-anade-aviso")?.remove();
    if (m.div.classList.contains("completa")) m.div._cierraGrande?.();
    setTimeout(() => { f.scrollIntoView({ behavior: "smooth", block: "start" }); f.querySelector("[name=nombre]").focus({ preventScroll: true }); }, 120);
    msgAnadir(id, "");
  }
  function msgAnadir(id, t, err) { const p = document.querySelector(`.apc-nuevo[data-mapa="${id}"] .msg`); if (p) { p.textContent = t || ""; p.classList.toggle("err", !!err); } }
  function terminaAnadir(id) {
    const m = MAPAS[id];
    if (m) { m.anadiendo = false; m.div.classList.remove("apc-anadiendo"); m.div.querySelector(".apc-anade-aviso")?.remove(); m.nuevo?.remove(); m.nuevo = null; }
    document.querySelector(`.apc-nuevo[data-mapa="${id}"]`)?.remove();
  }
  async function proponer(x) {
    try {
      const { data, error } = await sb.rpc("proponer_aparcamiento", { p_lat: x.lat, p_lon: x.lon, p_nombre: x.nombre, p_nota: x.nota || "", p_plazas: x.plazas || null, p_vigilado: !!x.vigilado, p_duchas: !!x.duchas, p_aseos: !!x.aseos });
      if (error) throw new Error(error.message);
      COMPAS = null; // v111: ya sale a todos; la próxima vez se vuelve a pedir la lista
      // v113: el servidor devuelve «ok:<id>:<llave>»; con la llave, solo este móvil puede quitarlo luego del mapa de todos
      const m = /^ok:(\d+):([0-9a-f]{20,})$/.exec(String(data || "")); if (m) x.co = { id: +m[1], llave: m[2] };
      return data === "ya" ? "ya" : "ok";
    } catch (e) { throw new Error(/Failed to fetch|NetworkError|Load failed/i.test(e.message) ? "No hay conexión: se ha guardado solo en tu móvil. Propónlo más tarde desde «Mis aparcamientos»." : e.message); }
  }
  async function guardaAnadir(id) {
    const f = document.querySelector(`.apc-nuevo[data-mapa="${id}"]`); if (!f) return;
    if (!f.dataset.lat) { msgAnadir(id, "Primero toca en el mapa el sitio del aparcamiento (o usa tu posición).", true); return; }
    const v = (n) => f.querySelector(`[name=${n}]`), nom = v("nombre").value.trim(), nota = v("nota").value.trim(), pl = parseInt(v("plazas").value, 10);
    if (nom.length < 3) { msgAnadir(id, "Escribe un nombre para el aparcamiento (mínimo 3 letras).", true); v("nombre").focus(); return; }
    if (v("plazas").value.trim() && !(pl >= 1 && pl <= 500)) { msgAnadir(id, "Las plazas tienen que ser un número entre 1 y 500.", true); v("plazas").focus(); return; }
    const x = { id: "mio:" + Date.now().toString(36), lat: +f.dataset.lat, lon: +f.dataset.lon, nombre: nom, nota, plazas: pl > 0 ? pl : null, vigilado: v("vigilado").checked, duchas: v("duchas").checked, aseos: v("aseos").checked, propuesto: "", t: Date.now() };
    let aviso = "Guardado en tu móvil.";
    if (v("proponer").checked) {
      f.querySelector("[type=submit]").disabled = true; msgAnadir(id, "Enviando a la sección…");
      try { x.propuesto = await proponer(x); aviso = x.propuesto === "ya" ? "Guardado. Otro compañero ya había propuesto este sitio." : "Guardado. Ya sale en el mapa de todos."; }
      catch (e) { f.querySelector("[type=submit]").disabled = false; msgAnadir(id, e.message, true); if (!/conexión/.test(e.message)) return; aviso = e.message; }
    }
    MIOS.push(x); guardaMios();
    terminaAnadir(id);
    await refrescaMios();
    if (!MAPAS[id]?.ultZona && id === "apc-mapa-libre") muestraZona(id, x.lat, x.lon, x.nombre);
    avisoMios(aviso);
  }
  function avisoMios(t) { const p = $("apc-mios-msg"); if (p) { p.textContent = t; p.classList.remove("err"); } estado(t); }
  // Vuelve a pintar todo lo que enseña aparcamientos
  async function refrescaMios() {
    pintaMios(); CERCA = [];
    for (const id in MAPAS) { const z = MAPAS[id].ultZona; if (z && !MAPAS[id].div.hidden) muestraZona(id, ...z); }
    if (RUTA) {
      const [lista, oficiales] = await Promise.all([cargaPaises(paisesDe(RUTA.puntos)), cargaOficiales(RUTA)]);
      EN_RUTA = enRuta(juntaOficiales(lista, oficiales), RUTA.puntos, RUTA);
      if (VIAJE) VIAJE.firma = "";
      repinta();
    }
  }
  function pintaMios() {
    const c = $("apc-mios-lista"), s = $("apc-mios-num"); if (!c) return;
    if (s) s.textContent = MIOS.length ? `(${MIOS.length})` : "";
    c.innerHTML = MIOS.length ? `<ul class="apc-lista">${MIOS.slice().reverse().map(m => `<li class="apc">
        <b class="apc-nom">${esc(m.nombre)}</b>
        <div class="apc-mio-etq">${esc(MIO_TXT[m.propuesto] || MIO_TXT[""])}</div>
        ${m.plazas || m.vigilado || m.duchas || m.aseos ? `<div class="apc-extra">${[m.plazas ? m.plazas + " plazas camión" : "", m.vigilado ? "Vigilado" : "", m.duchas ? "Duchas" : "", m.aseos ? "Aseos" : ""].filter(Boolean).map(e => `<span>${esc(e)}</span>`).join("")}</div>` : ""}
        ${m.nota ? `<p class="apc-nota-c">${esc(m.nota)}</p>` : ""}
        <div class="apc-mio-acc"><button type="button" class="btn sec" data-mio-ver="${esc(m.id)}">${icono("lugar", "p")}Ver en el mapa</button>${llevarHref(m) ? `<a class="btn sec apc-llevar" href="${esc(llevarHref(m))}">Llevarme aquí</a>` : ""}</div>
        ${accionesMio(m.id)}</li>`).join("")}</ul>`
      : `<p class="apc-nota">Todavía no has añadido ninguno. Abre el mapa y toca «Añadir aparcamiento».</p>`;
  }
  // Copia en PDF de «Mis aparcamientos» (v108): la lista legible y, dentro, los datos para recuperarlos en otro móvil
  const MARCA_MIOS = "%CCOO-APARCAMIENTOS:";
  async function copiaMios() {
    if (!MIOS.length) { avisoMios("Todavía no tienes ningún aparcamiento guardado."); return; }
    const logo = typeof logoParaPDF === "function" ? await logoParaPDF() : null, X = logo ? 70 : 0, ROJO = [0.67, 0.06, 0.07];
    const L = [{ banda: "CCOO Calsina Carré · Mis aparcamientos", color: ROJO, tam: 13, x: X }, ["", 6],
      [`${MIOS.length === 1 ? "1 aparcamiento" : MIOS.length + " aparcamientos"} · Hecho el ${new Date().toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 10, false, X], ["", 10]];
    MIOS.forEach(m => {
      L.push([m.nombre, 13, true]);
      L.push([`Coordenadas: ${(+m.lat).toFixed(5)}, ${(+m.lon).toFixed(5)}`, 10]);
      const extra = [m.plazas ? m.plazas + " plazas camión" : "", m.vigilado ? "vigilado" : "", m.duchas ? "duchas" : "", m.aseos ? "aseos" : ""].filter(Boolean).join(" · ");
      if (extra) L.push([extra, 10]);
      if (m.nota) L.push(["Nota: " + m.nota, 10]);
      L.push([MIO_TXT[m.propuesto] || MIO_TXT[""], 9, false, 0, [0.4, 0.4, 0.4]], ["", 8]);
    });
    L.push(["Para recuperarlos: en «Aparcamientos en mi ruta», abre «Mis aparcamientos» y toca «Recuperar una copia».", 9, false, 0, [0.4, 0.4, 0.4]]);
    const datos = { app: "ccoo-aparcamientos", mios: MIOS };
    const pdf = pdfSencillo(L, MARCA_MIOS + btoa(unescape(encodeURIComponent(JSON.stringify(datos)))), { logo });
    const nom = "mis-aparcamientos-" + new Date().toISOString().slice(0, 10) + ".pdf";
    try { const f = new File([pdf], nom, { type: "application/pdf" }); if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: nom }); return; } } catch (e) { if (e?.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(pdf); a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function recuperaMios(f) {
    try {
      const d = leePDFSencillo(await f.text(), MARCA_MIOS);
      if (d?.app !== "ccoo-aparcamientos" || !Array.isArray(d.mios)) throw 0;
      const txt = (v, n) => String(v ?? "").slice(0, n);
      const nuevos = d.mios.filter(m => m && Number.isFinite(+m.lat) && Number.isFinite(+m.lon) && +m.lat >= 34 && +m.lat <= 72 && +m.lon >= -25 && +m.lon <= 45 && String(m.nombre || "").trim())
        .map(m => ({ id: /^mio:[a-z0-9]+$/.test(m.id) ? m.id : "mio:" + Math.random().toString(36).slice(2, 10), lat: +m.lat, lon: +m.lon, nombre: txt(m.nombre, 80), nota: txt(m.nota, 300), plazas: +m.plazas > 0 && +m.plazas <= 500 ? Math.round(+m.plazas) : null,
          vigilado: !!m.vigilado, duchas: !!m.duchas, aseos: !!m.aseos, propuesto: ["ok", "ya"].includes(m.propuesto) ? m.propuesto : "", t: +m.t || Date.now() }))
        .filter(m => !MIOS.some(z => z.id === m.id || cercaDe(z, m)));
      if (!nuevos.length) { avisoMios("Esa copia no tiene aparcamientos nuevos: ya los tienes todos."); return; }
      if (!confirm(`La copia tiene ${nuevos.length === 1 ? "1 aparcamiento que no tienes" : nuevos.length + " aparcamientos que no tienes"}. Se añaden a los de este móvil. ¿Seguir?`)) return;
      MIOS.push(...nuevos); guardaMios(); await refrescaMios(); avisoMios(nuevos.length === 1 ? "Recuperado 1 aparcamiento." : `Recuperados ${nuevos.length} aparcamientos.`);
    } catch (_) { const p = $("apc-mios-msg"); if (p) { p.textContent = "Ese archivo no es una copia de «Mis aparcamientos»."; p.classList.add("err"); } }
  }

  // Botones de «Mis aparcamientos» (en la lista, en las tarjetas y en las ventanitas del mapa)
  async function accionMio(e) {
    const b = e.target.closest("[data-mio-borra],[data-mio-propone],[data-mio-ver]"); if (!b) return;
    const idm = b.dataset.mioBorra || b.dataset.mioPropone || b.dataset.mioVer, m = MIOS.find(z => z.id === idm); if (!m) return;
    if (b.dataset.mioVer) {
      if ($("apc-libre").hidden) abreMapaLibre();
      await pintaMapa("apc-mapa-libre", [], { ruta: false });
      MAPAS["apc-mapa-libre"]?.mapa.setView([m.lat, m.lon], 15);
      muestraZona("apc-mapa-libre", m.lat, m.lon, m.nombre);
      $("apc-mapa-libre").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (b.dataset.mioBorra) {
      const todos = m.propuesto === "ok" && m.co;
      if (!confirm(`¿Borrar «${m.nombre}»?` + (todos ? " Se quita de tu móvil y del mapa de todos." : m.propuesto === "ok" ? " Se quita de tu móvil. Lo enviaste antes de que se pudiera quitar desde aquí: para quitarlo del mapa de todos, avisa a la sección." : ""))) return;
      if (todos) {
        b.disabled = true;
        try { const { error } = await sb.rpc("quitar_mi_aparcamiento", { p_id: m.co.id, p_llave: m.co.llave }); if (error) throw new Error(error.message); COMPAS = null; }
        catch (er) { b.disabled = false; const t = errRed(er); const p = $("apc-mios-msg"); if (p) { p.textContent = t; p.classList.add("err"); } estado(t, true); return; }
      }
      MIOS = MIOS.filter(z => z.id !== idm); guardaMios(); await refrescaMios(); avisoMios(todos ? "Borrado de tu móvil y del mapa de todos." : "Borrado de tu móvil."); return;
    }
    b.disabled = true;
    try { m.propuesto = await proponer(m); guardaMios(); await refrescaMios(); avisoMios(m.propuesto === "ya" ? "Otro compañero ya había propuesto este sitio." : "Enviado. Ya sale en el mapa de todos."); }
    catch (er) { b.disabled = false; const p = $("apc-mios-msg"); if (p) { p.textContent = er.message; p.classList.add("err"); } estado(er.message, true); }
  }

  // Mapa sin ruta (debajo del formulario): busca un sitio o toca «Dónde estoy»
  function abreMapaLibre() {
    const c = $("apc-libre"); c.hidden = !c.hidden;
    $("apc-abre-mapa").setAttribute("aria-expanded", !c.hidden);
    $("apc-abre-mapa").lastChild.textContent = c.hidden ? "Abrir el mapa" : "Cerrar el mapa";
    if (c.hidden) return;
    if (!c.querySelector(".apc-busca-sitio")) { c.insertAdjacentHTML("afterbegin", buscaSitioHTML("apc-mapa-libre")); enlazaBuscaSitio(c); }
    pintaMapa("apc-mapa-libre", [], { ruta: false });
  }

  addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelector(".apc-mapa.completa")?._cierraGrande?.(); });
  addEventListener("hashchange", () => document.querySelector(".apc-mapa.completa")?._cierraGrande?.());

  function ponVista(v) {
    AJ.vista = v; guarda();
    document.querySelectorAll("#v-aparcar [data-apc-vista]").forEach(b => { b.classList.toggle("activa", b.dataset.apcVista === v); b.setAttribute("aria-pressed", b.dataset.apcVista === v); });
    if (VIAJE) { VIAJE.firma = ""; repinta(); } else pintaTodos();
  }

  // Lista larga de toda la ruta, con un rótulo cada 100 km para ubicarse al bajar (lo pidió el padre: verlos todos con sus distancias)
  function listaPorTramos(ver) {
    let html = "", tramo = -1;
    for (const y of ver) {
      const t = Math.floor(y.x.kmRuta / 100);
      if (t !== tramo) { html += `${tramo < 0 ? "" : "</ul>"}<h3 class="apc-tramo">Del km ${t * 100} al ${t * 100 + 100}</h3><ul class="apc-lista">`; tramo = t; }
      html += tarjeta(y.x, y.x.kmRuta, y.llega);
    }
    return html + "</ul>";
  }

  // ---------- Viaje en marcha ----------
  async function pideCandado() { try { if ("wakeLock" in navigator) CANDADO = await navigator.wakeLock.request("screen"); } catch (_) { CANDADO = null; } }
  function habla(t) {
    if (!AJ.voz || !("speechSynthesis" in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "es-ES"; u.rate = 0.95; speechSynthesis.speak(u); } catch (_) {}
  }
  function empiezaViaje(sinDestino = false) {
    if (!("geolocation" in navigator)) { estado("Este móvil no deja saber dónde estás.", true); return; }
    VIAJE = { sinDestino: sinDestino === true, idx: 0, pos: null };
    ULT_VOZ = ""; ANTES = null;
    $("apc-preparar").hidden = true; $("apc-viaje").hidden = false;
    $("apc-viaje-tit").textContent = VIAJE.sinDestino ? "Delante de ti" : "Por delante en tu ruta";
    $("apc-proximos").innerHTML = `<p class="apc-nota">Buscando dónde estás…</p>`; $("apc-proximos").hidden = false; $("apc-mapa-viaje").hidden = true;
    if (MAPAS["apc-mapa-viaje"]) MAPAS["apc-mapa-viaje"].encuadrado = false;
    document.querySelectorAll("#apc-viaje [data-apc-vista]").forEach(b => { b.classList.toggle("activa", b.dataset.apcVista === AJ.vista); b.setAttribute("aria-pressed", b.dataset.apcVista === AJ.vista); });
    pideCandado();
    VIGIA = navigator.geolocation.watchPosition(enMarcha, (e) => { $("apc-proximos").innerHTML = `<p class="msg err">${e.code === 1 ? "Sin permiso de ubicación no puedo saber qué tienes por delante. Dale permiso a la app en los ajustes del móvil." : "No se ha podido saber dónde estás. Comprueba que la ubicación está encendida."}</p>`; },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
    window.scrollTo(0, 0);
  }
  function terminaViaje() {
    if (VIGIA != null) navigator.geolocation.clearWatch(VIGIA);
    VIGIA = null; VIAJE = null;
    try { CANDADO?.release(); } catch (_) {} CANDADO = null;
    try { speechSynthesis.cancel(); } catch (_) {}
    $("apc-viaje").hidden = true; $("apc-preparar").hidden = false;
  }
  async function enMarcha(p) {
    if (!VIAJE) return;
    VIAJE.ultima = p;
    const a = p.coords.latitude, o = p.coords.longitude, ahora = Date.now();
    let lista = [];
    if (!VIAJE.sinDestino && RUTA) {
      // Dónde vamos de la ruta: el punto más cercano, sin volver atrás
      const pts = RUTA.puntos; let mejor = 1e9, idx = VIAJE.idx;
      for (let i = Math.max(0, VIAJE.idx - 20); i < pts.length; i++) { const d = km(a, o, pts[i][0], pts[i][1]); if (d < mejor) { mejor = d; idx = i; } if (d > mejor + 30) break; }
      VIAJE.idx = idx;
      const yaKm = pts[idx][2], yaMin = pts[idx][3];
      lista = EN_RUTA.filter(x => x.kmRuta > yaKm + 0.3).map(x => ({ x, falta: x.kmRuta - yaKm, llega: new Date(ahora + (x.minRuta - yaMin) * 60000) }));
      VIAJE.yaKm = yaKm;
      // Cortes graves por delante (los 3 primeros) y aviso en voz del siguiente
      const delante = (CORTES || []).filter(x => GRAVE.includes(x.tipo) && x.kmRuta > yaKm - 0.3);
      $("apc-cortes-viaje").innerHTML = delante.length ? `<ul class="apc-lista apc-cortes">${delante.slice(0, 3).map(x => corteHTML(x, x.kmRuta - yaKm)).join("")}</ul>` : "";
      if (delante[0] && delante[0].id !== VIAJE.ultCorte) { VIAJE.ultCorte = delante[0].id; habla(`Atención: ${TIPO_CORTE[delante[0].tipo]}${delante[0].via ? " en la " + delante[0].via : ""}, a ${Math.round(delante[0].kmRuta - yaKm)} kilómetros.`); }
      $("apc-viaje-info").textContent = mejor > 3 ? "Te has salido de la ruta calculada: los kilómetros pueden no cuadrar." : `Quedan ${Math.round(pts[pts.length - 1][2] - yaKm)} km hasta ${RUTA.hasta.nombre}.`;
    } else {
      // Sin destino: los que hay delante en la dirección en la que vas (rumbo del GPS o de los dos últimos puntos)
      if (!CERCA.length) CERCA = await cargaPaises(paisesDe([[a, o]]));
      let r = Number.isFinite(p.coords.heading) && p.coords.speed > 2 ? p.coords.heading : null;
      if (r == null && ANTES && km(ANTES.a, ANTES.o, a, o) > 0.05) r = rumbo(ANTES.a, ANTES.o, a, o);
      if (!ANTES || km(ANTES.a, ANTES.o, a, o) > 0.05) ANTES = { a, o, r };
      if (r == null) r = ANTES?.r;
      const vel = p.coords.speed > 5 ? p.coords.speed * 3.6 : 75;
      lista = CERCA.map(x => ({ x, falta: km(a, o, x.lat, x.lon) * 1.2, rb: rumbo(a, o, x.lat, x.lon) }))
        .filter(y => y.falta <= 150 && (r == null || Math.abs(((y.rb - r + 540) % 360) - 180) <= 35))
        .map(y => ({ ...y, llega: new Date(ahora + (y.falta / vel) * 3600000) })).sort((u, v) => u.falta - v.falta);
      $("apc-viaje-info").textContent = r == null ? "Cuando empieces a moverte sabré hacia dónde vas. Mientras, salen los que tienes alrededor." : "Distancias aproximadas, en la dirección en la que vas.";
    }
    const abiertos = lista.filter(y => estadoA(y.x, y.llega) !== "no");
    const vale = abiertos;
    const cerrados = lista.length - abiertos.length;
    // Con «Ver también los cerrados» salen todos, los cerrados en gris y marcados
    const mostrar = AJ.cerrados ? lista : vale;
    // Salen todos los que quedan por delante (se baja para ver más). Para no mover la lista mientras se mira,
    // se repinta como mucho cada 10 s, salvo que cambie el primero.
    const enMapa = AJ.vista === "mapa";
    $("apc-proximos").hidden = enMapa; $("apc-mapa-viaje").hidden = !enMapa;
    if (enMapa) MAPAS["apc-mapa-viaje"]?.yo?.setLatLng([a, o]);
    const firma = AJ.vista + mostrar.map(y => y.x.osm).join(), ahoraP = Date.now();
    if (firma === VIAJE.firma && ahoraP - PINTADO < 10000) return;
    VIAJE.firma = firma; PINTADO = ahoraP;
    if (enMapa) pintaMapa("apc-mapa-viaje", mostrar, { yo: [a, o], ruta: !VIAJE.sinDestino, desdeKm: VIAJE.sinDestino ? null : VIAJE.yaKm });
    else $("apc-proximos").innerHTML = mostrar.length
      ? `<p class="apc-cuenta">${mostrar.length === 1 ? "1 aparcamiento" : mostrar.length + " aparcamientos"} por delante, del más cercano al más lejano. Baja para verlos todos.</p><ul class="apc-lista">${mostrar.map(y => tarjeta(y.x, y.falta, y.llega)).join("")}</ul>${cerrados && !AJ.cerrados ? `<p class="apc-nota">${cerrados} por delante estarán cerrados cuando llegues: no salen. Para verlos, marca «Ver también los cerrados».</p>` : ""}`
      : `<p class="desc-vacio">No hay aparcamientos abiertos por delante.</p>`;
    const primero = vale[0];
    if (primero && primero.x.osm !== ULT_VOZ) {
      ULT_VOZ = primero.x.osm;
      habla(`Próximo aparcamiento abierto: ${nombre(primero.x)}, a ${Math.round(primero.falta)} kilómetros.${primero.x.plazas ? ` ${primero.x.plazas} plazas para camiones.` : ""}`);
    }
  }

  // Repinta con lo último (al llegar un aviso nuevo)
  function repinta() { if (VIAJE?.ultima) enMarcha(VIAJE.ultima); else pintaTodos(); }
  function buscaEn(osm) { return EN_RUTA.find(x => x.osm === osm) || CERCA.find(x => x.osm === osm); }
  const YA = {}; // lo que ya ha avisado este móvil (para no repetir por error)
  async function avisar(osm, tipo) {
    const x = buscaEn(osm); if (!x) return;
    const que = { cerrado: "está cerrado", lleno: "está lleno", abierto: "está abierto" }[tipo];
    if (YA[osm + tipo] && Date.now() - YA[osm + tipo] < 30 * 60000) { estado("Ya lo has avisado hace poco. Gracias."); return; }
    if (!confirm(`¿Avisar a los compañeros de que «${nombre(x)}» ${que}?`)) return;
    try {
      const { data, error } = await sb.rpc("avisar_aparcamiento", { p_osm: osm, p_tipo: tipo });
      if (error || !["ok", "ya avisado"].includes(data)) throw error || new Error(String(data));
      YA[osm + tipo] = Date.now();
      AVISOS[osm] = { tipo, t: Date.now() };
      estado(`Gracias: tus compañeros verán que ${que} durante ${VALE_H[tipo]} horas.`);
      repinta();
    } catch (_) { estado("No se ha podido enviar el aviso. Comprueba que tienes internet.", true); }
  }

  // v95: guía rápida con un botón «Ir» en cada paso (si aún no hay ruta, lleva al formulario)
  const visible = (...sels) => () => sels.map(x => document.querySelector(x)).find(e => e && e.offsetParent);
  const GUIA_APC = () => [
    [T("Calcular la ruta"), T("Escribe adónde vas (y desde dónde, si no es donde estás) y pulsa «Buscar ruta para camión». Pon las medidas de tu camión para que la ruta le sirva."), visible("#apc-hasta", "#apc-cambiar")],
    [T("Pueblos con el mismo nombre"), T("Si hay varios sitios que se llaman igual, pon el código postal o elige el bueno de la lista que te sale."), visible("#apc-hasta-cp", "#apc-cambiar")],
    [T("Prohibiciones de circular"), T("Si el día del viaje hay prohibición para camiones en algún país por donde pasas (fines de semana, festivos…), te aviso con la hora. Cambia «Salgo a las» para ver si te pilla."), visible("#apc-sec-prohib", "#apc-buscar")],
    [T("Dónde te toca parar"), T("Con la ruta hecha te digo en qué kilómetro y a qué hora te toca la pausa de 45 minutos (cada 4 h 30 de conducción) y el descanso diario, con los aparcamientos que tienes justo antes. Si ya has conducido hoy, ponlo en «¿Ya has conducido hoy?»."), visible("#apc-sec-paradas", "#apc-buscar")],
    [T("Los aparcamientos de la ruta"), T("Con la ruta hecha ves todos los aparcamientos que tienes por delante, con las plazas para camiones y si estarán abiertos. Con los filtros buscas por pueblo, duchas, vigilado…"), visible("#apc-sec-aparc", "#apc-buscar")],
    [T("Lista o mapa"), T("Cambia entre la lista y el mapa. En el móvil, el mapa se mueve con dos dedos; con «Pantalla completa» se maneja con uno."), visible("[data-apc-vista]", "#apc-abre-mapa")],
    [T("Cortes y peajes"), T("Debajo salen los cortes oficiales de la carretera (los graves, en rojo) y el precio aproximado de los peajes."), visible("#apc-sec-cortes", "#apc-buscar")],
    [T("Durante el viaje"), T("Pulsa «Empezar viaje»: la pantalla no se apaga y te enseño los aparcamientos que tienes delante. Si quieres, te los digo en voz alta."), visible("#apc-empezar", "#apc-voz", "#apc-buscar")],
    [T("Llevarme aquí"), T("En cada aparcamiento, «Llevarme aquí» lo abre en el navegador que uses en el móvil (iGO, Google Maps…)."), visible(".apc-llevar", "#apc-buscar")],
    [T("Sin cobertura"), T("La última ruta que calculas se guarda en el móvil. Si te quedas sin internet, toca «Abrir la última ruta»: verás la ruta, los aparcamientos y dónde te toca parar."), visible("#apc-ultima", "#apc-buscar", "#apc-cambiar")],
    [T("Mapa sin ruta"), T("Para mirar una zona sin calcular ruta, abre el mapa y toca «Dónde estoy» o busca un sitio."), visible("#apc-abre-mapa", "#apc-cambiar")],
    [T("Confirmar y decir qué tiene"), T("En cada aparcamiento, «Lo confirmo: está bien» avisa a los compañeros de que existe y se puede aparcar con camión. «Decir qué tiene» sirve para poner si tiene aseos, duchas, vigilancia o bar. Sale enseguida para todos; si hay opiniones distintas, manda la mayoría."), visible(".apc-opina", "#apc-abre-mapa", "#apc-cambiar")],
    [T("Añadir un aparcamiento"), T("¿Has encontrado uno que no sale? En el mapa toca «Añadir aparcamiento», toca el sitio (o usa tu posición), ponle nombre y guárdalo. Se queda en tu móvil, en «Mis aparcamientos». Si marcas «Proponerlo también a los compañeros», sale enseguida a todos."), visible(".apc-anade-btn", "#apc-abre-mapa", "#apc-cambiar")],
  ];
  // La guía se traduce como «Mis descansos» (función traducir, modo textos, grupo «aparcar»: solo los T("…") de este archivo)
  let MAPA_APC = {};
  const T = (s, v) => (MAPA_APC[s] || s).replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
  async function cargaIdiomaApc() {
    const idi = miIdioma(), m = $("apc-guia-msg");
    if (m) { m.textContent = ""; m.className = "msg"; }
    if (!idi) { MAPA_APC = {}; return; }
    const CACHE = "ccoo-textos-aparcar";
    try { const c = JSON.parse(localStorage.getItem(CACHE) || "null"); if (c && c.idioma === idi && c.v === VERSION_WEB && Date.now() - c.t < 86400000) { MAPA_APC = c.mapa; return; } } catch (_) {}
    if (m) m.textContent = "…";
    try {
      const { data, error } = await sb.functions.invoke("traducir", { body: { modo: "textos", grupo: "aparcar", idioma: idi } });
      if (error || !data?.textos) throw 0;
      if (miIdioma() !== idi) return;
      MAPA_APC = data.textos; if (m) m.textContent = "";
      try { localStorage.setItem(CACHE, JSON.stringify({ idioma: idi, v: VERSION_WEB, t: Date.now(), mapa: MAPA_APC })); } catch (_) {}
    } catch (_) { MAPA_APC = {}; if (m) { m.textContent = "La traducción no está disponible ahora mismo. Prueba más tarde."; m.className = "msg err"; } }
  }
  function pintaGuiaApc() {
    const caja = $("apc-guia-cuerpo"); if (!caja) return;
    const pasos = GUIA_APC(), sel = $("apc-guia-idioma");
    if (sel && !sel.options.length) sel.innerHTML = `<option value="">Español</option>` + Object.entries(IDIOMAS).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join("");
    if (sel) sel.value = miIdioma();
    caja.setAttribute("lang", miIdioma() || "es"); caja.setAttribute("dir", miIdioma() === "ar" ? "rtl" : "ltr");
    caja.innerHTML = guiaPasosHTML(pasos, { ir: T("Ir"), irA: (t) => T("Ir a: {t}", { t }) });
    caja.querySelectorAll("[data-guia-ir]").forEach(b => b.onclick = () => irAGuia(pasos[+b.dataset.guiaIr][2]));
  }

  function prepara() {
    pintaFormulario();
    pintaGuiaApc();
    if ($("apc-guia-idioma")) $("apc-guia-idioma").onchange = () => ponMiIdioma($("apc-guia-idioma").value);
    addEventListener("mi-idioma", async () => { await cargaIdiomaApc(); pintaGuiaApc(); });
    cargaIdiomaApc().then(pintaGuiaApc);
    // Durante el viaje, los avisos de los compañeros se refrescan cada 2 minutos
    $("apc-buscar").onclick = buscaRuta;
    $("apc-abre-mapa").onclick = abreMapaLibre;
    $("v-aparcar").addEventListener("click", accionMio);
    $("apc-mios-copia").onclick = copiaMios;
    $("apc-mios-recupera").onchange = () => { const f = $("apc-mios-recupera").files[0]; $("apc-mios-recupera").value = ""; if (f) recuperaMios(f); };
    $("v-aparcar").addEventListener("click", (e) => { const b = e.target.closest("[data-mal]"); if (b) abreMal(b.dataset.mal); });
    $("v-aparcar").addEventListener("click", (e) => { const c = e.target.closest("[data-confirma]"); if (c) return confirmaApc(c); const s = e.target.closest("[data-servicios]"); if (s) abreServicios(s.dataset.servicios); });
    pintaMios();
    $("v-aparcar").addEventListener("click", (e) => { const b = e.target.closest("[data-apc-vista]"); if (b) ponVista(b.dataset.apcVista); });
    // Si cambia el sitio o el código postal, lo elegido antes ya no vale
    [["apc-desde", "desde"], ["apc-desde-cp", "desde"], ["apc-hasta", "hasta"], ["apc-hasta-cp", "hasta"]].forEach(([id, k]) => $(id).addEventListener("input", () => { ELEGIDO[k] = null; $("apc-elegir").innerHTML = ""; }));
    $("apc-form").onsubmit = (e) => { e.preventDefault(); buscaRuta(); };
    $("apc-sin-destino").onclick = () => empiezaViaje(true);
    $("apc-ultima").onclick = abreUltima;
    pintaUltima();
    $("apc-terminar").onclick = terminaViaje;
    $("apc-voz").onchange = () => { AJ.voz = $("apc-voz").checked; guarda(); if (AJ.voz) habla("Te avisaré en voz alta del próximo aparcamiento abierto."); };
    $("apc-cerrados").onchange = () => { AJ.cerrados = $("apc-cerrados").checked; guarda(); if (VIAJE) { VIAJE.firma = ""; repinta(); } };
    // Al volver a la app con el viaje en marcha, la pantalla vuelve a quedarse encendida
    document.addEventListener("visibilitychange", () => { if (VIAJE && document.visibilityState === "visible") pideCandado(); });
    addEventListener("hashchange", () => { if (location.hash !== "#aparcar" && VIAJE) terminaViaje(); });
  }
  // Para las pruebas
  window.__aparcar = { abierto, precioTxt, enRuta, cargaAvisos, periodos, enMarcha: (a, o, rumboGps) => enMarcha({ coords: { latitude: a, longitude: o, heading: rumboGps ?? NaN, speed: rumboGps != null ? 20 : null } }) };
  prepara();
})();
