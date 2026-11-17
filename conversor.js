// Conversor rápido (Zona Conductores, v186; herramienta del padre que pasó Lorena con la petición n.º 55). Es su
// «Conversor rápido» con las mismas 9 conversiones, factores, valores habituales y notas. Aquí solo cambia la forma:
// sin <script> en línea ni oninput (CSP), textos con esc() y T("...") (zona-idioma.js: la función «traducir», grupo
// «conversor», saca de aquí los textos), sin emojis (el botón de cambiar lleva un icono) y los colores de Zona
// Conductores. Cuentas sin pantalla en «ConversorCuentas» (las prueba pruebas/sobresale.cjs).
// Guarda solo la conversión elegida en localStorage «ccoo-conversor» {c}.
(function () {
  /* textos */
  const C = [
    { id: "presion", n: "Presión", a: "bar", b: "PSI", k: 14.5037738, q: [6, 7, 8, 9, 10], nt: "1 bar es casi igual a 1 kg/cm². Un neumático de camión suele llevar entre 7 y 9 bar." },
    { id: "distancia", n: "Distancia", a: "kilómetros", b: "millas", k: 1 / 1.609344, q: [50, 100, 200, 500] },
    { id: "velocidad", n: "Velocidad", a: "km/h", b: "mph", k: 1 / 1.609344, q: [50, 80, 90, 100] },
    { id: "peso", n: "Peso", a: "kilos", b: "libras", k: 1 / 0.45359237, q: [25, 100, 500, 1000] },
    { id: "galuk", n: "Litros / gal. UK", a: "litros", b: "galones UK", k: 1 / 4.54609, q: [10, 50, 100, 500], nt: "Galón del Reino Unido (imperial)." },
    { id: "galus", n: "Litros / gal. US", a: "litros", b: "galones US", k: 1 / 3.785411784, q: [10, 50, 100, 500], nt: "Galón de Estados Unidos. Es más pequeño que el del Reino Unido." },
    { id: "temp", n: "Temperatura", a: "°C", b: "°F", temp: true, q: [-18, 0, 4, 20, 35] },
    { id: "pies", n: "Metros / pies", a: "metros", b: "pies", k: 1 / 0.3048, q: [2.5, 4, 13.6, 16.5] },
    { id: "pulgadas", n: "Cm / pulgadas", a: "centímetros", b: "pulgadas", k: 1 / 2.54, q: [10, 22.5, 60, 120], nt: "Las llantas de camión suelen ser de 22,5 pulgadas." },
  ];
  /* fin textos */
  // De la unidad de arriba (a) a la de abajo (b) y al revés
  const aB = (c, x) => c.temp ? x * 9 / 5 + 32 : x * c.k;
  const bA = (c, x) => c.temp ? (x - 32) * 5 / 9 : x / c.k;
  // Acepta coma o punto; «1.000» con punto de miles no se usa en el conversor (se lee como 1)
  const lee = (s) => { const t = String(s ?? "").trim().replace(/\s/g, "").replace(",", "."); if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return null; const x = parseFloat(t); return isFinite(x) ? x : null; };
  function formato(x) {
    if (x === null || !isFinite(x)) return "";
    let r = Math.abs(x) >= 1000 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100;
    if (Object.is(r, -0)) r = 0;
    return r.toLocaleString("es-ES", { maximumFractionDigits: 2, useGrouping: false });
  }
  window.ConversorCuentas = { C, aB, bA, lee, formato };

  const $ = (i) => document.getElementById(i);
  if (!$("v-conversor")) return;
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("conversor", "v-conversor", () => pinta(false)) : { T: (x) => x };
  const T = Z.T, KEY = "ccoo-conversor";
  let cur = 0, cambiado = false;
  try { const g = JSON.parse(localStorage.getItem(KEY) || "{}"); const i = C.findIndex(c => c.id === g.c); if (i >= 0) cur = i; } catch (e) { /* sin datos */ }
  const guarda = () => { try { localStorage.setItem(KEY, JSON.stringify({ c: C[cur].id })); } catch (e) { /* sin almacenamiento */ } };
  const num = (x) => String(x).replace(".", ",");

  function pinta(vacia) {
    const c = C[cur], arriba = cambiado ? c.b : c.a, abajo = cambiado ? c.a : c.b;
    $("cv-chips").innerHTML = C.map((x, i) => `<button type="button" class="zc-chip${i === cur ? " activa" : ""}" data-i="${i}" aria-pressed="${i === cur}">${esc(T(x.n))}</button>`).join("");
    $("cv-ua").textContent = T(arriba);
    $("cv-ub").textContent = T(abajo);
    $("cv-q").innerHTML = c.q.map(v => `<button type="button" data-v="${esc(String(v))}">${esc(T("{n} {u}", { n: num(v), u: T(c.a) }))}</button>`).join("");
    $("cv-nota").textContent = c.nt ? T(c.nt) : "";
    $("cv-nota").hidden = !c.nt;
    if (vacia) { $("cv-a").value = ""; $("cv-b").value = ""; }
  }
  // Escribir arriba cambia abajo y al revés
  function desdeA() { const c = C[cur], x = lee($("cv-a").value); $("cv-b").value = x === null ? "" : formato(cambiado ? bA(c, x) : aB(c, x)); }
  function desdeB() { const c = C[cur], x = lee($("cv-b").value); $("cv-a").value = x === null ? "" : formato(cambiado ? aB(c, x) : bA(c, x)); }
  $("cv-a").addEventListener("input", desdeA);
  $("cv-b").addEventListener("input", desdeB);
  $("cv-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (!b) return;
    cur = +b.dataset.i; cambiado = false; guarda(); pinta(true);
  });
  $("cv-q").addEventListener("click", (e) => {
    const b = e.target.closest("[data-v]");
    if (!b) return;
    const v = num(b.dataset.v);
    // Los valores habituales son de la unidad «a» (bar, km…): van al cuadro donde esté esa unidad
    if (cambiado) { $("cv-b").value = v; desdeB(); } else { $("cv-a").value = v; desdeA(); }
  });
  $("cv-cambia").addEventListener("click", () => {
    const a = $("cv-a").value, b = $("cv-b").value;
    cambiado = !cambiado; pinta(false);
    $("cv-a").value = b; $("cv-b").value = a;
  });
  pinta(true);
})();
