// ===== «Mis ganancias»: lo que gana el conductor cada día, semana y mes (Zona Conductores, v81) =====
// Los importes (salario, dietas, suplementos, pluses) los pone el padre en el panel (tabla tarifas_conductor, página
// «Importes conductores»). Cada concepto tiene una unidad que dice cómo se apunta:
//   mes → fijo al mes (salario, plus fijo); dia/noche/finde → casilla (sí o no ese día); vez → contador; hora/km/minuto → número.
// sin_pagar = las primeras N de cada día no se pagan (p. ej. la primera carga). max_mes = como mucho N al mes (fin de semana x2).
// Lo apuntado se guarda SOLO en este móvil (localStorage «ccoo-ganancias»): no va a ningún servidor.
(function () {
  const CLAVE = "ccoo-ganancias", CACHE_TARIFAS = "ccoo-tarifas";
  const DEF = () => ({ dias: {}, salario: "", oculto: {}, fijo: {}, tab: "dia", dia: "", semana: "", mes: "" });
  const lee = () => { try { const d = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (d && typeof d.dias === "object") return { ...DEF(), ...d }; } catch (_) {} return DEF(); };
  let DATOS = lee();
  const guarda = () => {
    try { localStorage.setItem(CLAVE, JSON.stringify(DATOS)); } catch (_) { msg(T("No se ha podido guardar en este móvil (¿modo incógnito?). Haz una copia."), true); }
    try { navigator.storage?.persist?.(); } catch (_) {}
  };
  const msg = (t, mal) => { const m = $("gan-msg"); if (m) { m.textContent = t; m.className = "msg " + (mal ? "err" : "ok"); } };
  let TARIFAS = (() => { try { return JSON.parse(localStorage.getItem(CACHE_TARIFAS) || "[]"); } catch (_) { return []; } })();

  // ---------- Idioma (como «Mis descansos») ----------
  // Textos con T("...") literal: la función «traducir» (modo textos, grupo ganancias) los saca de este archivo publicado
  // y añade los nombres de los conceptos de la tabla. Nada de texto de fuera.
  const LOCALES = { ca: "ca-ES", en: "en-GB", ro: "ro-RO", ar: "ar-u-nu-latn", fr: "fr-FR", pt: "pt-PT", de: "de-DE", pl: "pl-PL", sr: "sr-Cyrl-RS" };
  let MAPA = {}, LOC = "es-ES";
  const T = (s, v) => (MAPA[s] || s).replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
  const TH = (s, v) => esc(T(s, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const TD = (s) => MAPA[s] || s; // textos de la tabla (los pone el panel)
  const FIJOS = () => ({
    titulo: T("Mis ganancias"),
    intro: T("Apunta lo que haces cada día y te calculo lo que ganas: dietas, suplementos y pluses, por día, por semana y por mes. Se guarda solo en este móvil."),
    guiatit: T("Cómo se usa (guía rápida)"),
    tabdia: T("Día"), tabsemana: T("Semana"), tabmes: T("Mes"), tabajustes: T("Ajustes"),
    copia: T("Guardar una copia (PDF)"), recupera: T("Recuperar una copia"), borrar: T("Borrar todo"),
    ayudacopia: T("Guarda una copia de vez en cuando (y antes de cambiar de móvil): si se borran los datos del navegador, se pierde lo apuntado."),
    oficial: T("Orientativo y en bruto (antes de impuestos y descuentos). Los importes los pone la sección sindical según la tabla de la empresa. Manda tu nómina: si no cuadra, pregunta a un delegado."),
  });
  const GUIA = () => [
    [T("Cada día"), T("En «Día», marca lo que has hecho: dieta completa o partes (dormir, desayuno, comida, cena), noche fuera, cargas, kilómetros… El total sale arriba y se guarda solo.")],
    [T("Otro día"), T("Cambia de día con las flechas o tocando la fecha. «Copiar el día anterior» rellena lo mismo que el último día apuntado.")],
    [T("La semana y el mes"), T("En «Semana» ves cada día y el total de la semana. En «Mes», el total del mes con el salario y lo que se cobra con la nómina.")],
    [T("Ajustes"), T("Pon tu salario si cobras antigüedad, quita los conceptos que no usas para que la lista sea más corta y guarda una copia en PDF.")],
  ];
  function pintaFijos() {
    const f = FIJOS(), v = $("v-ganancias"), idi = miIdioma();
    v.querySelectorAll("[data-gt]").forEach(el => { const t = f[el.dataset.gt]; if (t) el.textContent = t; });
    $("gan-guia-cuerpo").innerHTML = `<ol class="desc-guia-pasos">${GUIA().map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ol>`;
    v.setAttribute("dir", idi === "ar" ? "rtl" : "ltr"); v.setAttribute("lang", idi || "es");
    const sel = $("gan-idioma");
    if (!sel.options.length) sel.innerHTML = `<option value="">Español</option>` + Object.entries(IDIOMAS).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join("");
    sel.value = idi;
  }
  // La caché depende también de los nombres de la tabla: si el panel los cambia, se vuelve a traducir
  const firmaTabla = () => TARIFAS.map(t => t.grupo + "|" + t.concepto + "|" + t.nota).join("\n");
  async function cargaIdioma() {
    const idi = miIdioma(), m = $("gan-idioma-msg");
    LOC = LOCALES[idi] || "es-ES"; m.textContent = ""; m.className = "msg";
    if (!idi) { MAPA = {}; return; }
    const CACHE = "ccoo-textos-ganancias", firma = firmaTabla();
    try { const c = JSON.parse(localStorage.getItem(CACHE) || "null"); if (c && c.idioma === idi && c.v === VERSION_WEB && c.f === firma && Date.now() - c.t < 86400000) { MAPA = c.mapa; return; } } catch (_) {}
    m.textContent = "…";
    try {
      const { data, error } = await sb.functions.invoke("traducir", { body: { modo: "textos", grupo: "ganancias", idioma: idi } });
      if (error || !data?.textos) throw 0;
      if (miIdioma() !== idi) return;
      MAPA = data.textos; m.textContent = "";
      try { localStorage.setItem(CACHE, JSON.stringify({ idioma: idi, v: VERSION_WEB, f: firma, t: Date.now(), mapa: MAPA })); } catch (_) {}
    } catch (_) { MAPA = {}; LOC = "es-ES"; m.textContent = "La traducción no está disponible ahora mismo. Prueba más tarde."; m.className = "msg err"; }
  }

  // ---------- Importes de la tabla ----------
  async function cargaTarifas() {
    try {
      const { data, error } = await sb.from("tarifas_conductor").select("*").order("orden").order("id");
      if (error || !Array.isArray(data)) return;
      TARIFAS = data.filter(t => t.visible !== false).map(t => ({ id: t.id, grupo: t.grupo || "", concepto: t.concepto, importe: +t.importe || 0, unidad: t.unidad, pago: t.pago, sin_pagar: +t.sin_pagar || 0, max_mes: +t.max_mes > 0 ? +t.max_mes : null, /* 0 o vacío = sin tope */ nota: t.nota || "" }));
      try { localStorage.setItem(CACHE_TARIFAS, JSON.stringify(TARIFAS)); } catch (_) {}
    } catch (_) { /* sin conexión: los de la última vez */ }
  }
  const CASILLA = ["dia", "noche", "finde"], NUMERO = ["hora", "km", "minuto"];
  const UNIDAD = () => ({ mes: T("al mes"), dia: T("por día"), noche: T("por noche"), finde: T("por fin de semana"), vez: T("cada una"), hora: T("por hora"), km: T("por km"), minuto: T("por minuto") });
  const QUE = () => ({ hora: T("horas"), km: T("km"), minuto: T("minutos"), vez: T("veces") });
  const variables = () => TARIFAS.filter(t => t.unidad !== "mes");
  const fijosMes = () => TARIFAS.filter(t => t.unidad === "mes");
  const salarioPropio = () => { const n = parseFloat(String(DATOS.salario || "").replace(",", ".")); return n > 0 ? n : null; };
  // ¿Cobra este fijo al mes? El primero (salario) sí por defecto; los demás (p. ej. plus ADR) solo si lo marca
  const cobraFijo = (t) => DATOS.fijo[t.id] ?? (t === fijosMes()[0]);

  // ---------- Fechas (días como «aaaa-mm-dd», hora local) ----------
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const deIso = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d, 12); };
  const suma = (s, n) => { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const lunesDe = (s) => { const d = deIso(s); return suma(s, -((d.getDay() + 6) % 7)); };
  const hoy = () => iso(new Date());
  const fDia = (s, larga) => deIso(s).toLocaleDateString(LOC, larga ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" });
  const fMes = (m) => deIso(m + "-01").toLocaleDateString(LOC, { month: "long", year: "numeric" });
  const eur = (n) => (Math.round(n * 100) / 100).toLocaleString(LOC, { style: "currency", currency: "EUR" });
  const precio = (n) => n.toLocaleString(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) + " €";
  const num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : 0; };

  // ---------- Cálculo ----------
  // Recorre todos los días en orden para aplicar los topes al mes (max_mes) y lo que no se paga cada día (sin_pagar).
  function calcula() {
    const res = {}, usados = {};
    Object.keys(DATOS.dias).sort().forEach(f => {
      const dia = DATOS.dias[f] || {}, mes = f.slice(0, 7), lineas = [];
      let total = 0, semanal = 0, mensual = 0;
      variables().forEach(t => {
        const n = num(dia[t.id]); if (!n) return;
        let pagadas = Math.max(0, n - t.sin_pagar), tope = false;
        if (t.max_mes != null) { const k = mes + "|" + t.id, ya = usados[k] || 0, cabe = Math.max(0, t.max_mes - ya); if (pagadas > cabe) { pagadas = cabe; tope = true; } usados[k] = ya + pagadas; }
        const imp = pagadas * t.importe;
        lineas.push({ t, n, pagadas, imp, tope }); total += imp;
        if (t.pago === "Mensual") mensual += imp; else semanal += imp;
      });
      res[f] = { total, semanal, mensual, lineas };
    });
    return res;
  }
  // Suma de varios días, por concepto
  function resumen(c, dias) {
    const por = new Map(); let total = 0, semanal = 0, mensual = 0, apuntados = 0;
    dias.forEach(f => { const r = c[f]; if (!r || !r.lineas.length) return; apuntados++; total += r.total; semanal += r.semanal; mensual += r.mensual;
      r.lineas.forEach(l => { const p = por.get(l.t.id) || { t: l.t, n: 0, imp: 0, tope: false }; p.n += l.pagadas; p.imp += l.imp; p.tope ||= l.tope; por.set(l.t.id, p); }); });
    return { total, semanal, mensual, apuntados, por: [...por.values()] };
  }
  const cantidadTxt = (t, n) => CASILLA.includes(t.unidad) ? (n === 1 ? "" : "× " + n) : t.unidad === "vez" ? "× " + n : n.toLocaleString(LOC, { maximumFractionDigits: 2 }) + " " + QUE()[t.unidad];
  const desglose = (r) => r.por.length ? `<ul class="gan-desglose">${r.por.map(p => `<li><span>${esc(TD(p.t.concepto))}${p.t.grupo && !p.t.concepto.includes(p.t.grupo) ? ` <small>· ${esc(TD(p.t.grupo))}</small>` : ""}${p.n && cantidadTxt(p.t, p.n) ? ` <small>${esc(cantidadTxt(p.t, p.n))}</small>` : ""}${p.tope ? ` <small class="gan-tope">${esc(p.n ? T("con tope al mes") : T("no suma: ya estaba el máximo del mes"))}</small>` : ""}</span><b>${esc(eur(p.imp))}</b></li>`).join("")}</ul>` : "";
  const reparto = (r) => r.semanal && r.mensual ? `<p class="gan-reparto"><span>${esc(T("Se cobra cada semana"))}: <b>${esc(eur(r.semanal))}</b></span><span>${esc(T("Con la nómina del mes"))}: <b>${esc(eur(r.mensual))}</b></span></p>` : "";

  // ---------- Pintar ----------
  function pinta() {
    const v = $("v-ganancias"); if (!v) return;
    const TAB = DATOS.tab || "dia";
    v.querySelectorAll("[data-gtab]").forEach(b => { const on = b.dataset.gtab === TAB; b.classList.toggle("activa", on); b.setAttribute("aria-selected", String(on)); });
    v.querySelectorAll("[data-gpanel]").forEach(p => { p.hidden = p.dataset.gpanel !== TAB; });
    const inst = typeof INSTALADA === "function" && INSTALADA();
    $("gan-app").innerHTML = `<details class="desc-mini"><summary>${icono(inst ? "alerta" : "movil", "p")}<span>${esc(inst ? T("Para no perder lo apuntado") : T("Instala la app para no perder lo apuntado"))}</span></summary><div><p>${esc(T("Se guarda solo en este móvil (no en internet). Se pierde si borras los datos de la app o del navegador, si usas una pestaña de incógnito o si cambias de móvil. Guarda de vez en cuando la copia en PDF (en «Ajustes»)."))}</p>${inst ? "" : `<button class="btn" id="gan-instalar">${icono("descargar", "p")}${esc(T("Instalar la app"))}</button>`}</div></details>`;
    if ($("gan-instalar")) $("gan-instalar").onclick = () => instalar();
    if (!TARIFAS.length) { ["gan-dia", "gan-semana", "gan-mes"].forEach(id => $(id).innerHTML = `<p class="desc-vacio">${esc(T("Cargando los importes… Si no salen, comprueba la conexión."))}</p>`); pintaAjustes(); return; }
    const c = calcula();
    if (TAB === "dia") pintaDia(c);
    if (TAB === "semana") pintaSemana(c);
    if (TAB === "mes") pintaMes(c);
    if (TAB === "ajustes") pintaAjustes();
  }

  function pintaDia(c) {
    const f = DATOS.dia || hoy(), dia = DATOS.dias[f] || {}, r = c[f] || { total: 0, lineas: [] };
    const lista = variables().filter(t => !DATOS.oculto[t.id]);
    const grupos = []; lista.forEach(t => { let g = grupos.find(x => x.n === t.grupo); if (!g) grupos.push(g = { n: t.grupo, ts: [] }); g.ts.push(t); });
    const linea = (t) => r.lineas.find(l => l.t.id === t.id);
    const control = (t) => {
      const n = num(dia[t.id]), id = "gan-c" + t.id;
      if (CASILLA.includes(t.unidad)) return `<input type="checkbox" id="${id}" data-c="${t.id}" ${n ? "checked" : ""}>`;
      if (t.unidad === "vez") return `<span class="gan-paso"><button type="button" class="btn-ic" data-menos="${t.id}" aria-label="${esc(T("Quitar una"))}">−</button><b id="${id}" aria-live="polite">${n}</b><button type="button" class="btn-ic" data-mas="${t.id}" aria-label="${esc(T("Añadir una"))}">+</button></span>`;
      return `<input id="${id}" class="gan-num" data-c="${t.id}" inputmode="decimal" value="${n ? esc(String(n).replace(".", ",")) : ""}" placeholder="0" aria-label="${esc(QUE()[t.unidad])}"><small>${esc(QUE()[t.unidad])}</small>`;
    };
    const fila = (t) => { const l = linea(t), nota = [t.nota && TD(t.nota), t.sin_pagar ? (t.sin_pagar === 1 ? T("La primera de cada día no se paga.") : T("Las primeras {n} de cada día no se pagan.", { n: t.sin_pagar })) : "", t.max_mes != null ? T("Como mucho {n} al mes.", { n: t.max_mes }) : ""].filter(Boolean);
      const unicos = [...new Set(nota)];
      return `<li class="gan-fila ${l ? "con" : ""}"><label for="gan-c${t.id}"><b>${esc(TD(t.concepto))}</b><small>${esc(precio(t.importe))} ${esc(UNIDAD()[t.unidad])}${t.pago === "Mensual" ? " · " + esc(T("con la nómina")) : ""}</small>${unicos.map(x => `<small class="gan-nota">${esc(x)}</small>`).join("")}${l?.tope ? `<small class="gan-tope">${esc(T("Ya llevas el máximo de este mes: este no suma."))}</small>` : ""}</label>
        <div class="gan-ctrl">${control(t)}</div><span class="gan-imp">${l ? esc(eur(l.imp)) : ""}</span></li>`; };
    // ¿Dieta completa y partes el mismo día? Normalmente es una u otra
    const lleva = (p) => r.lineas.some(l => /dieta/i.test(l.t.grupo + " " + l.t.concepto) && p(l.t));
    const doble = lleva(t => CASILLA.includes(t.unidad) && /complet/i.test(t.grupo + " " + t.concepto)) && lleva(t => t.unidad === "vez" && !/carga/i.test(t.concepto));
    const anterior = Object.keys(DATOS.dias).filter(x => x < f && Object.keys(DATOS.dias[x] || {}).length).sort().pop();
    $("gan-dia").innerHTML = `<div class="gan-nav"><button type="button" class="btn-ic" data-dia="-1" aria-label="${esc(T("Día anterior"))}">${icono("izq")}</button>
        <label class="gan-fecha"><span>${esc(fDia(f, true))}${f === hoy() ? ` · ${esc(T("hoy"))}` : ""}</span><input type="date" id="gan-fecha" value="${f}" aria-label="${esc(T("Elegir día"))}"></label>
        <button type="button" class="btn-ic" data-dia="1" aria-label="${esc(T("Día siguiente"))}">${icono("der")}</button></div>
      <div class="gan-total"><span>${esc(T("Este día"))}</span><b>${esc(eur(r.total))}</b></div>
      ${doble ? `<p class="desc-alerta">${icono("alerta", "p")}<span>${esc(T("Has marcado la dieta completa y también partes de la dieta. Normalmente se cobra una cosa o la otra: revísalo."))}</span></p>` : ""}
      ${grupos.map(g => `<section class="gan-grupo">${g.n ? `<h3>${esc(TD(g.n))}</h3>` : ""}<ul>${g.ts.map(fila).join("")}</ul></section>`).join("")}
      ${lista.length < variables().length ? `<p class="ayuda">${esc(T("Hay conceptos escondidos. Los vuelves a sacar en «Ajustes»."))}</p>` : ""}
      <div class="botones">${anterior && !Object.keys(dia).length ? `<button class="btn sec" id="gan-copiar">${icono("copia", "p")}${esc(T("Copiar el día anterior ({fecha})", { fecha: fDia(anterior) }))}</button>` : ""}
        ${Object.keys(dia).length ? `<button class="btn sec" id="gan-vaciar">${icono("borrar", "p")}${esc(T("Vaciar este día"))}</button>` : ""}</div>`;
    const v = $("gan-dia"), pon = (id, n) => { const d = { ...(DATOS.dias[f] || {}) }; if (n > 0) d[id] = Math.round(n * 100) / 100; else delete d[id]; if (Object.keys(d).length) DATOS.dias[f] = d; else delete DATOS.dias[f]; guarda(); };
    v.querySelectorAll("[data-dia]").forEach(b => b.onclick = () => { DATOS.dia = suma(f, +b.dataset.dia); guarda(); pinta(); });
    $("gan-fecha").onchange = () => { if (/^\d{4}-\d\d-\d\d$/.test($("gan-fecha").value)) { DATOS.dia = $("gan-fecha").value; guarda(); pinta(); } };
    v.querySelectorAll("input[type=checkbox][data-c]").forEach(i => i.onchange = () => { pon(i.dataset.c, i.checked ? 1 : 0); pinta(); });
    v.querySelectorAll("[data-mas],[data-menos]").forEach(b => b.onclick = () => { const id = b.dataset.mas || b.dataset.menos; pon(id, Math.max(0, num(dia[id]) + (b.dataset.mas ? 1 : -1))); pinta(); $(`gan-c${id}`)?.parentElement.querySelector(b.dataset.mas ? "[data-mas]" : "[data-menos]")?.focus(); });
    v.querySelectorAll(".gan-num").forEach(i => i.onchange = () => { pon(i.dataset.c, Math.min(num(i.value), 100000)); pinta(); });
    if ($("gan-copiar")) $("gan-copiar").onclick = () => { DATOS.dias[f] = { ...DATOS.dias[anterior] }; guarda(); pinta(); };
    if ($("gan-vaciar")) $("gan-vaciar").onclick = () => { if (!confirm(T("¿Vaciar lo apuntado este día?"))) return; delete DATOS.dias[f]; guarda(); pinta(); };
  }

  function pintaSemana(c) {
    const l = DATOS.semana || lunesDe(DATOS.dia || hoy()), dias = Array.from({ length: 7 }, (_, i) => suma(l, i)), r = resumen(c, dias);
    $("gan-semana").innerHTML = `<div class="gan-nav"><button type="button" class="btn-ic" data-sem="-7" aria-label="${esc(T("Semana anterior"))}">${icono("izq")}</button>
        <b class="gan-fecha"><span>${esc(T("Del {a} al {b}", { a: fDia(dias[0]), b: fDia(dias[6]) }))}</span></b>
        <button type="button" class="btn-ic" data-sem="7" aria-label="${esc(T("Semana siguiente"))}">${icono("der")}</button></div>
      <div class="gan-total"><span>${esc(T("Esta semana"))}</span><b>${esc(eur(r.total))}</b></div>${reparto(r)}
      <ul class="gan-dias">${dias.map(f => { const x = c[f]; return `<li><button type="button" data-ir-dia="${f}" class="${f === hoy() ? "hoy" : ""}"><span>${esc(fDia(f))}</span><b>${x && x.lineas.length ? esc(eur(x.total)) : `<small>${esc(T("Sin apuntar"))}</small>`}</b>${icono("der", "p")}</button></li>`; }).join("")}</ul>
      ${r.por.length ? `<h3 class="gan-sub">${esc(T("Por conceptos"))}</h3>${desglose(r)}` : ""}
      <p class="ayuda">${esc(T("Sin el salario: es lo que suman las dietas, suplementos y pluses de la semana. El salario sale en «Mes»."))}</p>`;
    const v = $("gan-semana");
    v.querySelectorAll("[data-sem]").forEach(b => b.onclick = () => { DATOS.semana = suma(l, +b.dataset.sem); guarda(); pinta(); });
    v.querySelectorAll("[data-ir-dia]").forEach(b => b.onclick = () => { DATOS.dia = b.dataset.irDia; DATOS.tab = "dia"; guarda(); pinta(); });
  }

  function pintaMes(c) {
    const m = DATOS.mes || (DATOS.dia || hoy()).slice(0, 7), [a, mm] = m.split("-").map(Number), n = new Date(a, mm, 0).getDate();
    const dias = Array.from({ length: n }, (_, i) => `${m}-${String(i + 1).padStart(2, "0")}`), r = resumen(c, dias);
    const fijos = fijosMes().filter(cobraFijo).map(t => ({ t, imp: t === fijosMes()[0] && salarioPropio() ? salarioPropio() : t.importe }));
    const totalFijo = fijos.reduce((s, x) => s + x.imp, 0), otroMes = (k) => { const d = new Date(a, mm - 1 + k, 1); return iso(d).slice(0, 7); };
    $("gan-mes").innerHTML = `<div class="gan-nav"><button type="button" class="btn-ic" data-mes="-1" aria-label="${esc(T("Mes anterior"))}">${icono("izq")}</button>
        <b class="gan-fecha"><span>${esc(fMes(m))}</span></b>
        <button type="button" class="btn-ic" data-mes="1" aria-label="${esc(T("Mes siguiente"))}">${icono("der")}</button></div>
      <div class="gan-total"><span>${esc(T("Total del mes (bruto)"))}</span><b>${esc(eur(totalFijo + r.total))}</b></div>
      <div class="desc-cifras gan-cifras">
        <div><b>${esc(eur(totalFijo))}</b><span>${esc(T("Fijo al mes (salario y pluses fijos)"))}</span></div>
        <div><b>${esc(eur(r.total))}</b><span>${esc(T("Dietas, suplementos y pluses de {n} días apuntados", { n: r.apuntados }))}</span></div>
      </div>
      ${r.semanal || r.mensual ? `<p class="gan-reparto"><span>${esc(T("Se cobra cada semana"))}: <b>${esc(eur(r.semanal))}</b></span><span>${esc(T("Con la nómina del mes"))}: <b>${esc(eur(r.mensual + totalFijo))}</b></span></p>` : ""}
      ${fijos.length ? `<h3 class="gan-sub">${esc(T("Fijo al mes"))}</h3><ul class="gan-desglose">${fijos.map(x => `<li><span>${esc(TD(x.t.concepto))}${x.imp !== x.t.importe ? ` <small>${esc(T("el tuyo, de «Ajustes»"))}</small>` : ""}</span><b>${esc(eur(x.imp))}</b></li>`).join("")}</ul>` : ""}
      ${r.por.length ? `<h3 class="gan-sub">${esc(T("Por conceptos"))}</h3>${desglose(r)}` : `<p class="desc-vacio">${esc(T("Este mes todavía no has apuntado ningún día."))}</p>`}
      <p class="ayuda">${esc(T("La antigüedad, las horas extra y los descuentos (IRPF, Seguridad Social) no están incluidos."))}</p>`;
    $("gan-mes").querySelectorAll("[data-mes]").forEach(b => b.onclick = () => { DATOS.mes = otroMes(+b.dataset.mes); guarda(); pinta(); });
  }

  function pintaAjustes() {
    const fm = fijosMes(), vs = variables(), base = fm[0];
    $("gan-ajustes").innerHTML = `${base ? `<label for="gan-salario">${esc(T("Mi salario bruto al mes (con antigüedad)"))}</label>
        <input id="gan-salario" inputmode="decimal" value="${esc(DATOS.salario || "")}" placeholder="${esc(precio(base.importe))}">
        <p class="ayuda">${esc(T("Si lo dejas vacío, uso el de la tabla: {importe}.", { importe: precio(base.importe) }))}</p>` : ""}
      ${fm.length ? `<fieldset class="gan-checks"><legend>${esc(T("Lo que cobro fijo cada mes"))}</legend>${fm.map(t => `<label class="check"><input type="checkbox" data-fijo="${t.id}" ${cobraFijo(t) ? "checked" : ""}><span>${esc(TD(t.concepto))} · ${esc(precio(t.importe))}</span></label>`).join("")}</fieldset>` : ""}
      ${vs.length ? `<fieldset class="gan-checks"><legend>${esc(T("Conceptos que salen en «Día»"))}</legend><p class="ayuda">${esc(T("Quita los que no usas nunca para que la lista sea más corta."))}</p>${vs.map(t => `<label class="check"><input type="checkbox" data-ver="${t.id}" ${DATOS.oculto[t.id] ? "" : "checked"}><span>${esc(TD(t.concepto))}${t.grupo && !t.concepto.includes(t.grupo) ? ` <small>· ${esc(TD(t.grupo))}</small>` : ""}</span></label>`).join("")}</fieldset>` : ""}`;
    const v = $("gan-ajustes");
    if ($("gan-salario")) $("gan-salario").onchange = () => { const n = num($("gan-salario").value); DATOS.salario = n ? String(Math.round(n * 100) / 100) : ""; $("gan-salario").value = DATOS.salario.replace(".", ","); guarda(); msg(T("Guardado.")); };
    v.querySelectorAll("[data-fijo]").forEach(i => i.onchange = () => { DATOS.fijo[i.dataset.fijo] = i.checked; guarda(); });
    v.querySelectorAll("[data-ver]").forEach(i => i.onchange = () => { if (i.checked) delete DATOS.oculto[i.dataset.ver]; else DATOS.oculto[i.dataset.ver] = true; guarda(); });
  }

  // ---------- Copia en PDF (siempre en español) ----------
  const MARCA = "%CCOO-GANANCIAS:";
  function hazPDF() {
    const locAntes = LOC, mapaAntes = MAPA; LOC = "es-ES"; MAPA = {};
    try {
      const c = calcula(), L = [], meses = [...new Set(Object.keys(DATOS.dias).map(f => f.slice(0, 7)))].sort().reverse();
      L.push(["Mis ganancias", 18, true], ["Sección Sindical CCOO Calsina Carré", 11], ["Copia hecha el " + new Date().toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }), 9], [""]);
      if (!meses.length) L.push(["Todavía no hay nada apuntado."]);
      meses.forEach(m => {
        const dias = Object.keys(DATOS.dias).filter(f => f.startsWith(m)).sort(), r = resumen(c, dias);
        L.push([fMes(m) + ": " + eur(r.total) + " (sin el salario)", 13, true]);
        dias.forEach(f => { const x = c[f]; if (!x?.lineas.length) return; L.push([fDia(f, true) + ": " + eur(x.total), 10, true, 6]); L.push([x.lineas.map(l => l.t.concepto + (cantidadTxt(l.t, l.n) ? " " + cantidadTxt(l.t, l.n) : "") + " " + eur(l.imp)).join(" · "), 9, false, 14]); });
        L.push([""]);
      });
      L.push(["Orientativo y en bruto. Manda tu nómina.", 8], ["Para volver a cargar estos datos en la app: Zona Conductores > Mis ganancias > Ajustes > Recuperar una copia, y elige este PDF.", 8]);
      const datos = { app: "ccoo-ganancias", dias: DATOS.dias, salario: DATOS.salario, oculto: DATOS.oculto, fijo: DATOS.fijo };
      return pdfSencillo(L, MARCA + btoa(unescape(encodeURIComponent(JSON.stringify(datos)))));
    } finally { LOC = locAntes; MAPA = mapaAntes; }
  }

  // ---------- Arranque ----------
  function prepara() {
    if (!$("v-ganancias")) return;
    document.querySelectorAll("#v-ganancias [data-gtab]").forEach(b => b.onclick = () => { DATOS.tab = b.dataset.gtab; guarda(); pinta(); });
    $("gan-copia").onclick = () => {
      const a = document.createElement("a"); a.href = URL.createObjectURL(hazPDF()); a.download = "mis-ganancias-" + hoy() + ".pdf";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    $("gan-recupera").onchange = async () => {
      const f = $("gan-recupera").files[0]; $("gan-recupera").value = ""; if (!f) return;
      try {
        const d = leePDFSencillo(await f.text(), MARCA);
        if (d.app !== "ccoo-ganancias" || !d.dias || typeof d.dias !== "object") throw 0;
        const dias = {};
        Object.entries(d.dias).forEach(([k, x]) => { if (/^\d{4}-\d\d-\d\d$/.test(k) && x && typeof x === "object") { const y = {}; Object.entries(x).forEach(([id, n]) => { if (/^\d+$/.test(id) && num(n)) y[id] = num(n); }); if (Object.keys(y).length) dias[k] = y; } });
        if (!confirm(T("La copia tiene {n} días apuntados. ¿Sustituir lo que hay ahora en este móvil?", { n: Object.keys(dias).length }))) return;
        const limpio = (o) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).filter(([k]) => /^\d+$/.test(k)).map(([k, v]) => [k, !!v]));
        DATOS = { ...DEF(), dias, salario: num(d.salario) ? String(num(d.salario)) : "", oculto: limpio(d.oculto), fijo: limpio(d.fijo), tab: "ajustes" };
        guarda(); pinta(); msg(T("Copia recuperada."));
      } catch (_) { msg(T("Ese archivo no es una copia de «Mis ganancias». Elige el PDF que guardaste con «Guardar una copia»."), true); }
    };
    $("gan-borrar").onclick = () => {
      if (!confirm(T("¿Borrar todo lo apuntado en este móvil? Si no tienes copia, no se podrá recuperar."))) return;
      DATOS = { ...DEF(), tab: "dia" }; guarda(); pinta(); msg(T("Borrado."));
    };
    $("gan-idioma").onchange = () => ponMiIdioma($("gan-idioma").value);
    addEventListener("mi-idioma", async () => { await cargaIdioma(); pintaFijos(); pinta(); });
    // Al entrar, el día de hoy (salvo que se esté mirando otro en esta visita)
    const alEntrar = () => { if (location.hash === "#ganancias") { DATOS.dia = hoy(); DATOS.semana = ""; DATOS.mes = ""; pinta(); } };
    addEventListener("hashchange", alEntrar);
    pintaFijos(); alEntrar(); pinta();
    cargaTarifas().then(async () => { await cargaIdioma(); pintaFijos(); pinta(); });
  }
  prepara();
})();
