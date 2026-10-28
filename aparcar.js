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
    const clave = location.origin + "/__aparcamientos/" + p;
    const guardado = caja ? await caja.match(clave).then(r => r && r.json()).catch(() => null) : null;
    if (guardado && Date.now() - guardado.t < 7 * 864e5 && Array.isArray(guardado.l)) return (MEM[p] = guardado.l);
    try {
      const l = [];
      for (let i = 0; i < 40000; i += 1000) {
        const { data, error } = await sb.from("aparcamientos").select("osm,lat,lon,nombre,horario,vigilado,duchas,aseos,plazas,area,camion").eq("pais", p).order("osm").range(i, i + 999);
        if (error) throw error;
        l.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      if (caja && l.length) try { await caja.put(clave, new Response(JSON.stringify({ t: Date.now(), l }), { headers: { "Content-Type": "application/json" } })); } catch (_) {}
      return (MEM[p] = l.length ? l : guardado?.l || []);
    } catch (_) { return (MEM[p] = guardado?.l || []); }
  }
  async function cargaPaises(ps) { const ls = await Promise.all(ps.map(delPais)); const vistos = new Set(); return ls.flatMap((l, i) => l.map(x => ({ ...x, pais: ps[i] }))).filter(x => !vistos.has(x.osm) && vistos.add(x.osm)); }

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
  const nombre = (x) => x.nombre || (x.area ? "Área de servicio" : "Aparcamiento de camiones");

  // Plazas para camiones: lo más importante para el padre (capacity:hgv de OpenStreetMap)
  const plazasHTML = (x) => x.plazas ? `<span class="apc-plazas"><b>${x.plazas}</b> ${x.plazas === 1 ? "plaza" : "plazas"} camión</span>` : `<span class="apc-plazas nose">Plazas sin apuntar</span>`;
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
  function tarjeta(x, faltaKm, llegada) {
    const extras = [x.camion ? "Para camiones" : "", x.vigilado ? "Vigilado" : "", x.duchas ? "Duchas" : "", x.aseos ? "Aseos" : "", x.desvio > 0.6 ? `A ${kmTxt(x.desvio)} km de la ruta` : ""].filter(Boolean);
    return `<li class="apc${estadoA(x, llegada) === "no" ? " cerrado" : ""}">
      <div class="apc-cab"><span class="apc-dist">a ${kmTxt(faltaKm)} km${llegada ? ` · llegas ${hora(llegada)}` : ""}</span>${plazasHTML(x)}</div>
      <b class="apc-nom">${esc(nombre(x))}</b>
      <div class="apc-hor">${abreHTML(x, llegada || new Date())}</div>
      ${avisoDe(x)?.tipo === "lleno" ? `<div class="apc-lleno">Lleno · avisado por un compañero ${haceTxt(avisoDe(x).t)}</div>` : ""}
      ${extras.length ? `<div class="apc-extra">${extras.map(e => `<span>${esc(e)}</span>`).join("")}</div>` : ""}
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
      RUTA = data;
      estado("Buscando aparcamientos en la ruta…");
      const lista = await cargaPaises(paisesDe(RUTA.puntos));
      EN_RUTA = enRuta(lista, RUTA.puntos, RUTA);
      estado("");
      pintaRuta();
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

  function pintaRuta() {
    const caja = $("apc-ruta");
    if (!RUTA) { caja.innerHTML = ""; return; }
    caja.innerHTML = `
      <div class="apc-res"><b>${esc(RUTA.desde.nombre)} → ${esc(RUTA.hasta.nombre)}</b><span>${RUTA.km} km · ${durTxt(RUTA.min)} conduciendo${RUTA.peaje ? " · con peajes" : ""}${RUTA.ferry ? " · con ferry" : ""}</span></div>
      <p class="apc-camion">Ruta calculada para tu camión: ${esc(AJ.camion.alto)} m de alto, ${esc(AJ.camion.peso)} t${AJ.camion.adr ? ", con ADR" : ""}.</p>
      <section class="apc-todos" aria-labelledby="apc-todos-tit">
        <h2 id="apc-todos-tit">Aparcamientos en tu ruta</h2>
        <label class="apc-salida">Salgo a las <input type="time" id="apc-salida" value="${esc(SALIDA)}"> <small>(vacío = ahora)</small></label>
        <div id="apc-todos"></div>
      </section>
      <details class="panel apc-tramos"><summary>Carreteras de la ruta (${RUTA.tramos.length})</summary>
        <ol class="apc-linea">${RUTA.tramos.map(t => `<li><b>${t.via ? `<span class="apc-via">${esc(t.via)}</span>` : "Carreteras locales"}</b>${t.hacia ? ` hacia ${esc(t.hacia)}` : ""}<small>${t.km} km</small></li>`).join("")}</ol></details>
      <div class="apc-acciones">
        <button type="button" class="btn apc-grande" id="apc-empezar">${icono("lugar")}Empezar viaje</button>
      </div>
      <p class="apc-nota">Con «Empezar viaje» te enseño los que tienes por delante mientras conduces, con tu navegador de siempre.</p>`;
    $("apc-empezar").onclick = empiezaViaje;
    $("apc-salida").onchange = () => { SALIDA = $("apc-salida").value; pintaTodos(); };
    pintaTodos();
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
  function pintaTodos() {
    const caja = $("apc-todos"); if (!caja) return;
    const t0 = horaSalida();
    const lista = EN_RUTA.map(x => ({ x, llega: new Date(t0 + x.minRuta * 60000), e: null })).map(y => ({ ...y, e: estadoA(y.x, y.llega) }));
    // Cerrados: los que estarán cerrados cuando pases. Abiertos: los que se sabe que estarán abiertos (horario o área de autopista).
    // Sin horario: no se sabe. Así no se confunde «no sé» con «abierto».
    const cerrados = lista.filter(y => y.e === "no"), abiertos = lista.filter(y => y.e === "si" || y.e === "siempre"), sinHorario = lista.filter(y => y.e === "nose");
    const ver = { cerrados, abiertos, nose: sinHorario, todos: lista }[FILTRO] || cerrados;
    const pl = (n, uno, varios) => n + " " + (n === 1 ? uno : varios);
    const cifra = (k, cls, n, txt) => `<button type="button" class="apc-cifra ${cls}${FILTRO === k ? " activa" : ""}" data-filtro="${k}" aria-pressed="${FILTRO === k}"><b>${n}</b>${txt}</button>`;
    caja.innerHTML = `<div class="apc-resumen" role="group" aria-label="Qué aparcamientos ver">
        ${cifra("cerrados", "cerr", cerrados.length, cerrados.length === 1 ? "cerrado" : "cerrados")}${cifra("abiertos", "abie", abiertos.length, abiertos.length === 1 ? "abierto" : "abiertos")}${cifra("nose", "nose", sinHorario.length, "sin horario")}</div>
      <button type="button" class="btn sec apc-ver-todos${FILTRO === "todos" ? " activa" : ""}" data-filtro="todos" aria-pressed="${FILTRO === "todos"}">Ver todos (${lista.length}), del primero al último</button>
      ${vistaHTML()}
      <p class="apc-cuenta">De los ${pl(lista.length, "aparcamiento", "aparcamientos")} de la ruta, a la hora a la que pasas.${EN_RUTA.contrario ? ` Solo salen los de tu sentido de marcha: ${pl(EN_RUTA.contrario, "área", "áreas")} del otro lado de la autopista no ${EN_RUTA.contrario === 1 ? "sale" : "salen"}.` : ""}${sinHorario.length ? " «Sin horario»: nadie ha apuntado su horario, así que no se sabe si estará abierto." : ""}</p>`
      + (AJ.vista === "mapa" ? `<div id="apc-mapa" class="apc-mapa" role="region" aria-label="Mapa de la ruta con los aparcamientos"></div>`
        : ver.length ? listaPorTramos(ver)
        : `<p class="desc-vacio">${FILTRO === "cerrados" ? "Según los horarios apuntados, ninguno estará cerrado cuando pases." + (sinHorario.length ? ` Mira también «Sin horario» (${sinHorario.length}): de esos no se sabe.` : "") : "No hay ninguno."}</p>`);
    caja.querySelectorAll("[data-filtro]").forEach(b => b.onclick = () => ponFiltro(b.dataset.filtro));
    if (AJ.vista === "mapa") pintaMapa("apc-mapa", ver);
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
      const mapa = L.map(caja, { zoomControl: true });
      mapa.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(mapa);
      m = MAPAS[id] = { div: caja, mapa, capa: L.layerGroup().addTo(mapa), ruta: null, rutaDe: null, yo: null, encuadrado: false };
    }
    const conRuta = opc.ruta !== false && RUTA;
    if (!conRuta && m.ruta) { m.ruta.remove(); m.ruta = null; m.rutaDe = null; }
    if (conRuta && m.rutaDe !== RUTA) {
      m.ruta?.remove();
      m.ruta = L.polyline(RUTA.fina || RUTA.puntos.map(q => [q[0], q[1]]), { color: "#AB1012", weight: 5, opacity: .85 }).addTo(m.mapa);
      m.rutaDe = RUTA; m.encuadrado = false;
    }
    m.capa.clearLayers();
    for (const y of items) {
      const e = estadoA(y.x, y.llega), cls = e === "no" ? "no" : e === "nose" ? "nose" : "si";
      const icon = L.divIcon({ className: "apc-pin " + cls, html: `<span>${y.x.plazas ? y.x.plazas : "P"}</span>`, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -16] });
      L.marker([y.x.lat, y.x.lon], { icon, title: nombre(y.x) + (y.x.plazas ? `, ${y.x.plazas} plazas` : "") })
        .bindPopup(`<ul class="apc-lista apc-popup">${tarjeta(y.x, y.falta ?? y.x.kmRuta, y.llega)}</ul>`, { maxWidth: 290, minWidth: 220 }).addTo(m.capa);
    }
    if (opc.yo) { if (m.yo) m.yo.setLatLng(opc.yo); else m.yo = L.circleMarker(opc.yo, { radius: 9, color: "#fff", weight: 3, fillColor: "#1E4F9C", fillOpacity: 1 }).addTo(m.mapa); }
    if (!m.encuadrado) {
      m.encuadrado = true;
      if (opc.yo) m.mapa.setView(opc.yo, 10);
      else if (m.ruta) m.mapa.fitBounds(m.ruta.getBounds(), { padding: [24, 24] });
      else if (items.length) m.mapa.fitBounds(items.map(y => [y.x.lat, y.x.lon]), { padding: [24, 24], maxZoom: 12 });
      else m.mapa.setView([46, 4], 5);
    }
    setTimeout(() => m.mapa.invalidateSize(), 60);
  }
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
    if (enMapa) pintaMapa("apc-mapa-viaje", mostrar, { yo: [a, o], ruta: !VIAJE.sinDestino });
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

  function prepara() {
    pintaFormulario();
    // Durante el viaje, los avisos de los compañeros se refrescan cada 2 minutos
    $("apc-buscar").onclick = buscaRuta;
    $("v-aparcar").addEventListener("click", (e) => { const b = e.target.closest("[data-apc-vista]"); if (b) ponVista(b.dataset.apcVista); });
    // Si cambia el sitio o el código postal, lo elegido antes ya no vale
    [["apc-desde", "desde"], ["apc-desde-cp", "desde"], ["apc-hasta", "hasta"], ["apc-hasta-cp", "hasta"]].forEach(([id, k]) => $(id).addEventListener("input", () => { ELEGIDO[k] = null; $("apc-elegir").innerHTML = ""; }));
    $("apc-form").onsubmit = (e) => { e.preventDefault(); buscaRuta(); };
    $("apc-sin-destino").onclick = () => empiezaViaje(true);
    $("apc-terminar").onclick = terminaViaje;
    $("apc-voz").onchange = () => { AJ.voz = $("apc-voz").checked; guarda(); if (AJ.voz) habla("Te avisaré en voz alta del próximo aparcamiento abierto."); };
    $("apc-cerrados").onchange = () => { AJ.cerrados = $("apc-cerrados").checked; guarda(); if (VIAJE) { VIAJE.firma = ""; repinta(); } };
    // Al volver a la app con el viaje en marcha, la pantalla vuelve a quedarse encendida
    document.addEventListener("visibilitychange", () => { if (VIAJE && document.visibilityState === "visible") pideCandado(); });
    addEventListener("hashchange", () => { if (location.hash !== "#aparcar" && VIAJE) terminaViaje(); });
  }
  // Para las pruebas
  window.__aparcar = { abierto, precioTxt, enRuta, cargaAvisos, enMarcha: (a, o, rumboGps) => enMarcha({ coords: { latitude: a, longitude: o, heading: rumboGps ?? NaN, speed: rumboGps != null ? 20 : null } }) };
  prepara();
})();
