// Gálibos y túneles (Zona Conductores > Utilidades en ruta, petición n.º 66 del padre, v196). Dos cosas:
// 1) «¿Quepo?»: tu altura total contra la altura máxima de la señal (R-205 en España). Pasa si no la superas; con
//    menos de 10 cm de margen avisa (nieve, asfalto nuevo, baches o una carga mal medida se comen ese margen).
// 2) Túneles y mercancías peligrosas: categoría del túnel (A a E, la letra del panel bajo la señal) y código de
//    restricción en túneles de la carga (el que va entre paréntesis en la carta de porte). Tabla del ADR 8.6.4.
// La lista de túneles concretos (con su altura y categoría) se añadirá con los datos que pase el padre: no se inventa.
// Cuentas sin pantalla en «GalibosCuentas» (las prueba pruebas/utilidades-v196.cjs). Sin nada en línea (CSP), textos
// con esc(). Solo en español. Guarda tu altura y el código de tu carga en «ccoo-galibos» {alto, cod}.
(function () {
  const MARGEN = 0.10; // m
  const num = (x) => { const n = parseFloat(String(x ?? "").replace(",", ".")); return isFinite(n) ? n : NaN; };
  // alto y senal en metros → {falta} | {mal} | {pasa, justo, margen}
  function cabe(alto, senal) {
    const a = num(alto), s = num(senal);
    if (!isFinite(a) || !isFinite(s)) return { falta: true };
    if (a <= 0 || s <= 0 || a > 6 || s > 10) return { mal: "Revisa los números: escribe la altura en metros, por ejemplo 4,00." };
    const margen = Math.round((s - a) * 100) / 100;
    return { pasa: margen >= 0, justo: margen >= 0 && margen < MARGEN, margen };
  }
  // Código de restricción en túneles de la carga → categorías por las que NO puede pasar (ADR 8.6.4).
  // c: con cisterna o a granel; k: más de la masa neta de explosivo que dice el código
  /* textos */
  const CODIGOS = [
    { id: "-", n: "(-) Sin restricción" },
    { id: "B", n: "(B)" },
    { id: "B1000C", n: "(B1000C)", pk: "¿Más de 1000 kg de masa neta de explosivo?" },
    { id: "B/D", n: "(B/D)", pc: "¿Va en cisterna?" },
    { id: "B/E", n: "(B/E)", pc: "¿Va en cisterna?" },
    { id: "C", n: "(C)" },
    { id: "C5000D", n: "(C5000D)", pk: "¿Más de 5000 kg de masa neta de explosivo?" },
    { id: "C/D", n: "(C/D)", pc: "¿Va en cisterna?" },
    { id: "C/E", n: "(C/E)", pc: "¿Va en cisterna?" },
    { id: "D", n: "(D)" },
    { id: "D/E", n: "(D/E)", pc: "¿Va en cisterna o a granel?" },
    { id: "E", n: "(E)" },
  ];
  const CATEGORIAS = [
    { id: "A", n: "Sin restricciones para mercancías peligrosas." },
    { id: "B", n: "Prohibidas las que pueden causar una explosión muy grande." },
    { id: "C", n: "Como B, y además las que pueden causar una explosión grande o una fuga tóxica grande." },
    { id: "D", n: "Como C, y además las que pueden causar un incendio grande." },
    { id: "E", n: "Prohibidas todas las mercancías peligrosas, salvo unas pocas (UN 2919, 3291, 3331, 3359 y 3373)." },
  ];
  /* fin textos */
  const ORDEN = "ABCDE";
  const desde = (l) => ORDEN.slice(ORDEN.indexOf(l)).split(""); // "C" → C, D, E
  function prohibidas(cod, cisterna, mucho) {
    switch (cod) {
      case "-": return [];
      case "B": return desde("B");
      case "B1000C": return desde(mucho ? "B" : "C");
      case "B/D": return desde(cisterna ? "B" : "D");
      case "B/E": return desde(cisterna ? "B" : "E");
      case "C": return desde("C");
      case "C5000D": return desde(mucho ? "C" : "D");
      case "C/D": return desde(cisterna ? "C" : "D");
      case "C/E": return desde(cisterna ? "C" : "E");
      case "D": return desde("D");
      case "D/E": return desde(cisterna ? "D" : "E");
      case "E": return ["E"];
      default: return null;
    }
  }
  const puedePasar = (cod, cat, cisterna, mucho) => { const p = prohibidas(cod, cisterna, mucho); return p ? !p.includes(cat) : null; };
  window.GalibosCuentas = { cabe, prohibidas, puedePasar, CODIGOS, CATEGORIAS, MARGEN };

  const $ = (i) => document.getElementById(i);
  if (!$("v-galibos")) return;
  const KEY = "ccoo-galibos";
  let g = {};
  try { g = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { /* sin datos */ }
  let cod = CODIGOS.some(x => x.id === g.cod) ? g.cod : "";
  if (g.alto) $("ga-alto").value = String(g.alto);
  const guarda = () => { try { localStorage.setItem(KEY, JSON.stringify({ alto: $("ga-alto").value.trim(), cod })); } catch (e) { /* sin almacenamiento */ } };
  const m = (x) => `${x.toFixed(2).replace(".", ",")} m`;

  function pintaCabe() {
    guarda();
    const r = cabe($("ga-alto").value, $("ga-senal").value);
    const o = $("ga-out");
    if (r.falta) { o.innerHTML = `<div class="zc-aviso">Escribe la altura de tu camión con la carga y la de la señal.</div>`; return; }
    if (r.mal) { o.innerHTML = `<div class="zc-mal">${esc(r.mal)}</div>`; return; }
    o.innerHTML = !r.pasa
      ? `<div class="zc-mal"><b>No pases.</b> Tu camión mide ${esc(m(-r.margen))} más de lo que permite la señal. Busca otro camino.</div>`
      : r.justo
        ? `<div class="zc-aviso"><b>Pasas muy justo: solo ${esc(String(Math.round(r.margen * 100)))} cm de margen.</b> Con nieve, asfalto nuevo, baches o una carga mal medida podrías tocar. Si puedes, busca otro camino.</div>`
        : `<div class="zc-ok"><b>Cabes.</b> Te sobran ${esc(m(r.margen))}.</div>`;
  }
  function pintaAdr() {
    guarda();
    $("ga-cod").innerHTML = CODIGOS.map(x => `<button type="button" class="zc-chip${x.id === cod ? " activa" : ""}" data-c="${esc(x.id)}" aria-pressed="${x.id === cod}" translate="no">${esc(x.n)}</button>`).join("");
    const c = CODIGOS.find(x => x.id === cod);
    const preg = c && (c.pc || c.pk);
    $("ga-pregunta").hidden = !preg;
    if (preg) $("ga-pregunta-t").textContent = preg;
    const o = $("ga-adr");
    if (!c) { o.innerHTML = `<div class="zc-aviso">Elige el código de tu carga. Lo tienes en la carta de porte, entre paréntesis al final de cada mercancía, por ejemplo (D/E).</div>`; return; }
    const si = $("ga-si").checked;
    const no = prohibidas(cod, c.pc ? si : false, c.pk ? si : false);
    o.innerHTML = `<ul class="ga-cats">${CATEGORIAS.map(k => {
      const ok = !no.includes(k.id);
      return `<li class="${ok ? "si" : "no"}"><span class="ga-letra" translate="no">${esc(k.id)}</span><span><b>${ok ? "Puedes pasar" : "No puedes pasar"}</b><small>${esc(k.n)}</small></span></li>`;
    }).join("")}</ul>`;
  }
  for (const id of ["ga-alto", "ga-senal"]) $(id).addEventListener("input", pintaCabe);
  $("ga-cod").addEventListener("click", (e) => {
    const b = e.target.closest("[data-c]");
    if (!b) return;
    cod = b.dataset.c;
    $("ga-si").checked = false;
    pintaAdr();
  });
  $("ga-si").addEventListener("change", pintaAdr);
  pintaCabe();
  pintaAdr();
})();
