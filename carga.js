// Simulador de carga (Zona Conductores, petición n.º 46). Es el «Simulador de carga» del padre pasado tal cual: las
// cuentas (filas desde la cabina mezclando filas largas y atravesadas, huecos, apilado en 2 alturas, peso) son las
// suyas. Aquí solo cambia la forma: sin <script> ni estilos en línea, sin onclick ni confirm() (CSP y app), textos con
// esc(), sin flechas ni símbolos, y los colores de Zona Conductores.
// Guarda las recogidas en el móvil (localStorage «ccoo-remolque»: en esta web no había nada guardado antes; el archivo
// del padre usaba «remolque_v2» en otra dirección, que el navegador no deja leer desde aquí). Si otra ventana guarda,
// esta se pone al día (evento «storage») antes de que el conductor siga tocando, para no pisar lo de la otra.
// Las cuentas están en CargaCuentas (sin pantalla) para poder probarlas: pruebas/carga.cjs.
(function () {
  // ---- Cuentas (las del padre, sin cambiar) ----
  function orients(d, W) {
    let o = [[d[0], d[1]], [d[1], d[0]]]; if (d[0] === d[1]) o = [o[0]];
    return o.map(x => ({ al: x[0], ac: x[1], cap: x[1] > 0 ? Math.floor(W / x[1]) : 0 })).filter(x => x.cap >= 1 && x.al > 0);
  }
  function plan(n, os) {
    let best = null; const A = Math.ceil(n / os[0].cap), B = os[1] ? Math.ceil(n / os[1].cap) : 0;
    for (let a = 0; a <= A; a++) for (let b = 0; b <= B; b++) {
      const cap = a * os[0].cap + (os[1] ? b * os[1].cap : 0); if (cap < n) continue;
      const len = a * os[0].al + (os[1] ? b * os[1].al : 0), nr = a + b;
      if (!best || len < best.len || (len === best.len && nr < best.nr)) best = { a, b, len, nr };
    }
    return best;
  }
  function fitDims(d, r) {
    let best = null;
    [[d[0], d[1]], [d[1], d[0]]].forEach(o => {
      if (o[0] <= r.w && o[1] <= r.h) { const sc = Math.max((r.w - o[0]) * r.h, o[0] * (r.h - o[1])); if (!best || sc > best.sc) best = { o, sc }; }
    });
    return best ? best.o : null;
  }
  function put(row, fi, o, flag, rec, sp) {
    const r = row.free[fi]; row.free.splice(fi, 1);
    // apil: su recogida va apilada (se le puede poner otro encima); hc: su alto en cm (0 = sin apuntar)
    row.items.push({ r: rec, s: flag, x: r.x, y: r.y, w: o[0], h: o[1], apil: !!sp?.st, hc: sp?.h || 0 });
    if (r.w - o[0] > 0) row.free.push({ x: r.x + o[0], y: r.y, w: r.w - o[0], h: r.h });
    if (r.h - o[1] > 0) row.free.push({ x: r.x, y: r.y + o[1], w: o[0], h: r.h - o[1] });
  }
  function place(rows, sp, W, fill) {
    let q = Math.max(0, Math.floor(sp.q || 0)); if (!q) return true;
    const os = orients(sp.d, W); if (!os.length) return false;
    // v179 (petición n.º 47): huecos encima. Si esta recogida va apilada, sus palets ocupan primero el sitio libre
    // encima de un palet suelto de otra recogida apilada (impar), si son iguales o más pequeños y caben de alto.
    // Con «Aprovechar huecos», en cualquier fila; sin él, solo en la última (la que queda a mano).
    if (sp.st) {
      const techo = sp.alto || 270, alto = sp.h || 120;
      for (let i = fill ? 0 : Math.max(0, rows.length - 1); i < rows.length && q; i++) rows[i].items.forEach(it => {
        if (!q || it.s || it.top || !it.apil || (it.hc || 120) + alto > techo) return;
        const o = [[sp.d[0], sp.d[1]], [sp.d[1], sp.d[0]]].find(o => o[0] <= it.w && o[1] <= it.h);
        if (o) { it.top = { r: sp.rec, w: o[0], h: o[1], hc: sp.h || 0 }; q--; }
      });
      if (!q) return true;
    }
    const n = sp.st ? Math.ceil(q / 2) : q, flags = [];
    for (let i = 0; i < n; i++) flags.push(!!sp.st && !(q % 2 === 1 && i === n - 1));
    while (flags.length) {
      let best = null, bo = null; const from = fill ? 0 : Math.max(0, rows.length - 1);
      for (let i = from; i < rows.length; i++) rows[i].free.forEach((r, fi) => {
        const o = fitDims(sp.d, r);
        if (o) { const w = r.w * r.h - o[0] * o[1]; if (!best || w < best.w) { best = { row: rows[i], fi, w }; bo = o; } }
      });
      if (!best) break;
      put(best.row, best.fi, bo, flags.shift(), sp.rec, sp);
    }
    if (!flags.length) return true;
    const b = plan(flags.length, os), list = [];
    for (let j = 0; j < b.a; j++) list.push(os[0]);
    for (let j = 0; j < b.b; j++) list.push(os[1]);
    list.sort((x, y) => y.cap - x.cap);
    list.forEach(o => {
      const row = { al: o.al, ac: o.ac, items: [], free: [] };
      for (let k = 0; k < o.cap; k++) row.free.push({ x: 0, y: k * o.ac, w: o.al, h: o.ac });
      rows.push(row);
      for (let k = 0; k < o.cap && flags.length; k++) put(row, 0, [o.al, o.ac], flags.shift(), sp.rec, sp);
    });
    return true;
  }
  const used = (rows) => rows.reduce((s, r) => s + r.al, 0);
  function maxFit(rows, d, W, L, fill) {
    if (!orients(d, W).length) return 0;
    for (let q = 1; q <= 200; q++) { const c = JSON.parse(JSON.stringify(rows)); place(c, { d, st: false, rec: 0, q }, W, fill); if (used(c) > L + 1e-6) return q - 1; }
    return 200;
  }
  function nfit(d, r) {
    let m = 0; [[d[0], d[1]], [d[1], d[0]]].forEach(o => { m = Math.max(m, Math.floor(r.w / o[0]) * Math.floor(r.h / o[1])); }); return m;
  }
  function holes(rows) {
    const g = {};
    rows.forEach(row => row.free.forEach(r => {
      if (r.w >= 40 && r.h >= 40 && r.w * r.h >= 4000) { const k = r.w + "×" + r.h; g[k] = g[k] || { w: r.w, h: r.h, c: 0 }; g[k].c++; }
    }));
    return Object.keys(g).map(k => g[k]);
  }
  // v180 (petición n.º 48): colocar a mano. «Sitios» = huecos del suelo y palets sueltos de recogidas apiladas (con el
  // sitio de encima libre), con su posición en cm desde la cabina (x) y desde el lado izquierdo (y).
  function sitios(rows) {
    const out = []; let x0 = 0;
    rows.forEach(row => {
      row.free.forEach(f => out.push({ tipo: "hueco", x: x0 + f.x, y: f.y, w: f.w, h: f.h, row, f }));
      row.items.forEach(it => { if (it.apil && !it.s && !it.top) out.push({ tipo: "encima", x: x0 + it.x, y: it.y, w: it.w, h: it.h, it }); });
      x0 += row.al;
    });
    return out;
  }
  // Por qué no cabe un palet de planta d y alto ha en el sitio s («medida» o «alto»); null si cabe
  function noCabe(s, d, ha, techo) {
    if (!fitDims(d, s)) return "medida";
    if (s.tipo === "encima" && (s.it.hc || 120) + (ha || 120) > (techo || 270)) return "alto";
    return null;
  }
  function ponMano(s, d, rec, st, ha) {
    const o = fitDims(d, s);
    if (s.tipo === "encima") { s.it.top = { r: rec, w: o[0], h: o[1], hc: ha || 0, m: true }; return; }
    put(s.row, s.row.free.indexOf(s.f), o, false, rec, { st, h: ha });
    s.row.items[s.row.items.length - 1].m = true;
  }
  const MEDIDAS = { eu: [120, 80], ind: [120, 100], med: [80, 60] };
  const dims = (r) => r.t === "cu" ? [r.l || 0, r.a || 0] : MEDIDAS[r.t] || MEDIDAS.eu;
  // Todas las recogidas a la vez: lo que pinta la pantalla y lo que miran las pruebas
  // Peso: kg = total de la recogida (v179); los datos viejos solo traen w (kg por palet)
  const kgRec = (r, q) => r.kg != null ? Math.max(0, +r.kg || 0) : q * (r.w || 0);
  // mano (v180): palets puestos a mano [{r: n.º de recogida desde 0, x, y: sitio en cm, e: encima}]. Esos palets salen
  // del cálculo automático de su recogida; luego se ponen en su sitio. Si el sitio ya no está o no cabe (han cambiado
  // los datos), ese palet se vuelve a colocar solo (res.manoMal) para no perder ninguno.
  // v185: como mucho TOPE palets por recogida (con 100.000 se quedaba colgado; en un remolque caben unos 66)
  const TOPE = 300, cant = (r) => Math.min(TOPE, Math.max(0, Math.floor(r.q || 0)));
  function calcula(recs, Lc, Wc, fill, altoC, mano) {
    const rows = [], res = { rows, lineas: [], bad: [], sinMedida: [], kg: 0, tot: 0, mano: 0, manoMal: 0 };
    const techo = altoC || 270, cuenta = recs.map(() => 0), validos = [];
    (mano || []).forEach(m => { const r = recs[m.r]; if (r && cuenta[m.r] < cant(r)) { cuenta[m.r]++; validos.push(m); } });
    recs.forEach((r, i) => {
      const q = cant(r), d = dims(r), before = used(rows);
      if (!q) return;
      if (!(d[0] > 0 && d[1] > 0)) { res.sinMedida.push(i); return; }
      if (!orients(d, Wc).length || !place(rows, { d, st: r.s, rec: i + 1, q: q - cuenta[i], h: r.h > 0 ? r.h : 0, alto: techo }, Wc, fill)) { res.bad.push(i); return; }
      res.kg += kgRec(r, q); res.tot += q;
      res.lineas.push({ i, q, d, nuevo: used(rows) - before });
    });
    const vuelta = recs.map(() => 0);
    validos.forEach(m => {
      const r = recs[m.r], d = dims(r), ha = r.h > 0 ? r.h : 0;
      if (res.bad.includes(m.r) || res.sinMedida.includes(m.r)) return;
      const s = sitios(rows).find(s => s.tipo === (m.e ? "encima" : "hueco") && m.x >= s.x && m.x < s.x + s.w && m.y >= s.y && m.y < s.y + s.h && !noCabe(s, d, ha, techo));
      if (s) { ponMano(s, d, m.r + 1, !!r.s, ha); res.mano++; } else { vuelta[m.r]++; res.manoMal++; }
    });
    vuelta.forEach((n, i) => { if (n) { const r = recs[i]; place(rows, { d: dims(r), st: r.s, rec: i + 1, q: n, h: r.h > 0 ? r.h : 0, alto: techo }, Wc, fill); } });
    // v185: redondeado a la milésima de cm (las sumas de decimales daban 1360,0000001 y «No cabe» sin pasar)
    res.usado = Math.round(used(rows) * 1000) / 1000;
    return res;
  }
  window.CargaCuentas = { orients, plan, place, used, maxFit, nfit, holes, calcula, MEDIDAS, kgRec, sitios, noCabe, dims };

  // ---- Pantalla ----
  const $ = (i) => document.getElementById(i);
  const vista = $("v-carga");
  if (!vista || typeof esc !== "function") return;
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("carga", "v-carga", () => { build(); calc(); }) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m), TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  /* textos */
  const NOMBRES = { eu: "Europalet 120×80", ind: "Industrial 120×100", med: "Medio palet 80×60", cu: "Otro tamaño" };
  /* fin textos */
  const COL = ["#2a3f9e", "#c2410c", "#047857", "#7c3aed", "#be123c", "#0e7490", "#a16207", "#4d7c0f"];
  const KEY = "ccoo-remolque", N_COL = COL.length;
  let recs = [], fit = false, FILL = true, resumen = "", VISTA = "3d", motor = null, cargando = null, ultimo = null;
  // v180 (petición n.º 48): colocar a mano. MANO = palets puestos a mano (se guarda en «mano»); MODO = el modo está
  // encendido; SITIOS = huecos y sitios encima del último cálculo; SELT = el sitio que se ha tocado.
  let MANO = [], MODO = false, SITIOS = [], SELT = null, ultimoR = null;
  const nuevo = (i) => ({ n: T("Recogida {n}", { n: i }), t: "eu", q: 0, s: false, kg: 0, l: 120, a: 80, h: 0 });
  const num = (v) => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : 0; };
  const f = (n, d) => n.toFixed(d).replace(".", ",");
  const kg = (n) => Math.round(n).toLocaleString("es-ES");
  // Lo guardado puede venir de una versión vieja o estropeado: se limpia campo a campo, sin perder lo que vale.
  // v179 (petición n.º 47): el peso es el total de la recogida («kg»). Lo guardado antes traía «w» = kg por palet:
  // se pasa una vez (w × n.º de palets) para no perder lo apuntado. Al guardar se deja también «w» (por palet) para que
  // una versión anterior de la web siga leyendo el peso si hubiera que volver atrás.
  const limpiaKg = (r) => r?.kg != null ? Math.max(0, num(r.kg)) : Math.max(0, num(r?.w)) * Math.max(0, Math.floor(num(r?.q)));
  const limpia = (r, i) => ({ n: typeof r?.n === "string" ? r.n.slice(0, 60) : T("Recogida {n}", { n: i + 1 }), t: NOMBRES[r?.t] ? r.t : "eu", q: Math.min(300, Math.max(0, Math.floor(num(r?.q)))), s: !!r?.s, kg: limpiaKg(r), l: Math.max(0, num(r?.l ?? 120)), a: Math.max(0, num(r?.a ?? 80)), h: Math.min(400, Math.max(0, num(r?.h))) });
  // Lo colocado a mano: lista de {r, x, y, e}; lo que no valga se tira (nunca toca las recogidas)
  const limpiaMano = (m, n) => Array.isArray(m) ? m.slice(0, 200).filter(o => o && Number.isInteger(o.r) && o.r >= 0 && o.r < n && isFinite(o.x) && isFinite(o.y) && o.x >= 0 && o.y >= 0).map(o => ({ r: o.r, x: Math.round(o.x), y: Math.round(o.y), e: !!o.e })) : [];
  function load() {
    recs = []; FILL = true; MANO = [];
    try {
      // «remolque_v2» es la clave del archivo del padre: si alguien lo usó en esta misma dirección, se recupera
      const d = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("remolque_v2") || "null");
      if (d && Array.isArray(d.recs) && d.recs.length) {
        recs = d.recs.slice(0, 40).map(limpia);
        $("cg-len").value = d.len || 13.6; $("cg-wid").value = d.wid || 2.4; $("cg-pay").value = d.pay || ""; $("cg-alt").value = d.alt || 2.7;
        if (d.fill === false) FILL = false;
        MANO = limpiaMano(d.mano, recs.length);
      }
      if (d && ["arriba", "lado", "3d"].includes(d.vista)) VISTA = d.vista;
    } catch (e) { /* sin datos o sin permiso: se empieza vacío */ }
    if (!recs.length) recs = [nuevo(1)];
    $("cg-fill").checked = FILL;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ recs: recs.map(r => Object.assign({}, r, { w: r.q > 0 ? Math.round(r.kg / r.q * 100) / 100 : 0 })), len: $("cg-len").value, wid: $("cg-wid").value, pay: $("cg-pay").value, alt: $("cg-alt").value, fill: FILL, vista: VISTA, mano: MANO })); } catch (e) { /* móvil sin espacio o en privado */ } }
  // Otra ventana ha guardado: ponerse al día (si no, al tocar aquí se pisaría lo de la otra)
  window.addEventListener("storage", (e) => { if (e.key === KEY) { load(); build(); cierra(); barra(); ponVista(VISTA, true); } });

  function build() {
    $("cg-recs").innerHTML = recs.map((r, i) => {
      const id = "cg-" + i;
      let h = `<div class="panel zc-caja cg-rec cg-c${i % N_COL}"><div class="cg-rec-cab"><span class="cg-num" aria-hidden="true">${i + 1}</span><label class="sr-only" for="${id}-n">${esc(T("Nombre de la recogida"))}</label><input id="${id}-n" data-i="${i}" data-f="n" value="${esc(r.n)}" maxlength="60">` +
        (recs.length > 1 ? `<button type="button" class="cg-quitar" data-del="${i}">${esc(T("Quitar"))}</button>` : "") + `</div>`;
      h += `<div class="cg-dato cg-d-t"><label for="${id}-t">${esc(T("Tipo de palet"))}</label><select id="${id}-t" data-i="${i}" data-f="t">` + Object.keys(NOMBRES).map(k => `<option value="${k}"${r.t === k ? " selected" : ""}>${esc(T(NOMBRES[k]))}</option>`).join("") + `</select>`;
      if (r.t === "cu") h += `<div class="zc-dos"><div><label for="${id}-l">${esc(T("Largo (cm)"))}</label><input id="${id}-l" type="number" inputmode="decimal" min="0" data-i="${i}" data-f="l" value="${esc(r.l)}"></div><div><label for="${id}-a">${esc(T("Ancho (cm)"))}</label><input id="${id}-a" type="number" inputmode="decimal" min="0" data-i="${i}" data-f="a" value="${esc(r.a)}"></div></div>`;
      h += `</div>`;
      h += `<div class="zc-dos"><div class="cg-dato cg-d-q"><label for="${id}-q">${esc(T("N.º de palets"))}</label><input id="${id}-q" type="number" inputmode="numeric" min="0" data-i="${i}" data-f="q" value="${r.q || ""}" placeholder="0"></div><div class="cg-dato cg-d-w"><label for="${id}-w">${esc(T("Kg en total de esta recogida (opcional)"))}</label><input id="${id}-w" type="number" inputmode="decimal" min="0" data-i="${i}" data-f="kg" value="${r.kg || ""}" placeholder="0"></div></div>`;
      h += `<div class="cg-dato cg-d-h"><label for="${id}-h">${esc(T("Alto con la carga y el palet (cm, opcional)"))}</label><input id="${id}-h" type="number" inputmode="decimal" min="0" max="400" data-i="${i}" data-f="h" value="${r.h || ""}" placeholder="${esc(T("Ej. 120"))}"></div>`;
      h += `<label class="cg-marca"><input type="checkbox" data-i="${i}" data-f="s"${r.s ? " checked" : ""}><span>${esc(T("Van apilados en 2 alturas"))}</span></label></div>`;
      return h;
    }).join("");
  }
  function draw(rows, Lc, Wc) {
    const u = used(rows), vw = Math.max(Lc, u), sc = $("cg-dibujo");
    const ppm = fit ? Math.max(16, (sc.clientWidth - 6) / (vw / 100)) : 64;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${Wc}" width="${vw / 100 * ppm}" height="${Wc / 100 * ppm}" aria-hidden="true">`;
    let x = 0;
    rows.forEach(r => {
      r.items.forEach(p => {
        const px = x + p.x;
        s += `<rect x="${px}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${COL[(p.r - 1) % N_COL]}" stroke="#fff" stroke-width="3" rx="4"/>`;
        if (p.w >= 60 && p.h >= 60 && !p.top) s += `<text x="${px + p.w / 2}" y="${p.y + p.h / 2 + 10}" font-size="32" font-weight="800" fill="#fff" text-anchor="middle">${p.r}</text>`;
        if (p.s && p.w >= 60) s += `<text x="${px + p.w - 6}" y="${p.y + 30}" font-size="24" font-weight="700" fill="#fff" text-anchor="end">×2</text>`;
        // Palet de otra recogida encima (v179): recuadro de su color dentro y «1+2» (abajo + encima)
        if (p.top) {
          const tw = Math.max(20, p.top.w - 24), th = Math.max(20, p.top.h - 24), tx = px + (p.w - tw) / 2, ty = p.y + (p.h - th) / 2;
          s += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="${COL[(p.top.r - 1) % N_COL]}" stroke="#fff" stroke-width="3" rx="4"/>`;
          if (p.w >= 60 && p.h >= 60) s += `<text x="${px + p.w / 2}" y="${p.y + p.h / 2 + 10}" font-size="28" font-weight="800" fill="#fff" text-anchor="middle">${p.r}+${p.top.r}</text>`;
        }
      });
      r.free.forEach(h => {
        if (h.w >= 30 && h.h >= 30) s += `<rect class="cg-hueco" x="${x + h.x + 3}" y="${h.y + 3}" width="${h.w - 6}" height="${h.h - 6}" fill="none" stroke-width="3" stroke-dasharray="10 8" rx="4"/>`;
      });
      x += r.al;
    });
    // Colocar a mano (v180): huecos y «+» encima de los palets sueltos, para tocarlos
    if (MODO) SITIOS.forEach((t, k) => {
      if (t.tipo === "hueco" && (t.w < 40 || t.h < 40)) return;
      const sel = SELT && esMismo(t, SELT) ? " cg-sel" : "", et = esc(etiquetaSitio(t));
      if (t.tipo === "hueco") s += `<g data-sitio="${k}" tabindex="0" role="button" aria-label="${et}"><rect class="cg-sitio${sel}" x="${t.x + 3}" y="${t.y + 3}" width="${t.w - 6}" height="${t.h - 6}" rx="4"/><text class="cg-sitio-mas" x="${t.x + t.w / 2}" y="${t.y + t.h / 2 + 14}" font-size="44" text-anchor="middle">+</text></g>`;
      else { const cx = t.x + t.w - 26, cy = t.y + t.h - 26; s += `<g class="cg-sitio-enc${sel}" data-sitio="${k}" tabindex="0" role="button" aria-label="${et}"><circle cx="${cx}" cy="${cy}" r="21"/><text class="cg-sitio-mas" x="${cx}" y="${cy + 13}" font-size="38" text-anchor="middle">+</text></g>`; }
    });
    if (u > Lc) s += `<rect class="cg-sobra" x="${Lc}" y="0" width="${u - Lc}" height="${Wc}"/><line class="cg-linea" x1="${Lc}" y1="0" x2="${Lc}" y2="${Wc}" stroke-width="6"/>`;
    sc.innerHTML = s + "</svg>";
  }
  function calc() {
    const L = num($("cg-len").value), W = num($("cg-wid").value), pay = num($("cg-pay").value);
    if (!(L > 0 && W > 0)) { $("cg-dibujo").innerHTML = ""; $("cg-cab").textContent = T("Pon el largo y el ancho del remolque en «Ajustes del remolque»."); $("cg-res").innerHTML = ""; resumen = ""; return; }
    // Alto: el de cada recogida (si no lo apuntan, 1,20 m en el 3D, que es lo normal para apilar 2 en 2,70 m) y el de dentro
    const Hc = Math.round((num($("cg-alt").value) || 2.7) * 100);
    const Lc = Math.round(L * 100), Wc = Math.round(W * 100), R = calcula(recs, Lc, Wc, FILL, Hc, MANO), rows = R.rows, u = R.usado, libre = Lc - u;
    SITIOS = sitios(rows); ultimoR = R;
    // Si el sitio elegido ya no está (han cambiado los datos), se cierra la lista
    if (SELT && !SITIOS.some(t => esMismo(t, SELT))) cierra();
    draw(rows, Lc, Wc);
    const altos = recs.map(r => r.h > 0 ? r.h : 0);
    ultimo = [rows, Lc, Wc, { altos, alto: Hc }];
    if (motor && VISTA !== "arriba") motor.pinta(rows, Lc, Wc, COL, oscuro(), ultimo[3]);
    $("cg-cab").innerHTML = TH("{n} palets", { n: R.tot }) + " · " + `<b${u > Lc ? ' class="cg-pasa"' : ""}>${esc(T("{u} m de {l} m", { u: f(u / 100, 2), l: f(L, 2) }))}</b> <small>${esc(u > Lc ? T("No cabe: sobran {m} m", { m: f((u - Lc) / 100, 2) }) : T("Quedan {m} m", { m: f(libre / 100, 2) }))}</small>`;
    const nombre = nombreRec;
    let h = "";
    if (R.manoMal) h += `<div class="zc-aviso">${esc(R.manoMal > 1 ? T("{n} palets que pusiste a mano ya no caben donde los pusiste (han cambiado los datos o la colocación). Se han colocado solos.", { n: R.manoMal }) : T("1 palet que pusiste a mano ya no cabe donde lo pusiste (han cambiado los datos o la colocación). Se ha colocado solo."))}</div>`;
    if (R.sinMedida.length) h += `<div class="zc-aviso">${esc(T("Pon el largo y el ancho de: {r}.", { r: R.sinMedida.map(nombre).join(", ") }))}</div>`;
    // Alto real: apilados = 2 palets uno encima del otro; tienen que caber bajo el techo
    const altoMal = recs.map((r, i) => ({ r, i })).filter(({ r }) => r.h > 0 && r.q > 0 && (r.s ? 2 * r.h : r.h) > Hc);
    altoMal.forEach(({ r, i }) => { h += `<div class="zc-mal">${esc(r.s ? T("{r}: apilados miden {x} m de alto y por dentro hay {a} m. No caben apilados.", { r: nombre(i), x: f(2 * r.h / 100, 2), a: f(Hc / 100, 2) }) : T("{r}: mide {x} m de alto y por dentro hay {a} m. No cabe de alto.", { r: nombre(i), x: f(r.h / 100, 2), a: f(Hc / 100, 2) }))}</div>`; });
    if (R.bad.length) h += `<div class="zc-mal">${esc(T("Estos palets son más anchos que el remolque y no se han colocado: {r}.", { r: R.bad.map(nombre).join(", ") }))}</div>`;
    if (u > Lc) h += `<div class="zc-mal">${TH("**No cabe todo.** La zona roja es lo que sobresale. Si algún palet admite apilar, márcalo; si no, hay que dejar parte fuera.")}</div>`;
    else if (R.tot) {
      const eu = maxFit(rows, [120, 80], Wc, Lc, FILL), ind = maxFit(rows, [120, 100], Wc, Lc, FILL), med = maxFit(rows, [80, 60], Wc, Lc, FILL);
      h += `<div class="zc-ok">${TH("Te quedan **{m} m**. Aún caben unos **{eu} europalets**, {ind} industriales o {med} medios palets.", { m: f(libre / 100, 2), eu, ind, med })}</div>`;
    }
    const hs = holes(rows);
    // Tipos de palet apuntados (para decir cuál no cabe en un hueco)
    const tipos = [];
    recs.forEach(r => { if (!(r.q > 0)) return; const d = dims(r); if (!(d[0] > 0 && d[1] > 0)) return; const nombre = r.t === "cu" ? d[0] + "×" + d[1] : T(NOMBRES[r.t]); if (!tipos.some(t => t.nombre === nombre)) tipos.push({ d, nombre }); });
    // Palets sueltos de recogidas apiladas con el sitio de encima libre (v179)
    const sueltos = {};
    rows.forEach(row => row.items.forEach(it => { if (it.apil && !it.s && !it.top) sueltos[it.r] = (sueltos[it.r] || 0) + 1; }));
    Object.keys(sueltos).forEach(k => {
      const c = sueltos[k], r = nombre(+k - 1);
      h += `<div class="zc-aviso">${esc(c > 1 ? T("Encima de {c} palets sueltos de {r} queda sitio para otro palet. Si la siguiente recogida va apilada, se pone ahí (si es igual o más pequeño y cabe de alto).", { c, r }) : T("Encima de 1 palet suelto de {r} queda sitio para otro palet. Si la siguiente recogida va apilada, se pone ahí (si es igual o más pequeño y cabe de alto).", { r }))}</div>`;
    });
    if (hs.length) {
      h += `<div class="zc-aviso"><p class="cg-p">${TH("**Huecos sin usar** (los de línea discontinua del dibujo):")}</p><ul>` + hs.map(g => {
        const a = nfit([120, 80], g), b = nfit([120, 100], g), c = nfit([80, 60], g), opts = [];
        if (a) opts.push(a > 1 ? T("{n} europalets", { n: a }) : T("1 europalet"));
        if (b) opts.push(b > 1 ? T("{n} industriales", { n: b }) : T("1 industrial"));
        if (c) opts.push(c > 1 ? T("{n} medios palets", { n: c }) : T("1 medio palet"));
        const que = g.c > 1 ? T("{c} huecos de {w}×{h} cm", { c: g.c, w: g.w, h: g.h }) : T("1 hueco de {w}×{h} cm", { w: g.w, h: g.h });
        // Por qué no se ha usado (v179): los tipos de palet apuntados que no caben en ese hueco
        const noCaben = tipos.filter(t => !nfit(t.d, g)).map(t => t.nombre);
        return `<li>${esc((opts.length ? T("{que}: caben {opts}.", { que, opts: opts.join(T(" o ")) }) : T("{que}: solo cabe mercancía suelta o pequeña.", { que })) + (noCaben.length ? " " + T("No cabe: {t}.", { t: noCaben.join(", ") }) : ""))}</li>`;
      }).join("") + `</ul><p class="zc-pista">${esc(T("Añade otra recogida con ese tipo de palet y se colocará sola en el hueco."))}</p></div>`;
    }
    if (R.kg > 0) {
      const pasa = pay > 0 && R.kg > pay;
      h += `<div class="${pasa ? "zc-mal" : "zc-aviso"}">${TH("Peso apuntado: **{k} kg**", { k: kg(R.kg) })}${pay > 0 ? esc(" " + T("de {p} kg.", { p: kg(pay) }) + " " + (pasa ? T("Te pasas {k} kg.", { k: kg(R.kg - pay) }) : T("Te quedan {k} kg.", { k: kg(pay - R.kg) }))) : "."}</div>`;
    }
    $("cg-res").innerHTML = h;
    // Resumen para copiar (texto plano, sin flechas)
    const lin = R.lineas.map(l => {
      const r = recs[l.i], tipo = r.t === "cu" ? l.d[0] + "×" + l.d[1] : T(NOMBRES[r.t]);
      return nombre(l.i) + ": " + l.q + " × " + tipo + (r.s ? " " + T("(apilados)") : "") + ", " + (l.nuevo ? T("{m} m nuevos", { m: f(l.nuevo / 100, 2) }) : T("en huecos"));
    });
    resumen = lin.join("\n") + (lin.length ? "\n" : "") + T("Total: {n} palets, {u} m de {l} m", { n: R.tot, u: f(u / 100, 2), l: f(L, 2) }) + (R.kg ? ", " + kg(R.kg) + " kg" : "") + (R.mano ? "\n" + T("Colocados a mano: {n}", { n: R.mano }) : "");
  }

  // ---- Colocar a mano (v180, petición n.º 48) ----
  const nombreRec = (i) => (recs[i] && recs[i].n) || T("Recogida {n}", { n: i + 1 });
  const altoDentro = () => Math.round((num($("cg-alt").value) || 2.7) * 100);
  const esMismo = (a, b) => a.tipo === b.tipo && a.x === b.x && a.y === b.y;
  function etiquetaSitio(t) {
    const m = f(t.x / 100, 2);
    return t.tipo === "hueco" ? T("Hueco de {w}×{h} cm, a {m} m de la cabina", { w: t.w, h: t.h, m }) : T("Encima del palet suelto de {r} ({w}×{h} cm), a {m} m de la cabina", { r: nombreRec(t.it.r - 1), w: t.w, h: t.h, m });
  }
  function barra() {
    $("cg-mano").setAttribute("aria-pressed", String(MODO));
    $("cg-mano").textContent = MODO ? T("Terminar de colocar") : T("Colocar a mano");
    $("cg-mano-pista").hidden = !MODO;
    $("cg-deshacer").hidden = $("cg-mano-quita").hidden = !MANO.length;
  }
  function cierra() { SELT = null; $("cg-elige").hidden = true; $("cg-elige").innerHTML = ""; }
  function motivo(por, t, d, r, techo) {
    if (por === "medida") return T("No cabe: el palet mide {p} cm y el sitio {s} cm.", { p: d[0] + "×" + d[1], s: t.w + "×" + t.h });
    if (por === "alto") return T("No cabe de alto: {a} m + {b} m, y por dentro hay {c} m.", { a: f((t.it.hc || 120) / 100, 2), b: f((r.h > 0 ? r.h : 120) / 100, 2), c: f(techo / 100, 2) });
    return por;
  }
  function elige(t) {
    SELT = { tipo: t.tipo, x: t.x, y: t.y }; $("cg-mano-msg").textContent = "";
    const techo = altoDentro(), caja = $("cg-elige");
    let h = `<p class="cg-p"><b>${esc(etiquetaSitio(t))}</b></p><p class="cg-p">${esc(T("¿Qué palet pones ahí?"))}</p><div class="cg-elige-opts">`, alguno = false;
    recs.forEach((r, i) => {
      const q = Math.max(0, Math.floor(r.q || 0)), d = dims(r);
      if (!(q > 0) || !(d[0] > 0 && d[1] > 0)) return;
      alguno = true;
      const tipo = r.t === "cu" ? d[0] + "×" + d[1] : T(NOMBRES[r.t]), libres = q - MANO.filter(m => m.r === i).length;
      const por = libres <= 0 ? T("Ya has colocado a mano todos sus palets.") : noCabe(t, d, r.h > 0 ? r.h : 0, techo);
      const cab = `<span class="cg-pon-num" aria-hidden="true">${i + 1}</span><span>${esc(nombreRec(i))}<small>${esc(por ? motivo(por, t, d, r, techo) : tipo)}</small></span>`;
      h += por ? `<p class="cg-no cg-c${i % N_COL}">${cab}</p>` : `<button type="button" class="btn cg-pon cg-c${i % N_COL}" data-pon="${i}">${cab}</button>`;
    });
    if (!alguno) h += `<p class="cg-p">${esc(T("Apunta antes alguna recogida con palets."))}</p>`;
    caja.innerHTML = h + `</div><button type="button" class="btn sec" data-cierra>${esc(T("Cancelar"))}</button>`;
    caja.hidden = false; calc();
    caja.scrollIntoView({ block: "nearest" });
    (caja.querySelector("[data-pon]") || caja.querySelector("[data-cierra]")).focus({ preventScroll: true });
  }
  function modo(si) {
    MODO = si; cierra(); $("cg-mano-msg").textContent = "";
    if (si && VISTA !== "arriba") ponVista("arriba"); else calc();
    barra();
  }
  $("cg-mano").addEventListener("click", () => modo(!MODO));
  const tocaSitio = (e) => { const g = e.target.closest("[data-sitio]"); if (!g || !MODO) return false; const t = SITIOS[+g.dataset.sitio]; if (t) elige(t); return true; };
  $("cg-dibujo").addEventListener("click", tocaSitio);
  $("cg-dibujo").addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && tocaSitio(e)) e.preventDefault(); });
  $("cg-elige").addEventListener("click", (e) => {
    if (e.target.closest("[data-cierra]")) { cierra(); calc(); $("cg-mano").focus(); return; }
    const b = e.target.closest("[data-pon]"); if (!b || !SELT) return;
    const i = +b.dataset.pon, antes = ultimoR ? ultimoR.manoMal : 0;
    MANO.push({ r: i, x: SELT.x, y: SELT.y, e: SELT.tipo === "encima" });
    cierra(); save(); calc(); barra();
    $("cg-mano-msg").textContent = ultimoR && ultimoR.manoMal > antes ? T("Al sacar ese palet de su recogida cambia la colocación y el sitio ya no está: se ha colocado solo. Pulsa «Deshacer» si quieres.") : T("Puesto: un palet de {r}. Si no te gusta, pulsa «Deshacer».", { r: nombreRec(i) });
  });
  $("cg-deshacer").addEventListener("click", () => { MANO.pop(); cierra(); save(); calc(); barra(); $("cg-mano-msg").textContent = T("Quitado el último palet colocado a mano."); if ($("cg-deshacer").hidden) $("cg-mano").focus(); });
  $("cg-mano-quita").addEventListener("click", () => { MANO = []; cierra(); save(); calc(); barra(); $("cg-mano-msg").textContent = T("Quitado todo lo colocado a mano. Los palets se colocan solos."); $("cg-mano").focus(); });

  // Vistas: «Desde arriba» (el dibujo del padre, siempre funciona), «De lado» y «En 3D» (carga-3d.js con three.js, que
  // solo se descarga al elegirlas). Si el móvil no puede con 3D (sin WebGL), se queda en «Desde arriba» y lo dice.
  const oscuro = () => { const m = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255]; return (+m[0] * 0.3 + +m[1] * 0.59 + +m[2] * 0.11) < 110; };
  function sin3d(txt, siempre) {
    motor = null; cargando = null; ponVista("arriba", true);
    if (siempre) $("cg-vistas").hidden = true; // sin WebGL no hay nada que elegir
    let p = vista.querySelector(".cg-sin3d");
    if (!p) { p = document.createElement("p"); p.className = "zc-pista cg-sin3d"; $("cg-cab").after(p); }
    p.textContent = txt;
  }
  function arranca3d() {
    if (motor || cargando) return cargando;
    // Antes de descargar three.js se mira si el móvil puede dibujar en 3D (así no se baja para nada)
    let gl = null; try { const c = document.createElement("canvas"); gl = c.getContext("webgl2") || c.getContext("webgl"); gl?.getExtension("WEBGL_lose_context")?.loseContext(); } catch (e) { gl = null; }
    if (!gl) { sin3d(T("Este móvil no puede enseñar el camión en 3D. Lo ves desde arriba."), true); return null; }
    const v = typeof VERSION_WEB !== "undefined" ? VERSION_WEB : "1";
    cargando = import("./carga-3d.js?v=" + v).then(m => {
      motor = m.crea($("cg-3d"));
      if (!motor) { sin3d(T("Este móvil no puede enseñar el camión en 3D. Lo ves desde arriba."), true); return; }
      if (ultimo) motor.pinta(ultimo[0], ultimo[1], ultimo[2], COL, oscuro(), ultimo[3]);
      if (VISTA !== "arriba") motor.vista(VISTA);
    }).catch(() => sin3d(T("No se ha podido cargar la vista en 3D (¿sin conexión?). Lo ves desde arriba.")));
    return cargando;
  }
  function ponVista(v, sinGuardar) {
    VISTA = v;
    if (v !== "arriba" && MODO) { MODO = false; cierra(); barra(); } // a mano solo se coloca en «Desde arriba»
    vista.querySelectorAll("#cg-vistas [data-vista]").forEach(b => { const si = b.dataset.vista === v; b.classList.toggle("activa", si); b.setAttribute("aria-pressed", String(si)); });
    const en3d = v !== "arriba";
    vista.querySelector(".cg-fija").classList.toggle("cg-en3d", en3d); // el 3D no se queda fijo arriba: taparía media pantalla
    $("cg-extremos").hidden = en3d; $("cg-dibujo").hidden = en3d; $("cg-3d").hidden = !en3d;
    if (!sinGuardar) save();
    calc();
    const aviso = vista.querySelector(".cg-sin3d"); if (aviso && en3d) aviso.remove();
    if (en3d) { if (motor) { motor.tamano(); motor.vista(v); } else arranca3d(); }
  }
  $("cg-vistas").addEventListener("click", (e) => { const b = e.target.closest("[data-vista]"); if (b) ponVista(b.dataset.vista); });
  // Modo claro/oscuro: repintar el 3D con el fondo que toca
  const cambiaTema = () => { if (motor && VISTA !== "arriba") calc(); };
  new MutationObserver(cambiaTema).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", cambiaTema);

  // Tocar una recogida
  $("cg-recs").addEventListener("input", (e) => {
    const el = e.target, i = el.dataset.i, fd = el.dataset.f; if (i === undefined || !recs[+i]) return;
    const r = recs[+i];
    if (fd === "n") r.n = el.value.slice(0, 60);
    else if (fd === "s") r.s = el.checked;
    else if (fd === "t") { r.t = NOMBRES[el.value] ? el.value : "eu"; save(); build(); calc(); $("cg-" + i + "-t")?.focus(); return; }
    else r[fd] = fd === "q" ? Math.min(300, Math.max(0, Math.floor(num(el.value)))) : Math.max(0, num(el.value));
    save(); calc();
  });
  $("cg-recs").addEventListener("change", (e) => { if (e.target.dataset.f === "s") { recs[+e.target.dataset.i].s = e.target.checked; save(); calc(); } });
  $("cg-recs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    const k = +b.dataset.del;
    recs.splice(k, 1);
    MANO = MANO.filter(m => m.r !== k).map(m => m.r > k ? Object.assign({}, m, { r: m.r - 1 }) : m); // lo suyo a mano se va con ella
    cierra(); save(); build(); calc(); barra();
  });
  $("cg-add").addEventListener("click", () => {
    recs.push(nuevo(recs.length + 1)); save(); build(); calc();
    const ult = $("cg-" + (recs.length - 1) + "-q"); if (ult) { ult.scrollIntoView({ block: "center" }); ult.focus({ preventScroll: true }); }
  });
  // Empezar de cero: se pregunta en la propia página (en la app no hay ventanas de confirmar)
  $("cg-cero").addEventListener("click", () => { $("cg-confirma").hidden = false; $("cg-cero").hidden = true; $("cg-si").focus(); });
  $("cg-no").addEventListener("click", () => { $("cg-confirma").hidden = true; $("cg-cero").hidden = false; $("cg-cero").focus(); });
  $("cg-si").addEventListener("click", () => {
    recs = [nuevo(1)]; MANO = []; cierra(); save(); build(); calc(); barra();
    $("cg-confirma").hidden = true; $("cg-cero").hidden = false; $("cg-cero").focus();
  });
  $("cg-zoom").addEventListener("click", () => { fit = !fit; $("cg-zoom").textContent = fit ? T("Ampliar") : T("Ver todo"); $("cg-zoom").setAttribute("aria-pressed", String(fit)); calc(); });
  $("cg-fill").addEventListener("change", () => { FILL = $("cg-fill").checked; save(); calc(); });
  ["cg-len", "cg-wid", "cg-pay", "cg-alt"].forEach(i => $(i).addEventListener("input", () => { save(); calc(); }));
  $("cg-copia").addEventListener("click", async () => {
    const msg = $("cg-copia-msg");
    try { await navigator.clipboard.writeText(resumen); msg.textContent = T("Resumen copiado. Pégalo donde quieras (WhatsApp, notas…)."); }
    catch (e) { msg.textContent = T("No se ha podido copiar. Mantén el dedo sobre el resumen de abajo para copiarlo a mano."); $("cg-resumen").hidden = false; $("cg-resumen").textContent = resumen; }
  });
  // El dibujo se queda arriba al bajar por las recogidas: justo debajo de la cabecera de la web
  const cab = document.querySelector(".cab-tablon");
  const fija = vista.querySelector(".cg-fija");
  const ponTop = () => { vista.style.setProperty("--cg-top", (cab ? cab.offsetHeight : 0) + "px"); if (fija.offsetHeight) vista.style.setProperty("--cg-alto", fija.offsetHeight + "px"); };
  if (typeof ResizeObserver === "function") new ResizeObserver(ponTop).observe(fija);
  window.addEventListener("resize", () => { ponTop(); if (fit) calc(); });
  ponTop();
  load(); build(); barra();
  // El 3D se prepara la primera vez que se abre el simulador (no al cargar la web)
  const alAbrir = () => { if (location.hash.replace("#", "") === "carga") { ponVista(VISTA, true); window.removeEventListener("hashchange", alAbrir); } };
  // Hasta abrirlo se enseña el dibujo de arriba (sin descargar el 3D); se recuerda la vista elegida
  const elegida = VISTA; ponVista("arriba", true); VISTA = elegida;
  window.addEventListener("hashchange", alAbrir); alAbrir();
})();
