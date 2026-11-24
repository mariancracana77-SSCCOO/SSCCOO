// Mi baja médica (Zona Conductores, petición n.º 72 del padre: «calcular baja médica amparado al convenio de transporte y
// logística de Girona»). Lo que paga la Seguridad Social, comprobado en el BOE el 24/11/2026: LGSS art. 171.2 (base
// reguladora = base de cotización del mes anterior ÷ 30) y art. 173.1 (desde qué día y quién paga), Decreto 3158/1966 art. 2
// (75 %) y Real Decreto 53/1980 (60 % del día 4 al 20 en enfermedad común y accidente no laboral). Lo que pone la empresa:
// artículo 24 del convenio de Girona 2026-2027 (BOP de Girona n.º 160, 20/08/2026; el PDF está en Documentos de la web).
// El convenio no dice nada de los accidentes no laborales ni de las enfermedades profesionales: ahí solo se cuenta lo de la
// Seguridad Social. Cómo se cuentan las «dos veces al año» del 100 % desde el día 61 lo elige el conductor (casilla).
// Todo se calcula en el móvil: no se guarda nada ni se envía. Lo prueba pruebas/baja.cjs (window.BAJA para las cuentas).
const BAJA = (function () {
  const MAX_DIAS = 545; // LGSS art. 169.1.a): 365 días, prorrogables 180
  // o = { tipo: "comun"|"anl"|"at"|"ep", base (€/mes), dias, hosp (true/false), veces (ya tuvo 2 este año) }
  // Devuelve los tramos: [desde, hasta, % Seguridad Social, quién paga eso, % total con el convenio]
  function tramos(o) {
    const t = [];
    const add = (a, b, ss, quien, tot) => { if (a <= o.dias) t.push([a, Math.min(b, o.dias), ss, quien, Math.max(ss, tot)]); };
    const fin = MAX_DIAS;
    if (o.tipo === "comun" || o.tipo === "anl") {
      const conv = o.tipo === "comun";
      const h = conv && o.hosp; // hospitalización: 100 % desde el primer día
      add(1, 3, 0, "", h ? 100 : 0);
      add(4, 15, 60, "empresa", h ? 100 : conv ? 80 : 60);
      add(16, 20, 60, "inss", h ? 100 : conv ? 80 : 60);
      add(21, 60, 75, "inss", h ? 100 : conv ? 80 : 75);
      add(61, fin, 75, "inss", h || (conv && !o.veces) ? 100 : 75);
    } else {
      // Accidente de trabajo y enfermedad profesional: el día de la baja, salario entero a cargo de la empresa; desde el día siguiente, 75 %
      add(1, 1, 100, "empresa", 100);
      if (o.tipo === "at") { add(2, 360, 75, "mutua", 100); add(361, fin, 75, "mutua", 75); }
      else add(2, fin, 75, "mutua", 75);
    }
    return t;
  }
  function calcula(o) {
    const dias = Math.min(MAX_DIAS, Math.max(0, Math.floor(o.dias || 0)));
    const diario = Math.max(0, o.base || 0) / 30;
    const filas = tramos({ ...o, dias }).map(([a, b, ss, quien, tot]) => {
      const n = b - a + 1;
      return { a, b, n, ss, quien, tot, ssEur: diario * ss / 100 * n, conv: diario * (tot - ss) / 100 * n, total: diario * tot / 100 * n };
    });
    const total = filas.reduce((s, f) => s + f.total, 0), entero = diario * dias;
    return { dias, diario, filas, total, entero, pierdes: entero - total, cortado: (o.dias || 0) > MAX_DIAS };
  }
  return { calcula, MAX_DIAS };
})();
if (typeof window !== "undefined") window.BAJA = BAJA;
if (typeof module !== "undefined") module.exports = BAJA;

(function () {
  if (typeof document === "undefined") return;
  const $ = (i) => document.getElementById(i);
  if (!$("v-baja")) return;
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("baja", "v-baja", () => calc()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m), TH: null };
  const T = Z.T;
  const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  // v216: lee números como los escribe la gente en España: «2100», «2.100», «2.100,50», «2100,5», «2100 €».
  const num = (v) => { let t = String(v ?? "").replace(/[\s€]/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    const n = parseFloat(t); return Number.isFinite(n) && n > 0 ? n : 0; };
  const QUIEN = { empresa: () => T("la paga la empresa"), inss: () => T("la paga la Seguridad Social o la mutua"), mutua: () => T("la paga la mutua"), "": () => T("nadie paga estos días") };
  const caja = (t) => `<div class="zc-ok">${t}</div>`;
  function calc() {
    const tipo = $("ba-tipo").value, comun = tipo === "comun";
    $("ba-comun-caja").hidden = !comun;
    const base = num($("ba-base").value), dias = Math.floor(num($("ba-dias").value)), out = $("ba-out");
    if (!(base > 0)) { out.innerHTML = caja(esc(T("Pon la base de cotización de tu última nómina para ver el resultado."))); return; }
    if (!(dias > 0)) { out.innerHTML = caja(esc(T("Pon cuántos días dura la baja."))); return; }
    const r = BAJA.calcula({ tipo, base, dias, hosp: comun && $("ba-hosp").checked, veces: comun && $("ba-veces").checked });
    let h = "";
    if (r.cortado) h += caja(esc(T("Una baja dura como mucho 545 días (365 y una prórroga de 180): contamos 545.")));
    if (tipo === "anl" || tipo === "ep") h += `<div class="zc-aviso">${esc(T("El convenio de Girona no dice nada de este caso: solo se cuenta lo que paga la Seguridad Social. Pregunta a un delegado si tu empresa lo mejora."))}</div>`;
    h += caja(esc(T("Tu base reguladora: {e} al día (la base de cotización ÷ 30).", { e: eur(r.diario) })));
    h += `<div class="panel zc-caja zc-resultado"><table class="zc-tabla zc-parte">`;
    for (const f of r.filas) {
      const rango = f.a === f.b ? T("Día {a}", { a: f.a }) : T("Del día {a} al {b}", { a: f.a, b: f.b });
      const det = f.ss ? T("Seguridad Social {s} % ({q})", { s: f.ss, q: QUIEN[f.quien]() }) : QUIEN[""]();
      const con = f.tot > f.ss ? " · " + T("la empresa completa hasta el {t} % por el convenio", { t: f.tot }) : "";
      h += `<tr><td>${esc(rango)}<small>${esc(det + con)}</small><small>${esc(T("{n} días a {e} al día", { n: f.n, e: eur(r.diario * f.tot / 100) }))}</small></td><td>${esc(eur(f.total))}</td></tr>`;
    }
    h += `</table><div class="zc-total"><span>${esc(T("Cobras en total"))}</span><span>${esc(eur(r.total))}</span></div></div>`;
    if (r.pierdes > 0.005) h += caja(esc(T("Sin la baja habrías cobrado unos {e} (el 100 % de tu base): dejas de cobrar {p}.", { e: eur(r.entero), p: eur(r.pierdes) })));
    out.innerHTML = h;
  }
  ["ba-tipo", "ba-base", "ba-dias", "ba-hosp", "ba-veces"].forEach(i => { $(i).addEventListener("input", calc); $(i).addEventListener("change", calc); });
  calc();
})();
