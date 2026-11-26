// Comparadora de nóminas (Zona Conductores, petición n.º 74 del padre: «una comparadora de nóminas y explicación para
// todos los conceptos»). Tres partes: (1) dos nóminas tuyas una al lado de la otra, con la diferencia de cada línea;
// (2) tu nómina con los mínimos del convenio de Girona 2026-2027 (tablas de convenio-girona.js, las de «Mi finiquito» y
// «Mi hora ordinaria»); (3) qué es cada concepto, con buscador. Los descuentos (Seguridad Social, IRPF) no se calculan:
// cambian según la persona y el año, solo se comparan los que pone el conductor. Todo se calcula en el móvil: no se guarda
// nada (ni en el móvil) ni se envía. Lo prueba pruebas/nomina.cjs (window.NOMINA para las cuentas).
// Los textos van con T("...") para poder traducirlos cuando se añada el grupo «nomina» a la función «traducir»
// (eso toca una función del servidor: espera el visto bueno de Lorena). Mientras, sale solo en español.
const NOMINA = (function () {
  // [clave, nombre, d = lo cobras / q = te lo quitan / i = solo informativo (no suma), explicación]
  /* textos */
  const CONCEPTOS = [
    ["base", "Salario base", "d", "Lo fijo de tu categoría, según la tabla del convenio. Sobre él se calcula la antigüedad. Si un mes no trabajas todos los días (baja, días sin sueldo), baja en proporción."],
    ["plus", "Plus convenio", "d", "Complemento fijo que el convenio marca para cada categoría. Se cobra todos los meses y entra también en las pagas extra."],
    ["antig", "Antigüedad", "d", "Lo que cobras por los años en la empresa: un porcentaje del salario base que sube a los 4, 9, 14, 19 y 24 años (10, 20, 30, 40 y 50 %)."],
    ["hx", "Horas extra", "d", "Horas trabajadas por encima de tu jornada. El convenio marca el precio mínimo de cada hora para tu categoría: compruébalo en «Con el convenio» o en «Mi hora ordinaria»."],
    ["noct", "Nocturnidad", "d", "Plus por las horas trabajadas de noche. Va con la nómina de fin de mes, no con el cobro semanal."],
    ["pluses", "Otros pluses", "d", "Pluses de puesto, de ADR, de disponibilidad, incentivos… El nombre exacto sale en tu nómina. Si cobras uno todos los meses por lo mismo, es un plus fijo."],
    ["prorrata", "Prorrata de pagas extra", "d", "Si no te pagan las pagas extra aparte, te pagan un trozo cada mes: es la prorrata. Por el convenio son 3 pagas al año de 30 días de salario base, plus convenio y antigüedad; prorrateadas, una cuarta parte de eso cada mes."],
    ["paga", "Paga extra", "d", "Si te pagan las pagas extra aparte, el mes que toca sale aquí. Por el convenio son 3 al año, cada una de 30 días de salario base, plus convenio y antigüedad."],
    ["dietas", "Dietas", "d", "Dinero para comer y dormir fuera cuando viajas por trabajo. Es una compensación de gastos, no sueldo: dentro de unos límites que marca la ley, no cotiza ni paga IRPF."],
    ["km", "Kilómetros", "d", "Lo que te pagan por los kilómetros recorridos, si tu empresa los paga así. Como las dietas, suele ir como compensación de gastos."],
    ["otrosd", "Otros cobros", "d", "Cualquier otra línea de lo que cobras que no esté arriba: festivos trabajados, cargas y descargas, atrasos…"],
    ["cc", "Contingencias comunes", "q", "Lo que pagas a la Seguridad Social para la jubilación, las bajas por enfermedad y otras prestaciones. Es un porcentaje de tu base de cotización: el porcentaje sale al lado en la nómina."],
    ["desempleo", "Desempleo", "q", "Lo que pagas para el paro. También es un porcentaje de tu base de cotización (un poco más alto si el contrato es temporal)."],
    ["fp", "Formación profesional", "q", "Una parte muy pequeña de tu base de cotización para los cursos de formación de los trabajadores."],
    ["mei", "MEI", "q", "Mecanismo de Equidad Intergeneracional: un pequeño porcentaje extra que va a la hucha de las pensiones. Sale en las nóminas desde 2023 y sube un poco cada año."],
    ["hxcot", "Cotización de horas extra", "q", "Las horas extra cotizan aparte a la Seguridad Social. Si este mes hiciste horas extra, puede salir esta línea."],
    ["irpf", "IRPF", "q", "Lo que la empresa retiene para Hacienda a cuenta de tu declaración de la renta. El porcentaje depende de lo que vas a cobrar en el año y de tu familia. Si cambia de un mes a otro, puede ser porque la empresa lo ha ajustado. Lo de más o de menos se arregla en la renta."],
    ["anticipo", "Anticipos", "q", "Dinero que la empresa te adelantó y ahora te descuenta."],
    ["otrosq", "Otros descuentos", "q", "Cualquier otra línea de lo que te quitan: cuota sindical, embargos, préstamos de la empresa…"],
    ["devengado", "Total devengado", "i", "Todo lo que cobras ese mes antes de descuentos (el bruto): la suma de las líneas de arriba de la nómina."],
    ["deducir", "Total a deducir", "i", "La suma de todo lo que te quitan: Seguridad Social, IRPF, anticipos y otros."],
    ["liquido", "Líquido a percibir", "i", "Lo que te llega al banco: el total devengado menos el total a deducir."],
    ["basecc", "Base de cotización por contingencias comunes", "i", "La cantidad sobre la que se calculan tus descuentos de Seguridad Social. Suele ser tu sueldo del mes con la parte de las pagas extra, sin dietas ni kilómetros (dentro de los límites de la ley). Es la que sirve para calcular la baja por enfermedad y la jubilación."],
    ["baseat", "Base de accidentes de trabajo y enfermedades profesionales", "i", "Como la anterior, pero sumando las horas extra. La paga la empresa y sirve para calcular lo que cobras si tienes un accidente de trabajo."],
    ["baseirpf", "Base sujeta a retención del IRPF", "i", "La parte de lo que cobras sobre la que se aplica el porcentaje del IRPF."],
    ["empresa", "Aportación de la empresa", "i", "Abajo de la nómina sale lo que la empresa paga a la Seguridad Social por ti. No te lo quitan a ti: es informativo."]
  ];
  /* fin textos */
  const de = (tipo) => CONCEPTOS.filter(c => c[2] === tipo);
  // a y b: { clave: importe } de cada nómina. Devuelve las líneas con algo, los totales y las diferencias.
  function compara(a, b) {
    const filas = CONCEPTOS.filter(c => c[2] !== "i" && (a[c[0]] || b[c[0]])).map(([k, n, t]) => ({ k, n, t, a: a[k] || 0, b: b[k] || 0, dif: (b[k] || 0) - (a[k] || 0) }));
    const suma = (o, t) => de(t).reduce((s, c) => s + (o[c[0]] || 0), 0);
    const tot = (o) => { const d = suma(o, "d"), q = suma(o, "q"); return { d, q, l: d - q }; };
    return { filas, ta: tot(a), tb: tot(b) };
  }
  // Mínimos del convenio de Girona para una categoría, año (1 = 2026, 2 = 2027) y años en la empresa
  function minimos(cat, yr, anios) {
    const t = CONVENIO_GIRONA.TAB[cat][yr], pct = CONVENIO_GIRONA.pctAntiguedad(Math.max(0, anios || 0));
    const base = t[0], plus = t[1], antig = Math.round(base * pct) / 100;
    return { base, plus, antig, pct, prorrata: Math.round((base + plus + antig) * 3 / 12 * 100) / 100, hx: t[2] };
  }
  return { CONCEPTOS, compara, minimos };
})();
if (typeof window !== "undefined") window.NOMINA = NOMINA;
if (typeof module !== "undefined") module.exports = NOMINA;

(function () {
  if (typeof document === "undefined") return;
  const $ = (i) => document.getElementById(i);
  if (!$("v-nomina") || typeof CONVENIO_GIRONA === "undefined") return;
  const T = (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
  const TH = (x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  // Lee números como los escribe la gente en España: «2100», «2.100», «2.100,50», «2100,5», «2100 €» (igual que baja.js)
  const num = (v) => { let t = String(v ?? "").replace(/[\s€]/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    const n = parseFloat(t); return Number.isFinite(n) && n > 0 ? n : 0; };
  const C = NOMINA.CONCEPTOS;
  const SEC = { d: "Lo que cobras", q: "Lo que te quitan" };

  // ---------- Pestañas ----------
  let tab = "dos";
  function ponTab(t) {
    tab = t;
    document.querySelectorAll("[data-nom-tab]").forEach(b => { const si = b.dataset.nomTab === t; b.classList.toggle("activa", si); b.setAttribute("aria-selected", si ? "true" : "false"); });
    document.querySelectorAll("[data-nom-vista]").forEach(v => { v.hidden = v.dataset.nomVista !== t; });
  }
  $("v-nomina").querySelector(".zc-tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-nom-tab]"); if (b) ponTab(b.dataset.nomTab); });

  // ---------- 1. Dos nóminas ----------
  const nombres = () => [$("nom-n1").value.trim() || T("1.ª nómina"), $("nom-n2").value.trim() || T("2.ª nómina")];
  $("nom-filas").innerHTML = ["d", "q"].map(t => `<h3 class="nom-sec">${esc(T(SEC[t]))}</h3>` + C.filter(c => c[2] === t).map(([k, n, , ex]) =>
    `<div class="nom-fila"><details><summary>${esc(T(n))}</summary><p>${esc(T(ex))}</p></details>
      <div class="nom-par"><input id="nom-a-${esc(k)}" data-nom="a" data-k="${esc(k)}" type="text" inputmode="decimal" autocomplete="off"><input id="nom-b-${esc(k)}" data-nom="b" data-k="${esc(k)}" type="text" inputmode="decimal" autocomplete="off"></div></div>`).join("")).join("");
  function ponNombres() {
    const [n1, n2] = nombres();
    C.forEach(([k, n]) => {
      const a = $("nom-a-" + k), b = $("nom-b-" + k); if (!a) return;
      a.placeholder = n1; b.placeholder = n2;
      a.setAttribute("aria-label", T(n) + ", " + n1); b.setAttribute("aria-label", T(n) + ", " + n2);
    });
  }
  const difTxt = (d) => Math.abs(d) < 0.005 ? T("igual") : (d > 0 ? "+" : "−") + eur(Math.abs(d));
  function calcDos() {
    const a = {}, b = {};
    $("nom-filas").querySelectorAll("input[data-nom]").forEach(i => { (i.dataset.nom === "a" ? a : b)[i.dataset.k] = num(i.value); });
    const r = NOMINA.compara(a, b), [n1, n2] = nombres(), out = $("nom-out");
    const hayA = r.ta.d || r.ta.q, hayB = r.tb.d || r.tb.q;
    if (!hayA || !hayB) { out.innerHTML = `<div class="zc-ok">${esc(T("Copia los importes de las dos nóminas y aquí verás la diferencia de cada línea."))}</div>`; return; }
    const cab = `<tr class="nom-cab"><td>${esc(n1)}</td><td>${esc(n2)}</td><td>${esc(T("Diferencia"))}</td></tr>`;
    const fila = (n, x, y, d, cls, quita) => `<tr class="nom-nombre${cls ? " " + cls : ""}"><td colspan="3">${esc(n)}</td></tr><tr class="nom-cifras${cls ? " " + cls : ""}"><td>${esc(eur(x))}</td><td>${esc(eur(y))}</td><td class="${Math.abs(d) < 0.005 ? "" : (d > 0) !== !!quita ? "nom-mas" : "nom-menos"}">${esc(difTxt(d))}</td></tr>`;
    let h = `<div class="panel zc-caja zc-resultado"><div class="nom-scroll"><table class="zc-tabla nom-tabla">${cab}`;
    for (const t of ["d", "q"]) {
      const fs = r.filas.filter(f => f.t === t); if (!fs.length) continue;
      h += `<tr class="zc-sec"><td colspan="3">${esc(T(SEC[t]))}</td></tr>` + fs.map(f => fila(T(f.n), f.a, f.b, f.dif, "", t === "q")).join("");
    }
    h += fila(T("Total devengado"), r.ta.d, r.tb.d, r.tb.d - r.ta.d, "nom-tot") + fila(T("Total a deducir"), r.ta.q, r.tb.q, r.tb.q - r.ta.q, "nom-tot", true);
    h += `</table></div>`;
    const dl = r.tb.l - r.ta.l;
    h += `<div class="zc-total"><span>${esc(T("Líquido a percibir"))}</span><span>${esc(eur(r.ta.l))} → ${esc(eur(r.tb.l))}</span></div></div>`;
    // Lo que más ha cambiado, en frases
    const cambios = r.filas.filter(f => Math.abs(f.dif) >= 0.005).sort((x, y) => Math.abs(y.dif) - Math.abs(x.dif)).slice(0, 4);
    let frases = Math.abs(dl) < 0.005 ? [T("En las dos te llega lo mismo al banco.")]
      : [TH("En «{b}» te llega al banco **{d} {m}** que en «{a}».", { a: n1, b: n2, d: eur(Math.abs(dl)), m: dl > 0 ? T("más") : T("menos") })];
    frases = frases.map(x => x.includes("<b>") ? x : esc(x));
    cambios.forEach(f => {
      const sube = f.dif > 0, cobro = f.t === "d";
      frases.push(TH(cobro ? (sube ? "**{n}:** cobras {d} más." : "**{n}:** cobras {d} menos.") : (sube ? "**{n}:** te quitan {d} más." : "**{n}:** te quitan {d} menos."), { n: T(f.n), d: eur(Math.abs(f.dif)) }));
    });
    if (r.filas.some(f => f.k === "irpf" && Math.abs(f.dif) >= 0.005)) frases.push(esc(T("Si el IRPF ha cambiado sin que cambie tu sueldo, puede que la empresa haya ajustado el porcentaje. Lo de más o de menos se arregla en la renta.")));
    const bruto = r.tb.d - r.ta.d;
    if (Math.abs(bruto) >= 0.005 && Math.sign(bruto) !== Math.sign(dl) && Math.abs(dl) >= 0.005) frases.push(esc(T("Ojo: has cobrado más en bruto pero te llega menos (o al revés). Mira los descuentos.")));
    h += `<div class="zc-aviso nom-resumen"><ul>${frases.map(x => `<li>${x}</li>`).join("")}</ul></div>`;
    out.innerHTML = h;
  }
  ["nom-n1", "nom-n2"].forEach(i => $(i).addEventListener("input", () => { ponNombres(); calcDos(); }));
  $("nom-filas").addEventListener("input", calcDos);
  ponNombres(); calcDos();

  // ---------- 2. Con el convenio ----------
  const TAB = CONVENIO_GIRONA.TAB, sc = $("nc-cat");
  sc.innerHTML = Object.keys(TAB).map(k => `<option value="${esc(k)}">${esc(TAB[k][0])}</option>`).join("");
  sc.value = "c";
  function calcConv() {
    const pro = $("nc-pro").checked; $("nc-pro-caja").hidden = !pro;
    const m = NOMINA.minimos(sc.value, +$("nc-yr").value, num($("nc-ant").value));
    const tu = { base: num($("nc-base").value), plus: num($("nc-plus").value), antig: num($("nc-antig").value), prorrata: pro ? num($("nc-prorrata").value) : 0, hx: num($("nc-hx").value) };
    const lin = [["base", T("Salario base")], ["plus", T("Plus convenio")], ["antig", T("Antigüedad ({p} %)", { p: m.pct })]];
    if (pro) lin.push(["prorrata", T("Prorrata de pagas extra")]);
    lin.push(["hx", T("Hora extra (precio de cada hora)")]);
    const puestas = lin.filter(([k]) => tu[k] > 0 || (k === "antig" && $("nc-antig").value.trim() !== "" && m.antig === 0));
    if (!puestas.length) { $("nc-out").innerHTML = `<div class="zc-ok">${esc(T("Copia de tu nómina el salario base y el plus convenio, y te digo si llegan al mínimo del convenio."))}</div>`; return; }
    let h = `<div class="panel zc-caja zc-resultado"><div class="nom-scroll"><table class="zc-tabla nom-tabla"><tr class="nom-cab"><td>${esc(T("Tu nómina"))}</td><td>${esc(T("Convenio"))}</td><td></td></tr>`;
    const bajo = [];
    for (const [k, n] of puestas) {
      const d = tu[k] - m[k], mal = d < -0.005;
      if (mal) bajo.push([n, -d, k]);
      h += `<tr class="nom-nombre"><td colspan="3">${esc(n)}</td></tr><tr class="nom-cifras"><td>${esc(eur(tu[k]))}</td><td>${esc(eur(m[k]))}</td><td class="${mal ? "nom-menos" : "nom-mas"}">${esc(mal ? T("Falta {d}", { d: eur(-d) }) : T("Bien"))}</td></tr>`;
    }
    h += `</table></div></div>`;
    const faltan = lin.filter(([k]) => !puestas.some(p => p[0] === k) && k !== "hx").map(([, n]) => n);
    if (bajo.length) h += `<div class="zc-mal"><p>${TH("Hay **{n}** por debajo del mínimo del convenio:", { n: bajo.length === 1 ? T("una línea") : T("{n} líneas", { n: bajo.length }) })}</p><ul>${bajo.map(([n, d, k]) => `<li>${esc(k === "hx" ? T("{n}: {d} menos por cada hora extra.", { n, d: eur(d) }) : T("{n}: {d} menos al mes.", { n, d: eur(d) }))}</li>`).join("")}</ul><p>${esc(T("Puede haber un motivo (un mes con baja o con días sin sueldo, otra categoría…). Si no lo ves claro, habla con un delegado."))}</p></div>`;
    else h += `<div class="zc-ok">${esc(T("Lo que has puesto llega al mínimo del convenio de tu categoría. Bien."))}</div>`;
    if (faltan.length) h += `<div class="zc-aviso">${esc(T("No has puesto: {l}. Si sale en tu nómina, cópialo para compararlo.", { l: faltan.join(", ") }))}</div>`;
    if (!pro) h += `<div class="zc-aviso">${esc(T("Las pagas extra van aparte: el convenio marca 3 al año de {e} cada una (30 días de salario base, plus convenio y antigüedad).", { e: eur(m.base + m.plus + m.antig) }))}</div>`;
    $("nc-out").innerHTML = h;
  }
  ["nc-cat", "nc-yr", "nc-ant", "nc-base", "nc-plus", "nc-antig", "nc-pro", "nc-prorrata", "nc-hx"].forEach(i => { $(i).addEventListener("input", calcConv); $(i).addEventListener("change", calcConv); });
  calcConv();

  // ---------- 3. Qué es cada concepto ----------
  const sin = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const GRUPO = { d: "Lo que cobras", q: "Lo que te quitan", i: "Totales, bases y otras líneas" };
  function pintaLista() {
    const q = sin($("nom-q").value.trim());
    let h = "";
    for (const t of ["d", "q", "i"]) {
      const l = C.filter(c => c[2] === t && (!q || sin(T(c[1]) + " " + T(c[3])).includes(q)));
      if (l.length) h += `<h3 class="nom-sec">${esc(T(GRUPO[t]))}</h3>` + l.map(([, n, , ex]) => `<div class="panel zc-caja nom-concepto"><b>${esc(T(n))}</b><p>${esc(T(ex))}</p></div>`).join("");
    }
    $("nom-lista").innerHTML = h || `<div class="zc-aviso">${esc(T("No hay ningún concepto con esa palabra. Prueba con otra o pregunta a un delegado."))}</div>`;
  }
  $("nom-q").addEventListener("input", pintaLista);
  pintaLista();
  ponTab("dos");
})();
