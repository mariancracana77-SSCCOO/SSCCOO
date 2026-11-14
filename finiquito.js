// Mi finiquito (Zona Conductores, petición n.º 38 del padre). Es su calculadora «Finiquito · Convenio de Girona»
// pasada tal cual: las tablas salariales, los porcentajes y las cuentas son las suyas, sin cambiar ni una cifra
// (si hay que corregir algo, que lo diga él). Aquí solo cambia la forma: sin <script> en línea ni onclick (CSP),
// textos con esc() y los colores de Zona Conductores. Todo se calcula en pantalla: no se guarda nada en el móvil
// ni se envía a ningún sitio.
(function () {
  const $ = (i) => document.getElementById(i);
  if (!$("v-finiquito")) return;
  const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const D = (s) => { const p = s.split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); };
  const DAY = 864e5, inc = (a, b) => Math.max(0, Math.round((b - a) / DAY) + 1);
  const f1 = (n) => n.toFixed(1).replace(".", ",");
  // Tablas del convenio de Girona 2026-2027 (BOP 160, 20/08/2026): [nombre, [base 2026, plus convenio 2026], [base 2027, plus convenio 2027]]
  const TAB = {
    cm: ["Conductor mecánico", [1188.56, 191.66], [1230.16, 198.37]],
    c: ["Conductor", [1082.40, 184.58], [1120.28, 191.04]],
    cf: ["Conductor de moto y furgoneta", [1008.08, 179.64], [1043.36, 185.93]],
    aj: ["Ayudante", [976.22, 177.51], [1010.39, 183.72]],
    me: ["Mozo especializado / carretillero", [953.66, 192.16], [987.04, 198.88]],
    mc: ["Mozo de carga, descarga y repartidor", [941.24, 204.58], [974.18, 211.74]],
    ct: ["Jefe de tráfico de 3ª", [1236.33, 194.85], [1279.60, 201.67]],
    a1: ["Oficial 1ª administrativo", [1292.03, 198.56], [1337.25, 205.51]],
    a2: ["Oficial 2ª administrativo", [1127.50, 187.60], [1166.96, 194.17]]
  };
  const sel = $("fin-cat");
  sel.innerHTML = Object.keys(TAB).map(k => `<option value="${esc(k)}">${esc(TAB[k][0])}</option>`).join("") + `<option value="man">Otra (introduzco los importes)</option>`;
  sel.value = "c";
  const caja = (t) => `<div class="zc-ok">${t}</div>`;
  function calc() {
    const out = $("fin-out"), man = sel.value === "man";
    $("fin-man").hidden = !man;
    if (!$("fin-alta").value || !$("fin-baja").value) { out.innerHTML = caja("Rellena las fechas para ver el resultado."); return; }
    const alta = D($("fin-alta").value), baja = D($("fin-baja").value);
    if (baja < alta) { out.innerHTML = `<p class="zc-error">La fecha de baja no puede ser anterior al alta.</p>`; return; }
    const bd = new Date(baja), by = bd.getUTCFullYear(), bm = bd.getUTCMonth(), bdy = bd.getUTCDate();
    let base, pc, yr = "";
    if (man) { base = parseFloat($("fin-bm").value) || 0; pc = parseFloat($("fin-pm").value) || 0; $("fin-tabinfo").textContent = ""; }
    else {
      const t = TAB[sel.value][by >= 2027 ? 2 : 1]; base = t[0]; pc = t[1]; yr = by >= 2027 ? 2027 : 2026;
      $("fin-tabinfo").textContent = "Tabla " + yr + ": salario base " + eur(base) + " + plus convenio " + eur(pc) + " al mes.";
    }
    if (!(base > 0)) { out.innerHTML = caja("Introduce el salario base mensual."); return; }
    const anios = inc(alta, baja) / 365.25, ay = Math.floor(anios);
    const pct = ay >= 24 ? 50 : ay >= 19 ? 40 : ay >= 14 ? 30 : ay >= 9 ? 20 : ay >= 4 ? 10 : 0;
    const ant = base * pct / 100, P = base + pc + ant, X = parseFloat($("fin-plus").value) || 0;
    const pagas = $("fin-pagas").value, tipo = $("fin-tipo").value;
    const ord = (pagas === "all" ? P * 1.25 : pagas === "mar" ? P * (1 + 1 / 12) : P) + X;
    const diasMes = Math.min(30, bdy), rows = [];
    let fin = 0;
    const add = (t, sm, v) => { rows.push([t, sm, v]); fin += v; };
    add("Salario del mes de la baja", diasMes + " días a " + eur(ord / 30) + "/día", ord / 30 * diasMes);
    if (pagas !== "all") {
      const sem = 182.5;
      let st, v;
      if (bm <= 5) { st = Math.max(alta, Date.UTC(by, 0, 1)); v = P * Math.min(1, inc(st, baja) / sem); add("Paga extra de verano (parte devengada)", "1 ene – 30 jun", v); }
      else { st = Math.max(alta, Date.UTC(by, 6, 1)); v = P * Math.min(1, inc(st, baja) / sem); add("Paga extra de Navidad (parte devengada)", "1 jul – 31 dic", v); }
    }
    if (pagas === "none") {
      add("Paga de marzo (parte devengada este año)", "1 ene a la baja · se paga hasta el 15 de marzo del año siguiente", P * inc(Math.max(alta, Date.UTC(by, 0, 1)), baja) / 365);
      const ye = Date.UTC(by - 1, 11, 31);
      if ((bm < 2 || (bm === 2 && bdy < 15)) && alta <= ye) {
        add("Paga de marzo del año anterior", "Aún no cobrada si la baja es antes del 15 de marzo", P * inc(Math.max(alta, Date.UTC(by - 1, 0, 1)), ye) / 365);
      }
    }
    const dev = 23 * inc(Math.max(alta, Date.UTC(by, 0, 1)), baja) / 365;
    const pend = Math.max(0, dev - (parseFloat($("fin-dis").value) || 0));
    add("Vacaciones no disfrutadas", f1(pend) + " días laborables pendientes de " + f1(dev) + " devengados", pend * (P + X) * 12 / 365 * 1.4);
    const diario = (15 * P + 12 * X) / 365;
    let dias = 0, nota = "", cap = 0;
    if (tipo === "imp") {
      const cut = Date.UTC(2012, 1, 12);
      if (alta >= cut) { dias = 33 * anios; cap = 720; nota = "33 días por año, máx. 24 mensualidades"; }
      else {
        const y45 = inc(alta, Math.min(baja, cut - DAY)) / 365.25, y33 = Math.max(0, anios - y45), d45 = 45 * y45;
        dias = d45 + 33 * y33; cap = d45 > 720 ? 1260 : 720; nota = "45 días/año hasta el 11/02/2012 y 33 después, máx. " + (cap === 1260 ? "42" : "24") + " mensualidades";
      }
      dias = Math.min(dias, cap);
    } else if (tipo === "obj") { dias = Math.min(20 * anios, 360); nota = "20 días por año, máx. 12 mensualidades"; }
    else if (tipo === "tmp") { dias = 12 * anios; nota = "12 días por año trabajado"; }
    const ind = dias * diario;
    const fila = (t, sm, v, fuerte) => `<tr><td>${fuerte ? `<b>${esc(t)}</b>` : esc(t)}${sm ? `<small>${esc(sm)}</small>` : ""}</td><td>${esc(eur(v))}</td></tr>`;
    let h = caja(`Antigüedad: <b>${ay} años</b> → complemento del <b>${pct}%</b> sobre el salario base (${esc(eur(ant))}/mes). Paga extra = ${esc(eur(P))}.`);
    h += `<div class="panel zc-caja zc-resultado"><table class="zc-tabla"><tr class="zc-sec"><td colspan="2">Finiquito</td></tr>`;
    rows.forEach(r => { h += fila(r[0], r[1], r[2]); });
    h += fila("Total finiquito", "", fin, true) + `<tr class="zc-sec"><td colspan="2">Indemnización</td></tr>`;
    if (ind > 0) h += fila("Indemnización por la baja", nota + " · " + f1(dias) + " días a " + eur(diario) + "/día", ind);
    else h += fila("Este motivo no da derecho a indemnización legal", tipo === "dis" ? "Si crees que el despido es injusto, puedes impugnarlo: podría pasar a improcedente." : "Revisa si tu contrato o empresa la mejoran.", 0);
    h += `</table><div class="zc-total"><span>Total bruto</span><span>${esc(eur(fin + ind))}</span></div></div>`;
    out.innerHTML = h;
  }
  ["fin-alta", "fin-baja", "fin-cat", "fin-bm", "fin-pm", "fin-plus", "fin-pagas", "fin-dis", "fin-tipo"].forEach(i => $(i).addEventListener("input", calc));
  ["fin-cat", "fin-pagas", "fin-tipo"].forEach(i => $(i).addEventListener("change", calc));
  calc();
})();
