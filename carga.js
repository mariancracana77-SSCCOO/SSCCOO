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
  function put(row, fi, o, flag, rec) {
    const r = row.free[fi]; row.free.splice(fi, 1);
    row.items.push({ r: rec, s: flag, x: r.x, y: r.y, w: o[0], h: o[1] });
    if (r.w - o[0] > 0) row.free.push({ x: r.x + o[0], y: r.y, w: r.w - o[0], h: r.h });
    if (r.h - o[1] > 0) row.free.push({ x: r.x, y: r.y + o[1], w: o[0], h: r.h - o[1] });
  }
  function place(rows, sp, W, fill) {
    const q = Math.max(0, Math.floor(sp.q || 0)); if (!q) return true;
    const os = orients(sp.d, W); if (!os.length) return false;
    const n = sp.st ? Math.ceil(q / 2) : q, flags = [];
    for (let i = 0; i < n; i++) flags.push(!!sp.st && !(q % 2 === 1 && i === n - 1));
    while (flags.length) {
      let best = null, bo = null; const from = fill ? 0 : Math.max(0, rows.length - 1);
      for (let i = from; i < rows.length; i++) rows[i].free.forEach((r, fi) => {
        const o = fitDims(sp.d, r);
        if (o) { const w = r.w * r.h - o[0] * o[1]; if (!best || w < best.w) { best = { row: rows[i], fi, w }; bo = o; } }
      });
      if (!best) break;
      put(best.row, best.fi, bo, flags.shift(), sp.rec);
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
      for (let k = 0; k < o.cap && flags.length; k++) put(row, 0, [o.al, o.ac], flags.shift(), sp.rec);
    });
    return true;
  }
  const used = (rows) => rows.reduce((s, r) => s + r.al, 0);
  function maxFit(rows, d, W, L, fill) {
    if (!orients(d, W).length) return 0;
    for (let q = 1; q <= 200; q++) { const c = JSON.parse(JSON.stringify(rows)); place(c, { d, st: false, rec: 0, q }, W, fill); if (used(c) > L) return q - 1; }
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
  const MEDIDAS = { eu: [120, 80], ind: [120, 100], med: [80, 60] };
  const dims = (r) => r.t === "cu" ? [r.l || 0, r.a || 0] : MEDIDAS[r.t] || MEDIDAS.eu;
  // Todas las recogidas a la vez: lo que pinta la pantalla y lo que miran las pruebas
  function calcula(recs, Lc, Wc, fill) {
    const rows = [], res = { rows, lineas: [], bad: [], sinMedida: [], kg: 0, tot: 0 };
    recs.forEach((r, i) => {
      const q = Math.max(0, Math.floor(r.q || 0)), d = dims(r), before = used(rows);
      if (!q) return;
      if (!(d[0] > 0 && d[1] > 0)) { res.sinMedida.push(i); return; }
      if (!place(rows, { d, st: r.s, rec: i + 1, q }, Wc, fill)) { res.bad.push(i); return; }
      res.kg += q * (r.w || 0); res.tot += q;
      res.lineas.push({ i, q, d, nuevo: used(rows) - before });
    });
    res.usado = used(rows);
    return res;
  }
  window.CargaCuentas = { orients, plan, place, used, maxFit, nfit, holes, calcula, MEDIDAS };

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
  const nuevo = (i) => ({ n: T("Recogida {n}", { n: i }), t: "eu", q: 0, s: false, w: 0, l: 120, a: 80, h: 0 });
  const num = (v) => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : 0; };
  const f = (n, d) => n.toFixed(d).replace(".", ",");
  const kg = (n) => Math.round(n).toLocaleString("es-ES");
  // Lo guardado puede venir de una versión vieja o estropeado: se limpia campo a campo, sin perder lo que vale.
  const limpia = (r, i) => ({ n: typeof r?.n === "string" ? r.n.slice(0, 60) : T("Recogida {n}", { n: i + 1 }), t: NOMBRES[r?.t] ? r.t : "eu", q: Math.max(0, Math.floor(num(r?.q))), s: !!r?.s, w: Math.max(0, num(r?.w)), l: Math.max(0, num(r?.l ?? 120)), a: Math.max(0, num(r?.a ?? 80)), h: Math.min(400, Math.max(0, num(r?.h))) });
  function load() {
    recs = []; FILL = true;
    try {
      // «remolque_v2» es la clave del archivo del padre: si alguien lo usó en esta misma dirección, se recupera
      const d = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("remolque_v2") || "null");
      if (d && Array.isArray(d.recs) && d.recs.length) {
        recs = d.recs.slice(0, 40).map(limpia);
        $("cg-len").value = d.len || 13.6; $("cg-wid").value = d.wid || 2.4; $("cg-pay").value = d.pay || ""; $("cg-alt").value = d.alt || 2.7;
        if (d.fill === false) FILL = false;
      }
      if (d && ["arriba", "lado", "3d"].includes(d.vista)) VISTA = d.vista;
    } catch (e) { /* sin datos o sin permiso: se empieza vacío */ }
    if (!recs.length) recs = [nuevo(1)];
    $("cg-fill").checked = FILL;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ recs, len: $("cg-len").value, wid: $("cg-wid").value, pay: $("cg-pay").value, alt: $("cg-alt").value, fill: FILL, vista: VISTA })); } catch (e) { /* móvil sin espacio o en privado */ } }
  // Otra ventana ha guardado: ponerse al día (si no, al tocar aquí se pisaría lo de la otra)
  window.addEventListener("storage", (e) => { if (e.key === KEY) { load(); build(); ponVista(VISTA, true); } });

  function build() {
    $("cg-recs").innerHTML = recs.map((r, i) => {
      const id = "cg-" + i;
      let h = `<div class="panel zc-caja cg-rec cg-c${i % N_COL}"><div class="cg-rec-cab"><span class="cg-num" aria-hidden="true">${i + 1}</span><label class="sr-only" for="${id}-n">${esc(T("Nombre de la recogida"))}</label><input id="${id}-n" data-i="${i}" data-f="n" value="${esc(r.n)}" maxlength="60">` +
        (recs.length > 1 ? `<button type="button" class="cg-quitar" data-del="${i}">${esc(T("Quitar"))}</button>` : "") + `</div>`;
      h += `<div class="cg-dato cg-d-t"><label for="${id}-t">${esc(T("Tipo de palet"))}</label><select id="${id}-t" data-i="${i}" data-f="t">` + Object.keys(NOMBRES).map(k => `<option value="${k}"${r.t === k ? " selected" : ""}>${esc(T(NOMBRES[k]))}</option>`).join("") + `</select>`;
      if (r.t === "cu") h += `<div class="zc-dos"><div><label for="${id}-l">${esc(T("Largo (cm)"))}</label><input id="${id}-l" type="number" inputmode="decimal" min="0" data-i="${i}" data-f="l" value="${esc(r.l)}"></div><div><label for="${id}-a">${esc(T("Ancho (cm)"))}</label><input id="${id}-a" type="number" inputmode="decimal" min="0" data-i="${i}" data-f="a" value="${esc(r.a)}"></div></div>`;
      h += `</div>`;
      h += `<div class="zc-dos"><div class="cg-dato cg-d-q"><label for="${id}-q">${esc(T("N.º de palets"))}</label><input id="${id}-q" type="number" inputmode="numeric" min="0" data-i="${i}" data-f="q" value="${r.q || ""}" placeholder="0"></div><div class="cg-dato cg-d-w"><label for="${id}-w">${esc(T("Kg por palet (opcional)"))}</label><input id="${id}-w" type="number" inputmode="decimal" min="0" data-i="${i}" data-f="w" value="${r.w || ""}" placeholder="0"></div></div>`;
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
        if (p.w >= 60 && p.h >= 60) s += `<text x="${px + p.w / 2}" y="${p.y + p.h / 2 + 10}" font-size="32" font-weight="800" fill="#fff" text-anchor="middle">${p.r}</text>`;
        if (p.s && p.w >= 60) s += `<text x="${px + p.w - 6}" y="${p.y + 30}" font-size="24" font-weight="700" fill="#fff" text-anchor="end">×2</text>`;
      });
      r.free.forEach(h => {
        if (h.w >= 30 && h.h >= 30) s += `<rect class="cg-hueco" x="${x + h.x + 3}" y="${h.y + 3}" width="${h.w - 6}" height="${h.h - 6}" fill="none" stroke-width="3" stroke-dasharray="10 8" rx="4"/>`;
      });
      x += r.al;
    });
    if (u > Lc) s += `<rect class="cg-sobra" x="${Lc}" y="0" width="${u - Lc}" height="${Wc}"/><line class="cg-linea" x1="${Lc}" y1="0" x2="${Lc}" y2="${Wc}" stroke-width="6"/>`;
    sc.innerHTML = s + "</svg>";
  }
  function calc() {
    const L = num($("cg-len").value), W = num($("cg-wid").value), pay = num($("cg-pay").value);
    if (!(L > 0 && W > 0)) { $("cg-dibujo").innerHTML = ""; $("cg-cab").textContent = T("Pon el largo y el ancho del remolque en «Ajustes del remolque»."); $("cg-res").innerHTML = ""; resumen = ""; return; }
    const Lc = Math.round(L * 100), Wc = Math.round(W * 100), R = calcula(recs, Lc, Wc, FILL), rows = R.rows, u = R.usado, libre = Lc - u;
    draw(rows, Lc, Wc);
    // Alto: el de cada recogida (si no lo apuntan, 1,20 m en el 3D, que es lo normal para apilar 2 en 2,70 m) y el de dentro
    const Hc = Math.round((num($("cg-alt").value) || 2.7) * 100), altos = recs.map(r => r.h > 0 ? r.h : 0);
    ultimo = [rows, Lc, Wc, { altos, alto: Hc }];
    if (motor && VISTA !== "arriba") motor.pinta(rows, Lc, Wc, COL, oscuro(), ultimo[3]);
    $("cg-cab").innerHTML = TH("{n} palets", { n: R.tot }) + " · " + `<b${u > Lc ? ' class="cg-pasa"' : ""}>${esc(T("{u} m de {l} m", { u: f(u / 100, 2), l: f(L, 2) }))}</b> <small>${esc(u > Lc ? T("No cabe: sobran {m} m", { m: f((u - Lc) / 100, 2) }) : T("Quedan {m} m", { m: f(libre / 100, 2) }))}</small>`;
    const nombre = (i) => recs[i].n || T("Recogida {n}", { n: i + 1 });
    let h = "";
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
    if (hs.length) {
      h += `<div class="zc-aviso"><p class="cg-p">${TH("**Huecos sin usar** (los de línea discontinua del dibujo):")}</p><ul>` + hs.map(g => {
        const a = nfit([120, 80], g), b = nfit([120, 100], g), c = nfit([80, 60], g), opts = [];
        if (a) opts.push(a > 1 ? T("{n} europalets", { n: a }) : T("1 europalet"));
        if (b) opts.push(b > 1 ? T("{n} industriales", { n: b }) : T("1 industrial"));
        if (c) opts.push(c > 1 ? T("{n} medios palets", { n: c }) : T("1 medio palet"));
        const que = g.c > 1 ? T("{c} huecos de {w}×{h} cm", { c: g.c, w: g.w, h: g.h }) : T("1 hueco de {w}×{h} cm", { w: g.w, h: g.h });
        return `<li>${esc(opts.length ? T("{que}: caben {opts}.", { que, opts: opts.join(T(" o ")) }) : T("{que}: solo cabe mercancía suelta o pequeña.", { que }))}</li>`;
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
    resumen = lin.join("\n") + (lin.length ? "\n" : "") + T("Total: {n} palets, {u} m de {l} m", { n: R.tot, u: f(u / 100, 2), l: f(L, 2) }) + (R.kg ? ", " + kg(R.kg) + " kg" : "");
  }

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
    else r[fd] = fd === "q" ? Math.max(0, Math.floor(num(el.value))) : Math.max(0, num(el.value));
    save(); calc();
  });
  $("cg-recs").addEventListener("change", (e) => { if (e.target.dataset.f === "s") { recs[+e.target.dataset.i].s = e.target.checked; save(); calc(); } });
  $("cg-recs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    recs.splice(+b.dataset.del, 1); save(); build(); calc();
  });
  $("cg-add").addEventListener("click", () => {
    recs.push(nuevo(recs.length + 1)); save(); build(); calc();
    const ult = $("cg-" + (recs.length - 1) + "-q"); if (ult) { ult.scrollIntoView({ block: "center" }); ult.focus({ preventScroll: true }); }
  });
  // Empezar de cero: se pregunta en la propia página (en la app no hay ventanas de confirmar)
  $("cg-cero").addEventListener("click", () => { $("cg-confirma").hidden = false; $("cg-cero").hidden = true; $("cg-si").focus(); });
  $("cg-no").addEventListener("click", () => { $("cg-confirma").hidden = true; $("cg-cero").hidden = false; $("cg-cero").focus(); });
  $("cg-si").addEventListener("click", () => {
    recs = [nuevo(1)]; save(); build(); calc();
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
  load(); build();
  // El 3D se prepara la primera vez que se abre el simulador (no al cargar la web)
  const alAbrir = () => { if (location.hash.replace("#", "") === "carga") { ponVista(VISTA, true); window.removeEventListener("hashchange", alAbrir); } };
  // Hasta abrirlo se enseña el dibujo de arriba (sin descargar el 3D); se recuerda la vista elegida
  const elegida = VISTA; ponVista("arriba", true); VISTA = elegida;
  window.addEventListener("hashchange", alAbrir); alAbrir();
})();
