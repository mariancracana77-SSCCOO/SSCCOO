// «Aparcar cerca» (Zona Conductores, vista #aparcar): los aparcamientos de camiones más cercanos a donde está el conductor.
// La lista sale de OpenStreetMap (el mapa libre): la función «aparcamientos» la guarda cada mes por países en el bucket «datos».
// El móvil se baja la de los países elegidos y busca los cercanos él solo: la ubicación no sale del móvil.
// «Llevarme con el Maps» abre Google Maps con la ruta hasta el que se elija. Sin conexión, usa la última lista guardada.
(() => {
  const $ = (id) => document.getElementById(id);
  if (!$("v-aparcar")) return;
  const CLAVE = "ccoo-aparcar", CAJA = "ccoo-aparcamientos";
  const BASE = (window.SUPABASE_URL || "") + "/storage/v1/object/public/datos/aparcamientos/";
  const PAISES = [["ES", "España"], ["FR", "Francia"], ["PT", "Portugal"], ["AD", "Andorra"], ["IT", "Italia"], ["DE", "Alemania"],
    ["BE", "Bélgica"], ["NL", "Países Bajos"], ["LU", "Luxemburgo"], ["CH", "Suiza"], ["AT", "Austria"], ["GB", "Reino Unido"]];
  const DEF = () => ({ paises: ["ES", "FR", "AD", "PT"], radio: 50, abierto: true, precio: "todos", vigilado: false, duchas: false, camion: false });
  const lee = () => { try { return { ...DEF(), ...(JSON.parse(localStorage.getItem(CLAVE) || "null") || {}) }; } catch (_) { return DEF(); } };
  let AJ = lee();
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(AJ)); } catch (_) {} };
  let LISTA = null, AQUI = null, CARGADOS = "";

  // ---------- Horario (opening_hours de OpenStreetMap, lo más corriente) ----------
  // Devuelve true (abierto), false (cerrado) o null (no se sabe: sin horario o escrito de una forma que no entendemos)
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
  function abierto(h, ahora = new Date()) {
    if (!h) return null;
    const s = h.trim();
    if (s === "24/7") return true;
    const dia = ahora.getDay(), min = ahora.getHours() * 60 + ahora.getMinutes();
    let res = null, entendido = false;
    for (const regla of s.split(";")) {
      const r = regla.trim();
      if (!r || /^PH\b/.test(r)) continue; // festivos: no los sabemos
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
      res = dentro; // en OpenStreetMap, la regla de después manda sobre la de antes
    }
    return entendido ? res ?? false : null;
  }
  const es24h = (h) => /^(24\/7|Mo-Su 00:00-24:00|00:00-24:00)$/.test((h || "").trim());

  // ---------- Datos ----------
  async function bajar(url) {
    // Primero internet; sin conexión, la última copia guardada en el móvil
    let caja = null; try { caja = await caches.open(CAJA); } catch (_) {}
    try {
      const r = await fetch(url, { cache: "no-cache" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      if (caja) try { await caja.put(url.split("?")[0], r.clone()); } catch (_) {}
      return await r.json();
    } catch (e) {
      const c = caja && await caja.match(url.split("?")[0]);
      if (c) return c.json();
      throw e;
    }
  }
  async function cargaLista() {
    const clave = AJ.paises.slice().sort().join(",");
    if (LISTA && CARGADOS === clave) return LISTA;
    let indice = {};
    try { indice = await bajar(BASE + "indice.json?d=" + new Date().toISOString().slice(0, 13)); } catch (_) {}
    const todos = await Promise.all(AJ.paises.map(p => bajar(BASE + p + ".json?f=" + encodeURIComponent(indice[p]?.fecha || "")).then(l => (Array.isArray(l) ? l : []).map(x => ({ ...x, pais: p }))).catch(() => [])));
    LISTA = todos.flat(); CARGADOS = clave;
    return LISTA;
  }
  const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b.a - a.a) * r, dLo = (b.o - a.o) * r;
    const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.a * r) * Math.cos(b.a * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

  // ---------- Pintar ----------
  const nombre = (x) => x.n || (x.t === "s" ? "Área de servicio" : "Aparcamiento de camiones");
  const precioHTML = (x) => x.f === 0 ? `<span class="apc-precio gratis">Gratis</span>`
    : x.f === 1 ? `<span class="apc-precio pago">${icono("euro", "p")}De pago${x.c ? " · " + esc(x.c) : ""}</span>`
    : `<span class="apc-precio nose">Precio sin apuntar</span>`;
  function horarioHTML(x) {
    const ab = abierto(x.h);
    if (es24h(x.h)) return `<span class="apc-abre si">Abierto 24 h</span>`;
    if (ab === true) return `<span class="apc-abre si">Abierto ahora</span> <small>${esc(x.h)}</small>`;
    if (ab === false) return `<span class="apc-abre no">Cerrado ahora</span> <small>${esc(x.h)}</small>`;
    return x.h ? `<small>Horario: ${esc(x.h)}</small>` : `<small>Horario sin apuntar (casi todas abren las 24 h)</small>`;
  }
  const mapsIr = (x) => `https://www.google.com/maps/dir/?api=1&destination=${x.a},${x.o}&travelmode=driving`;
  const mapsVer = (x) => `https://www.google.com/maps/search/?api=1&query=${x.a},${x.o}`;
  function tarjeta(x) {
    const extras = [x.g ? "Para camiones" : "", x.v ? "Vigilado" : "", x.d ? "Duchas" : "", x.w ? "Aseos" : "", x.p ? x.p + " plazas" : ""].filter(Boolean);
    const cls = x.f === 0 ? "gratis" : x.f === 1 ? "pago" : "nose";
    return `<li class="apc ${cls}${abierto(x.h) === false ? " cerrado" : ""}">
      <div class="apc-cab"><span class="apc-dist">a ${x.dist < 10 ? x.dist.toFixed(1).replace(".", ",") : Math.round(x.dist)} km</span>${precioHTML(x)}</div>
      <b class="apc-nom">${esc(nombre(x))}</b>
      <div class="apc-hor">${horarioHTML(x)}</div>
      ${extras.length ? `<div class="apc-extra">${extras.map(e => `<span>${esc(e)}</span>`).join("")}</div>` : ""}
      <div class="apc-bots"><a class="btn" href="${esc(urlSegura(mapsIr(x)))}" target="_blank" rel="noopener">${icono("lugar", "p")}Llevarme con el Maps</a>
        <a class="btn sec" href="${esc(urlSegura(mapsVer(x)))}" target="_blank" rel="noopener">Ver en el mapa</a></div>
    </li>`;
  }
  function pintaFiltros() {
    $("apc-filtros").innerHTML = `
      <div class="apc-precios" role="group" aria-label="Precio">${[["todos", "Todos"], ["gratis", "Gratis"], ["pago", "De pago"]].map(([k, t]) => `<button type="button" class="filtro ${AJ.precio === k ? "activo" : ""}" data-precio="${k}" aria-pressed="${AJ.precio === k}">${t}</button>`).join("")}</div>
      <label class="check"><input type="checkbox" data-f="abierto" ${AJ.abierto ? "checked" : ""}> Solo abiertos ahora</label>
      <label class="check"><input type="checkbox" data-f="camion" ${AJ.camion ? "checked" : ""}> Solo los marcados para camiones</label>
      <label class="check"><input type="checkbox" data-f="vigilado" ${AJ.vigilado ? "checked" : ""}> Vigilado</label>
      <label class="check"><input type="checkbox" data-f="duchas" ${AJ.duchas ? "checked" : ""}> Con duchas</label>
      <label class="apc-radio">Buscar hasta <select id="apc-radio">${[25, 50, 100, 200].map(n => `<option value="${n}" ${AJ.radio === n ? "selected" : ""}>${n} km</option>`).join("")}</select></label>`;
    $("apc-filtros").querySelectorAll("[data-precio]").forEach(b => b.onclick = () => { AJ.precio = b.dataset.precio; guarda(); pintaFiltros(); pintaLista(); });
    $("apc-filtros").querySelectorAll("[data-f]").forEach(c => c.onchange = () => { AJ[c.dataset.f] = c.checked; guarda(); pintaLista(); });
    $("apc-radio").onchange = () => { AJ.radio = +$("apc-radio").value; guarda(); pintaLista(); };
  }
  function pintaLista() {
    const caja = $("apc-lista");
    if (!AQUI || !LISTA) { caja.innerHTML = ""; return; }
    const cerca = LISTA.map(x => ({ ...x, dist: km(AQUI, x) })).filter(x => x.dist <= AJ.radio).sort((a, b) => a.dist - b.dist);
    const vale = cerca.filter(x => (!AJ.abierto || abierto(x.h) !== false) && (AJ.precio === "todos" || (AJ.precio === "gratis" ? x.f === 0 : x.f === 1))
      && (!AJ.vigilado || x.v) && (!AJ.duchas || x.d) && (!AJ.camion || x.g));
    const quitados = cerca.length - vale.length;
    if (!LISTA.length) { caja.innerHTML = `<p class="msg err">No se ha podido bajar la lista de aparcamientos. Comprueba que tienes internet e inténtalo otra vez.</p>`; return; }
    caja.innerHTML = `<div class="apc-res"><b>${vale.length ? vale.length + (vale.length === 1 ? " cerca de ti" : " cerca de ti") : "Ninguno"}</b><span>en ${AJ.radio} km en línea recta, del más cercano al más lejano${quitados ? ` · ${quitados} no salen por los filtros` : ""}</span></div>`
      + (vale.length ? `<ul class="apc-lista">${vale.slice(0, 40).map(tarjeta).join("")}</ul>` : `<p class="desc-vacio">No hay ninguno apuntado con esos filtros. Prueba a buscar más lejos o a quitar algún filtro.</p>`);
  }
  function pintaPaises() {
    $("apc-paises").innerHTML = PAISES.map(([k, n]) => `<label class="check"><input type="checkbox" data-pais="${k}" ${AJ.paises.includes(k) ? "checked" : ""}> ${n}</label>`).join("");
    $("apc-paises").querySelectorAll("[data-pais]").forEach(c => c.onchange = () => {
      AJ.paises = PAISES.map(p => p[0]).filter(k => $("apc-paises").querySelector(`[data-pais="${k}"]`).checked);
      if (!AJ.paises.length) { AJ.paises = ["ES"]; pintaPaises(); }
      guarda(); LISTA = null; if (AQUI) busca(AQUI);
    });
  }
  const estado = (t, err) => { const m = $("apc-estado"); m.textContent = t; m.classList.toggle("err", !!err); };

  async function busca(pos) {
    AQUI = pos; estado("Buscando aparcamientos…");
    try { await cargaLista(); estado(""); } catch (_) { estado("No se ha podido bajar la lista de aparcamientos.", true); }
    pintaLista();
  }
  function dondeEstoy() {
    if (!("geolocation" in navigator)) { estado("Este móvil no deja saber dónde estás.", true); return; }
    estado("Buscando dónde estás…");
    $("apc-buscar").disabled = true;
    navigator.geolocation.getCurrentPosition(
      (p) => { $("apc-buscar").disabled = false; busca({ a: p.coords.latitude, o: p.coords.longitude }); },
      (e) => { $("apc-buscar").disabled = false;
        estado(e.code === 1 ? "No has dado permiso para saber dónde estás. Para darlo: toca el candado o los ajustes de la app, entra en «Ubicación» y elige «Permitir»."
          : "No se ha podido saber dónde estás. Comprueba que la ubicación del móvil está encendida y prueba otra vez.", true); },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 });
  }

  function prepara() {
    $("apc-buscar").onclick = dondeEstoy;
    pintaFiltros(); pintaPaises();
    // Se prepara la lista en segundo plano al entrar, para que al tocar el botón salga enseguida (y quede guardada sin conexión)
    const alEntrar = () => { if (location.hash === "#aparcar") cargaLista().catch(() => {}); };
    addEventListener("hashchange", alEntrar); alEntrar();
  }
  // Para las pruebas: buscar desde un punto sin pedir la ubicación
  window.__aparcarDesde = (a, o) => busca({ a, o });
  window.__aparcarAbierto = abierto;
  prepara();
})();
