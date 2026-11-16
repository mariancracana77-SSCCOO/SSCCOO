// Reparto de peso por ejes y estiba (Zona Conductores, petición n.º 50 del padre, v181). Dos pestañas:
//  - «Peso por ejes»: tractora 4x2 + semirremolque de trídem. Pesos en vacío por eje (los de una báscula, con los
//    depósitos a la mitad) + la carga (kg y dónde va, o la del Simulador de carga) + el gasoil. Reparto por palancas:
//    la carga se reparte entre el pivote y el centro del trídem; lo del pivote, entre el eje delantero y el motriz
//    según dónde está la quinta rueda. Límites por defecto: motriz 11.500 kg, trídem 24.000 kg y total 40.000 kg
//    (Directiva 96/53/CE y RGV); el delantero, el de la ficha técnica (7.500 kg por defecto, se cambia en «Mi camión»).
//  - «Estiba»: cuántas cinchas por encima (amarre por rozamiento) hacen falta según la norma EN 12195-1:2010:
//    n ≥ (c − μ·cz) · m · g / (2 · μ · sen α · FT) · fs, con c = 0,8 adelante, 0,5 atrás y de lado (carretera),
//    cz = 1, fs = 1,25 hacia delante y 1,1 en las demás. Comprobada con el ejemplo de la guía IRU (2 cinchas,
//    μ 0,45, α 55°, STF 400 daN: 10,9 t de lado y 1,4 t adelante; pruebas/ejes.cjs).
// Todo es orientativo y se calcula en el móvil. Lo que se apunta se guarda solo aquí, clave «ccoo-ejes».
// Las cuentas están en EjesCuentas (sin pantalla) para poder probarlas.
(function () {
  const G = 9.81;
  // Valores por defecto del camión (los cambia cada uno en «Mi camión»)
  const CAMION = { del: 5700, mot: 4450, tri: 4500, dep: 700, bat: 3.7, qr: 0.55, piv: 1.3, ejes: 7.7, caja: 13.6, mDel: 7500, mMot: 11500, mTri: 24000, mTot: 40000 };
  // Gasoil: 0,84 kg por litro; el depósito cae entre los ejes de la tractora (60 % delante, 40 % motriz)
  const GASOIL = { "1/4": 0.25, "1/2": 0.5, lleno: 1 };
  function reparto(c, carga, gas) {
    // c = camión; carga = [{kg, x}] (x = centro en m desde la pared delantera de la caja)
    const extra = ((GASOIL[gas] ?? 0.5) - 0.5) * c.dep * 0.84;
    let del = c.del + extra * 0.6, mot = c.mot + extra * 0.4, tri = c.tri, kg = 0;
    carga.forEach(p => {
      if (!(p.kg > 0)) return;
      const d = p.x - c.piv, t = p.kg * d / c.ejes, k = p.kg - t;
      tri += t; kg += p.kg;
      del += k * c.qr / c.bat; mot += k * (c.bat - c.qr) / c.bat;
    });
    const tot = del + mot + tri;
    return { del, mot, tri, tot, kg, extra };
  }
  // Estiba: cinchas por encima que hacen falta en cada sentido (0 si el rozamiento ya basta)
  const COEF = { lado: [0.5, 1.1], atras: [0.5, 1.1], delante: [0.8, 1.25] };
  function cinchas(m, mu, ang, stf) {
    const sa = Math.sin(ang * Math.PI / 180), FT = stf * 10, out = {};
    Object.keys(COEF).forEach(k => {
      const [cc, fs] = COEF[k], num = (cc - mu) * m * G * fs, den = 2 * mu * sa * FT;
      out[k] = num <= 0 ? 0 : den > 0 ? Math.ceil(num / den - 1e-9) : Infinity;
    });
    return out;
  }
  // Kilos que sujetan n cinchas en un sentido (para el ejemplo de la guía IRU)
  function sujeta(n, mu, ang, stf, sentido) {
    const [cc, fs] = COEF[sentido];
    return cc - mu <= 0 ? Infinity : n * 2 * mu * Math.sin(ang * Math.PI / 180) * stf * 10 / ((cc - mu) * G * fs);
  }
  // La carga del Simulador de carga (ccoo-remolque): cada palet con su peso y su sitio
  function cargaSimulador(d) {
    if (!d || !Array.isArray(d.recs) || typeof CargaCuentas === "undefined") return null;
    const num = (v) => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : 0; };
    const recs = d.recs.slice(0, 40).map(r => ({ t: r?.t, q: Math.max(0, Math.floor(num(r?.q))), s: !!r?.s, kg: r?.kg != null ? Math.max(0, num(r.kg)) : Math.max(0, num(r?.w)) * Math.max(0, Math.floor(num(r?.q))), l: num(r?.l ?? 120), a: num(r?.a ?? 80), h: Math.max(0, num(r?.h)) }));
    const Lc = Math.round((num(d.len) || 13.6) * 100), Wc = Math.round((num(d.wid) || 2.4) * 100);
    const res = CargaCuentas.calcula(recs, Lc, Wc, d.fill !== false, Math.round((num(d.alt) || 2.7) * 100), Array.isArray(d.mano) ? d.mano : []);
    // kg por palet de cada recogida (1, 2…) = kg de la recogida / palets que se han podido poner
    const n = recs.map(() => 0), pos = [];
    let x0 = 0;
    res.rows.forEach(row => {
      row.items.forEach(it => {
        const x = (x0 + it.x + it.w / 2) / 100;
        const sube = (r) => { n[r - 1]++; pos.push({ r, x }); };
        sube(it.r); if (it.s) sube(it.r); if (it.top) sube(it.top.r);
      });
      x0 += row.al;
    });
    const carga = pos.map(p => ({ kg: n[p.r - 1] ? recs[p.r - 1].kg / n[p.r - 1] : 0, x: p.x }));
    const kg = carga.reduce((s, p) => s + p.kg, 0);
    if (!(kg > 0)) return null;
    return { carga, kg, centro: carga.reduce((s, p) => s + p.kg * p.x, 0) / kg, palets: pos.length, largo: res.usado / 100 };
  }
  window.EjesCuentas = { CAMION, reparto, cinchas, sujeta, cargaSimulador };

  // ---- Pantalla ----
  const $ = (i) => document.getElementById(i);
  const vista = $("v-ejes");
  if (!vista || typeof esc !== "function") return;
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("ejes", "v-ejes", () => calc()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m), TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  const KEY = "ccoo-ejes";
  const num = (v) => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : NaN; };
  const kgTxt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " kg"; // con punto también en 4 cifras (7.500)
  const mTxt = (n) => n.toFixed(1).replace(".", ",") + " m";
  const CAMPOS = Object.keys(CAMION); // id «ej-c-<clave>»
  let PEST = "ejes", GAS = "1/2", SIM = false, POS = "centro";
  function lee() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!d || typeof d !== "object") return;
      if (d.cam && typeof d.cam === "object") CAMPOS.forEach(k => { const v = num(d.cam[k]); if (v > 0 && v < 100000) $("ej-c-" + k).value = String(v); });
      if (num(d.kg) >= 0) $("ej-kg").value = String(num(d.kg));
      if (num(d.largo) > 0) $("ej-largo").value = String(num(d.largo));
      if (num(d.centro) >= 0) $("ej-centro").value = String(num(d.centro));
      if (GASOIL[d.gas]) GAS = d.gas;
      if (["cabina", "centro", "puertas", "medida"].includes(d.pos)) POS = d.pos;
      SIM = !!d.sim; if (d.pest === "estiba") PEST = "estiba";
      const e = d.est || {};
      if (num(e.kg) >= 0) $("es-kg").value = String(num(e.kg));
      if ([...$("es-mu").options].some(o => o.value === String(e.mu))) $("es-mu").value = String(e.mu);
      if (num(e.muOtro) > 0) $("es-mu-otro").value = String(num(e.muOtro));
      if ([...$("es-ang").options].some(o => o.value === String(e.ang))) $("es-ang").value = String(e.ang);
      if (num(e.stf) > 0) $("es-stf").value = String(num(e.stf));
      $("es-bloq").checked = !!e.bloq;
      if (num(e.h) > 0) $("es-h").value = String(num(e.h));
      if (num(e.b) > 0) $("es-b").value = String(num(e.b));
    } catch (e) { /* sin datos o sin permiso: valores por defecto */ }
  }
  function guarda() {
    const cam = {}; CAMPOS.forEach(k => { cam[k] = $("ej-c-" + k).value; });
    try {
      localStorage.setItem(KEY, JSON.stringify({ cam, kg: $("ej-kg").value, largo: $("ej-largo").value, centro: $("ej-centro").value, gas: GAS, pos: POS, sim: SIM, pest: PEST,
        est: { kg: $("es-kg").value, mu: $("es-mu").value, muOtro: $("es-mu-otro").value, ang: $("es-ang").value, stf: $("es-stf").value, bloq: $("es-bloq").checked, h: $("es-h").value, b: $("es-b").value } }));
    } catch (e) { /* móvil sin espacio o en privado */ }
  }
  function camion() {
    const c = {}; CAMPOS.forEach(k => { const v = num($("ej-c-" + k).value); c[k] = v > 0 ? v : CAMION[k]; });
    if (c.qr >= c.bat) c.qr = CAMION.qr; // la quinta rueda va entre los ejes de la tractora
    return c;
  }
  function simulador() { try { return cargaSimulador(JSON.parse(localStorage.getItem("ccoo-remolque") || "null")); } catch (e) { return null; } }
  function marca(sel, val) { vista.querySelectorAll(sel).forEach(b => { const si = b.dataset.v === val; b.classList.toggle("activa", si); b.setAttribute("aria-pressed", String(si)); }); }
  // Centro de la carga según «dónde va»
  function centroDe(c, largo) {
    const l = Math.min(Math.max(largo, 0.4), c.caja);
    if (POS === "cabina") return l / 2;
    if (POS === "puertas") return c.caja - l / 2;
    if (POS === "centro") return c.caja / 2;
    const x = num($("ej-centro").value);
    return Math.min(Math.max(isFinite(x) ? x : c.caja / 2, l / 2), c.caja - l / 2);
  }
  function barra(nombre, v, max) {
    const p = max > 0 ? v / max * 100 : 0, cls = p > 100 ? "mal" : p > 95 ? "justo" : "bien";
    const est = p > 100 ? T("Pasa {k}", { k: kgTxt(v - max) }) : p > 95 ? T("Muy justo") : T("Correcto");
    return `<div class="panel ej-eje ${cls}"><div class="ej-eje-cab"><span><b>${esc(nombre)}</b><small>${esc(T("Máximo {k}", { k: kgTxt(max) }))}</small></span><strong>${esc(kgTxt(v))}</strong></div>` +
      `<div class="zc-barra ej-barra"><i class="ej-p${Math.min(100, Math.max(0, Math.round(p / 5) * 5))}"></i></div><div class="ej-eje-pie"><span>${esc(T("{p} % del máximo", { p: Math.round(p) }))}</span><b>${esc(est)}</b></div></div>`;
  }
  // Dibujo de lado: tractora, semirremolque, ejes y la carga (solo clases: sin estilos en línea por la CSP)
  function dibujo(c, carga) {
    const k = 30, x0 = 10 + 2.6 * k, W = x0 + c.caja * k + 10;
    let s = `<svg class="ej-dib" viewBox="0 0 ${W.toFixed(0)} 120" role="img" aria-label="${esc(T("El camión de lado con la carga"))}">`;
    s += `<rect class="ej-trac" x="10" y="40" width="${(2.4 * k).toFixed(0)}" height="50" rx="6"/>`;
    s += `<rect class="ej-caja" x="${x0}" y="22" width="${(c.caja * k).toFixed(0)}" height="68" rx="3"/>`;
    carga.forEach(p => { if (p.kg > 0) s += `<rect class="ej-carga" x="${(x0 + (p.x - p.l / 2) * k).toFixed(1)}" y="52" width="${Math.max(3, p.l * k - 1).toFixed(1)}" height="36" rx="2"/>`; });
    const piv = x0 + c.piv * k, ejeTri = piv + c.ejes * k, mot = piv + c.qr * k, del = mot - c.bat * k;
    [del, mot].forEach(x => { s += `<circle class="ej-rueda" cx="${x.toFixed(1)}" cy="100" r="12"/>`; });
    [-1.31, 0, 1.31].forEach(d => { s += `<circle class="ej-rueda" cx="${(ejeTri + d * k).toFixed(1)}" cy="100" r="12"/>`; });
    s += `<path class="ej-piv" d="M${piv.toFixed(1)} 90 l-6 8 h12 z"/></svg>`;
    return s;
  }
  function calcEjes() {
    const c = camion(), sim = SIM ? simulador() : null;
    let carga, nota = "";
    if (SIM && sim) {
      carga = sim.carga.map(p => ({ kg: p.kg, x: p.x, l: 1.2 }));
      nota = T("Carga del Simulador: {k} en {n} palets, centro a {m} de la cabina.", { k: kgTxt(sim.kg), n: sim.palets, m: mTxt(sim.centro) });
    } else {
      const kg = Math.max(0, num($("ej-kg").value) || 0), largo = Math.min(Math.max(num($("ej-largo").value) || c.caja, 0.4), c.caja), x = centroDe(c, largo);
      const r = $("ej-centro"); r.max = String(c.caja); r.min = "0";
      if (POS !== "medida") r.value = x.toFixed(1);
      $("ej-centro-v").textContent = T("Centro de la carga: {m} de la cabina", { m: mTxt(x) });
      carga = [{ kg, x, l: largo }];
    }
    $("ej-sim-nota").textContent = nota;
    $("ej-sim-caja").hidden = !(SIM && sim);
    $("ej-mano").hidden = !!(SIM && sim);
    $("ej-sim").hidden = !simulador();
    $("ej-sim").textContent = SIM && sim ? T("Escribir la carga a mano") : T("Usar mi carga del Simulador");
    const r = reparto(c, carga, GAS);
    let out = `<div class="zc-grande"><small>${esc(T("Peso total del conjunto"))}</small><strong>${esc(kgTxt(r.tot))}</strong><small>${esc(T("Carga: {k}", { k: kgTxt(r.kg) }))}</small></div>`;
    out += dibujo(c, carga);
    out += barra(T("Eje delantero de la tractora"), r.del, c.mDel) + barra(T("Eje motriz de la tractora"), r.mot, c.mMot) + barra(T("Trídem del semirremolque"), r.tri, c.mTri) + barra(T("Total del conjunto"), r.tot, c.mTot);
    const avisos = [];
    if (r.tri < c.tri * 0.98 && r.kg > 0) avisos.push(T("La carga va tan pegada a la cabina que descarga el trídem: revisa dónde va."));
    if (r.mot < r.tot * 0.25) avisos.push(T("El eje motriz lleva menos del 25 % del peso total: el camión puede patinar y no cumple la norma europea. Lleva la carga más hacia la cabina."));
    if (r.del > c.mDel || r.mot > c.mMot) avisos.push(T("Si pasa de la tractora, lleva la carga más hacia las puertas."));
    if (r.tri > c.mTri) avisos.push(T("Si pasa del trídem, lleva la carga más hacia la cabina."));
    if (r.tot > c.mTot) avisos.push(T("Pasa del peso total: sobra carga, no se arregla moviéndola."));
    out += avisos.length ? `<div class="zc-mal"><ul class="ej-avisos">${avisos.map(a => `<li>${esc(a)}</li>`).join("")}</ul></div>`
      : `<div class="zc-ok">${esc(T("Dentro de los límites. Al descargar una parte (por ejemplo, la de atrás en el primer cliente), vuelve a mirarlo antes de seguir."))}</div>`;
    $("ej-out").innerHTML = out;
  }
  function calcEstiba() {
    const m = Math.max(0, num($("es-kg").value) || 0), otro = $("es-mu").value === "otro";
    $("es-mu-otro-caja").hidden = !otro;
    const mu = otro ? num($("es-mu-otro").value) : num($("es-mu").value), ang = num($("es-ang").value), stf = num($("es-stf").value);
    if (!(m > 0) || !(mu > 0 && mu < 2) || !(stf > 0)) { $("es-out").innerHTML = `<div class="zc-aviso">${esc(T("Escribe el peso, el rozamiento y la fuerza de la cincha (STF) y te digo cuántas cinchas hacen falta."))}</div>`; return; }
    const n = cinchas(m, mu, ang, stf), bloq = $("es-bloq").checked;
    const usa = bloq ? Math.max(n.lado, n.atras) : Math.max(n.lado, n.atras, n.delante);
    let out = `<div class="zc-grande"><small>${esc(T("Cinchas por encima que hacen falta"))}</small><strong>${esc(isFinite(usa) ? String(usa) : "—")}</strong><small>${esc(T("para {k} con STF {s} daN", { k: kgTxt(m), s: Math.round(stf) }))}</small></div>`;
    const fila = (t, v) => `<tr><td>${esc(t)}</td><td>${esc(v)}</td></tr>`;
    out += `<div class="panel zc-caja"><table class="zc-tabla">` +
      fila(T("Para que no se vaya de lado"), String(n.lado)) +
      fila(T("Para que no se vaya hacia atrás"), String(n.atras)) +
      fila(T("Para que no se vaya hacia delante"), bloq ? T("Bloqueada: no cuenta") : String(n.delante)) + `</table></div>`;
    const av = [];
    if (usa === 0) av.push(T("Con este rozamiento no se movería, pero sujétala siempre: los baches y las curvas la pueden levantar."));
    if (!bloq && n.delante > Math.max(n.lado, n.atras)) av.push(T("Hacia delante es donde más cinchas hacen falta. Si la pegas a la cabecera o a otra carga (bloqueada), bastan las de lado y atrás."));
    if (mu < 0.6) av.push(T("Una alfombrilla antideslizante debajo (rozamiento 0,6) reduce mucho las cinchas."));
    const h = num($("es-h").value), b = num($("es-b").value);
    if (h > 0 && b > 0 && 0.6 * h > b) av.push(T("Es alta y estrecha: puede volcar de lado. Además de las cinchas, necesita sujeción contra el vuelco (por ejemplo, bloquearla o atarla en lazo)."));
    if (av.length) out += `<div class="zc-aviso"><ul>${av.map(a => `<li>${esc(a)}</li>`).join("")}</ul></div>`;
    $("es-out").innerHTML = out;
  }
  function calc() {
    marca("#ej-pest [data-v]", PEST); marca("#ej-gas [data-v]", GAS); marca("#ej-pos [data-v]", POS);
    $("ej-p-ejes").hidden = PEST !== "ejes"; $("ej-p-estiba").hidden = PEST !== "estiba";
    calcEjes(); calcEstiba(); guarda();
  }
  lee();
  vista.addEventListener("click", (e) => {
    const b = e.target.closest("[data-v]");
    if (b) {
      const g = b.parentElement.id;
      if (g === "ej-pest") PEST = b.dataset.v; else if (g === "ej-gas") GAS = b.dataset.v; else if (g === "ej-pos") POS = b.dataset.v; else return;
      calc(); return;
    }
    if (e.target.closest("#ej-sim")) { SIM = !SIM; calc(); }
    if (e.target.closest("#ej-c-defecto")) { CAMPOS.forEach(k => { $("ej-c-" + k).value = String(CAMION[k]); }); calc(); }
  });
  vista.addEventListener("input", (e) => { if (e.target.id === "ej-centro") POS = "medida"; calc(); });
  vista.addEventListener("change", calc);
  addEventListener("storage", (e) => { if (e.key === "ccoo-remolque" || e.key === KEY) { if (e.key === KEY) lee(); calc(); } });
  addEventListener("hashchange", () => { if (location.hash === "#ejes") calc(); }); // al volver del Simulador, con su carga nueva
  calc();
})();
