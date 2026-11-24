// Mi jubilación (Zona Conductores, petición n.º 72 del padre: «calculadora de jubilación conductor profesional»).
// Solo con datos comprobados en el BOE el 24/11/2026 (Ley General de la Seguridad Social, texto consolidado, y Real
// Decreto-ley 3/2026 para las cifras de 2026). Lo que no se ha podido comprobar no entra en la cuenta. Todo se calcula en
// el móvil: no se guarda nada ni se envía a ningún sitio. No se pregunta el sexo. Para conductores profesionales NO hay
// real decreto en vigor con coeficientes reductores: se explica en un recuadro y no se calcula. Lo prueba pruebas/jubilacion.cjs.
// Con «sabido» se pueden probar las cuentas sin el navegador (window.JUBILACION).
const JUBILACION = (function () {
  const D = Object.freeze({
    // LGSS DT 7.ª: año del hecho causante → [meses cotizados para jubilarse a los 65, edad en meses si no se llega]
    edad: (y) => y <= 2026 ? [38 * 12 + 3, 66 * 12 + 10] : [38 * 12 + 6, 67 * 12],
    MIN_COT: 15 * 12,       // LGSS art. 205.1.b): 15 años cotizados como mínimo
    MIN_VOL: 35 * 12,       // art. 208.1.b): 35 años para la anticipada voluntaria (hasta 2 años antes)
    MIN_INV: 33 * 12,       // art. 207.1.c): 33 años para la anticipada por despido o cierre (hasta 4 años antes)
    MAX: 3359.60,           // RDL 3/2026, art. 1: pensión máxima 2026, euros al mes (14 pagas)
    BASE_MAX: 5101.20,      // Orden PJC/297/2026: base máxima de cotización 2026, euros al mes
    // RDL 3/2026, anexo I: pensión mínima de jubilación 2026 en euros al año [con 65 años, menor de 65]
    MINIMA: { carga: [17592.40, 17592.40], solo: [13106.80, 12262.60], nocarga: [12441.80, 11590.60] },
  // Art. 208.2 (voluntaria): fila = meses que se adelanta (1 a 24); columnas = menos de 38a6m, 38a6m-41a6m, 41a6m-44a6m, 44a6m o más
  RED_VOL: [[3.26, 3.11, 2.96, 2.81],[3.38, 3.23, 3.08, 2.92],[3.52, 3.36, 3.2, 3.04],[3.67, 3.5, 3.33, 3.17],[3.83, 3.65, 3.48, 3.3],[4.0, 3.82, 3.64, 3.45],[4.19, 4.0, 3.81, 3.62],[4.4, 4.2, 4.0, 3.8],[4.63, 4.42, 4.21, 4.0],[4.89, 4.67, 4.44, 4.22],[5.18, 4.94, 4.71, 4.47],[5.5, 5.25, 5.0, 4.75],[5.87, 5.6, 5.33, 5.07],[6.29, 6.0, 5.71, 5.43],[6.77, 6.46, 6.15, 5.85],[7.33, 7.0, 6.67, 6.33],[8.0, 7.64, 7.27, 6.91],[8.8, 8.4, 8.0, 7.6],[9.78, 9.33, 8.89, 8.4],[11.0, 10.5, 10.0, 9.2],[12.57, 12.0, 11.43, 10.0],[14.67, 14.0, 13.33, 11.0],[17.6, 16.5, 15.0, 12.0],[21.0, 19.0, 17.0, 13.0]],
  // Art. 207.2 (por despido o cierre): fila = meses que se adelanta (1 a 48); mismas columnas
  RED_INV: [[0.63, 0.58, 0.54, 0.5],[1.25, 1.17, 1.08, 1.0],[1.88, 1.75, 1.63, 1.5],[2.5, 2.33, 2.17, 2.0],[3.13, 2.92, 2.71, 2.5],[3.75, 3.5, 3.25, 3.0],[4.19, 4.0, 3.81, 3.62],[4.4, 4.2, 4.0, 3.8],[4.63, 4.42, 4.21, 4.0],[4.89, 4.67, 4.44, 4.22],[5.18, 4.94, 4.71, 4.47],[5.5, 5.25, 5.0, 4.75],[5.87, 5.6, 5.33, 5.07],[6.29, 6.0, 5.71, 5.43],[6.77, 6.46, 6.15, 5.85],[7.33, 7.0, 6.67, 6.33],[8.0, 7.64, 7.27, 6.91],[8.8, 8.4, 8.0, 7.6],[9.78, 9.33, 8.89, 8.4],[11.0, 10.5, 10.0, 9.2],[12.57, 12.0, 11.38, 10.0],[13.75, 12.83, 11.92, 11.0],[14.38, 13.42, 12.46, 11.5],[15.0, 14.0, 13.0, 12.0],[15.63, 14.58, 13.54, 12.5],[16.25, 15.17, 14.08, 13.0],[16.88, 15.75, 14.63, 13.5],[17.5, 16.33, 15.17, 14.0],[18.13, 16.92, 15.71, 14.5],[18.75, 17.5, 16.25, 15.0],[19.38, 18.08, 16.79, 15.5],[20.0, 18.67, 17.33, 16.0],[20.63, 19.25, 17.88, 16.5],[21.25, 19.83, 18.42, 17.0],[21.88, 20.42, 18.96, 17.5],[22.5, 21.0, 19.5, 18.0],[23.13, 21.58, 20.04, 18.5],[23.75, 22.17, 20.58, 19.0],[24.38, 22.75, 21.13, 19.5],[25.0, 23.33, 21.67, 20.0],[25.63, 23.92, 22.21, 20.5],[26.25, 24.5, 22.75, 21.0],[26.88, 25.08, 23.29, 21.5],[27.5, 25.67, 23.83, 22.0],[28.13, 26.25, 24.38, 22.5],[28.75, 26.83, 24.92, 23.0],[29.38, 27.42, 25.46, 23.5],[30.0, 28.0, 26.0, 24.0]],
  });
  // Porcentaje sobre la base reguladora (LGSS art. 210.1 y DT 9.ª) según el año y los meses cotizados
  function porcentaje(y, m) {
    if (m < D.MIN_COT) return 0;
    const x = m - D.MIN_COT;
    const p = y <= 2026 ? 50 + 0.21 * Math.min(x, 49) + 0.19 * Math.min(Math.max(x - 49, 0), 209)
      : 50 + 0.19 * Math.min(x, 248) + 0.18 * Math.min(Math.max(x - 248, 0), 16);
    return Math.min(100, Math.round(p * 100) / 100);
  }
  // Columna de las tablas de reducción según los meses cotizados
  const tramo = (m) => m < 462 ? 0 : m < 498 ? 1 : m < 534 ? 2 : 3;
  // Fechas en UTC (sin horas)
  const dia = (y, m, d) => Date.UTC(y, m, d);
  const masMeses = (t, n) => { const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + n; return Date.UTC(y, m, Math.min(d.getUTCDate(), new Date(Date.UTC(y, m + 1, 0)).getUTCDate())); };
  const mesesEntre = (a, b) => { const x = new Date(a), z = new Date(b); return (z.getUTCFullYear() - x.getUTCFullYear()) * 12 + z.getUTCMonth() - x.getUTCMonth() - (z.getUTCDate() < x.getUTCDate() ? 1 : 0); };
  const anio = (t) => new Date(t).getUTCFullYear();

  // o = { nac, hoy (fechas UTC), cot (meses cotizados hoy), sigue (true/false), base (€/mes), reg ("ajena"|"auto"), fam ("", "carga", "solo", "nocarga"), despido (true/false), adelanto (meses, opcional) }
  function calcula(o) {
    const cotEn = (t, sigue = o.sigue) => o.cot + (sigue ? Math.max(0, mesesEntre(o.hoy, t)) : 0);
    // Edad ordinaria: el primer mes desde los 65 en que se cumple la regla del año (DT 7.ª)
    function ordinaria(sigue) {
      for (let k = 0; k <= 24; k++) {
        const t = masMeses(o.nac, 65 * 12 + k), [umbral, edadLarga] = D.edad(anio(t)), e = 65 * 12 + k;
        if (cotEn(t, sigue) >= umbral || e >= edadLarga) return { t, edad: e };
      }
      return { t: masMeses(o.nac, 67 * 12), edad: 67 * 12 };
    }
    const base = Math.min(Math.max(0, o.base || 0), D.BASE_MAX);
    // Base reguladora (art. 209.1): las 324 mejores bases de las últimas 348 / 378. Con la misma base todos los meses = base × 324 / 378.
    // Horquilla: de un 10 % menos (si las bases de años atrás eran más bajas) a la base de ahora.
    const br = [base * 0.9 * 324 / 378, base * 324 / 378];
    const fam = o.fam && D.MINIMA[o.fam];
    const r = { base, br, avisos: [], filas: [] };
    function fila(tipo, t, edad, adel) {
      const cot = cotEn(t), y = anio(t), pct = porcentaje(y, cot);
      const f = { tipo, t, edad, adel, cot, pct, red: 0, pension: null, tope: false, noCalc: "" };
      if (cot < D.MIN_COT) { f.noCalc = "pocos"; return f; }
      let tope = D.MAX;
      if (tipo === "vol") f.red = D.RED_VOL[adel - 1][tramo(cot)];
      if (tipo === "inv") { f.red = D.RED_INV[adel - 1][tramo(cot)]; tope = D.MAX * (1 - 0.005 * Math.ceil(adel / 3)); }
      f.pension = br.map(b => {
        const sin = b * pct / 100;
        if (tipo === "vol" && sin > D.MAX) f.noCalc = "dt34"; // art. 210.3 y DT 34.ª: con la pensión por encima del tope se calcula de otra forma
        const v = sin * (1 - f.red / 100);
        if (v > tope) f.tope = true;
        return Math.min(v, tope);
      });
      if (tipo === "vol" && fam && f.pension[1] <= fam[0] / 14) f.noCalc = "minima"; // art. 208.1.c)
      return f;
    }
    const ord = ordinaria(o.sigue);
    r.ordinaria = fila("ord", ord.t, ord.edad, 0);
    if (ord.t < o.hoy) r.avisos.push("ya");
    // Para la anticipada, la edad de referencia es la que tendría si siguiera cotizando (arts. 207.2 y 208.2)
    const ref = ordinaria(true);
    const anticipada = (tipo, maxAdel, minCot) => {
      if (r.avisos.includes("ya")) return null; // ya tiene la edad ordinaria: adelantarla no tiene sentido
      const quiero = o.adelanto > 0 ? Math.min(o.adelanto, maxAdel) : 0;
      // Sin elegir, lo más pronto posible (desde hoy); eligiendo, solo esos meses
      for (let k = quiero || maxAdel; k >= (quiero || 1); k--) {
        const t = masMeses(ref.t, -k);
        if (t < o.hoy) { if (quiero) return { tipo, pasado: true }; continue; }
        if (cotEn(t) < minCot) { if (quiero) return { tipo, falta: minCot }; continue; }
        return fila(tipo, t, ref.edad - k, k);
      }
      return { tipo, falta: minCot };
    };
    r.vol = anticipada("vol", 24, D.MIN_VOL);
    r.inv = o.reg === "ajena" && o.despido ? anticipada("inv", 48, D.MIN_INV) : null;
    r.minima = fam ? fam.map(x => x / 14) : null;
    return r;
  }
  return { D, porcentaje, calcula, masMeses, mesesEntre, dia };
})();
if (typeof window !== "undefined") window.JUBILACION = JUBILACION;
if (typeof module !== "undefined") module.exports = JUBILACION;

(function () {
  if (typeof document === "undefined") return;
  const $ = (i) => document.getElementById(i);
  if (!$("v-jubilacion")) return;
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("jubilacion", "v-jubilacion", () => calc()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m), TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  // v216: lee números como los escribe la gente en España: «2100», «2.100», «2.100,50», «2100,5», «2100 €».
  const num = (v) => { let t = String(v ?? "").replace(/[\s€]/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    const n = parseFloat(t); return Number.isFinite(n) && n > 0 ? n : 0; };
  const fecha = (t) => new Date(t).toLocaleDateString("es-ES", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
  const am = (m) => m % 12 ? T("{a} años y {m} meses", { a: Math.floor(m / 12), m: m % 12 }) : T("{a} años", { a: m / 12 });
  const pct = (p) => p.toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " %";
  const horq = (p) => p[0] === p[1] ? eur(p[1]) : T("{a} a {b}", { a: eur(p[0]), b: eur(p[1]) });
  const caja = (t) => `<div class="zc-ok">${t}</div>`;
  function filaHTML(f, titulo) {
    let h = `<tr class="zc-sec"><td colspan="2">${esc(titulo)}</td></tr>`;
    if (f.pasado) return h + `<tr><td colspan="2">${esc(T("Con tantos meses de adelanto la fecha ya ha pasado."))}</td></tr>`;
    if (f.falta) return h + `<tr><td colspan="2">${esc(T("No llegas a los {a} cotizados que pide.", { a: am(f.falta) }))}</td></tr>`;
    h += `<tr><td>${esc(T("Fecha aproximada"))}<small>${esc(T("con {e} de edad", { e: am(f.edad) }))}</small></td><td>${esc(fecha(f.t))}</td></tr>`;
    h += `<tr><td>${esc(T("Años cotizados en esa fecha"))}</td><td>${esc(am(f.cot))}</td></tr>`;
    if (f.noCalc === "pocos") return h + `<tr><td colspan="2"><b>${esc(T("Con menos de 15 años cotizados no hay pensión de jubilación contributiva."))}</b></td></tr>`;
    h += `<tr><td>${esc(T("Porcentaje de la base reguladora"))}</td><td>${esc(pct(f.pct))}</td></tr>`;
    if (f.adel) h += `<tr><td>${esc(T("Recorte por adelantarla"))}<small>${esc(T("{m} meses antes", { m: f.adel }))}</small></td><td>${esc("− " + pct(f.red))}</td></tr>`;
    if (f.noCalc === "dt34") return h + `<tr><td colspan="2">${esc(T("Tu pensión llega al tope máximo. En ese caso el recorte se calcula de otra forma y aquí no lo calculamos: pídelo a la Seguridad Social."))}</td></tr>`;
    h += `<tr><td><b>${esc(T("Pensión aproximada"))}</b><small>${esc(T("bruta al mes, 14 pagas"))}</small></td><td>${esc(horq(f.pension))}</td></tr>`;
    if (f.tope) h += `<tr><td colspan="2"><small>${esc(T("Llega al tope máximo de pensión de 2026."))}</small></td></tr>`;
    if (f.noCalc === "minima") h += `<tr><td colspan="2"><b>${esc(T("Así no podrías: la pensión tiene que salir más alta que la pensión mínima de tu situación familiar."))}</b></td></tr>`;
    return h;
  }
  function calc() {
    const out = $("ju-out"), aut = $("ju-reg").value === "auto";
    $("ju-desp-caja").hidden = aut;
    if (!$("ju-nac").value) { out.innerHTML = caja(esc(T("Pon tu fecha de nacimiento para ver el resultado."))); return; }
    const p = $("ju-nac").value.split("-").map(Number), h = new Date();
    const o = {
      nac: Date.UTC(p[0], p[1] - 1, p[2]), hoy: Date.UTC(h.getFullYear(), h.getMonth(), h.getDate()),
      cot: Math.floor(num($("ju-anios").value)) * 12 + Math.min(11, Math.floor(num($("ju-meses").value))),
      sigue: $("ju-sigue").value === "si", base: num($("ju-base").value), reg: aut ? "auto" : "ajena",
      fam: $("ju-fam").value, despido: !aut && $("ju-desp").checked, adelanto: Math.floor(num($("ju-adel").value))
    };
    if (o.nac > o.hoy) { out.innerHTML = `<p class="zc-error">${esc(T("La fecha de nacimiento no puede ser futura."))}</p>`; return; }
    if (!(o.base > 0)) { out.innerHTML = caja(esc(T("Pon tu base de cotización (o tu sueldo bruto) para ver la pensión."))); return; }
    const r = JUBILACION.calcula(o);
    let html = "";
    if (r.avisos.includes("ya")) html += caja(esc(T("Ya tienes la edad de jubilación ordinaria.")));
    if (num($("ju-base").value) > r.base) html += caja(esc(T("Tu base pasa de la base máxima de 2026: usamos {b}.", { b: eur(r.base) })));
    html += `<div class="panel zc-caja zc-resultado"><table class="zc-tabla zc-parte">`;
    html += filaHTML(r.ordinaria, T("Jubilación ordinaria"));
    if (r.vol) html += filaHTML(r.vol, T("Jubilación anticipada voluntaria"));
    if (r.inv) html += filaHTML(r.inv, T("Jubilación anticipada por despido o cierre"));
    html += `</table>`;
    if (r.ordinaria.pension) html += `<div class="zc-total"><span>${esc(T("Pensión ordinaria aproximada"))}</span><span>${esc(horq(r.ordinaria.pension))}</span></div>`;
    html += `</div>`;
    if (r.minima) html += caja(esc(T("Si la pensión te sale más baja, la Seguridad Social puede completarla hasta la mínima de 2026: {a} al mes con 65 años o más ({b} si tienes menos de 65), si tus otros ingresos no pasan de un límite (el límite no lo calculamos).", { a: eur(r.minima[0]), b: eur(r.minima[1]) })));
    out.innerHTML = html;
  }
  ["ju-nac", "ju-anios", "ju-meses", "ju-sigue", "ju-base", "ju-reg", "ju-fam", "ju-desp", "ju-adel"].forEach(i => { $(i).addEventListener("input", calc); $(i).addEventListener("change", calc); });
  calc();
})();
