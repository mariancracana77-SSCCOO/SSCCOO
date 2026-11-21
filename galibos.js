// Gálibos y túneles (Zona Conductores > Utilidades en ruta, petición n.º 66 del padre, v199).
// Lo primero es la INFORMACIÓN de cada túnel (altura, categoría ADR, velocidades, distancia, horarios, alternativa).
// Después, «¿Puedo pasar con mi carga?»: se elige una vez el código de restricción en túneles de la carta de porte
// (p. ej. (D/E)) y cada túnel dice SÍ / NO / CON CUIDADO. Abajo y plegado, la altura del camión (aviso si va justo).
// Los datos están en galibos-datos.js (window.GalibosDatos), cada uno con «Comprobado en…» o «Sin comprobar».
// Regla ADR (8.6.4): el código dice desde qué categoría está prohibido: B prohíbe B, C, D y E; C prohíbe C, D y E;
// D prohíbe D y E; E prohíbe E. Con barra, (D/E): la primera letra es para cisterna y la segunda para lo demás.
// Sin nada en línea (CSP), textos con esc(). Guarda solo {codigo, cisterna, alto} en «ccoo-galibos».
(function () {
  const ORDEN = "ABCDE";
  // Códigos que salen en la carta de porte. «mas»: códigos con cantidad (B1000C, C5000D): letra si se pasa del peso, si no la otra.
  const CODIGOS = [
    { v: "", t: "Elige tu código" },
    { v: "sin", t: "No llevo mercancías peligrosas" },
    { v: "panel", t: "Llevo ADR sin panel naranja (cantidades pequeñas)" },
    { v: "(D/E)", t: "(D/E) · gasoil, gasolina, muchos líquidos inflamables" },
    { v: "(E)", t: "(E)" },
    { v: "(D)", t: "(D)" },
    { v: "(C/E)", t: "(C/E)" },
    { v: "(C/D)", t: "(C/D)" },
    { v: "(C)", t: "(C)" },
    { v: "(C5000D)", t: "(C5000D)" },
    { v: "(B/E)", t: "(B/E)" },
    { v: "(B/D)", t: "(B/D)" },
    { v: "(B)", t: "(B)" },
    { v: "(B1000C)", t: "(B1000C)" },
    { v: "(-)", t: "(-) · sin restricción en túneles" }
  ];
  const CAT_TXT = {
    A: "Sin restricción para mercancías peligrosas.",
    B: "Prohibido lo que puede provocar una explosión muy grande.",
    C: "Prohibido lo de la B y además lo que puede provocar una explosión grande o una fuga tóxica grande.",
    D: "Prohibido lo de la C y además lo que puede provocar un incendio grande (por ejemplo, gasoil o gasolina en cisterna).",
    E: "Prohibidas casi todas las mercancías peligrosas con panel naranja.",
    tren: "No es un túnel de carretera: el camión va en tren. Tiene sus propias normas de mercancías peligrosas."
  };

  // Letra que manda para este viaje. mucho: true/false/null (pasa del peso del código con cantidad; null = no lo sé).
  function letra(cod, cisterna, mucho) {
    if (!cod || cod === "sin" || cod === "panel" || cod === "(-)") return { l: null };
    const m = /^\(([A-E])(?:(\d+)([A-E]))?(?:\/([A-E]))?\)$/.exec(cod);
    if (!m) return { l: null, raro: true };
    if (m[4]) return { l: cisterna ? m[1] : m[4] };
    if (m[2]) return mucho == null ? { l: m[1], o: m[3], kg: +m[2] } : { l: mucho ? m[1] : m[3] };
    return { l: m[1] };
  }

  // ¿Puede pasar? cat: categoría del túnel (A–E, "tren" o null). Devuelve {r: "si"|"no"|"duda", m: motivo}.
  // «D ni E», «C, D ni E»…
  const desde = (l) => { const a = ORDEN.slice(ORDEN.indexOf(l)).split(""); return a.length > 1 ? a.slice(0, -1).join(", ") + " ni " + a[a.length - 1] : a[0]; };
  function puede(cod, cat, cisterna, mucho) {
    if (!cod) return null;
    if (cat === "tren") {
      if (cod === "sin") return { r: "si", m: "Sin mercancías peligrosas: puedes subir al tren." };
      return { r: "duda", m: "El tren tiene sus propias normas de mercancías peligrosas: declara la carga al reservar y pregunta si la aceptan." };
    }
    if (cod === "sin") return { r: "si", m: "Sin mercancías peligrosas no te afecta la categoría ADR." };
    if (cod === "panel") return { r: "duda", m: "Sin panel naranja, las restricciones ADR de túneles no se aplican (ADR 1.1.3.6 y 8.6.3.3), pero el túnel puede tener normas propias: míralo en la entrada." };
    if (cod === "(-)") return { r: "si", m: "El código (-) no tiene restricción en túneles." };
    if (!cat || !ORDEN.includes(cat)) return { r: "duda", m: "No sabemos la categoría ADR de este túnel: mira la señal de la entrada." };
    const x = letra(cod, cisterna, mucho);
    if (!x.l) return { r: "duda", m: "No entendemos ese código: mira la carta de porte." };
    const prohibe = (l) => ORDEN.indexOf(cat) >= ORDEN.indexOf(l);
    if (x.o) {
      if (!prohibe(x.o) && !prohibe(x.l)) return { r: "si", m: `Túnel ${cat}: tu código ${cod} pasa por aquí.` };
      if (prohibe(x.o)) return { r: "no", m: `Túnel ${cat}: el código ${cod} no puede pasar por túneles ${desde(x.o)}.` };
      return { r: "duda", m: `Túnel ${cat}: depende del peso. Con más de ${x.kg} kg (masa neta de explosivo) no puedes pasar; con menos, sí.` };
    }
    const quien = /\//.test(cod) ? (cisterna ? " en cisterna" : " sin cisterna") : "";
    if (prohibe(x.l)) return { r: "no", m: `Túnel ${cat}: el código ${cod}${quien} no puede pasar por túneles ${desde(x.l)}.` };
    return { r: "si", m: `Túnel ${cat}: el código ${cod}${quien} puede pasar.` };
  }

  // Altura del camión frente al gálibo del túnel. alto y camion en metros. Devuelve {r: "si"|"justo"|"no"|"duda", m}.
  const MARGEN = 0.10;
  const m2 = (n) => n.toFixed(2).replace(".", ",") + " m";
  function cabe(alto, camion) {
    if (!(camion > 0)) return null;
    if (!(alto > 0)) return { r: "duda", m: "No tenemos la altura de este túnel: mira la señal." };
    const sobra = Math.round((alto - camion) * 100) / 100;
    if (sobra < 0) return { r: "no", m: `Tu camión (${m2(camion)}) es más alto que el máximo (${m2(alto)}). No entres.` };
    if (sobra < MARGEN) return { r: "justo", m: `Muy justo: te sobran ${Math.round(sobra * 100)} cm. Comprueba la altura real del camión y la señal.` };
    return { r: "si", m: `Te sobran ${Math.round(sobra * 100)} cm.` };
  }
  const num = (s) => { const n = parseFloat(String(s || "").replace(",", ".")); return isFinite(n) ? n : null; };

  window.GalibosCuentas = { CODIGOS, CAT_TXT, letra, puede, cabe, num, MARGEN };

  const $ = (i) => document.getElementById(i);
  if (typeof document === "undefined" || !$("v-galibos")) return;
  const D = window.GalibosDatos || { tuneles: [], zonas: [] };
  const KEY = "ccoo-galibos";
  let est = { codigo: "", cisterna: false, mucho: null, alto: "" };
  try { const g = JSON.parse(localStorage.getItem(KEY) || "{}"); if (g && typeof g === "object") est = { ...est, ...g }; } catch (e) { /* sin datos */ }
  if (!CODIGOS.some(c => c.v === est.codigo)) est.codigo = "";
  const guarda = () => { try { localStorage.setItem(KEY, JSON.stringify(est)); } catch (e) { /* sin almacenamiento */ } };
  const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let zona = "";

  const RES = { si: "SÍ", no: "NO", duda: "CON CUIDADO", justo: "MUY JUSTO" };
  const fuente = (c) => c && c.f
    ? `<span class="ga-fuente ok">Comprobado en ${esc(c.f)}${c.d ? ", " + esc(c.d) : ""}.</span>`
    : `<span class="ga-fuente sin">Sin comprobar: confirma con la señal.</span>`;

  function tarjeta(t) {
    const c = t.comp || {};
    // Si el dato del túnel está sin comprobar, un «SÍ» pasa a «CON CUIDADO» (un «NO» se queda en NO).
    const flojo = (r, ok) => r && !ok && r.r !== "no" && r.r !== "duda" ? { r: "duda", m: r.m + " El dato del túnel está sin comprobar: confirma con la señal." } : r;
    const p = flojo(puede(est.codigo, t.adr, est.cisterna, est.mucho), c.adr || !t.adr);
    const h = flojo(cabe(t.alto, num(est.alto)), c.alto);
    const malo = (p && p.r === "no") || (h && h.r === "no");
    const cat = t.adr === "tren" ? "Tren" : t.adr ? `Categoría ${t.adr}` : "Sin dato";
    return `<article class="panel ga-tunel${malo ? " no" : ""}" id="tunel-${esc(t.id)}">
      <h3>${esc(t.n)}</h3>
      <p class="ga-donde">${esc(t.paises)}${t.via ? " · " + esc(t.via) : ""}${t.km ? " · " + esc(t.km) : ""}</p>
      ${t.ruta ? `<p class="zc-pista">${esc(t.ruta)}</p>` : ""}
      ${p ? `<p class="ga-res ${esc(p.r)}"><b>¿Con tu carga? ${RES[p.r]}</b> <span>${esc(p.m)}</span></p>` : ""}
      ${h ? `<p class="ga-res ${esc(h.r)}"><b>¿Cabes? ${RES[h.r]}</b> <span>${esc(h.m)}</span></p>` : ""}
      <dl class="ga-datos">
        <div><dt>Altura máxima</dt><dd><b class="ga-num">${t.alto ? esc(m2(t.alto)) : "Sin dato"}</b>${t.altoNota ? " " + esc(t.altoNota) : ""} ${fuente(c.alto)}</dd></div>
        <div><dt>Mercancías peligrosas (ADR)</dt><dd><b class="ga-num">${esc(cat)}</b> ${esc(t.adrNota || CAT_TXT[t.adr] || "")} ${fuente(c.adr)}</dd></div>
        ${t.vel ? `<div><dt>Velocidad</dt><dd>${esc(t.vel)} ${fuente(c.vel)}</dd></div>` : ""}
        ${t.dist ? `<div><dt>Distancia entre camiones</dt><dd>${esc(t.dist)} ${fuente(c.dist)}</dd></div>` : ""}
      </dl>
      ${t.normas && t.normas.length ? `<ul class="ga-normas">${t.normas.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${t.alt ? `<p><b>Si no puedes pasar:</b> ${esc(t.alt)} <span class="ga-fuente sin">(sin comprobar)</span></p>` : ""}
      <div class="ga-tels"><a class="btn sec ga-tel" href="tel:112">${icono("telefono", "p")}Emergencias: 112</a></div>
      ${t.web ? `<p class="zc-pista"><a href="${esc(urlSegura(t.web))}" target="_blank" rel="noopener">Web oficial del túnel</a></p>` : ""}
    </article>`;
  }

  function pinta() {
    $("ga-codigo").value = est.codigo;
    const x = letra(est.codigo, est.cisterna, null);
    const barra = /\//.test(est.codigo);
    $("ga-cis-caja").hidden = !barra;
    $("ga-cisterna").checked = !!est.cisterna;
    $("ga-mucho-caja").hidden = !x.o;
    if (x.o) { $("ga-mucho-kg").textContent = x.kg; $("ga-mucho").value = est.mucho == null ? "" : est.mucho ? "si" : "no"; }
    $("ga-alto").value = est.alto || "";
    $("ga-zonas").innerHTML = [{ id: "", n: "Todos" }, ...(D.zonas || [])].map(z => `<button type="button" class="zc-chip${z.id === zona ? " activa" : ""}" data-z="${esc(z.id)}" aria-pressed="${z.id === zona}">${esc(z.n)}</button>`).join("");
    const q = normal($("ga-busca").value.trim());
    const l = D.tuneles.filter(t => (!zona || t.zona === zona) && (!q || normal(`${t.n} ${t.paises} ${t.via} ${t.ruta} ${t.buscar || ""}`).includes(q)));
    const ca = num(est.alto);
    let resumen = `${l.length} de ${D.tuneles.length} túneles`;
    if (est.codigo) { const n = l.filter(t => (puede(est.codigo, t.adr, est.cisterna, est.mucho) || {}).r === "no").length; resumen += ` · con tu carga no puedes pasar por ${n}`; }
    if (ca > 0) { const n = l.filter(t => (cabe(t.alto, ca) || {}).r === "no").length; resumen += ` · demasiado bajos para ti: ${n}`; }
    $("ga-cuenta").textContent = resumen;
    $("ga-lista").innerHTML = l.length ? l.map(tarjeta).join("") : `<div class="zc-aviso">No hay ningún túnel que coincida. Prueba con otro nombre o país.</div>`;
    const ah = $("ga-alto-res");
    ah.textContent = ca > 0 ? (ca > 4.5 ? `Ojo: ${m2(ca)} es más de lo normal. La altura máxima de un camión en la mayoría de países es 4,00 m (Francia y Reino Unido no tienen límite general, pero cuentan los gálibos). Comprueba que lo has escrito bien.` : `Altura de tu camión: ${m2(ca)}. Los túneles a los que no llegas salen en rojo y los que van justos (menos de ${Math.round(MARGEN * 100)} cm) en ámbar.`) : "";
  }

  $("ga-codigo").innerHTML = CODIGOS.map(c => `<option value="${esc(c.v)}">${esc(c.t)}</option>`).join("");
  $("ga-codigo").addEventListener("change", (e) => { est.codigo = e.target.value; est.mucho = null; guarda(); pinta(); });
  $("ga-cisterna").addEventListener("change", (e) => { est.cisterna = e.target.checked; guarda(); pinta(); });
  $("ga-mucho").addEventListener("change", (e) => { const v = e.target.value; est.mucho = v === "" ? null : v === "si"; guarda(); pinta(); });
  $("ga-alto").addEventListener("input", (e) => { est.alto = e.target.value.slice(0, 6); guarda(); pinta(); });
  $("ga-zonas").addEventListener("click", (e) => { const b = e.target.closest("[data-z]"); if (!b) return; zona = b.dataset.z; pinta(); });
  $("ga-busca").addEventListener("input", pinta);
  if (D.revisado) $("ga-revisado").textContent = `Datos revisados el ${D.revisado}.`;
  if (est.alto) $("ga-altura").open = true;
  pinta();
})();
