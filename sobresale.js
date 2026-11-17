// Cargas que sobresalen (Zona Conductores, petición n.º 55 del padre, v186). La herramienta de su captura: cuánto
// puede sobresalir una carga indivisible según el artículo 15 del Reglamento General de Circulación y cómo se
// señaliza (panel V-20, luz roja detrás y, en las cargas anchas, luz blanca delante), con el dibujo visto desde arriba.
// Cuentas sin pantalla en «SobresaleCuentas» (las prueba pruebas/sobresale.cjs). Sin nada en línea (CSP), textos con
// esc() y T("...") (zona-idioma.js: la función «traducir», grupo «sobresale», saca de aquí los textos).
// Guarda solo lo escrito en localStorage «ccoo-sobresale» {largo, ancho, tipo, del, det, cubre, izq, der}.
(function () {
  const ANCHO_MAX = 2.55, LADO_MAX = 0.4, DEL_MAX = 2, DET_MAX = 3, LARGO_CORTO = 5, EPS = 1e-9;
  const num = (x) => { const n = parseFloat(String(x ?? "").replace(",", ".")); return isFinite(n) ? n : NaN; };

  // Lo que permite el art. 15 RGC (cargas indivisibles en vehículos de uso exclusivo para mercancías)
  function limites(largo, ancho) {
    const corto = largo > 0 && largo <= LARGO_CORTO;
    const del = corto ? largo / 3 : DEL_MAX, det = corto ? largo / 3 : DET_MAX;
    const lado = Math.max(0, Math.min(LADO_MAX, (ANCHO_MAX - ancho) / 2));
    return { corto, del, det, lado };
  }
  // d = {largo, ancho, tipo: "larga"|"ancha", del, det, izq, der} → {ok, fallos: [{q, v, max}], lim, total}
  function calcula(d) {
    const largo = num(d.largo), ancho = num(d.ancho);
    if (!(largo > 0) || !(ancho > 0)) return { falta: true };
    const lim = limites(largo, ancho), fallos = [];
    const v = (x) => Math.max(0, num(x) || 0);
    if (d.tipo === "ancha") {
      const izq = v(d.izq), der = v(d.der), total = ancho + izq + der;
      if (izq > LADO_MAX + EPS) fallos.push({ q: "izq", v: izq, max: LADO_MAX });
      if (der > LADO_MAX + EPS) fallos.push({ q: "der", v: der, max: LADO_MAX });
      if ((izq > 0 || der > 0) && total > ANCHO_MAX + EPS) fallos.push({ q: "total", v: total, max: ANCHO_MAX });
      return { ok: !fallos.length, fallos, lim, total, izq, der, ancho, largo };
    }
    const del = v(d.del), det = v(d.det);
    if (del > lim.del + EPS) fallos.push({ q: "del", v: del, max: lim.del });
    if (det > lim.det + EPS) fallos.push({ q: "det", v: det, max: lim.det });
    return { ok: !fallos.length, fallos, lim, del, det, ancho, largo };
  }
  window.SobresaleCuentas = { limites, calcula, ANCHO_MAX, LADO_MAX };

  const $ = (i) => document.getElementById(i);
  if (!$("v-sobresale")) return;
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("sobresale", "v-sobresale", () => calc()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m), TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  const m = (x) => (Math.round(x * 100) / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " m";
  const CAMPOS = ["largo", "ancho", "tipo", "del", "det", "cubre", "izq", "der"], KEY = "ccoo-sobresale";

  function lee() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      for (const k of CAMPOS) if (d && typeof d[k] === "string" && $("so-" + k) && d[k].length < 12) $("so-" + k).value = d[k];
      if (!["larga", "ancha"].includes($("so-tipo").value)) $("so-tipo").value = "larga";
      if (!["no", "si"].includes($("so-cubre").value)) $("so-cubre").value = "no";
    } catch (e) { /* sin datos guardados */ }
  }
  function guarda() {
    try { const d = {}; for (const k of CAMPOS) d[k] = $("so-" + k).value; localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* sin almacenamiento */ }
  }

  // Dibujo visto desde arriba: cabina a la izquierda, la carga en naranja, luces y paneles V-20
  function dibujo(r, tipo, cubre) {
    const W = 340, H = 150, M = 14;
    const del = tipo === "larga" ? r.del : 0, det = tipo === "larga" ? r.det : 0;
    const izq = tipo === "ancha" ? r.izq : 0, der = tipo === "ancha" ? r.der : 0;
    const totL = r.largo + del + det, totA = r.ancho + izq + der;
    const k = Math.min((W - 2 * M) / totL, (H - 2 * M - 16) / Math.max(totA, 2.55) * 0.9);
    const vx = M + del * k, vw = r.largo * k, va = r.ancho * k, vy = (H - 16 - va) / 2 + 2;
    const cab = Math.min(vw * 0.16, 2.3 * k);
    let s = `<svg class="so-dib" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T("Vista desde arriba"))}">`;
    s += `<rect class="so-veh" x="${vx}" y="${vy}" width="${vw}" height="${va}" rx="4"/>`;
    // La cabina se pinta después de la carga, para que siempre se vea aunque la carga cubra todo el ancho
    const cabS = `<rect class="so-cab" x="${vx}" y="${vy}" width="${cab}" height="${va}" rx="4"/>` +
      `<text class="so-dib-t" x="${vx + cab / 2}" y="${vy + va / 2}" transform="rotate(-90 ${vx + cab / 2} ${vy + va / 2})">${esc(T("CABINA"))}</text>`;
    const luz = (x, y, c) => `<circle class="so-luz ${c}" cx="${x}" cy="${y}" r="5"/>`;
    const v20 = (x, y) => `<g class="so-v20"><rect x="${x - 7}" y="${y - 7}" width="14" height="14"/><path d="M${x - 7} ${y + 1}l8-8M${x - 7} ${y + 7}l14-14M${x + 1} ${y + 7}l6-6"/></g>`;
    if (tipo === "larga") {
      const lw = cubre ? va * 0.92 : Math.max(va * 0.22, 6), ly = vy + (va - lw) / 2, lx = M, lL = totL * k;
      s += `<rect class="so-carga" x="${lx}" y="${ly}" width="${lL}" height="${lw}" rx="2"/>`;
      if (det > 0) {
        const ex = lx + lL;
        if (cubre) s += v20(ex - 8, ly + 9) + v20(ex - 8, ly + lw - 9);
        else s += v20(ex - 8, vy + va / 2);
        s += luz(ex + 6, vy + va / 2, "roja");
      }
    } else {
      const lx = vx + vw * 0.42, lw = Math.max(vw * 0.18, 10), ly = vy - izq * k, lA = totA * k;
      s += `<rect class="so-carga" x="${lx}" y="${ly}" width="${lw}" height="${lA}" rx="2"/>`;
      for (const [sob, y] of [[izq, ly + 4], [der, ly + lA - 4]]) if (sob > 0) s += luz(lx - 6, y, "blanca") + luz(lx + lw + 6, y, "roja");
    }
    return s + cabS + `<text class="so-dib-p" x="${M}" y="${H - 3}">${esc(T("Delante"))}</text><text class="so-dib-p so-fin" x="${W - M}" y="${H - 3}">${esc(T("Detrás"))}</text></svg>`;
  }

  function calc() {
    const tipo = $("so-tipo").value === "ancha" ? "ancha" : "larga", cubre = $("so-cubre").value === "si";
    $("so-larga").hidden = tipo !== "larga";
    $("so-ancha").hidden = tipo !== "ancha";
    guarda();
    const r = calcula({ largo: $("so-largo").value, ancho: $("so-ancho").value, tipo, del: $("so-del").value, det: $("so-det").value, izq: $("so-izq").value, der: $("so-der").value });
    if (r.falta) {
      $("so-dibujo").innerHTML = "";
      $("so-out").innerHTML = `<div class="zc-aviso">${esc(T("Escribe el largo y el ancho del vehículo."))}</div>`;
      return;
    }
    $("so-dibujo").innerHTML = dibujo(r, tipo, cubre);
    const L = r.lim;
    let o = "";
    const maxTxt = tipo === "larga"
      ? T("Máximo en tu caso: {d} por delante y {t} por detrás.", { d: m(L.del), t: m(L.det) })
      : L.lado > 0 ? T("Máximo en tu caso: {l} por cada lado, sin pasar de 2,55 m de ancho en total.", { l: m(L.lado) })
        : T("Con tu vehículo de {a} de ancho, la carga no puede sobresalir por los lados: ya llegas a 2,55 m.", { a: m(r.ancho) });
    if (r.ok) o += `<div class="zc-ok"><b>${esc(T("Dentro de los límites del artículo 15."))}</b> ${esc(maxTxt)}</div>`;
    else {
      const linea = (f) => ({
        del: T("Por delante sobresale {v}: el máximo es {x}.", { v: m(f.v), x: m(f.max) }),
        det: T("Por detrás sobresale {v}: el máximo es {x}.", { v: m(f.v), x: m(f.max) }),
        izq: T("Por la izquierda sobresale {v}: el máximo es {x}.", { v: m(f.v), x: m(f.max) }),
        der: T("Por la derecha sobresale {v}: el máximo es {x}.", { v: m(f.v), x: m(f.max) }),
        total: T("El ancho total sería {v}: el máximo es {x}.", { v: m(f.v), x: m(f.max) }),
      })[f.q];
      o += `<div class="zc-mal"><b>${esc(T("Te pasas de los límites del artículo 15."))}</b><ul>${r.fallos.map(f => `<li>${esc(linea(f))}</li>`).join("")}</ul><p class="so-p">${TH("Así no puedes circular: hace falta una **autorización de transporte especial**.")}</p></div>`;
    }
    if (tipo === "larga" && L.corto) o += `<p class="zc-pista">${esc(T("Tu vehículo mide 5 m o menos: puede sobresalir un tercio de su largo por cada extremo."))}</p>`;
    // Cómo señalizarla
    const li = [];
    if (tipo === "larga") {
      if (r.det > 0) {
        li.push(cubre
          ? TH("**Dos paneles V-20** en el extremo de atrás, uno en cada lado de la carga, formando una V invertida.")
          : TH("**Un panel V-20** en el extremo de atrás de la carga, perpendicular al eje del vehículo."));
        li.push(TH("**Luz roja** detrás cuando circules entre la puesta y la salida del sol o con poca visibilidad."));
      }
      if (r.del > 0 || r.det > 0) li.push(TH("**Protege el extremo que sobresale** con una funda o un acolchado, para suavizar un roce o un golpe."));
    } else if (r.izq > 0 || r.der > 0) {
      li.push(TH("**Luz blanca delante y luz roja detrás** en cada lado que sobresale, de noche o con poca visibilidad."));
      li.push(TH("**Protege los extremos que sobresalen** con una funda o un acolchado."));
    }
    if (li.length) li.push(TH("La carga **no debe tapar** las luces, los catadióptricos ni la matrícula."));
    o += `<div class="panel zc-caja"><h2>${esc(T("Cómo señalizarla"))}</h2>` +
      (li.length ? `<ul>${li.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p>${esc(T("No sobresale nada: no hace falta señalizarla."))}</p>`) + `</div>`;
    $("so-out").innerHTML = o;
  }

  lee();
  $("v-sobresale").addEventListener("input", (e) => { if (e.target.closest(".zc-caja")) calc(); });
  $("v-sobresale").addEventListener("change", (e) => { if (e.target.closest(".zc-caja")) calc(); });
  calc();
})();
