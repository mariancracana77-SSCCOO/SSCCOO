// Comparadora de nóminas (Zona Conductores, petición n.º 74 del padre: «una comparadora de nóminas y explicación para
// todos los conceptos»). Tres partes: (1) dos nóminas tuyas una al lado de la otra, con la diferencia de cada línea;
// (2) tu nómina con los mínimos del convenio de Girona 2026-2027 (tablas de convenio-girona.js, las de «Mi finiquito» y
// «Mi hora ordinaria»); (3) qué es cada concepto, con buscador. Los descuentos (Seguridad Social, IRPF) no se calculan:
// cambian según la persona y el año, solo se comparan los que pone el conductor. Todo se calcula en el móvil: no se guarda
// nada (ni en el móvil) ni se envía. Lo prueba pruebas/nomina.cjs (window.NOMINA para las cuentas).
// Los textos van con T("..."): los traduce la función «traducir» (grupo «nomina», v219) con el selector de idioma.
const NOMINA = (function () {
  // [clave, nombre, d = lo cobras / q = te lo quitan / i = solo informativo (no suma), explicación]
  /* textos */
  const CONCEPTOS = [
    ["base", "Salario base", "d", "Lo fijo de tu categoría, según la tabla del convenio. Sobre él se calcula la antigüedad. Si un mes no trabajas todos los días (baja, días sin sueldo), baja en proporción."],
    ["plus", "Plus convenio", "d", "Complemento fijo que el convenio marca para cada categoría. Se cobra todos los meses y entra también en las pagas extra."],
    ["antig", "Antigüedad", "d", "Lo que cobras por los años en la empresa: un porcentaje del salario base que sube a los 4, 9, 14, 19 y 24 años (10, 20, 30, 40 y 50 %)."],
    ["hx", "Horas extra", "d", "Horas trabajadas por encima de tu jornada. El convenio marca el precio mínimo de cada hora para tu categoría: compruébalo en «Con el convenio» o en «Mi hora ordinaria»."],
    ["noct", "Nocturnidad", "d", "Plus por las horas trabajadas de noche. En la nómina sale cuántas horas (cuantía) y lo que se paga cada hora (precio). Va con la nómina de fin de mes, no con el cobro semanal. Si un mes no sale, ese mes no te han pagado horas de noche."],
    ["pluses", "Otros pluses", "d", "Pluses de puesto, de ADR, de disponibilidad, incentivos… El nombre exacto sale en tu nómina. Si cobras uno todos los meses por lo mismo, es un plus fijo."],
    ["prorrata", "Prorrata de pagas extra", "d", "Si no te pagan las pagas extra aparte, te pagan un trozo cada mes: es la prorrata. Por el convenio son 3 pagas al año de 30 días de salario base, plus convenio y antigüedad; prorrateadas, una cuarta parte de eso cada mes."],
    ["paga", "Paga extra", "d", "Si te pagan las pagas extra aparte, el mes que toca sale aquí. Por el convenio son 3 al año, cada una de 30 días de salario base, plus convenio y antigüedad."],
    ["dietas", "Dietas", "d", "Dinero para comer y dormir fuera cuando viajas por trabajo. Es una compensación de gastos, no sueldo: lleva un «-» delante (no salarial) y, dentro de unos límites que marca la ley, no cotiza ni paga IRPF. Si te las adelantan durante el mes, abajo sale el descuento del anticipo de dietas."],
    ["km", "Kilómetros", "d", "Lo que te pagan por los kilómetros recorridos, si tu empresa los paga así. Como las dietas, suele ir como compensación de gastos."],
    ["otrosd", "Otros cobros", "d", "Cualquier otra línea de lo que cobras que no esté arriba: festivos trabajados, cargas y descargas, atrasos…"],
    ["cc", "Contingencias comunes", "q", "Lo que pagas a la Seguridad Social para la jubilación, las bajas por enfermedad y otras prestaciones. Es el 4,70 % de tu base de cotización (el porcentaje sale al lado en la nómina)."],
    ["desempleo", "Desempleo", "q", "Lo que pagas para el paro: el 1,55 % de tu base de cotización si el contrato es indefinido (un poco más si es temporal)."],
    ["fp", "Formación profesional", "q", "El 0,10 % de tu base de cotización, para los cursos de formación de los trabajadores."],
    ["mei", "MEI", "q", "Mecanismo de Equidad Intergeneracional: un pequeño porcentaje extra que va a la hucha de las pensiones (en 2026, el 0,15 % de tu base de cotización). Sale en las nóminas desde 2023 y sube un poco cada año."],
    ["hxcot", "Cotización de horas extra", "q", "Las horas extra cotizan aparte a la Seguridad Social. Si este mes hiciste horas extra, puede salir esta línea."],
    ["irpf", "IRPF", "q", "Lo que la empresa retiene para Hacienda a cuenta de tu declaración de la renta. El porcentaje depende de lo que vas a cobrar en el año y de tu familia. Si cambia de un mes a otro, puede ser porque la empresa lo ha ajustado. Lo de más o de menos se arregla en la renta."],
    ["anticipo", "Anticipos", "q", "Dinero que la empresa te adelantó y ahora te descuenta. Si durante el mes te han ido pagando a cuenta el incentivo, la productividad o las dietas, la nómina pone arriba el importe entero del mes y abajo descuenta lo que ya te pagaron: así no lo cobras dos veces. Comprueba que lo que te descuentan es lo que te dieron."],
    ["otrosq", "Otros descuentos", "q", "Cualquier otra línea de lo que te quitan: cuota sindical, embargos, préstamos de la empresa…"],
    ["devengado", "Total devengado", "i", "Todo lo que cobras ese mes antes de descuentos (el bruto): la suma de las líneas de arriba de la nómina."],
    ["deducir", "Total a deducir", "i", "La suma de todo lo que te quitan: Seguridad Social, IRPF, anticipos y otros."],
    ["liquido", "Líquido a percibir", "i", "Lo que te llega al banco: el total devengado menos el total a deducir."],
    ["basecc", "Base de cotización por contingencias comunes", "i", "La cantidad sobre la que se calculan tus descuentos de Seguridad Social. Suele ser tu sueldo del mes con la parte de las pagas extra, sin dietas ni kilómetros (dentro de los límites de la ley). Es la que sirve para calcular la baja por enfermedad y la jubilación."],
    ["baseat", "Base de accidentes de trabajo y enfermedades profesionales", "i", "Como la anterior, pero sumando las horas extra. La paga la empresa y sirve para calcular lo que cobras si tienes un accidente de trabajo."],
    ["baseirpf", "Base sujeta a retención del IRPF", "i", "La parte de lo que cobras sobre la que se aplica el porcentaje del IRPF."],
    ["empresa", "Aportación de la empresa", "i", "Abajo de la nómina sale lo que la empresa paga a la Seguridad Social por ti, sobre tu base de cotización: contingencias comunes 23,60 %, MEI 0,75 %, accidentes de trabajo y enfermedades profesionales 6,70 %, desempleo 5,50 %, formación 0,60 % y FOGASA 0,20 %. No te lo quitan a ti: es informativo."]
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
  // v219 (permiso de Lorena, 26/11): textos traducibles con el selector «Idioma · Language» (zona-idioma.js, grupo «nomina» de la función «traducir»)
  const T0 = (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("nomina", "v-nomina", () => { ponNombres(); calcDos(); calcConv(); pintaLista(); pintaRev(); pintaGuardadas(); pintaBorraTodo(); }) : { T: T0, TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  // v225: con punto de miles siempre («3.097,77 €»; el formato de España no lo pone con 4 cifras)
  const eur = (n) => { const [e, d] = Math.abs(n).toFixed(2).split("."); return (n < 0 ? "-" : "") + e.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + d + "\u00a0€"; };
  // Lee números como los escribe la gente en España: «2100», «2.100», «2.100,50», «2100,5», «2100 €» (igual que baja.js)
  const num = (v) => { let t = String(v ?? "").replace(/[\s€]/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    const n = parseFloat(t); return Number.isFinite(n) && n > 0 ? n : 0; };
  const C = NOMINA.CONCEPTOS;
  const SEC = { /* textos */ d: "Lo que cobras", q: "Lo que te quitan" /* fin textos */ };

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
      a.setAttribute("aria-label", T(n) + ", " + n1); b.setAttribute("aria-label", T(n) + ", " + n2);
    });
  }
  const fuente = { a: null, b: null }; // la nómina leída de cada columna (bases y líneas con su nombre, para el informe)
  const difTxt = (d) => Math.abs(d) < 0.005 ? T("igual") : (d > 0 ? "+" : "−") + eur(Math.abs(d));
  // v225: informe como el que enseñó el padre: 1) lo que llega al banco, 2) los totales, 3) por qué cambia,
  // 4) concepto por concepto (con los nombres de la nómina si se leyeron las dos y no se corrigieron a mano)
  // y 5) en resumen. Las cabeceras: el nombre de cada nómina; si son iguales o faltan, «1.ª nómina» / «2.ª nómina».
  const llano = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, " ").trim();
  // Número con punto de miles también en 4 cifras («3.000», que toLocaleString deja «3000») y sin ceros de más
  const numero = (x, d = 2) => { const v = Math.abs(+x || 0), [e, dec] = v.toFixed(d).split("."); const fr = (dec || "").replace(/0+$/, ""); return (+x < 0 ? "-" : "") + e.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (fr ? "," + fr : ""); };
  const lista = (xs) => xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " " + T("y") + " " + xs[xs.length - 1];
  function calcDos() {
    const a = {}, b = {};
    $("nom-filas").querySelectorAll("input[data-nom]").forEach(i => { (i.dataset.nom === "a" ? a : b)[i.dataset.k] = num(i.value); });
    const r = NOMINA.compara(a, b), out = $("nom-out");
    let [n1, n2] = nombres();
    if (llano(n1) === llano(n2)) { n1 = T("1.ª nómina"); n2 = T("2.ª nómina"); }
    const hayA = r.ta.d || r.ta.q, hayB = r.tb.d || r.tb.q;
    if (!hayA || !hayB) { out.innerHTML = `<div class="zc-ok">${esc(T("Elige las dos nóminas arriba (o copia los importes a mano) y aquí verás qué ha cambiado."))}</div>`; return; }
    const claseDif = (d, quita) => Math.abs(d) < 0.005 ? "" : (d > 0) !== !!quita ? "nom-mas" : "nom-menos";
    const cab = (t) => `<tr class="nom-cab"><td>${esc(n1)}</td><td>${esc(n2)}</td><td>${esc(t || T("Diferencia"))}</td></tr>`;
    const fila = (n, x, y, d, cls, quita) => `<tr class="nom-nombre${cls ? " " + cls : ""}"><td colspan="3">${esc(n)}</td></tr><tr class="nom-cifras${cls ? " " + cls : ""}"><td>${x == null ? "—" : esc(eur(x))}</td><td>${y == null ? "—" : esc(eur(y))}</td><td class="${quita === null ? "" : claseDif(d, quita)}">${esc(difTxt(d))}</td></tr>`;
    const tabla = (filas, t) => `<div class="panel zc-caja zc-resultado nl-informe"><div class="nom-scroll"><table class="zc-tabla nom-tabla">${cab(t)}${filas}</table></div></div>`;
    const dl = r.tb.l - r.ta.l;
    // 1. Lo que te llega al banco
    let h = `<h3 class="nom-sec">${esc(T("1. Lo que te llega al banco"))}</h3>
      <div class="panel zc-caja nl-neto"><div class="nl-neto-dos"><div><span>${esc(n1)}</span><b>${esc(eur(r.ta.l))}</b></div><div><span>${esc(n2)}</span><b>${esc(eur(r.tb.l))}</b></div></div>
      <div class="nl-neto-dif"><span>${esc(T("Diferencia"))}</span><b class="${claseDif(dl)}">${esc(difTxt(dl))}${r.ta.l && Math.abs(dl) >= 0.005 ? `<small> (${dl > 0 ? "+" : "−"}${esc(String((Math.abs(dl) / r.ta.l * 100).toFixed(1)).replace(".", ","))} %)</small>` : ""}</b></div>
      <p>${Math.abs(dl) < 0.005 ? esc(T("En las dos te llega lo mismo al banco.")) : (dl > 0 ? TH("En «{b}» te llega **{d} más** que en «{a}».", { a: n1, b: n2, d: eur(Math.abs(dl)) }) : TH("En «{b}» te llega **{d} menos** que en «{a}».", { a: n1, b: n2, d: eur(Math.abs(dl)) }))}</p></div>`;
    // 2. Los totales
    const sum = (o, ks) => ks.reduce((t, k) => t + (o[k] || 0), 0), SS = ["cc", "desempleo", "fp", "mei", "hxcot"], PAGAS = ["paga", "prorrata"];
    const tot = [[T("Total devengado"), r.ta.d, r.tb.d], [T("Total a deducir"), r.ta.q, r.tb.q, true], [T("Líquido a percibir"), r.ta.l, r.tb.l],
      [T("Seguridad Social"), sum(a, SS), sum(b, SS), true], [T("IRPF"), a.irpf || 0, b.irpf || 0, true]];
    if (sum(a, PAGAS) || sum(b, PAGAS)) tot.push([T("Pagas extra y prorrata"), sum(a, PAGAS), sum(b, PAGAS)]);
    const base = (k) => fuente.a && fuente.b && fuente.a.valores[k] != null && fuente.b.valores[k] != null ? [fuente.a.valores[k], fuente.b.valores[k]] : null;
    if (base("basecc")) tot.push([T("Base de cotización"), ...base("basecc"), null]);
    if (base("baseirpf")) tot.push([T("Base del IRPF"), ...base("baseirpf"), null]);
    // v227: lo que paga la empresa por ti y lo que le cuestas (si las dos nóminas lo traen)
    const ex = (k) => fuente.a && fuente.b && fuente.a.extra && fuente.b.extra && fuente.a.extra[k] != null && fuente.b.extra[k] != null ? [fuente.a.extra[k], fuente.b.extra[k]] : null;
    if (base("empresa")) tot.push([T("Lo que paga la empresa a la Seguridad Social"), ...base("empresa"), null]);
    if (ex("coste")) tot.push([T("Coste empresa"), ...ex("coste"), null]);
    h += `<h3 class="nom-sec">${esc(T("2. Los totales"))}</h3>` + tabla(tot.map(([n, x, y, q]) => fila(n, x, y, y - x, "", q)).join(""));
    // Las líneas: con su nombre de la nómina (si se leyeron las dos sin corregir) o por grupos
    const conNombre = !!(fuente.a && fuente.b && !fuente.a.editada && !fuente.b.editada && fuente.a.detalle && fuente.a.detalle.length && fuente.b.detalle && fuente.b.detalle.length);
    let lin = [];
    if (conNombre) {
      const m = new Map();
      for (const [col, n] of [["a", fuente.a], ["b", fuente.b]]) for (const x of n.detalle) {
        const k = x.tipo + "|" + llano(x.texto);
        if (!m.has(k)) m.set(k, { n: x.texto, t: x.tipo, a: 0, b: 0 });
        m.get(k)[col] = Math.round((m.get(k)[col] + x.importe) * 100) / 100;
      }
      lin = [...m.values()];
    } else lin = r.filas.map(f => ({ n: T(f.n), t: f.t, a: f.a, b: f.b, k: f.k }));
    lin.forEach(x => { x.dif = x.b - x.a; x.efecto = x.t === "d" ? x.dif : -x.dif; });
    // 3. Por qué cambia
    if (Math.abs(dl) >= 0.005) {
      const ant = lin.filter(x => x.t === "q" && /anticip|bestreta/.test(llano(x.n)) && (x.a || x.b));
      const top = lin.filter(x => Math.abs(x.efecto) >= 0.005).sort((x, y) => Math.abs(y.efecto) - Math.abs(x.efecto)).slice(0, 4);
      let filas = top.map(x => fila(x.n, x.a, x.b, x.dif, "", x.t === "q")).join("");
      let frase;
      const pesa = (e) => Math.sign(e) === Math.sign(dl) && Math.abs(e) >= Math.abs(dl) * 0.7;
      if (ant.length >= 2) {
        const ta = ant.reduce((t, x) => t + x.a, 0), tb = ant.reduce((t, x) => t + x.b, 0);
        filas += fila(T("Total anticipos"), ta, tb, tb - ta, "nom-tot", true);
        if (pesa(ta - tb)) { filas = ant.map(x => fila(x.n, x.a, x.b, x.dif, "", true)).join("") + fila(T("Total anticipos"), ta, tb, tb - ta, "nom-tot", true); const va = { a: n1, b: n2, d: eur(Math.abs(tb - ta)) }; frase = tb > ta ? TH("En «{b}» te descuentan **{d} más en anticipos** que en «{a}». Esto explica casi toda la diferencia.", va) : TH("En «{b}» te descuentan **{d} menos en anticipos** que en «{a}». Esto explica casi toda la diferencia.", va); }
      }
      if (!frase && top.length) frase = pesa(top[0].efecto) ? TH("La diferencia más grande está en **{n}**: explica casi toda la diferencia.", { n: top[0].n })
        : TH("Lo que más pesa es **{n}**, pero hay varias cosas que cambian.", { n: top[0].n });
      h += `<h3 class="nom-sec">${esc(dl < 0 ? T("3. ¿Por qué te llega menos en «{b}»?", { b: n2 }) : T("3. ¿Por qué te llega más en «{b}»?", { b: n2 }))}</h3>`;
      if (frase) h += `<p class="nl-frase">${frase}</p>`;
      // Barras: lo que sube y lo que baja lo que te llega al banco (los anticipos, juntos)
      const efectos = lin.filter(x => !(ant.length >= 2 && ant.includes(x)) && Math.abs(x.efecto) >= 0.005).map(x => ({ n: x.n, e: x.efecto }));
      if (ant.length >= 2) { const e = ant.reduce((t, x) => t + x.efecto, 0); if (Math.abs(e) >= 0.005) efectos.push({ n: T("Anticipos (todos juntos)"), e }); }
      const barras = efectos.sort((x, y) => Math.abs(y.e) - Math.abs(x.e)).slice(0, 6), max = Math.max(...barras.map(x => Math.abs(x.e)), 0.01);
      if (barras.length) h += `<div class="panel zc-caja nl-barras"><p class="zc-pista">${esc(T("Cuánto sube o baja lo que te llega al banco por cada cosa:"))}</p><ul>${barras.map(x =>
        `<li><span class="nl-barra-n">${esc(x.n)}</span><span class="nl-barra-v ${x.e > 0 ? "nom-mas" : "nom-menos"}">${esc((x.e > 0 ? "+" : "−") + eur(Math.abs(x.e)))}</span><span class="nl-barra"><i class="${x.e > 0 ? "mas" : "menos"}" style="width:${Math.max(3, Math.round(Math.abs(x.e) / max * 100))}%"></i></span></li>`).join("")}</ul></div>`;
      if (ant.length >= 2) h += tabla(filas);
    }
    // 4. Concepto por concepto
    h += `<h3 class="nom-sec">${esc(T("4. Concepto por concepto"))}</h3>`;
    if (conNombre) h += `<p class="zc-pista">${esc(T("Con los nombres que trae tu nómina."))}</p>`;
    let todas = "";
    for (const t of ["d", "q"]) {
      const fs = lin.filter(x => x.t === t && (x.a || x.b)); if (!fs.length) continue;
      todas += `<tr class="zc-sec"><td colspan="3">${esc(T(SEC[t]))}</td></tr>` + fs.map(x => fila(x.n, x.a || null, x.b || null, x.dif, "", t === "q")).join("");
    }
    todas += fila(T("Total devengado"), r.ta.d, r.tb.d, r.tb.d - r.ta.d, "nom-tot") + fila(T("Total a deducir"), r.ta.q, r.tb.q, r.tb.q - r.ta.q, "nom-tot", true);
    h += tabla(todas).replace(/<\/div>$/, `<div class="zc-total"><span>${esc(T("Líquido a percibir"))}</span><span>${esc(eur(r.ta.l))} → ${esc(eur(r.tb.l))}</span></div></div>`);
    // 5. En resumen
    const frases = [], con = lin.filter(x => x.a || x.b);
    const iguales = con.filter(x => x.a && x.b && Math.abs(x.dif) < 0.005).map(x => x.n);
    if (iguales.length) frases.push(esc(T("No cambian: {l}.", { l: lista(iguales.slice(0, 6)) })));
    const soloA = con.filter(x => x.a && !x.b).map(x => `${x.n} (${eur(x.a)})`), soloB = con.filter(x => !x.a && x.b).map(x => `${x.n} (${eur(x.b)})`);
    if (soloA.length) frases.push(esc(T("Solo en «{a}»: {l}.", { a: n1, l: lista(soloA.slice(0, 4)) })));
    if (soloB.length) frases.push(esc(T("Solo en «{b}»: {l}.", { b: n2, l: lista(soloB.slice(0, 4)) })));
    con.filter(x => x.a && x.b && Math.abs(x.dif) >= 0.005 && !(x.t === "q" && /anticip|bestreta/.test(llano(x.n)))).sort((x, y) => Math.abs(y.dif) - Math.abs(x.dif)).slice(0, 3)
      .forEach(x => frases.push(TH("**{n}** pasa de {x} a {y}.", { n: x.n, x: eur(x.a), y: eur(x.b) })));
    const antB = con.filter(x => x.t === "q" && /anticip|bestreta/.test(llano(x.n)) && x.b).map(x => eur(x.b));
    if (antB.length) frases.push(esc(T("Comprueba que los anticipos que te descuentan en «{b}» ({l}) te los dieron de verdad.", { b: n2, l: lista(antB) })));
    if (Math.abs((b.irpf || 0) - (a.irpf || 0)) >= 0.005 && Math.abs(r.tb.d - r.ta.d) < 0.005) frases.push(esc(T("Si el IRPF ha cambiado sin que cambie tu sueldo, puede que la empresa haya ajustado el porcentaje. Lo de más o de menos se arregla en la renta.")));
    // v227: datos que ayudan a entender la nómina de Calsina (y cualquier otra que los traiga)
    const ss = (o) => sum(o, SS) + (o.irpf || 0);
    if (r.tb.d) frases.push(TH("En «{b}», de cada 100 € que cobras en bruto, **{p} €** se van en Seguridad Social e IRPF.", { b: n2, p: numero(ss(b) / r.tb.d * 100, 1) }));
    if (base("baseirpf") && base("baseirpf")[0] && base("baseirpf")[1]) {
      const [pa, pb] = base("baseirpf").map((x, i) => ((i ? b : a).irpf || 0) / x * 100);
      frases.push(Math.abs(pa - pb) >= 0.05 ? esc(T("El IRPF pasa del {x} % al {y} %.", { x: numero(pa, 2), y: numero(pb, 2) })) : esc(T("El IRPF es del {x} % en las dos.", { x: numero(pb, 2) })));
    }
    if (fuente.b && fuente.b.extra && fuente.b.extra.coste) frases.push(esc(T("En «{b}» le cuestas a la empresa {c} y a ti te llegan {l}.", { b: n2, c: eur(fuente.b.extra.coste), l: eur(r.tb.l) })));
    const linea = (n, re) => n && n.detalle ? n.detalle.find(x => re.test(llano(x.texto)) && x.cuantia) : null;
    const [kmA, kmB] = [fuente.a, fuente.b].map(n => linea(n, /incentiv/));
    if (kmA && kmB && kmA.precio && kmB.precio) frases.push(esc(T("Incentivo a la conducción: {k1} km a {p1} €/km en «{a}» y {k2} km a {p2} €/km en «{b}».", { a: n1, b: n2, k1: numero(kmA.cuantia), p1: numero(kmA.precio, 4), k2: numero(kmB.cuantia), p2: numero(kmB.precio, 4) })));
    const [nA, nB] = [fuente.a, fuente.b].map(n => linea(n, /noct/));
    if (nA && nB) frases.push(esc(T("Nocturnidad: {h1} horas en «{a}» y {h2} horas en «{b}».", { a: n1, b: n2, h1: numero(nA.cuantia), h2: numero(nB.cuantia) })));
    else if (fuente.a && fuente.b && (a.noct || b.noct) && !(a.noct && b.noct)) frases.push(esc(T("«{x}» no lleva nocturnidad.", { x: a.noct ? n2 : n1 })));
    const bruto = r.tb.d - r.ta.d;
    if (Math.abs(bruto) >= 0.005 && Math.sign(bruto) !== Math.sign(dl) && Math.abs(dl) >= 0.005) frases.push(bruto > 0 ? TH("Ojo: en «{b}» cobras **más en bruto** pero te llega **menos al banco**. Mira lo que te quitan.", { b: n2 }) : TH("En «{b}» cobras menos en bruto pero te llega más al banco: te quitan menos.", { b: n2 }));
    if (frases.length) h += `<h3 class="nom-sec">${esc(T("5. En resumen"))}</h3><div class="zc-aviso nom-resumen"><ul>${frases.map(x => `<li>${x}</li>`).join("")}</ul></div>`;
    h += `<div class="nl-botones nl-compartir"><button type="button" class="btn sec" id="nom-compartir">${esc(T("Compartir el informe"))}</button></div><p class="zc-pista">${esc(T("Por ejemplo, para enseñárselo a un delegado. Solo van los importes, sin tu nombre."))}</p>`;
    informeTxt = [T("Comparadora de nóminas"), `${n1}: ${eur(r.ta.l)} · ${n2}: ${eur(r.tb.l)} (${T("Diferencia")}: ${difTxt(dl)})`,
      ...frases.map(x => x.replace(/<[^>]+>/g, "").replace(/&laquo;|&raquo;/g, "")).map(x => "- " + x.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"))].join("\n");
    out.innerHTML = h;
  }
  let informeTxt = "";
  $("nom-out").addEventListener("click", (e) => { if (e.target.closest("#nom-compartir") && informeTxt && window.compartir) window.compartir(T("Comparadora de nóminas"), informeTxt); });
  ["nom-n1", "nom-n2"].forEach(i => $(i).addEventListener("input", () => { ponNombres(); calcDos(); }));
  $("nom-filas").addEventListener("input", (e) => { const c = e.target.dataset && e.target.dataset.nom; if (c) fuente[c] = null; calcDos(); });
  ponNombres(); calcDos();

  // ---------- 1b. Leer nóminas en PDF (v221, paso 2 del plan de la nómina; aprobado por Lorena el 26/11/2026) ----------
  // nomina-lector.js lee cada PDF en la memoria del móvil (pdf.js) y lo olvida. Antes de comparar sale «He leído esto»
  // por cada nómina: se puede cambiar todo y avisa si las sumas no cuadran. Nunca se usa nada sin que se marque.
  // GUARDAR (solo si se marca la casilla, por defecto no): en «ccoo-nominas» solo el mes y los importes, nunca nombre,
  // DNI, cuenta ni el archivo. Para no perder nada (norma del 13/11): antes de escribir se copia lo que había en
  // «ccoo-nominas-copia»; si «ccoo-nominas» no se puede leer, se usa la copia; otra ventana abierta se entera por el
  // evento «storage» y vuelve a pintar la lista. «Borrar todo» quita las dos claves.
  const L = typeof LECTOR_NOMINA !== "undefined" ? LECTOR_NOMINA : null;
  const CLAVE = "ccoo-nominas", COPIA = "ccoo-nominas-copia", MAX_GUARDADAS = 24;
  const CLAVES = C.map(c => c[0]);
  const limpia = (v) => { const o = {}; for (const k of CLAVES) { const n = +v?.[k]; if (Number.isFinite(n) && n >= 0 && n < 1e6) o[k] = Math.round(n * 100) / 100; } return o; };
  const valida = (x) => x && x.v === 1 && Array.isArray(x.lista) ? x.lista.filter(n => n && typeof n.id === "string").map(n => ({ id: n.id.slice(0, 20), mes: /^\d{4}-\d{2}$/.test(n.mes) ? n.mes : "", nombre: String(n.nombre || "").slice(0, 20), valores: limpia(n.valores) })) : null;
  function leeGuardadas() {
    for (const k of [CLAVE, COPIA]) { try { const t = localStorage.getItem(k); if (t == null) { if (k === CLAVE) continue; return []; } const l = valida(JSON.parse(t)); if (l) return l; } catch (_) {} }
    return [];
  }
  function guardaLista(lista) {
    try {
      const antes = localStorage.getItem(CLAVE);
      if (antes != null) localStorage.setItem(COPIA, antes);
      if (lista.length) localStorage.setItem(CLAVE, JSON.stringify({ v: 1, lista })); else { localStorage.removeItem(CLAVE); localStorage.removeItem(COPIA); }
      return true;
    } catch (_) { return false; }
  }
  const etiqueta = (n) => n.nombre || (L && n.mes ? L.nombreMes(n.mes, T) : T("Nómina"));
  // v224 (lo pidió el padre con una maqueta: «Nómina A» y «Nómina B», «así… foto o PDF»): dos tarjetas grandes, una por
  // nómina. En cada una se elige el archivo, se lee en el móvil y sale corto lo leído («He leído esto», editable dentro
  // de «Ver y corregir lo leído»). Al marcar «He leído esto y está bien» pasa a su columna y sale el informe abajo.
  // Las fotos aún no (sin OCR: necesitaría cambiar la CSP, lo decide Lorena).
  const SLOTS = ["a", "b"];
  let slot = { a: null, b: null }; // {id, mes, nombre, valores, sinReconocer, ok} | {error} | {leyendo: true}
  const turno = { a: 0, b: 0 };
  const $slots = $("nom-slots"), $guar = $("nom-guardadas");
  const formato = (n) => n == null ? "" : String(n.toFixed(2)).replace(".", ",");
  const AVISO_HTML = (a) => esc(T(a.t, a.v && { a: eur(a.v.a), b: eur(a.v.b) }));
  const RESUMEN = ["devengado", "deducir", "liquido", "irpf", "basecc"];
  // v227: además, lo que el lector comprobó al leer (cada cotización = base × %, base = remuneración + pagas extra),
  // mientras no se haya cambiado nada a mano
  const LECTURA_HTML = (a) => esc(a.v.n != null ? T(a.t, { n: a.v.n, b: eur(a.v.b), p: numero(a.v.p), c: eur(a.v.c), v: eur(a.v.v) }) : T(a.t, { a: eur(a.v.a), b: eur(a.v.b) }));
  const avisosHTML = (n) => { const av = L.revisa(n.valores, n.mes).map(AVISO_HTML).concat(!n.editada && n.lectura ? n.lectura.map(LECTURA_HTML) : []); return av.length ? `<div class="zc-aviso"><ul>${av.map(a => `<li>${a}</li>`).join("")}</ul></div>` : `<div class="zc-ok">${esc(T("Las sumas cuadran con los totales de la nómina."))}</div>`; };
  const elegir = (s, txt, prin) => `<label class="btn${prin ? "" : " sec"} nl-elegir"><input type="file" class="nl-file" data-file="${s}">${esc(txt)}</label>`;

  function pintaSlot(s) {
    const caja = $slots && $slots.querySelector(`[data-slot="${s}"]`); if (!caja) return;
    const n = slot[s], titulo = s === "a" ? T("1.ª nómina") : T("2.ª nómina");
    let h = `<h3>${esc(titulo)}${n && n.mes ? " · " + esc(L.nombreMes(n.mes, T)) : ""}</h3>`;
    if (!n) h += `<p class="zc-pista">${esc(T("PDF, Word, Excel u OpenOffice: la que te da la empresa. Se lee en tu móvil y no se envía."))}</p>${elegir(s, T("Elegir nómina"), true)}`;
    else if (n.leyendo) h += `<p class="nl-leyendo">${esc(T("Leyendo en tu móvil…"))}</p>`;
    else if (n.error) h += `<div class="zc-aviso">${esc(T(L.ERR[n.error]))}</div><div class="nl-botones">${elegir(s, T("Elegir otra"), true)}<button type="button" class="btn sec" data-quita="${s}">${esc(T("Quitar"))}</button></div>`;
    else {
      const campo = ([k, nom]) => `<label class="nl-campo"><span>${esc(T(nom))}</span><input type="text" inputmode="decimal" autocomplete="off" data-rev="${s}" data-k="${esc(k)}" value="${esc(formato(n.valores[k]))}"></label>`;
      const conValor = C.filter(c => n.valores[c[0]] != null), sinValor = C.filter(c => n.valores[c[0]] == null);
      const res = RESUMEN.filter(k => n.valores[k] != null).map(k => `<li><span>${esc(k === "basecc" ? T("Base de cotización") : T(C.find(c => c[0] === k)[1]))}</span><b>${esc(eur(n.valores[k]))}</b></li>`).join("");
      // v227: línea por línea (código, cuantía × precio), lo que paga la empresa y el coste empresa
      const tipoTxt = (t) => t === "d" ? T("cobro") : T("descuento");
      const det = (n.detalle || []).map(x => `<li><span>${x.codigo ? esc(x.codigo) + " · " : ""}${esc(x.texto)}${x.cuantia != null && x.precio != null ? ` <small>${["cc", "mei", "fp", "desempleo", "irpf"].includes(x.k) ? esc(numero(x.cuantia)) + " % × " + esc(eur(x.precio)) : esc(numero(x.cuantia)) + " × " + esc(numero(x.precio, 4))}</small>` : x.cuantia != null ? ` <small>${esc(numero(x.cuantia))}</small>` : ""}</span><b class="${x.tipo === "d" ? "nom-mas" : "nom-menos"}">${esc(eur(x.importe))} <small>${esc(tipoTxt(x.tipo))}</small></b></li>`).join("");
      const blq = (n.bloque || []).map(x => `<li><span>${esc(x.texto)}${x.base != null && x.tipo != null ? ` <small>${esc(eur(x.base))} × ${esc(numero(x.tipo))} %</small>` : ""}</span><b>${esc(eur(x.importe))}</b></li>`).join("");
      const ext = n.extra || {}, hayAnt = (n.detalle || []).some(x => x.k === "anticipo");
      const extras = [[T("Coste empresa"), ext.coste], [T("Remuneración total"), ext.remtotal], [T("Parte de las pagas extra"), ext.ppextras]].filter(([, v]) => v != null).map(([t, v]) => `<li><span>${esc(t)}</span><b>${esc(eur(v))}</b></li>`).join("");
      h += `${res ? `<ul class="nl-resumen">${res}${extras}</ul>` : ""}
        ${hayAnt ? `<p class="zc-pista">${esc(T("Las bestretas (anticipos) son lo que ya te pagaron a cuenta este mes: arriba sale el importe entero y abajo se descuenta lo que ya cobraste."))}</p>` : ""}
        ${det ? `<details class="nl-faltan nl-lineas"><summary>${esc(T("Línea por línea ({n})", { n: n.detalle.length }))}</summary><ul class="nl-resumen">${det}</ul></details>` : ""}
        ${blq ? `<details class="nl-faltan nl-lineas"><summary>${esc(T("Lo que paga la empresa por ti: {x}", { x: eur(n.bloque.reduce((t, x) => t + x.importe, 0)) }))}</summary><p class="zc-pista">${esc(T("No te lo quitan a ti: es lo que la empresa paga a la Seguridad Social por tu trabajo."))}</p><ul class="nl-resumen">${blq}</ul></details>` : ""}
        <div class="nl-avisos" data-avisos="${s}">${avisosHTML(n)}</div>
        <details class="nl-faltan"${n.ok ? "" : " open"}><summary>${esc(T("Ver y corregir lo leído"))}</summary>
          <p class="zc-pista">${esc(T("Esto es lo que he leído. Míralo con tu nómina delante y cambia lo que no esté bien."))}</p>
          <label class="nl-campo"><span>${esc(T("Nombre para compararla"))}</span><input type="text" maxlength="20" autocomplete="off" data-rev-nombre="${s}" value="${esc(n.nombre)}"></label>
          <div class="nl-campos">${conValor.map(campo).join("")}</div>
          ${sinValor.length ? `<details class="nl-faltan"><summary>${esc(T("Lo que no he encontrado ({n})", { n: sinValor.length }))}</summary><div class="nl-campos">${sinValor.map(campo).join("")}</div></details>` : ""}
          ${n.sinReconocer && n.sinReconocer.length ? `<div class="zc-aviso"><p>${esc(T("Líneas que no he reconocido:"))}</p><ul>${n.sinReconocer.map(x => `<li>${esc(x.texto)}: ${esc(eur(x.importe))} · ${esc(x.tipo === "d" ? T("la he sumado en «Otros cobros»") : x.tipo === "q" ? T("la he sumado en «Otros descuentos»") : T("no sé si es un cobro o un descuento: no la he contado"))}</li>`).join("")}</ul></div>` : ""}
        </details>
        <label class="check nl-visto"><input type="checkbox" data-slot-ok="${s}"${n.ok ? " checked" : ""}><span>${esc(T("He leído esto y está bien"))}</span></label>
        <div class="nl-botones">${elegir(s, T("Elegir otra"), false)}<button type="button" class="btn sec" data-quita="${s}">${esc(T("Quitar"))}</button></div>`;
    }
    caja.innerHTML = h;
    caja.classList.toggle("nl-ok", !!(n && n.ok));
  }
  function pintaGuardar() {
    const g = $("nom-guardar-caja"); if (!g) return;
    const hay = SLOTS.some(s => slot[s] && slot[s].ok);
    g.hidden = !hay;
    if (hay) g.innerHTML = `<button type="button" class="btn sec" id="nom-guardar">${esc(T("Guardar en este móvil para compararlas otro día"))}</button>
      <p class="zc-pista">${esc(T("Solo el mes y los importes. Nunca tu nombre, DNI, cuenta del banco ni el archivo."))}</p><p class="zc-pista" id="nom-guardar-msg" aria-live="polite"></p>`;
  }
  function pintaRev() { SLOTS.forEach(pintaSlot); pintaGuardar(); }
  // Pone una nómina en la columna a o b de la comparadora (o la vacía)
  function ponEn(col, n) {
    C.forEach(([k]) => { const inp = $(`nom-${col}-${k}`); if (inp) inp.value = n && n.valores[k] != null ? formato(n.valores[k]) : ""; });
    $(col === "a" ? "nom-n1" : "nom-n2").value = n ? etiqueta(n).slice(0, 20) : "";
    fuente[col] = n || null;
  }
  // La columna sigue a su tarjeta: marcada = sus importes; leída sin marcar o quitada = vacía
  function sincroniza(s, antes) {
    const n = slot[s];
    if (n && n.ok) ponEn(s, n); else if (antes || (n && !n.error && !n.leyendo)) ponEn(s, null);
    ponNombres(); calcDos();
  }
  function marca(s, si) {
    slot[s].ok = si; pintaSlot(s); pintaGuardar(); sincroniza(s, true);
    if (si && SLOTS.every(x => slot[x] && slot[x].ok)) $("nom-out").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (L && $slots) {
    $slots.addEventListener("change", async (e) => {
      const t = e.target;
      if (t.dataset.slotOk != null) { marca(t.dataset.slotOk, t.checked); return; }
      if (t.dataset.file == null) return;
      const s = t.dataset.file, f = (t.files || [])[0]; t.value = "";
      if (!f) return;
      const yo = ++turno[s], antes = slot[s] && slot[s].ok;
      slot[s] = { leyendo: true }; pintaSlot(s); pintaGuardar();
      if (antes) sincroniza(s, true);
      const r = await L.leeArchivo(f);
      if (yo !== turno[s]) return;
      slot[s] = r.error ? { error: r.error } : { id: Date.now().toString(36) + s, mes: r.mes || "", nombre: r.mes ? L.nombreMes(r.mes, T).slice(0, 20) : "", valores: limpia(r.valores), sinReconocer: r.sinReconocer, detalle: r.detalle || [], bloque: r.bloque || [], lectura: r.lectura || [],
        extra: { remtotal: r.valores.remtotal ?? null, ppextras: r.valores.ppextras ?? null, coste: r.valores.coste ?? null }, ok: false };
      if (slot[s].valores) slot[s].leido = Object.assign({}, slot[s].valores);
      pintaSlot(s); pintaGuardar();
      $slots.querySelector(`[data-slot="${s}"]`).scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $slots.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.rev != null) {
        const s = t.dataset.rev, n = slot[s], v = num(t.value);
        if (String(t.value).trim() === "") delete n.valores[t.dataset.k]; else n.valores[t.dataset.k] = v;
        // si queda distinto de lo leído, las líneas con su nombre ya no cuadran: el informe usa los grupos
        n.editada = !!n.leido && CLAVES.some(k => (n.valores[k] ?? null) !== (n.leido[k] ?? null));
        const caja = $slots.querySelector(`[data-avisos="${s}"]`); if (caja) caja.innerHTML = avisosHTML(n);
        if (n.ok) { n.ok = false; const ck = $slots.querySelector(`[data-slot-ok="${s}"]`); if (ck) ck.checked = false; $slots.querySelector(`[data-slot="${s}"]`).classList.remove("nl-ok"); pintaGuardar(); sincroniza(s, true); }
      } else if (t.dataset.revNombre != null) { const n = slot[t.dataset.revNombre]; n.nombre = t.value.trim().slice(0, 20); if (n.ok) sincroniza(t.dataset.revNombre); }
    });
    $slots.addEventListener("click", (e) => {
      const b = e.target.closest("[data-quita]"); if (!b) return;
      const s = b.dataset.quita; turno[s]++; slot[s] = null; pintaSlot(s); pintaGuardar(); sincroniza(s, true);
    });
    $("nom-guardar-caja")?.addEventListener("click", (e) => {
      if (e.target.closest("#nom-guardar") == null) return;
      let lista = leeGuardadas();
      for (const s of SLOTS) {
        const n = slot[s]; if (!n || !n.ok) continue;
        lista = lista.filter(x => x.id !== n.id && !(x.mes && x.mes === n.mes && x.valores.liquido === n.valores.liquido));
        lista.push({ id: n.id, mes: n.mes, nombre: n.nombre, valores: limpia(n.valores) });
      }
      lista.sort((a, b) => (a.mes || "").localeCompare(b.mes || "")); lista = lista.slice(-MAX_GUARDADAS);
      $("nom-guardar-msg").textContent = guardaLista(lista) ? T("Guardadas en este móvil.") : T("No se ha podido guardar en este móvil (puede que esté en modo privado).");
      pintaGuardadas();
    });
  }

  // Lo guardado en este móvil
  function pintaGuardadas() {
    const lista = leeGuardadas();
    if (!lista.length) { $guar.innerHTML = ""; return; }
    $guar.innerHTML = `<details class="panel nl-guardadas"><summary>${esc(T("Guardadas en este móvil ({n})", { n: lista.length }))}</summary>
      <p class="zc-pista">${esc(T("Solo el mes y los importes. Nadie más las ve: están en este móvil y no se envían."))}</p>
      <ul class="nl-lista">${lista.map(n => `<li><span><b>${esc(etiqueta(n))}</b>${n.valores.liquido != null ? " · " + esc(T("líquido {d}", { d: eur(n.valores.liquido) })) : ""}</span>
        <span class="nl-botones"><button type="button" class="btn sec" data-g-a="${esc(n.id)}">${esc(T("Como 1.ª"))}</button><button type="button" class="btn sec" data-g-b="${esc(n.id)}">${esc(T("Como 2.ª"))}</button><button type="button" class="btn sec" data-g-quita="${esc(n.id)}" aria-label="${esc(T("Quitar {n}", { n: etiqueta(n) }))}">${esc(T("Quitar"))}</button></span></li>`).join("")}</ul>
      <div class="nl-borrar"><button type="button" class="btn sec" id="nom-g-borrar">${esc(T("Borrar todo lo guardado"))}</button>
      <div id="nom-g-confirma" hidden><p>${esc(T("¿Seguro? Se borran todas las nóminas guardadas en este móvil."))}</p><div class="nl-botones"><button type="button" class="btn" id="nom-g-si">${esc(T("Sí, borrar todo"))}</button><button type="button" class="btn sec" id="nom-g-no">${esc(T("No"))}</button></div></div></div>
    </details>`;
  }
  $guar.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const lista = leeGuardadas(), id = b.dataset.gA || b.dataset.gB || b.dataset.gQuita;
    if (b.dataset.gA || b.dataset.gB) {
      const n = lista.find(x => x.id === id); if (!n) return;
      const s = b.dataset.gA ? "a" : "b"; turno[s]++;
      slot[s] = { id: n.id, mes: n.mes, nombre: n.nombre, valores: Object.assign({}, n.valores), sinReconocer: [], ok: true };
      pintaSlot(s); pintaGuardar(); sincroniza(s, true);
      $slots.querySelector(`[data-slot="${s}"]`).scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (b.dataset.gQuita) { guardaLista(lista.filter(x => x.id !== id)); pintaGuardadas(); const d = $guar.querySelector("details"); if (d) d.open = true; return; }
    if (b.id === "nom-g-borrar") { $("nom-g-confirma").hidden = false; b.hidden = true; return; }
    if (b.id === "nom-g-no") { $("nom-g-confirma").hidden = true; $("nom-g-borrar").hidden = false; return; }
    if (b.id === "nom-g-si") { try { localStorage.removeItem(CLAVE); localStorage.removeItem(COPIA); } catch (_) {} pintaGuardadas(); }
  });
  addEventListener("storage", (e) => { if (e.key === CLAVE || e.key === null) pintaGuardadas(); });
  pintaRev(); pintaGuardadas();

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
  const GRUPO = { /* textos */ d: "Lo que cobras", q: "Lo que te quitan", i: "Totales, bases y otras líneas" /* fin textos */ };
  // v226 (lo pidió el padre por el Coordinador, 27/11/2026): tarjetas que solo explican (no son casillas de la
  // comparadora) y, en cada tarjeta, cómo sale en la nómina de Calsina, de dónde sale y lo que falta comprobar.
  // [detrás de qué clave va, clave, nombre, grupo, explicación, fuente o "", sin comprobar o ""]
  const SOLO_EXPLICA = [ /* textos */
    ["noct", "incentivo", "Incentivo a la conducción", "d", "Paga el tiempo de más que trabajas conduciendo: lo que pasa o puede pasar de la jornada anual máxima del convenio de Girona. Se calcula con una cantidad por cada kilómetro recorrido, pero eso es solo la forma de calcularlo. En la nómina sale como «Incentivo a la conducción», con los kilómetros (cuantía) y lo que vale cada kilómetro (precio). Lleva un «*» delante: es salarial.", "Acuerdo firmado aportado por el delegado (documento de la sección), punto segundo.", "Cuánto vale cada kilómetro no lo dice el texto del acuerdo: mira el precio en tu nómina."],
    ["incentivo", "productividad", "Productividad", "d", "Paga las operaciones de carga y descarga, los tiempos de espera y de estar a disposición en ellas, y lo que se alarguen esos tiempos. Se calcula con una cantidad por cada operación de carga y descarga. En la nómina sale como «Productividad». Lleva un «*» delante: es salarial.", "Acuerdo firmado aportado por el delegado (documento de la sección), punto tercero.", "Cuánto vale cada operación no lo dice el texto del acuerdo: mira el precio en tu nómina."],
    ["liquido", "remtotal", "Remuneración total", "i", "La suma de lo que cobras este mes que cuenta como sueldo (sin las dietas). Sumándole la parte de las pagas extra (P.P.EXTRAS) suele salir la base de cotización.", "", ""],
    ["empresa", "coste", "Coste empresa", "i", "Lo que le cuestas a la empresa ese mes: lo que cobras en bruto más lo que la empresa paga por ti a la Seguridad Social. No te lo quitan a ti: es informativo.", "", ""],
    ["coste", "leyenda", "Qué quieren decir «*» y «-»", "i", "Delante del nombre de cada concepto: «*» es un concepto salarial (es sueldo: cotiza y paga IRPF) y «-» es no salarial (como las dietas: compensa gastos y, dentro de los límites de la ley, no cotiza).", "", ""]
  /* fin textos */ ];
  // Cómo sale cada concepto en la nómina de Calsina (sin traducir: son las palabras de la nómina). También sirven para buscar.
  const EN_NOMINA = { base: "SALARIO BASE", plus: "PLUS CONVENIO", antig: "ANTIGÜEDAD", noct: "PLUS NOCTURNIDAD · NOCTURNITAT", incentivo: "INCENTIVO A LA CONDUCCION", productividad: "PRODUCTIVIDAD", dietas: "DIETES · DIETAS", prorrata: "P.P.EXTRAS", anticipo: "BESTRETA (INCENTIVO, PRODUCTIVIDAD, DIETES)", cc: "COTIZACION CONT.COMU", mei: "MEI", fp: "COTIZACION FORMACION", desempleo: "COTIZACION DESEMPLEO", irpf: "I.R.P.F.", devengado: "T. DEVENGADO", deducir: "T. A DEDUCIR", liquido: "LIQUIDO A PERCIBIR", basecc: "BASE S.S.", baseat: "BASE A.T. Y DES.", baseirpf: "BASE I.R.P.F.", remtotal: "REM. TOTAL", coste: "COSTE EMPRESA", empresa: "DETERMINACION DE LAS B. DE COTIZACION", leyenda: "* -" };
  const TODOS = (() => { const l = C.map(([k, n, t, ex]) => ({ k, n, t, ex, f: "", s: "" })); for (const [tras, k, n, t, ex, f, s] of SOLO_EXPLICA) { const i = l.findIndex(x => x.k === tras); l.splice(i < 0 ? l.length : i + 1, 0, { k, n, t, ex, f, s }); } return l; })();
  function pintaLista() {
    const q = sin($("nom-q").value.trim());
    let h = "";
    for (const t of ["d", "q", "i"]) {
      const l = TODOS.filter(c => c.t === t && (!q || sin(T(c.n) + " " + T(c.ex) + " " + (EN_NOMINA[c.k] || "")).includes(q)));
      if (l.length) h += `<h3 class="nom-sec">${esc(T(GRUPO[t]))}</h3>` + l.map(c => `<div class="panel zc-caja nom-concepto" data-k="${esc(c.k)}"><b>${esc(T(c.n))}</b>`
        + (EN_NOMINA[c.k] ? `<span class="nom-en">${esc(T("En tu nómina:"))} <i>${esc(EN_NOMINA[c.k])}</i></span>` : "") + `<p>${esc(T(c.ex))}</p>`
        + (c.f ? `<p class="nom-fuente">${esc(T("Fuente:"))} ${esc(T(c.f))}</p>` : "") + (c.s ? `<p class="nom-sin">${esc(T("Sin comprobar:"))} ${esc(T(c.s))}</p>` : "") + `</div>`).join("");
    }
    $("nom-lista").innerHTML = h || `<div class="zc-aviso">${esc(T("No hay ningún concepto con esa palabra. Prueba con otra o pregunta a un delegado."))}</div>`;
  }
  $("nom-q").addEventListener("input", pintaLista);
  pintaLista();

  // ---------- Borrar todo (v222, lo pidió el padre por el Coordinador, 26/11/2026) ----------
  // Un botón bien visible arriba que deja la herramienta como recién abierta: lo leído, las casillas de las tres
  // pestañas, los resultados y lo guardado en este móvil («ccoo-nominas» y su copia). Es un borrado que pide la
  // persona, con confirmación en la propia página: por eso aquí no se guarda copia. Otra ventana abierta se entera
  // por el evento «storage» de arriba (pintaGuardadas).
  const $bt = $("nom-borra-todo");
  function pintaBorraTodo(msg) {
    const caja = $("nom-borra-todo"); if (!caja) return; // por id: el idioma puede llamarla antes de llegar aquí
    caja.innerHTML = `<button type="button" class="btn sec" id="nom-bt">${esc(T("Borrar todo"))}</button>
      <div id="nom-bt-confirma" class="panel nl-bt-confirma" hidden><p>${esc(T("¿Borrar todo? Se borran las nóminas leídas, lo que has escrito en las casillas, los resultados y las nóminas guardadas en este móvil. No se puede deshacer."))}</p>
      <div class="nl-botones"><button type="button" class="btn" id="nom-bt-si">${esc(T("Sí, borrar todo"))}</button><button type="button" class="btn sec" id="nom-bt-no">${esc(T("No"))}</button></div></div>
      <p class="zc-ok nl-bt-msg" id="nom-bt-msg" aria-live="polite"${msg ? "" : " hidden"}>${msg ? esc(T("Todo borrado")) : ""}</p>`;
  }
  function borraTodo() {
    SLOTS.forEach(x => { turno[x]++; slot[x] = null; }); pintaRev();
    $("nom-n1").value = ""; $("nom-n2").value = "";
    $("nom-filas").querySelectorAll("input").forEach(i => { i.value = ""; });
    sc.value = "c"; $("nc-yr").value = "1"; $("nc-ant").value = "0"; $("nc-pro").checked = false;
    ["nc-base", "nc-plus", "nc-antig", "nc-prorrata", "nc-hx"].forEach(i => { $(i).value = ""; });
    $("nom-q").value = "";
    try { localStorage.removeItem(CLAVE); localStorage.removeItem(COPIA); } catch (_) {}
    ponNombres(); calcDos(); calcConv(); pintaLista(); pintaGuardadas(); ponTab("dos");
    pintaBorraTodo(true);
    $("nom-bt")?.focus();
  }
  if ($bt) $bt.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "nom-bt") { $("nom-bt-confirma").hidden = false; b.hidden = true; $("nom-bt-msg").hidden = true; $("nom-bt-si").focus(); return; }
    if (b.id === "nom-bt-no") { pintaBorraTodo(); $("nom-bt")?.focus(); return; }
    if (b.id === "nom-bt-si") borraTodo();
  });
  pintaBorraTodo();
  ponTab("dos");
})();
