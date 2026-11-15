// Mi hora ordinaria (Zona Conductores, petición n.º 43). Es la calculadora del padre «Mi hora ordinaria · Convenio de
// Girona 2026-2027» pasada tal cual: las cuentas y los textos son los suyos. Las tablas de sueldos y la antigüedad
// salen de convenio-girona.js, las mismas que usa «Mi finiquito». Aquí solo cambia la forma: sin <script> en línea
// ni oninput (CSP), textos con esc() y los colores de Zona Conductores. No se guarda nada en el móvil.
(function () {
  const $ = (i) => document.getElementById(i);
  if (!$("v-hora") || typeof CONVENIO_GIRONA === "undefined") return;
  const TAB = CONVENIO_GIRONA.TAB;
  // v177 (petición n.º 45): textos traducibles con T("...") (zona-idioma.js; la función «traducir» los saca de este archivo)
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("hora", "v-hora", () => calc()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m), TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const s = $("ho-cat");
  s.innerHTML = Object.keys(TAB).map(k => `<option value="${esc(k)}">${esc(TAB[k][0])}</option>`).join(""); // los nombres los traduce zona-idioma.js (van entre /* textos */ en convenio-girona.js)
  s.value = "c";
  const fila = (t, sm, v, fuerte) => `<tr><td>${fuerte ? `<b>${esc(t)}</b>` : esc(t)}${sm ? `<small>${esc(sm)}</small>` : ""}</td><td>${esc(v)}</td></tr>`;
  function calc() {
    const yr = +$("ho-yr").value, t = TAB[s.value][yr], base = t[0], pc = t[1], hxc = t[2];
    const y = parseFloat($("ho-ant").value) || 0, pct = CONVENIO_GIRONA.pctAntiguedad(y);
    const ant = base * pct / 100, P = base + pc + ant, X = parseFloat($("ho-plus").value) || 0;
    const anual = 15 * P + 12 * X, h = parseFloat($("ho-hrs").value) || 0;
    $("ho-antinfo").textContent = T("Antigüedad: {p}% del salario base ({a} al mes). Sube a los 4, 9, 14, 19 y 24 años.", { p: pct, a: eur(ant) });
    if (!(h > 0)) { $("ho-out").innerHTML = ""; return; }
    const ho = anual / h, mes = h / 12;
    let out = `<div class="zc-grande"><small>${esc(T("Tu hora ordinaria"))}</small><strong>${esc(eur(ho))}</strong><small>${esc(T("brutos por hora"))}</small></div>`;
    out += `<div class="panel zc-caja"><table class="zc-tabla">` +
      fila(T("Salario base"), T("Tabla {a}", { a: yr === 1 ? 2026 : 2027 }), eur(base)) +
      fila(T("Plus convenio"), "", eur(pc)) +
      fila(T("Antigüedad ({p}%)", { p: pct }), "", eur(ant)) +
      (X ? fila(T("Otros pluses fijos"), "", eur(X)) : "") +
      fila(T("Paga extra"), T("30 días de base, plus convenio y antigüedad"), eur(P)) +
      fila(T("Total al año"), T("12 meses + 3 pagas extra"), eur(anual), true) +
      fila(T("Horas al mes de media"), "", mes.toFixed(1).replace(".", ",") + " h") +
      fila(T("Hora extra del convenio"), T("Según la tabla salarial"), eur(hxc)) + `</table></div>`;
    const mx = parseFloat($("ho-hx").value);
    if (mx > 0) {
      const d = mx - hxc;
      out += d < -0.005
        ? `<div class="zc-mal">${TH("Tu hora extra de nómina ({x}) está **{d} por debajo** de la tabla del convenio. Por cada 10 horas extra son unos {d10} menos. Habla con un delegado.", { x: eur(mx), d: eur(-d), d10: eur(-d * 10) })}</div>`
        : `<div class="zc-ok">${esc(T("Tu hora extra de nómina ({x}) es igual o mayor que la del convenio. Bien.", { x: eur(mx) }))}</div>`;
    } else out += `<div class="zc-aviso">${esc(T("Escribe lo que te pagan por hora extra en la nómina y te digo si coincide con la del convenio."))}</div>`;
    $("ho-out").innerHTML = out;
  }
  ["ho-cat", "ho-yr", "ho-ant", "ho-plus", "ho-hrs", "ho-hx"].forEach(i => { $(i).addEventListener("input", calc); $(i).addEventListener("change", calc); });
  calc();
})();
