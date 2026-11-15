// Traducir las herramientas nuevas de Zona Conductores (v177, petición n.º 45 del padre): Mi finiquito, Mi hora
// ordinaria, Diccionario del conductor y Test de ADR. Usa el mismo idioma que «Mis descansos» (localStorage
// «ccoo-mi-idioma», selector «Idioma · Language») y la misma función «traducir» (modo textos), que NO acepta texto de
// fuera: saca ella misma los textos de los archivos publicados en la web:
//  - de index.html, lo que se ve en la sección de la herramienta (y los placeholder, aria-label y title);
//  - de cada .js, lo escrito con T("...")/TH("...") y las cadenas entre /* textos */ y /* fin textos */.
// Aquí se pone la traducción encima de lo que hay en pantalla (también de lo que se pinte después) y se vuelve al
// español al elegir «Español». Las cuentas no cambian: solo cambia el texto que se ve.
// IMPORTANTE: la forma de partir el texto (bloques con solo texto y <b>/<strong>/<i>/<em>, frases sueltas, espacios
// juntados) es la misma que la de la función (herramientas/funciones/traducir.ts, «textosVista»). Si se cambia una, la otra.
// Lo único que guarda en el móvil es la caché de la traducción («ccoo-textos-<herramienta>», como Mis descansos).
(function () {
  const EN_LINEA = { B: "**", STRONG: "**", I: "", EM: "" };
  const SALTA = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, TEMPLATE: 1, svg: 1, SVG: 1 };
  const ATRIBUTOS = ["placeholder", "aria-label", "title"];
  const LETRA = /\p{L}/u;
  const junta = (s) => s.replace(/\s+/g, " ").trim();
  const html = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const salta = (el) => SALTA[el.tagName] || el.getAttribute("translate") === "no";
  // Un «bloque» es un elemento que solo tiene texto y negritas/cursivas (con solo texto dentro): se traduce entero.
  function esBloque(el) {
    let letra = false;
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { if (LETRA.test(n.data)) letra = true; continue; }
      if (n.nodeType === 8) continue;
      if (n.nodeType !== 1 || !(n.tagName in EN_LINEA) || [...n.childNodes].some(m => m.nodeType !== 3)) return false;
      if (LETRA.test(n.textContent)) letra = true;
    }
    return letra;
  }
  const marcado = (el) => junta([...el.childNodes].map(n => n.nodeType === 3 ? n.data : n.nodeType === 1 ? EN_LINEA[n.tagName] + n.textContent + EN_LINEA[n.tagName] : "").join(""));

  window.ZonaIdioma = function (grupo, idVista, alCambiar) {
    const vista = document.getElementById(idVista);
    let MAPA = {}, cargado = "", turno = 0;
    const PUESTO = new WeakMap(), ORIG = new WeakMap(), TOCADOS = new Set();
    const T = (s, v) => (MAPA[s] || s).replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
    const TH = (s, v) => html(T(s, v));
    const yo = { T, TH };
    if (!vista) return yo;

    // Selector de idioma, debajo de la explicación (translate="no": no se traduce a sí mismo)
    const intro = vista.querySelector(".intro-vista");
    const caja = document.createElement("div");
    caja.className = "zc-idioma"; caja.setAttribute("translate", "no");
    caja.innerHTML = `<label class="desc-idioma"><svg class="icono p" aria-hidden="true"><use href="#i-idioma"/></svg><span>Idioma · Language</span><select aria-label="Idioma · Language"><option value="">Español</option>${Object.entries(IDIOMAS).map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("")}</select></label><p class="msg" role="status"></p>`;
    (intro || vista.firstElementChild).after(caja);
    const sel = caja.querySelector("select"), msg = caja.querySelector(".msg");
    sel.value = miIdioma();
    sel.addEventListener("change", () => ponMiIdioma(sel.value));

    function recorre(el) {
      if (salta(el)) return;
      for (const a of ATRIBUTOS) {
        const v = el.getAttribute(a); if (!v || !LETRA.test(v)) continue;
        const clave = "@" + a, k = junta(v), hecho = PUESTO.get(el) || {};
        if (hecho[clave] === v || !MAPA[k] || MAPA[k] === k) continue;
        const orig = ORIG.get(el) || {}; orig[clave] = v; ORIG.set(el, orig);
        el.setAttribute(a, MAPA[k]); hecho[clave] = MAPA[k]; PUESTO.set(el, hecho); TOCADOS.add(el);
      }
      if (esBloque(el)) {
        const k = marcado(el);
        if ((PUESTO.get(el) || {}).bloque === k || !MAPA[k] || MAPA[k] === k) return;
        const orig = ORIG.get(el) || {}; orig.html = el.innerHTML; ORIG.set(el, orig);
        el.innerHTML = html(MAPA[k]); PUESTO.set(el, Object.assign(PUESTO.get(el) || {}, { bloque: marcado(el) })); TOCADOS.add(el);
        return;
      }
      for (const n of [...el.childNodes]) {
        if (n.nodeType === 1) recorre(n);
        else if (n.nodeType === 3 && LETRA.test(n.data)) {
          const k = junta(n.data);
          if (PUESTO.get(n) === n.data || !MAPA[k] || MAPA[k] === k) continue;
          ORIG.set(n, n.data);
          const ini = n.data.match(/^\s*/)[0], fin = n.data.match(/\s*$/)[0];
          n.data = ini + MAPA[k] + fin; PUESTO.set(n, n.data); TOCADOS.add(n);
        }
      }
    }
    // Vuelve al español lo que se tradujo y sigue igual (si la herramienta lo ha vuelto a pintar, se deja)
    function quita() {
      for (const n of TOCADOS) {
        const o = ORIG.get(n), p = PUESTO.get(n);
        if (n.isConnected && o != null) {
          if (n.nodeType === 3) { if (n.data === p) n.data = o; }
          else {
            for (const a of ATRIBUTOS) if (o["@" + a] != null && p && n.getAttribute(a) === p["@" + a]) n.setAttribute(a, o["@" + a]);
            if (o.html != null && p && p.bloque != null && marcado(n) === p.bloque) n.innerHTML = o.html;
          }
        }
        PUESTO.delete(n); ORIG.delete(n);
      }
      TOCADOS.clear();
    }
    const obs = new MutationObserver(() => { if (pendiente) return; pendiente = true; requestAnimationFrame(pasa); });
    let pendiente = false;
    function pasa() {
      pendiente = false;
      if (!cargado) return;
      recorre(vista); obs.takeRecords(); // lo que acabamos de cambiar no cuenta
    }
    const activa = () => vista.classList.contains("activa");

    async function carga() {
      const idi = miIdioma(), mio = ++turno;
      sel.value = idi; msg.textContent = ""; msg.className = "msg";
      vista.setAttribute("dir", idi === "ar" ? "rtl" : "ltr"); vista.setAttribute("lang", idi || "es");
      caja.setAttribute("dir", "ltr");
      let mapa = {};
      if (idi) {
        const CACHE = "ccoo-textos-" + grupo;
        try { const c = JSON.parse(localStorage.getItem(CACHE) || "null"); if (c && c.idioma === idi && c.v === VERSION_WEB && Date.now() - c.t < 86400000) mapa = c.mapa; } catch (_) {}
        if (!Object.keys(mapa).length) {
          msg.textContent = "…";
          try {
            const { data, error } = await sb.functions.invoke("traducir", { body: { modo: "textos", grupo, idioma: idi } });
            if (error || !data?.textos) throw 0;
            mapa = data.textos; msg.textContent = "";
            try { localStorage.setItem(CACHE, JSON.stringify({ idioma: idi, v: VERSION_WEB, t: Date.now(), mapa })); } catch (_) {}
          } catch (_) { mapa = {}; msg.textContent = "La traducción no está disponible ahora mismo. Prueba más tarde."; msg.className = "msg err"; }
        }
      }
      if (mio !== turno || miIdioma() !== idi) return;
      quita(); MAPA = mapa; cargado = idi || "";
      if (!idi) vista.removeAttribute("dir");
      try { alCambiar && alCambiar(); } catch (_) {}
      if (idi) { recorre(vista); obs.takeRecords(); }
    }
    obs.observe(vista, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
    // Solo se pide la traducción al abrir la herramienta (así no se llama a la función en cada visita a la web)
    let ultimo = null;
    const mira = () => { if (activa() && ultimo !== miIdioma()) { ultimo = miIdioma(); carga(); } };
    new MutationObserver(mira).observe(vista, { attributes: true, attributeFilter: ["class"] });
    addEventListener("mi-idioma", () => { sel.value = miIdioma(); ultimo = null; mira(); });
    setTimeout(mira, 0); // después de que la herramienta termine de prepararse
    return yo;
  };
})();
