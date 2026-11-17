// Mi finiquito (Zona Conductores, petición n.º 38 del padre). Es su calculadora «Finiquito · Convenio de Girona»
// pasada tal cual: las tablas salariales, los porcentajes y las cuentas son las suyas, sin cambiar ni una cifra
// (si hay que corregir algo, que lo diga él). Aquí solo cambia la forma: sin <script> en línea ni onclick (CSP),
// textos con esc() y los colores de Zona Conductores. Todo se calcula en pantalla: no se guarda nada en el móvil
// ni se envía a ningún sitio.
// v185 (revisión a fondo que pidió Lorena el 17/11/2026, con su visto bueno): se corrigen errores de las cuentas, no las
// cifras del convenio: mes de la baja como mes de 30 días (febrero y meses de 31) y prorrateado si el alta es del mismo mes,
// años de antigüedad por aniversarios (antes, con /365,25, la víspera del aniversario contaba un año menos), semestres y
// años con sus días reales (bisiestos incluidos) y sin importes negativos. Las prueba pruebas/finiquito.cjs.
(function () {
  const $ = (i) => document.getElementById(i);
  if (!$("v-finiquito") || typeof CONVENIO_GIRONA === "undefined") return;
  const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const D = (s) => { const p = s.split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); };
  const DAY = 864e5, inc = (a, b) => Math.max(0, Math.round((b - a) / DAY) + 1);
  const f1 = (n) => n.toFixed(1).replace(".", ",");
  const pos = (v) => Math.max(0, parseFloat(v) || 0); // ningún importe ni día negativo
  // Fecha + n años (29 de febrero → 28 de febrero si el año no es bisiesto)
  const masAnios = (t, n) => { const d = new Date(t), y = d.getUTCFullYear() + n, m = d.getUTCMonth(); return Date.UTC(y, m, Math.min(d.getUTCDate(), new Date(Date.UTC(y, m + 1, 0)).getUTCDate())); };
  // Años trabajados de «a» a «b» (los dos días incluidos): años enteros por aniversarios y la parte del año en curso
  function anios(a, b) {
    const fin = b + DAY;
    let n = 0;
    while (masAnios(a, n + 1) <= fin) n++;
    const i = masAnios(a, n), j = masAnios(a, n + 1);
    return n + (fin - i) / (j - i);
  }
  const diasAnio = (y) => inc(Date.UTC(y, 0, 1), Date.UTC(y, 11, 31)); // 365 o 366

  // Tablas del convenio de Girona 2026-2027 y regla de antigüedad: en convenio-girona.js (las comparte con «Mi hora ordinaria»)
  const TAB = CONVENIO_GIRONA.TAB;
  // v177 (petición n.º 45): textos traducibles con T("...") (zona-idioma.js; la función «traducir» los saca de este archivo)
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("finiquito", "v-finiquito", () => calc()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m), TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  const sel = $("fin-cat");
  sel.innerHTML = Object.keys(TAB).map(k => `<option value="${esc(k)}">${esc(TAB[k][0])}</option>`).join("") + `<option value="man">${esc(T("Otra (introduzco los importes)"))}</option>`;
  sel.value = "c";
  const caja = (t) => `<div class="zc-ok">${t}</div>`; // t ya va escapado
  function calc() {
    const out = $("fin-out"), man = sel.value === "man";
    $("fin-man").hidden = !man;
    if (!$("fin-alta").value || !$("fin-baja").value) { out.innerHTML = caja(esc(T("Rellena las fechas para ver el resultado."))); return; }
    const alta = D($("fin-alta").value), baja = D($("fin-baja").value);
    if (baja < alta) { out.innerHTML = `<p class="zc-error">${esc(T("La fecha de baja no puede ser anterior al alta."))}</p>`; return; }
    const bd = new Date(baja), by = bd.getUTCFullYear(), bm = bd.getUTCMonth(), bdy = bd.getUTCDate();
    let base, pc, yr = "";
    if (man) { base = pos($("fin-bm").value); pc = pos($("fin-pm").value); $("fin-tabinfo").textContent = ""; }
    else {
      const t = TAB[sel.value][by >= 2027 ? 2 : 1]; base = t[0]; pc = t[1]; yr = by >= 2027 ? 2027 : 2026;
      $("fin-tabinfo").textContent = T("Tabla {a}: salario base {b} + plus convenio {p} al mes.", { a: yr, b: eur(base), p: eur(pc) });
    }
    if (!(base > 0)) { out.innerHTML = caja(esc(T("Introduce el salario base mensual."))); return; }
    const anyos = anios(alta, baja), ay = Math.floor(anyos + 1e-9);
    const pct = CONVENIO_GIRONA.pctAntiguedad(ay);
    const ant = base * pct / 100, P = base + pc + ant, X = pos($("fin-plus").value);
    const pagas = $("fin-pagas").value, tipo = $("fin-tipo").value;
    const ord = (pagas === "all" ? P * 1.25 : pagas === "mar" ? P * (1 + 1 / 12) : P) + X;
    // Mes de 30 días: si la baja es el último día del mes cuentan 30 (también en febrero y en los meses de 31);
    // si el alta es del mismo mes, solo desde el día del alta
    const ultimo = new Date(Date.UTC(by, bm + 1, 0)).getUTCDate(), ad = new Date(alta);
    const hasta = bdy === ultimo ? 30 : Math.min(30, bdy);
    const desde = ad.getUTCFullYear() === by && ad.getUTCMonth() === bm ? Math.min(30, ad.getUTCDate()) : 1;
    const diasMes = Math.max(1, hasta - desde + 1), rows = [];
    let fin = 0;
    const add = (t, sm, v) => { rows.push([t, sm, v]); fin += v; };
    add(T("Salario del mes de la baja"), T("{n} días a {e}/día", { n: diasMes, e: eur(ord / 30) }), ord / 30 * diasMes);
    if (pagas !== "all") {
      // Días reales de cada semestre (181 o 182 de enero a junio, 184 de julio a diciembre)
      let st, v;
      if (bm <= 5) { st = Math.max(alta, Date.UTC(by, 0, 1)); v = P * Math.min(1, inc(st, baja) / inc(Date.UTC(by, 0, 1), Date.UTC(by, 5, 30))); add(T("Paga extra de verano (parte devengada)"), T("1 ene – 30 jun"), v); }
      else { st = Math.max(alta, Date.UTC(by, 6, 1)); v = P * Math.min(1, inc(st, baja) / inc(Date.UTC(by, 6, 1), Date.UTC(by, 11, 31))); add(T("Paga extra de Navidad (parte devengada)"), T("1 jul – 31 dic"), v); }
    }
    if (pagas === "none") {
      add(T("Paga de marzo (parte devengada este año)"), T("1 ene a la baja · se paga hasta el 15 de marzo del año siguiente"), P * inc(Math.max(alta, Date.UTC(by, 0, 1)), baja) / diasAnio(by));
      const ye = Date.UTC(by - 1, 11, 31);
      if ((bm < 2 || (bm === 2 && bdy < 15)) && alta <= ye) {
        add(T("Paga de marzo del año anterior"), T("Aún no cobrada si la baja es antes del 15 de marzo"), P * inc(Math.max(alta, Date.UTC(by - 1, 0, 1)), ye) / diasAnio(by - 1));
      }
    }
    const dev = 23 * inc(Math.max(alta, Date.UTC(by, 0, 1)), baja) / diasAnio(by);
    const pend = Math.max(0, dev - pos($("fin-dis").value));
    add(T("Vacaciones no disfrutadas"), T("{p} días laborables pendientes de {d} devengados", { p: f1(pend), d: f1(dev) }), pend * (P + X) * 12 / 365 * 1.4);
    const diario = (15 * P + 12 * X) / 365;
    let dias = 0, nota = "", cap = 0;
    if (tipo === "imp") {
      const cut = Date.UTC(2012, 1, 12);
      if (alta >= cut) { dias = 33 * anyos; cap = 720; nota = T("33 días por año, máx. 24 mensualidades"); }
      else {
        const y45 = anios(alta, Math.min(baja, cut - DAY)), y33 = Math.max(0, anyos - y45), d45 = 45 * y45;
        // v173 (corregido con el visto bueno del padre): Estatuto, disposición transitoria undécima. Si solo el tramo de antes
        // del 12/02/2012 ya pasa de 720 días, se cobra ese tramo (máx. 1260 = 42 mensualidades) y lo de después no suma.
        if (d45 > 720) { dias = Math.min(d45, 1260); cap = 1260; nota = T("45 días/año hasta el 11/02/2012 (pasa de 720 días: lo de después no suma), máx. 42 mensualidades"); }
        else { dias = d45 + 33 * y33; cap = 720; nota = T("45 días/año hasta el 11/02/2012 y 33 después, máx. 24 mensualidades"); }
      }
      dias = Math.min(dias, cap);
    } else if (tipo === "obj") { dias = Math.min(20 * anyos, 360); nota = T("20 días por año, máx. 12 mensualidades"); }
    else if (tipo === "tmp") { dias = 12 * anyos; nota = T("12 días por año trabajado"); }
    const ind = dias * diario;
    const fila = (t, sm, v, fuerte) => `<tr><td>${fuerte ? `<b>${esc(t)}</b>` : esc(t)}${sm ? `<small>${esc(sm)}</small>` : ""}</td><td>${esc(eur(v))}</td></tr>`;
    let h = caja(TH("Antigüedad: **{y} años** → complemento del **{p}%** sobre el salario base ({a}/mes). Paga extra = {e}.", { y: ay, p: pct, a: eur(ant), e: eur(P) }));
    h += `<div class="panel zc-caja zc-resultado"><table class="zc-tabla"><tr class="zc-sec"><td colspan="2">${esc(T("Finiquito"))}</td></tr>`;
    rows.forEach(r => { h += fila(r[0], r[1], r[2]); });
    h += fila(T("Total finiquito"), "", fin, true) + `<tr class="zc-sec"><td colspan="2">${esc(T("Indemnización"))}</td></tr>`;
    if (ind > 0) h += fila(T("Indemnización por la baja"), nota + " · " + T("{n} días a {e}/día", { n: f1(dias), e: eur(diario) }), ind);
    else h += fila(T("Este motivo no da derecho a indemnización legal"), tipo === "dis" ? T("Si crees que el despido es injusto, puedes impugnarlo: podría pasar a improcedente.") : T("Revisa si tu contrato o empresa la mejoran."), 0);
    h += `</table><div class="zc-total"><span>${esc(T("Total bruto"))}</span><span>${esc(eur(fin + ind))}</span></div></div>`;
    out.innerHTML = h;
  }
  ["fin-alta", "fin-baja", "fin-cat", "fin-bm", "fin-pm", "fin-plus", "fin-pagas", "fin-dis", "fin-tipo"].forEach(i => $(i).addEventListener("input", calc));
  ["fin-cat", "fin-pagas", "fin-tipo"].forEach(i => $(i).addEventListener("change", calc));
  calc();
})();
