// ===== «Mis incentivos»: lo que gana el conductor cada día, semana y mes (Zona Conductores, v81) =====
// Los importes (salario, dietas, suplementos, pluses) los pone el padre en el panel (tabla tarifas_conductor, página
// «Importes conductores»). Cada concepto tiene una unidad que dice cómo se apunta:
//   mes → fijo al mes (salario, plus fijo); dia/noche/finde → casilla (sí o no ese día); vez → contador; hora/km/minuto → número.
// sin_pagar = las primeras N de cada día no se pagan (p. ej. la primera carga). max_mes = como mucho N al mes (fin de semana x2).
// Lo apuntado se guarda SOLO en este móvil (localStorage «ccoo-ganancias»): no va a ningún servidor.
// v83: cada conductor puede poner su propio importe de cualquier concepto (DATOS.precio, «Lo que cobras tú»): cada uno cobra
// distinto (antigüedad, horas sindicales…). Los conceptos que quita en Ajustes no cuentan. La nómina del mes suma el salario,
// los fijos y lo que se paga «Mensual» (festivo, nocturnidad, ADR, horas sindicales). Descargar en PDF por semanas o días
// elegidos en un calendario.
(function () {
  const CLAVE = "ccoo-ganancias", CACHE_TARIFAS = "ccoo-tarifas";
  const DEF = () => ({ dias: {}, salario: "", precio: {}, oculto: {}, fijo: {}, tab: "dia", dia: "", semana: "", mes: "" });
  const lee = () => { try { const d = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (d && typeof d.dias === "object") { const x = { ...DEF(), ...d }; if (!x.precio || typeof x.precio !== "object") x.precio = {}; return x; } } catch (_) {} return DEF(); };
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
    titulo: T("Mis incentivos"),
    intro: T("Apunta lo que haces cada día y te calculo lo que ganas: dietas, suplementos y pluses, por día, por semana y por mes. Se guarda solo en este móvil."),
    guiatit: T("Cómo se usa (guía rápida)"),
    tabdia: T("Día"), tabsemana: T("Semana"), tabmes: T("Mes"), tabajustes: T("Ajustes"),
    copia: T("Copia de todo (PDF)"), recupera: T("Recuperar una copia"), borrar: T("Borrar todo"),
    ayudacopia: T("Guarda una copia de vez en cuando (y antes de cambiar de móvil): si se borran los datos del navegador, se pierde lo apuntado."),
    oficial: T("Orientativo y en bruto (antes de impuestos y descuentos). Los importes los pone la sección sindical según la tabla de la empresa. Manda tu nómina: si no cuadra, pregunta a un delegado."),
  });
  const GUIA = () => [
    [T("Cada día"), T("En «Día», marca lo que has hecho: dieta completa o partes (dormir, desayuno, comida, cena), noche fuera, cargas, kilómetros… El total sale arriba y se guarda solo.")],
    [T("Otro día"), T("Cambia de día con las flechas o tocando la fecha. «Copiar el día anterior» rellena lo mismo que el último día apuntado.")],
    [T("La semana y el mes"), T("En «Semana» ves cada día y el total de la semana. En «Mes», el total del mes con el salario y lo que se cobra con la nómina.")],
    [T("Lo que cobras tú"), T("En «Ajustes», pon tu salario y lo que cobras tú de cada cosa (por ejemplo, el precio de tus horas sindicales). Si lo dejas vacío, se usa el de la tabla.")],
    [T("Descargar"), T("En «Ajustes», elige en el calendario las semanas o los días que quieras y descárgalos en PDF.")],
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
  // Importe de cada uno: el suyo si lo ha puesto en Ajustes; si no, el de la tabla (el salario antiguo de la v81 también vale)
  const imp = (t) => { const p = DATOS.precio[t.id]; if (typeof p === "number" && p >= 0) return p; if (t === fijosMes()[0] && salarioPropio()) return salarioPropio(); return t.importe; };
  const esPropio = (t) => imp(t) !== t.importe;
  const usa = (t) => !DATOS.oculto[t.id];

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
      variables().filter(usa).forEach(t => {
        const n = num(dia[t.id]); if (!n) return;
        let pagadas = Math.max(0, n - t.sin_pagar), tope = false;
        if (t.max_mes != null) { const k = mes + "|" + t.id, ya = usados[k] || 0, cabe = Math.max(0, t.max_mes - ya); if (pagadas > cabe) { pagadas = cabe; tope = true; } usados[k] = ya + pagadas; }
        const im = pagadas * imp(t);
        lineas.push({ t, n, pagadas, imp: im, tope }); total += im;
        if (t.pago === "Mensual") mensual += im; else semanal += im;
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
  // Cuentas de un mes: la nómina (salario, fijos y lo que se paga «Mensual») y lo que se cobra cada semana
  function cuentasMes(c, m) {
    const [a, mm] = m.split("-").map(Number), n = new Date(a, mm, 0).getDate();
    const dias = Array.from({ length: n }, (_, i) => `${m}-${String(i + 1).padStart(2, "0")}`), r = resumen(c, dias);
    const fijos = fijosMes().filter(cobraFijo).map(t => ({ t, imp: imp(t) })), totalFijo = fijos.reduce((s, x) => s + x.imp, 0);
    return { r, fijos, totalFijo, nomina: totalFijo + r.mensual, semanal: r.semanal, total: totalFijo + r.total };
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
      return `<li class="gan-fila ${l ? "con" : ""}"><label for="gan-c${t.id}"><b>${esc(TD(t.concepto))}</b><small>${imp(t) ? `${esc(precio(imp(t)))} ${esc(UNIDAD()[t.unidad])}${esPropio(t) ? " · " + esc(T("el tuyo")) : ""}` : `<span class="gan-tope">${esc(T("Pon tu precio en «Ajustes»"))}</span>`}${t.pago === "Mensual" ? " · " + esc(T("con la nómina")) : ""}</small>${unicos.map(x => `<small class="gan-nota">${esc(x)}</small>`).join("")}${l?.tope ? `<small class="gan-tope">${esc(T("Ya llevas el máximo de este mes: este no suma."))}</small>` : ""}</label>
        <div class="gan-ctrl">${control(t)}</div><span class="gan-imp">${l ? esc(eur(l.imp)) : ""}</span></li>`; };
    // ¿Dieta completa y partes el mismo día? Normalmente es una u otra
    const lleva = (p) => r.lineas.some(l => /dieta/i.test(l.t.grupo + " " + l.t.concepto) && p(l.t));
    const doble = lleva(t => CASILLA.includes(t.unidad) && /complet/i.test(t.grupo + " " + t.concepto)) && lleva(t => t.unidad === "vez" && !/carga/i.test(t.concepto));
    const anterior = Object.keys(DATOS.dias).filter(x => x < f && Object.keys(DATOS.dias[x] || {}).length).sort().pop();
    $("gan-dia").innerHTML = `<div class="gan-nav"><button type="button" class="btn-ic" data-dia="-1" aria-label="${esc(T("Día anterior"))}">${icono("izq")}</button>
        <label class="gan-fecha"><span>${esc(fDia(f, true))}${f === hoy() ? ` · ${esc(T("hoy"))}` : ""}</span><input type="date" id="gan-fecha" value="${f}" aria-label="${esc(T("Elegir día"))}"></label>
        <button type="button" class="btn-ic" data-dia="1" aria-label="${esc(T("Día siguiente"))}">${icono("der")}</button></div>
      <div class="gan-total"><span>${esc(T("Este día"))}</span><b>${esc(eur(r.total))}</b></div>
      ${(() => { const k = cuentasMes(c, f.slice(0, 7)); return `<button type="button" class="gan-mini-mes" data-ir-mes>${esc(fMes(f.slice(0, 7)))}: <span>${esc(T("nómina"))} <b>${esc(eur(k.nomina))}</b></span> <span>${esc(T("cada semana"))} <b>${esc(eur(k.semanal))}</b></span>${icono("der", "p")}</button>`; })()}
      ${doble ? `<p class="desc-alerta">${icono("alerta", "p")}<span>${esc(T("Has marcado la dieta completa y también partes de la dieta. Normalmente se cobra una cosa o la otra: revísalo."))}</span></p>` : ""}
      ${grupos.map(g => `<section class="gan-grupo">${g.n ? `<h3>${esc(TD(g.n))}</h3>` : ""}<ul>${g.ts.map(fila).join("")}</ul></section>`).join("")}
      ${lista.length < variables().length ? `<p class="ayuda">${esc(T("Hay conceptos escondidos. Los vuelves a sacar en «Ajustes»."))}</p>` : ""}
      <div class="botones">${anterior && !Object.keys(dia).length ? `<button class="btn sec" id="gan-copiar">${icono("copia", "p")}${esc(T("Copiar el día anterior ({fecha})", { fecha: fDia(anterior) }))}</button>` : ""}
        ${Object.keys(dia).length ? `<button class="btn sec" id="gan-vaciar">${icono("borrar", "p")}${esc(T("Vaciar este día"))}</button>` : ""}</div>`;
    const v = $("gan-dia"), pon = (id, n) => { const d = { ...(DATOS.dias[f] || {}) }; if (n > 0) d[id] = Math.round(n * 100) / 100; else delete d[id]; if (Object.keys(d).length) DATOS.dias[f] = d; else delete DATOS.dias[f]; guarda(); };
    v.querySelectorAll("[data-dia]").forEach(b => b.onclick = () => { DATOS.dia = suma(f, +b.dataset.dia); guarda(); pinta(); });
    v.querySelector("[data-ir-mes]").onclick = () => { DATOS.mes = f.slice(0, 7); DATOS.tab = "mes"; guarda(); pinta(); };
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
      <p class="ayuda">${esc(T("Sin el salario: es lo que suman las dietas, suplementos y pluses de la semana. El salario sale en «Mes»."))}</p>
      <div class="botones"><button class="btn sec" id="gan-pdf-semana">${icono("descargar", "p")}${esc(T("Descargar esta semana (PDF)"))}</button></div>`;
    const v = $("gan-semana");
    $("gan-pdf-semana").onclick = () => descarga(dias, "semana-" + dias[0]);
    v.querySelectorAll("[data-sem]").forEach(b => b.onclick = () => { DATOS.semana = suma(l, +b.dataset.sem); guarda(); pinta(); });
    v.querySelectorAll("[data-ir-dia]").forEach(b => b.onclick = () => { DATOS.dia = b.dataset.irDia; DATOS.tab = "dia"; guarda(); pinta(); });
  }

  function pintaMes(c) {
    const m = DATOS.mes || (DATOS.dia || hoy()).slice(0, 7), [a, mm] = m.split("-").map(Number), k = cuentasMes(c, m), r = k.r;
    const otroMes = (x) => iso(new Date(a, mm - 1 + x, 1)).slice(0, 7);
    const enNomina = r.por.filter(p => p.t.pago === "Mensual"), semanales = r.por.filter(p => p.t.pago !== "Mensual");
    $("gan-mes").innerHTML = `<div class="gan-nav"><button type="button" class="btn-ic" data-mes="-1" aria-label="${esc(T("Mes anterior"))}">${icono("izq")}</button>
        <b class="gan-fecha"><span>${esc(fMes(m))}</span></b>
        <button type="button" class="btn-ic" data-mes="1" aria-label="${esc(T("Mes siguiente"))}">${icono("der")}</button></div>
      <div class="gan-total"><span>${esc(T("Total del mes (bruto)"))}</span><b>${esc(eur(k.total))}</b></div>
      <div class="desc-cifras gan-cifras">
        <div><b>${esc(eur(k.nomina))}</b><span>${esc(T("Nómina del mes: salario, fijos y lo que se paga con la nómina (festivos, nocturnidad, ADR, horas sindicales…)"))}</span></div>
        <div><b>${esc(eur(k.semanal))}</b><span>${esc(T("Cada semana: dietas, suplementos, cargas y kilómetros de {n} días apuntados", { n: r.apuntados }))}</span></div>
      </div>
      <h3 class="gan-sub">${esc(T("Con la nómina"))}</h3>
      <ul class="gan-desglose">${k.fijos.map(x => `<li><span>${esc(TD(x.t.concepto))}${esPropio(x.t) ? ` <small>${esc(T("el tuyo, de «Ajustes»"))}</small>` : ""}</span><b>${esc(eur(x.imp))}</b></li>`).join("")}</ul>
      ${desglose({ por: enNomina })}
      ${semanales.length ? `<h3 class="gan-sub">${esc(T("Cada semana"))}</h3>${desglose({ por: semanales })}` : ""}
      ${r.por.length ? "" : `<p class="desc-vacio">${esc(T("Este mes todavía no has apuntado ningún día."))}</p>`}
      <p class="ayuda">${esc(T("Las horas extra y los descuentos (IRPF, Seguridad Social) no están incluidos. Si cobras antigüedad, pon tu salario en «Ajustes»."))}</p>`;
    $("gan-mes").querySelectorAll("[data-mes]").forEach(b => b.onclick = () => { DATOS.mes = otroMes(+b.dataset.mes); guarda(); pinta(); });
  }

  // ---------- Ajustes ----------
  function pintaResumenAj() {
    const caja = $("gan-aj-resumen"); if (!caja) return;
    const m = hoy().slice(0, 7), k = cuentasMes(calcula(), m);
    caja.innerHTML = `<b>${esc(T("Así queda {mes}", { mes: fMes(m) }))}</b><span>${esc(T("Nómina"))}: <b>${esc(eur(k.nomina))}</b></span><span>${esc(T("Cada semana"))}: <b>${esc(eur(k.semanal))}</b></span><span>${esc(T("Total"))}: <b>${esc(eur(k.total))}</b></span>`;
  }
  function pintaAjustes() {
    const fm = fijosMes(), vs = variables(), base = fm[0];
    const valor = (t) => { const p = DATOS.precio[t.id]; if (typeof p === "number") return String(p).replace(".", ","); return t === base && DATOS.salario ? String(DATOS.salario).replace(".", ",") : ""; };
    const grupos = []; TARIFAS.forEach(t => { let g = grupos.find(x => x.n === t.grupo); if (!g) grupos.push(g = { n: t.grupo, ts: [] }); g.ts.push(t); });
    $("gan-ajustes").innerHTML = `<div class="gan-aj-resumen" id="gan-aj-resumen" aria-live="polite"></div>
      <details class="gan-checks gan-precios" open><summary>${esc(T("Lo que cobras tú"))}</summary>
        <p class="ayuda">${esc(T("Cada persona cobra distinto (antigüedad, horas sindicales…). Pon tu importe donde no te cuadre la tabla; si lo dejas vacío, se usa el de la tabla."))}</p>
        ${grupos.map(g => `<div class="gan-precios-grupo">${g.n ? `<h4>${esc(TD(g.n))}</h4>` : ""}${g.ts.map(t => `<label class="gan-precio"><span>${esc(TD(t.concepto))}<small>${esc(UNIDAD()[t.unidad])}${t === base ? " · " + esc(T("con antigüedad")) : ""}</small></span>
          <input inputmode="decimal" data-precio="${t.id}" value="${esc(valor(t))}" placeholder="${esc(t.importe ? precio(t.importe) : T("tu precio"))}" aria-label="${esc(TD(t.concepto) + " · " + UNIDAD()[t.unidad])}"></label>`).join("")}</div>`).join("")}
      </details>
      ${fm.length ? `<fieldset class="gan-checks"><legend>${esc(T("Lo que cobro fijo cada mes"))}</legend>${fm.map(t => `<label class="check"><input type="checkbox" data-fijo="${t.id}" ${cobraFijo(t) ? "checked" : ""}><span>${esc(TD(t.concepto))} · ${esc(precio(imp(t)))}</span></label>`).join("")}</fieldset>` : ""}
      ${vs.length ? `<fieldset class="gan-checks"><legend>${esc(T("Conceptos que uso"))}</legend><p class="ayuda">${esc(T("Quita los que no usas nunca: salen de «Día» y no cuentan en los totales."))}</p>${vs.map(t => `<label class="check"><input type="checkbox" data-ver="${t.id}" ${DATOS.oculto[t.id] ? "" : "checked"}><span>${esc(TD(t.concepto))}${t.grupo && !t.concepto.includes(t.grupo) ? ` <small>· ${esc(TD(t.grupo))}</small>` : ""}</span></label>`).join("")}</fieldset>` : ""}`;
    const v = $("gan-ajustes");
    v.querySelectorAll("[data-precio]").forEach(i => i.onchange = () => {
      const id = i.dataset.precio, txt = String(i.value).trim(), n = parseFloat(txt.replace(",", "."));
      if (!txt) delete DATOS.precio[id]; else if (Number.isFinite(n) && n >= 0 && n < 100000) DATOS.precio[id] = Math.round(n * 1e8) / 1e8; else { i.value = valor(TARIFAS.find(t => String(t.id) === id)); return msg(T("Escribe solo el número, por ejemplo 12,50."), true); }
      if (base && id === String(base.id)) DATOS.salario = ""; // el salario va ya con los demás importes
      guarda(); msg(T("Guardado.")); pintaResumenAj();
      v.querySelectorAll("[data-fijo]").forEach(c => { const t = TARIFAS.find(x => String(x.id) === c.dataset.fijo); c.nextElementSibling.textContent = TD(t.concepto) + " · " + precio(imp(t)); });
    });
    v.querySelectorAll("[data-fijo]").forEach(i => i.onchange = () => { DATOS.fijo[i.dataset.fijo] = i.checked; guarda(); pintaResumenAj(); });
    v.querySelectorAll("[data-ver]").forEach(i => i.onchange = () => { if (i.checked) delete DATOS.oculto[i.dataset.ver]; else DATOS.oculto[i.dataset.ver] = true; guarda(); pintaResumenAj(); });
    pintaResumenAj(); pintaCalendario();
  }

  // ---------- Descargar por semanas o días (calendario) ----------
  let CAL = "", ELEGIDOS = new Set();
  function pintaCalendario() {
    const caja = $("gan-descarga"); if (!caja) return;
    const m = CAL || hoy().slice(0, 7), [a, mm] = m.split("-").map(Number), ini = lunesDe(m + "-01");
    const semanas = []; for (let l = ini; l.slice(0, 7) <= m || semanas.length === 0; l = suma(l, 7)) { if (l.slice(0, 7) > m) break; semanas.push(l); }
    const nombres = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(LOC, { weekday: "narrow" }));
    const hay = (f) => DATOS.dias[f] && Object.keys(DATOS.dias[f]).length;
    const n = ELEGIDOS.size, conDatos = [...ELEGIDOS].filter(hay).length;
    caja.innerHTML = `<h3 class="gan-sub">${esc(T("Descargar en PDF"))}</h3>
      <p class="ayuda">${esc(T("Toca los días o la semana entera (el botón de la izquierda) y descarga solo eso."))}</p>
      <div class="gan-nav"><button type="button" class="btn-ic" data-cmes="-1" aria-label="${esc(T("Mes anterior"))}">${icono("izq")}</button>
        <b class="gan-fecha"><span>${esc(fMes(m))}</span></b>
        <button type="button" class="btn-ic" data-cmes="1" aria-label="${esc(T("Mes siguiente"))}">${icono("der")}</button></div>
      <div class="gan-cal-rapido"><button type="button" class="filtro" data-crap="estasem">${esc(T("Esta semana"))}</button><button type="button" class="filtro" data-crap="pasada">${esc(T("La semana pasada"))}</button><button type="button" class="filtro" data-crap="mes">${esc(T("Todo el mes"))}</button>${n ? `<button type="button" class="filtro" data-crap="nada">${esc(T("Quitar"))}</button>` : ""}</div>
      <div class="gan-cal" role="grid" aria-label="${esc(fMes(m))}">
        <span></span>${nombres.map(x => `<span class="gan-cal-cab">${esc(x)}</span>`).join("")}
        ${semanas.map((l, i) => { const ds = Array.from({ length: 7 }, (_, k) => suma(l, k)), todas = ds.every(d => ELEGIDOS.has(d));
          return `<button type="button" class="gan-cal-sem ${todas ? "sel" : ""}" data-csem="${l}" aria-pressed="${todas}" aria-label="${esc(T("Semana del {a} al {b}", { a: fDia(ds[0]), b: fDia(ds[6]) }))}">${esc(T("S{n}", { n: i + 1 }))}</button>` +
            ds.map(d => `<button type="button" class="gan-cal-dia ${d.slice(0, 7) !== m ? "fuera" : ""} ${ELEGIDOS.has(d) ? "sel" : ""} ${hay(d) ? "con" : ""} ${d === hoy() ? "hoy" : ""}" data-cdia="${d}" aria-pressed="${ELEGIDOS.has(d)}" aria-label="${esc(fDia(d, true))}">${+d.slice(8)}</button>`).join(""); }).join("")}
      </div>
      <p class="gan-cal-ley"><span class="gan-cal-dia con"></span>${esc(T("con algo apuntado"))}</p>
      <div class="botones"><button class="btn" id="gan-pdf-elegidos" ${conDatos ? "" : "disabled"}>${icono("descargar", "p")}${esc(n ? T("Descargar {n} días elegidos (PDF)", { n }) : T("Elige días o semanas"))}</button></div>
      ${n && !conDatos ? `<p class="ayuda">${esc(T("En los días elegidos no hay nada apuntado."))}</p>` : ""}`;
    const semana = (l) => Array.from({ length: 7 }, (_, k) => suma(l, k));
    const pon = (ds) => { const todas = ds.every(d => ELEGIDOS.has(d)); ds.forEach(d => todas ? ELEGIDOS.delete(d) : ELEGIDOS.add(d)); pintaCalendario(); };
    caja.querySelectorAll("[data-cmes]").forEach(b => b.onclick = () => { CAL = iso(new Date(a, mm - 1 + +b.dataset.cmes, 1)).slice(0, 7); pintaCalendario(); });
    caja.querySelectorAll("[data-csem]").forEach(b => b.onclick = () => pon(semana(b.dataset.csem)));
    caja.querySelectorAll("[data-cdia]").forEach(b => b.onclick = () => { const d = b.dataset.cdia; ELEGIDOS.has(d) ? ELEGIDOS.delete(d) : ELEGIDOS.add(d); pintaCalendario(); });
    caja.querySelectorAll("[data-crap]").forEach(b => b.onclick = () => {
      const k = b.dataset.crap; ELEGIDOS = new Set();
      if (k === "estasem") { semana(lunesDe(hoy())).forEach(d => ELEGIDOS.add(d)); CAL = hoy().slice(0, 7); }
      if (k === "pasada") { const l = suma(lunesDe(hoy()), -7); semana(l).forEach(d => ELEGIDOS.add(d)); CAL = l.slice(0, 7); }
      if (k === "mes") { const dm = new Date(a, mm, 0).getDate(); for (let i = 1; i <= dm; i++) ELEGIDOS.add(`${m}-${String(i).padStart(2, "0")}`); }
      pintaCalendario();
    });
    $("gan-pdf-elegidos").onclick = () => { const ds = [...ELEGIDOS].sort(); descarga(ds, ds.length === 1 ? ds[0] : ds[0] + "-a-" + ds[ds.length - 1]); };
  }

  // ---------- PDF (siempre en español) ----------
  // Lleva dentro (en la «marca») los días que salen, para poder recuperarlos con «Recuperar una copia».
  const MARCA = "%CCOO-GANANCIAS:";
  function hazPDF(elegidos) {
    const locAntes = LOC, mapaAntes = MAPA; LOC = "es-ES"; MAPA = {};
    try {
      const c = calcula(), L = [], todos = !elegidos;
      const dias = (elegidos || Object.keys(DATOS.dias)).filter(f => c[f]?.lineas.length).sort();
      L.push(["Mis incentivos", 18, true], ["Sección Sindical CCOO Calsina Carré", 11], ["Hecho el " + new Date().toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }), 9]);
      if (dias.length) L.push([todos ? "Todo lo apuntado" : "Del " + fDia(dias[0], true) + " al " + fDia(dias[dias.length - 1], true), 11, true]);
      L.push([""]);
      if (!dias.length) L.push(["No hay nada apuntado en esos días."]);
      const semanas = [...new Set(dias.map(lunesDe))];
      semanas.forEach(l => {
        const ds = dias.filter(f => lunesDe(f) === l), r = resumen(c, ds);
        L.push(["Semana del " + fDia(l) + " al " + fDia(suma(l, 6)) + ": " + eur(r.total), 13, true]);
        ds.forEach(f => { const x = c[f]; L.push([fDia(f, true) + ": " + eur(x.total), 10, true, 6]); L.push([x.lineas.map(li => li.t.concepto + (cantidadTxt(li.t, li.n) ? " " + cantidadTxt(li.t, li.n) : "") + " " + eur(li.imp)).join(" · "), 9, false, 14]); });
        L.push(["Cada semana: " + eur(r.semanal) + " · Con la nómina: " + eur(r.mensual), 9, false, 6], [""]);
      });
      if (semanas.length > 1) { const r = resumen(c, dias); L.push(["Total de estos días: " + eur(r.total) + " (cada semana " + eur(r.semanal) + " · con la nómina " + eur(r.mensual) + ")", 12, true], [""]); }
      L.push(["Sin el salario ni los fijos del mes. Orientativo y en bruto: manda tu nómina.", 8], ["Para volver a cargar estos días en la app: Zona Conductores > Mis incentivos > Ajustes > Recuperar una copia, y elige este PDF.", 8]);
      const datos = { app: "ccoo-ganancias", dias: Object.fromEntries((elegidos ? dias : Object.keys(DATOS.dias)).map(f => [f, DATOS.dias[f]])), salario: DATOS.salario, precio: DATOS.precio, oculto: DATOS.oculto, fijo: DATOS.fijo };
      return pdfSencillo(L, MARCA + btoa(unescape(encodeURIComponent(JSON.stringify(datos)))));
    } finally { LOC = locAntes; MAPA = mapaAntes; }
  }
  function descarga(dias, nombre) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(hazPDF(dias)); a.download = "mis-incentivos-" + nombre + ".pdf";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- Arranque ----------
  function prepara() {
    if (!$("v-ganancias")) return;
    document.querySelectorAll("#v-ganancias [data-gtab]").forEach(b => b.onclick = () => { DATOS.tab = b.dataset.gtab; guarda(); pinta(); });
    $("gan-copia").onclick = () => descarga(null, "copia-" + hoy());
    $("gan-recupera").onchange = async () => {
      const f = $("gan-recupera").files[0]; $("gan-recupera").value = ""; if (!f) return;
      try {
        const d = leePDFSencillo(await f.text(), MARCA);
        if (d.app !== "ccoo-ganancias" || !d.dias || typeof d.dias !== "object") throw 0;
        const dias = {};
        Object.entries(d.dias).forEach(([k, x]) => { if (/^\d{4}-\d\d-\d\d$/.test(k) && x && typeof x === "object") { const y = {}; Object.entries(x).forEach(([id, n]) => { if (/^\d+$/.test(id) && num(n)) y[id] = num(n); }); if (Object.keys(y).length) dias[k] = y; } });
        // Se añaden a lo que ya hay (los mismos días se sustituyen): así sirven también los PDF de una semana
        if (!confirm(T("La copia tiene {n} días apuntados. Se añaden a lo que tienes en este móvil (si un día ya está, se cambia por el de la copia). ¿Seguir?", { n: Object.keys(dias).length }))) return;
        const limpio = (o) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).filter(([k]) => /^\d+$/.test(k)).map(([k, v]) => [k, !!v]));
        const precios = Object.fromEntries(Object.entries(d.precio && typeof d.precio === "object" ? d.precio : {}).filter(([k, v]) => /^\d+$/.test(k) && Number.isFinite(+v) && +v >= 0 && +v < 100000).map(([k, v]) => [k, +v]));
        DATOS = { ...DATOS, dias: { ...DATOS.dias, ...dias }, salario: num(d.salario) ? String(num(d.salario)) : DATOS.salario, precio: { ...DATOS.precio, ...precios }, oculto: { ...DATOS.oculto, ...limpio(d.oculto) }, fijo: { ...DATOS.fijo, ...limpio(d.fijo) }, tab: "ajustes" };
        guarda(); pinta(); msg(T("Copia recuperada."));
      } catch (_) { msg(T("Ese archivo no es una copia de «Mis incentivos». Elige el PDF que guardaste con «Guardar una copia»."), true); }
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
