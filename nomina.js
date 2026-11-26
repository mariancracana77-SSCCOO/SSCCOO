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
  // v219 (permiso de Lorena, 26/11): textos traducibles con el selector «Idioma · Language» (zona-idioma.js, grupo «nomina» de la función «traducir»)
  const T0 = (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("nomina", "v-nomina", () => { ponNombres(); calcDos(); calcConv(); pintaLista(); pintaRev(); pintaGuardadas(); pintaBorraTodo(); }) : { T: T0, TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
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
  const baseCol = { a: null, b: null }; // base de cotización de la nómina leída de cada columna (para el informe)
  const difTxt = (d) => Math.abs(d) < 0.005 ? T("igual") : (d > 0 ? "+" : "−") + eur(Math.abs(d));
  function calcDos() {
    const a = {}, b = {};
    $("nom-filas").querySelectorAll("input[data-nom]").forEach(i => { (i.dataset.nom === "a" ? a : b)[i.dataset.k] = num(i.value); });
    const r = NOMINA.compara(a, b), [n1, n2] = nombres(), out = $("nom-out");
    const hayA = r.ta.d || r.ta.q, hayB = r.tb.d || r.tb.q;
    if (!hayA || !hayB) { out.innerHTML = `<div class="zc-ok">${esc(T("Elige las dos nóminas arriba (o copia los importes a mano) y aquí verás qué ha cambiado."))}</div>`; return; }
    const cab = `<tr class="nom-cab"><td>${esc(n1)}</td><td>${esc(n2)}</td><td>${esc(T("Diferencia"))}</td></tr>`;
    const fila = (n, x, y, d, cls, quita) => `<tr class="nom-nombre${cls ? " " + cls : ""}"><td colspan="3">${esc(n)}</td></tr><tr class="nom-cifras${cls ? " " + cls : ""}"><td>${esc(eur(x))}</td><td>${esc(eur(y))}</td><td class="${Math.abs(d) < 0.005 ? "" : (d > 0) !== !!quita ? "nom-mas" : "nom-menos"}">${esc(difTxt(d))}</td></tr>`;
    // v224: resumen arriba (lo que pedía la maqueta del padre): bruto, neto, IRPF, Seguridad Social, pagas y base
    const sum = (o, ks) => ks.reduce((t, k) => t + (o[k] || 0), 0), SS = ["cc", "desempleo", "fp", "mei", "hxcot"], PAGAS = ["paga", "prorrata"];
    const res = [[T("Sueldo bruto (total devengado)"), r.ta.d, r.tb.d], [T("Te llega al banco"), r.ta.l, r.tb.l], [T("IRPF"), a.irpf || 0, b.irpf || 0, true], [T("Seguridad Social"), sum(a, SS), sum(b, SS), true]];
    if (sum(a, PAGAS) || sum(b, PAGAS)) res.push([T("Pagas extra y prorrata"), sum(a, PAGAS), sum(b, PAGAS)]);
    if (baseCol.a != null && baseCol.b != null) res.push([T("Base de cotización"), baseCol.a, baseCol.b, null]);
    let h = `<h3 class="nom-sec">${esc(T("Resumen"))}</h3><div class="panel zc-caja zc-resultado nl-informe"><div class="nom-scroll"><table class="zc-tabla nom-tabla">${cab}`;
    h += res.map(([n, x, y, quita]) => quita === null ? `<tr class="nom-nombre"><td colspan="3">${esc(n)}</td></tr><tr class="nom-cifras"><td>${esc(eur(x))}</td><td>${esc(eur(y))}</td><td>${esc(difTxt(y - x))}</td></tr>` : fila(n, x, y, y - x, "", quita)).join("");
    h += `</table></div></div><h3 class="nom-sec">${esc(T("Línea por línea"))}</h3>`;
    h += `<div class="panel zc-caja zc-resultado"><div class="nom-scroll"><table class="zc-tabla nom-tabla">${cab}`;
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
  $("nom-filas").addEventListener("input", (e) => { const c = e.target.dataset && e.target.dataset.nom; if (c) baseCol[c] = null; calcDos(); });
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
  const avisosHTML = (n) => { const av = L.revisa(n.valores, n.mes); return av.length ? `<div class="zc-aviso"><ul>${av.map(a => `<li>${AVISO_HTML(a)}</li>`).join("")}</ul></div>` : `<div class="zc-ok">${esc(T("Las sumas cuadran con los totales de la nómina."))}</div>`; };
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
      h += `${res ? `<ul class="nl-resumen">${res}</ul>` : ""}
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
    baseCol[col] = n && n.valores.basecc != null ? n.valores.basecc : null;
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
      slot[s] = r.error ? { error: r.error } : { id: Date.now().toString(36) + s, mes: r.mes || "", nombre: r.mes ? L.nombreMes(r.mes, T).slice(0, 20) : "", valores: limpia(r.valores), sinReconocer: r.sinReconocer, ok: false };
      pintaSlot(s); pintaGuardar();
      $slots.querySelector(`[data-slot="${s}"]`).scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $slots.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.rev != null) {
        const s = t.dataset.rev, n = slot[s], v = num(t.value);
        if (String(t.value).trim() === "") delete n.valores[t.dataset.k]; else n.valores[t.dataset.k] = v;
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
