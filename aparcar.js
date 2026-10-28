// «Aparcamientos en mi ruta» (Zona Conductores, vista #aparcar). Lo pidió el padre para usarlo durante el trayecto:
// los aparcamientos de camiones que hay POR DELANTE en tu ruta, los abiertos a la hora a la que llegas, gratis en verde,
// de pago en azul con el precio, y «Llevarme aquí» con Google Maps. El conductor decide dónde para.
// - Ruta para camión (alto, ancho, largo, peso, ADR): función «ruta» (Valhalla de OpenStreetMap, sin claves; no guarda nada).
// - Aparcamientos: tabla «aparcamientos» (OpenStreetMap, se renueva sola cada mes). Se baja por países enteros y se busca
//   en el móvil: la ubicación no sale del móvil mientras conduces. Sin conexión, usa la última lista guardada.
// - Modo «sin destino»: los que hay delante en la dirección en la que vas.
(() => {
  const $ = (id) => document.getElementById(id);
  if (!$("v-aparcar")) return;
  const CLAVE = "ccoo-aparcar", CAJA = "ccoo-aparcamientos";
  const DEF = () => ({ camion: { alto: "4", ancho: "2,55", largo: "16,5", peso: "40", adr: false }, voz: false, gratis: false, desde: "", hasta: "" });
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
  const estadoA = (x, cuando) => { const a = abierto(x.horario, cuando); if (a === true) return "si"; if (a === false) return "no"; return x.area && !x.horario ? "siempre" : "nose"; };

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
        const { data, error } = await sb.from("aparcamientos").select("osm,lat,lon,nombre,horario,pago,precio,vigilado,duchas,aseos,plazas,area,camion").eq("pais", p).order("osm").range(i, i + 999);
        if (error) throw error;
        l.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      if (caja && l.length) try { await caja.put(clave, new Response(JSON.stringify({ t: Date.now(), l }), { headers: { "Content-Type": "application/json" } })); } catch (_) {}
      return (MEM[p] = l.length ? l : guardado?.l || []);
    } catch (_) { return (MEM[p] = guardado?.l || []); }
  }
  async function cargaPaises(ps) { const ls = await Promise.all(ps.map(delPais)); const vistos = new Set(); return ls.flat().filter(x => !vistos.has(x.osm) && vistos.add(x.osm)); }

  // ---------- Geometría ----------
  const R = Math.PI / 180;
  const km = (a1, o1, a2, o2) => { const x = Math.sin((a2 - a1) * R / 2) ** 2 + Math.cos(a1 * R) * Math.cos(a2 * R) * Math.sin((o2 - o1) * R / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const rumbo = (a1, o1, a2, o2) => { const y = Math.sin((o2 - o1) * R) * Math.cos(a2 * R), x = Math.cos(a1 * R) * Math.sin(a2 * R) - Math.sin(a1 * R) * Math.cos(a2 * R) * Math.cos((o2 - o1) * R); return (Math.atan2(y, x) / R + 360) % 360; };
  // Para cada aparcamiento, el punto de la ruta más cercano (los puntos van cada ~1,5 km)
  function enRuta(lista, puntos) {
    const res = [];
    const caja = puntos.reduce((b, [la, lo]) => [Math.min(b[0], la), Math.max(b[1], la), Math.min(b[2], lo), Math.max(b[3], lo)], [90, -90, 180, -180]);
    for (const x of lista) {
      if (x.lat < caja[0] - 0.05 || x.lat > caja[1] + 0.05 || x.lon < caja[2] - 0.07 || x.lon > caja[3] + 0.07) continue;
      let mejor = 1e9, idx = -1;
      for (let i = 0; i < puntos.length; i++) { const d = km(x.lat, x.lon, puntos[i][0], puntos[i][1]); if (d < mejor) { mejor = d; idx = i; } }
      if (mejor <= 1.5) res.push({ ...x, desvio: mejor, kmRuta: puntos[idx][2], minRuta: puntos[idx][3] });
    }
    return res.sort((a, b) => a.kmRuta - b.kmRuta);
  }

  // ---------- Estado del viaje ----------
  let RUTA = null, EN_RUTA = [], VIAJE = null, VIGIA = null, CANDADO = null, ULT_VOZ = "", CERCA = [], ANTES = null;
  const estado = (t, err) => { const m = $("apc-estado"); m.textContent = t || ""; m.classList.toggle("err", !!err); };
  const hora = (d) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const kmTxt = (n) => n < 10 ? n.toFixed(1).replace(".", ",") : String(Math.round(n));
  const durTxt = (m) => { const h = Math.floor(m / 60), mm = Math.round(m % 60); return h ? `${h} h${mm ? " " + mm + " min" : ""}` : `${mm} min`; };
  const nombre = (x) => x.nombre || (x.area ? "Área de servicio" : "Aparcamiento de camiones");
  const mapsIr = (x) => `https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lon}&travelmode=driving`;

  function precioHTML(x) {
    if (x.pago === 0) return `<span class="apc-precio gratis">Gratis</span>`;
    if (x.pago === 1) return `<span class="apc-precio pago">${icono("euro", "p")}De pago${x.precio ? " · " + esc(precioTxt(x.precio)) : ""}</span>`;
    return `<span class="apc-precio nose">Precio sin apuntar</span>`;
  }
  function abreHTML(x, cuando) {
    const e = estadoA(x, cuando);
    if (e === "si") return `<span class="apc-abre si">Abierto cuando llegues</span>`;
    if (e === "no") return `<span class="apc-abre no">Cerrado cuando llegues</span>${x.horario ? ` <small>${esc(x.horario)}</small>` : ""}`;
    if (e === "siempre") return `<span class="apc-abre si">Área de autopista: abierta siempre</span>`;
    return `<small>Horario sin apuntar</small>`;
  }
  function tarjeta(x, faltaKm, llegada) {
    const extras = [x.camion ? "Para camiones" : "", x.vigilado ? "Vigilado" : "", x.duchas ? "Duchas" : "", x.aseos ? "Aseos" : "", x.plazas ? x.plazas + " plazas" : "", x.desvio > 0.6 ? `A ${kmTxt(x.desvio)} km de la ruta` : ""].filter(Boolean);
    const cls = x.pago === 0 ? "gratis" : x.pago === 1 ? "pago" : "nose";
    return `<li class="apc ${cls}${estadoA(x, llegada) === "no" ? " cerrado" : ""}">
      <div class="apc-cab"><span class="apc-dist">a ${kmTxt(faltaKm)} km${llegada ? ` · llegas ${hora(llegada)}` : ""}</span>${precioHTML(x)}</div>
      <b class="apc-nom">${esc(nombre(x))}</b>
      <div class="apc-hor">${abreHTML(x, llegada || new Date())}</div>
      ${extras.length ? `<div class="apc-extra">${extras.map(e => `<span>${esc(e)}</span>`).join("")}</div>` : ""}
      <a class="btn apc-ir" href="${esc(urlSegura(mapsIr(x)))}" target="_blank" rel="noopener">${icono("lugar", "p")}Llevarme aquí</a>
    </li>`;
  }

  // ---------- Formulario ----------
  function pintaFormulario() {
    const c = AJ.camion;
    $("apc-desde").value = AJ.desde; $("apc-hasta").value = AJ.hasta;
    $("apc-alto").value = c.alto; $("apc-ancho").value = c.ancho; $("apc-largo").value = c.largo; $("apc-peso").value = c.peso; $("apc-adr").checked = !!c.adr;
    $("apc-voz").checked = !!AJ.voz; $("apc-gratis").checked = !!AJ.gratis;
  }
  function leeFormulario() {
    AJ.desde = $("apc-desde").value.trim(); AJ.hasta = $("apc-hasta").value.trim();
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
    if (!AJ.hasta) { estado("Escribe adónde vas.", true); $("apc-hasta").focus(); return; }
    $("apc-buscar").disabled = true; estado("Calculando la ruta para tu camión…");
    try {
      const desde = AJ.desde || await posicion().then(p => ({ ...p, nombre: "Tu ubicación" }));
      const { data, error } = await sb.functions.invoke("ruta", { body: { desde, hasta: AJ.hasta, camion: AJ.camion } });
      if (error || !data || data.error) throw new Error(data?.error || "No se ha podido calcular la ruta. Comprueba que tienes internet.");
      RUTA = data;
      estado("Buscando aparcamientos en la ruta…");
      EN_RUTA = enRuta(await cargaPaises(paisesDe(RUTA.puntos)), RUTA.puntos);
      estado("");
      pintaRuta();
    } catch (e) { estado(e.message || String(e), true); }
    finally { $("apc-buscar").disabled = false; }
  }

  function pintaRuta() {
    const caja = $("apc-ruta");
    if (!RUTA) { caja.innerHTML = ""; return; }
    const p = RUTA.puntos, n = p.length, wp = [0.25, 0.5, 0.75].map(f => p[Math.round(f * (n - 1))]).map(x => x[0] + "," + x[1]).join("|");
    const maps = `https://www.google.com/maps/dir/?api=1&origin=${p[0][0]},${p[0][1]}&destination=${p[n - 1][0]},${p[n - 1][1]}&waypoints=${encodeURIComponent(wp)}&travelmode=driving`;
    const abiertos = EN_RUTA.filter(x => estadoA(x, new Date(Date.now() + x.minRuta * 60000)) !== "no");
    caja.innerHTML = `
      <div class="apc-res"><b>${esc(RUTA.desde.nombre)} → ${esc(RUTA.hasta.nombre)}</b><span>${RUTA.km} km · ${durTxt(RUTA.min)} conduciendo${RUTA.peaje ? " · con peajes" : ""}${RUTA.ferry ? " · con ferry" : ""}</span></div>
      <p class="apc-camion">Ruta calculada para tu camión: ${esc(AJ.camion.alto)} m de alto, ${esc(AJ.camion.peso)} t${AJ.camion.adr ? ", con ADR" : ""}.</p>
      <details class="panel apc-tramos"><summary>Carreteras de la ruta (${RUTA.tramos.length})</summary>
        <ol class="apc-linea">${RUTA.tramos.map(t => `<li><b>${t.via ? `<span class="apc-via">${esc(t.via)}</span>` : "Carreteras locales"}</b>${t.hacia ? ` hacia ${esc(t.hacia)}` : ""}<small>${t.km} km</small></li>`).join("")}</ol></details>
      <div class="apc-acciones">
        <button type="button" class="btn apc-grande" id="apc-empezar">${icono("lugar")}Empezar viaje</button>
        <a class="btn sec" href="${esc(urlSegura(maps))}" target="_blank" rel="noopener">Ir guiado con Google Maps</a>
      </div>
      <p class="apc-nota">El Maps no sabe que vas en camión: te lo paso con puntos de esta ruta para que siga el mismo camino. Si te propone otro, sigue las carreteras de arriba.</p>
      <p class="apc-nota"><b>${EN_RUTA.length} aparcamientos en la ruta</b>, ${abiertos.length} abiertos si sales ahora. Pulsa «Empezar viaje» y te enseño los que tienes por delante mientras conduces.</p>`;
    $("apc-empezar").onclick = empiezaViaje;
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
    $("apc-proximos").innerHTML = `<p class="apc-nota">Buscando dónde estás…</p>`;
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
        .filter(y => y.falta <= 80 && (r == null || Math.abs(((y.rb - r + 540) % 360) - 180) <= 35))
        .map(y => ({ ...y, llega: new Date(ahora + (y.falta / vel) * 3600000) })).sort((u, v) => u.falta - v.falta);
      $("apc-viaje-info").textContent = r == null ? "Cuando empieces a moverte sabré hacia dónde vas. Mientras, salen los que tienes alrededor." : "Distancias aproximadas, en la dirección en la que vas.";
    }
    const abiertos = lista.filter(y => estadoA(y.x, y.llega) !== "no");
    const vale = abiertos.filter(y => !AJ.gratis || y.x.pago === 0);
    const cerrados = lista.length - abiertos.length;
    $("apc-proximos").innerHTML = vale.length
      ? `<ul class="apc-lista">${vale.slice(0, 6).map(y => tarjeta(y.x, y.falta, y.llega)).join("")}</ul>${cerrados ? `<p class="apc-nota">${cerrados} por delante estarán cerrados cuando llegues: no salen.</p>` : ""}`
      : `<p class="desc-vacio">${AJ.gratis ? "No hay ninguno gratis y abierto por delante." : "No hay aparcamientos abiertos por delante."}</p>`;
    const primero = vale[0];
    if (primero && primero.x.osm !== ULT_VOZ) {
      ULT_VOZ = primero.x.osm;
      habla(`Próximo aparcamiento abierto: ${nombre(primero.x)}, a ${Math.round(primero.falta)} kilómetros. ${primero.x.pago === 0 ? "Gratis." : primero.x.pago === 1 ? "De pago." : ""}`);
    }
  }

  function prepara() {
    pintaFormulario();
    $("apc-buscar").onclick = buscaRuta;
    $("apc-form").onsubmit = (e) => { e.preventDefault(); buscaRuta(); };
    $("apc-sin-destino").onclick = () => empiezaViaje(true);
    $("apc-terminar").onclick = terminaViaje;
    $("apc-voz").onchange = () => { AJ.voz = $("apc-voz").checked; guarda(); if (AJ.voz) habla("Te avisaré en voz alta del próximo aparcamiento abierto."); };
    $("apc-gratis").onchange = () => { AJ.gratis = $("apc-gratis").checked; guarda(); };
    // Al volver a la app con el viaje en marcha, la pantalla vuelve a quedarse encendida
    document.addEventListener("visibilitychange", () => { if (VIAJE && document.visibilityState === "visible") pideCandado(); });
    addEventListener("hashchange", () => { if (location.hash !== "#aparcar" && VIAJE) terminaViaje(); });
  }
  // Para las pruebas
  window.__aparcar = { abierto, precioTxt, enRuta, enMarcha: (a, o, rumboGps) => enMarcha({ coords: { latitude: a, longitude: o, heading: rumboGps ?? NaN, speed: rumboGps != null ? 20 : null } }) };
  prepara();
})();
