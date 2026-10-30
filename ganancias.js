// ===== «Mis incentivos»: lo que gana el conductor cada día, semana y mes (Zona Conductores, v81) =====
// Los importes (salario, dietas, suplementos, pluses) los pone el padre en el panel (tabla tarifas_conductor, página
// «Importes conductores»). Cada concepto tiene una unidad que dice cómo se apunta:
//   mes → fijo al mes (salario, plus fijo); dia/noche/finde → casilla (sí o no ese día); vez → contador; hora/km/minuto → número.
// sin_pagar = las primeras N de cada día no se pagan (p. ej. la primera carga). max_mes = como mucho N al mes (fin de semana x2).
// Lo apuntado se guarda SOLO en este móvil (localStorage «ccoo-ganancias»): no va a ningún servidor.
// v83: cada conductor puede poner su propio importe de cualquier concepto (DATOS.precio, «Lo que cobras tú»): cada uno cobra
// distinto (antigüedad, horas sindicales…). Los conceptos que quita en Ajustes no cuentan. La nómina del mes suma el salario,
// los fijos y lo que se paga «Mensual» (nocturnidad, ADR; festivo y las horas sindicales son semanales desde la v88). Descargar en PDF por semanas o días
// elegidos en un calendario.
(function () {
  const CLAVE = "ccoo-ganancias", CACHE_TARIFAS = "ccoo-tarifas";
  const DEF = () => ({ dias: {}, salario: "", precio: {}, oculto: {}, fijo: {}, tab: "dia", dia: "", semana: "", mes: "", inicio: "" });
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
  // v95: cada paso lleva su botón «Ir» (pestaña y sitio al que lleva)
  const GUIA = () => [
    [T("Cada día"), T("En «Día», marca lo que has hecho: dieta completa o partes (dormir, desayuno, comida, cena), noche fuera, cargas, kilómetros… El total sale arriba y se guarda solo."), { tab: "dia", sel: "#gan-dia .gan-total" }],
    [T("Otro día"), T("Cambia de día con las flechas o tocando la fecha. «Copiar el día anterior» rellena lo mismo que el último día apuntado."), { tab: "dia", sel: "#gan-dia .gan-nav" }],
    [T("El ADR"), T("En «Día», el ADR se apunta en horas y minutos: las horas arriba y los minutos abajo. Ves el precio por hora y por minuto, y va en el cobro semanal."), { tab: "dia", sel: () => document.querySelector("#gan-dia [data-hm]")?.closest(".gan-fila") }],
    [T("Cobro semanal y nómina"), T("Lo que la empresa paga por semanas (dietas, suplementos, cargas, kilómetros, festivos, ADR por minuto, horas sindicales) sale como «Cobro semanal». Lo que va con el salario a fin de mes (nocturnidad, ADR fijo) sale como «En la nómina». Es la columna «Periodicidad pago» de la tabla de la empresa."), { tab: "mes", sel: "#gan-mes .gan-cifras" }],
    [T("La semana y el mes"), T("Arriba del todo ves siempre lo de hoy, lo de esta semana y lo del mes: toca una cifra para ir a esa vista. En «Semana» va cada día con la semana del año (la 44, la 45…) y puedes ir a una escribiendo su número. En «Mes», el total con el salario y lo que se cobra con la nómina, semana por semana."), { sel: "#gan-tira" }],
    [T("La hoja de trabajo"), T("En «Semana», abajo, haz una foto a la hoja de papel de esa semana (o elígela de la galería). Se guarda en este móvil con esa semana y la puedes bajar en PDF A4 para imprimirla. Cada semana tiene la suya."), { tab: "semana", sel: "#gan-hoja .botones" }],
    [T("Lo que cobras tú"), T("En «Ajustes», pon tu salario y lo que cobras tú de cada cosa (por ejemplo, el precio de tus horas sindicales). Si lo dejas vacío, se usa el de la tabla."), { tab: "ajustes", sel: "#gan-ajustes .gan-precios" }],
    [T("Descargar y enviar"), T("En «Semana» y en «Mes» hay un botón para descargar el PDF y otro para enviarlo por WhatsApp a un delegado si algo no cuadra. En «Ajustes», elige en el calendario las semanas o los días que quieras."), { tab: "ajustes", sel: "#gan-descarga" }],
    [T("Copia de seguridad"), T("Lo apuntado se guarda solo en este móvil. En «Ajustes», «Copia de todo (PDF)» lo guarda y «Recuperar una copia» lo vuelve a poner (por ejemplo, en un móvil nuevo). Las fotos de la hoja no van en la copia: descárgalas en PDF."), { tab: "ajustes", sel: "#gan-copia" }],
  ];
  function pintaFijos() {
    const f = FIJOS(), v = $("v-ganancias"), idi = miIdioma();
    v.querySelectorAll("[data-gt]").forEach(el => { const t = f[el.dataset.gt]; if (t) el.textContent = t; });
    const pasos = GUIA(), guia = $("gan-guia-cuerpo");
    guia.innerHTML = guiaPasosHTML(pasos, { ir: T("Ir"), irA: (t) => T("Ir a: {t}", { t }) });
    guia.querySelectorAll("[data-guia-ir]").forEach(b => b.onclick = () => { const d = pasos[+b.dataset.guiaIr][2]; if (d.tab) { DATOS.tab = d.tab; guarda(); pinta(); } irAGuia(d.sel); });
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
      TARIFAS = data.filter(t => t.visible !== false).map(t => ({ id: t.id, grupo: t.grupo || "", concepto: t.concepto, importe: +t.importe || 0, unidad: t.unidad, pago: t.pago, sin_pagar: +t.sin_pagar || 0, max_mes: +t.max_mes > 0 ? +t.max_mes : null, /* 0 o vacío = sin tope */ nota: t.nota || "", nuevo: +t.importe_nuevo > 0 ? +t.importe_nuevo : null, desde: /^\d{4}-\d\d-\d\d$/.test(t.desde || "") ? t.desde : null }));
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
  // v89: el precio de la tabla depende del día: desde «desde» vale el importe nuevo (la tabla de 2027 a partir del 1 de enero, por ejemplo);
  // los días de antes siguen con el de siempre. Sin día, el de hoy.
  const base = (t, f) => t.nuevo != null && t.desde && (f || hoy()) >= t.desde ? t.nuevo : t.importe;
  const imp = (t, f) => { const p = DATOS.precio[t.id]; if (typeof p === "number" && p >= 0) return p; if (t === fijosMes()[0] && salarioPropio()) return salarioPropio(); return base(t, f); };
  const esPropio = (t, f) => imp(t, f) !== base(t, f);
  const usa = (t) => !DATOS.oculto[t.id];

  // ---------- Fechas (días como «aaaa-mm-dd», hora local) ----------
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const deIso = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d, 12); };
  const suma = (s, n) => { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const lunesDe = (s) => { const d = deIso(s); return suma(s, -((d.getDay() + 6) % 7)); };
  const hoy = () => iso(new Date());
  // Semana del año (ISO, la de los calendarios de pared y los tacógrafos): «Semana 44». Lo pidió el padre en la v84.
  const semDe = (s) => semanaISO(deIso(s));
  const semTxt = (s) => T("Semana {n}", { n: semDe(s).n });
  const nombreSem = (l) => { const w = semDe(l); return "semana-" + w.n + "-" + w.a; };
  const diasDe = (l) => Array.from({ length: 7 }, (_, i) => suma(l, i));
  const fDia = (s, larga) => deIso(s).toLocaleDateString(LOC, larga ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" });
  const fMes = (m) => deIso(m + "-01").toLocaleDateString(LOC, { month: "long", year: "numeric" });
  const eur = (n) => (Math.round(n * 100) / 100).toLocaleString(LOC, { style: "currency", currency: "EUR" });
  const precio = (n) => n.toLocaleString(LOC, { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 }) + " €"; // v86: 0,0081 € y no 0,00812196 €
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
        const im = pagadas * imp(t, f);
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
    const fijos = fijosMes().filter(cobraFijo).map(t => ({ t, imp: imp(t, m + "-01") })), totalFijo = fijos.reduce((s, x) => s + x.imp, 0);
    return { r, fijos, totalFijo, nomina: totalFijo + r.mensual, semanal: r.semanal, total: totalFijo + r.total };
  }
  const hm = (n) => ({ h: Math.floor(n / 60), m: Math.round((n - Math.floor(n / 60) * 60) * 100) / 100 });
  const horasMin = (n) => { const { h, m } = hm(n); return h && m ? T("{h} h {m} min", { h, m: m.toLocaleString(LOC) }) : h ? T("{h} h", { h }) : T("{m} min", { m: m.toLocaleString(LOC) }); };
  const cantidadTxt = (t, n) => CASILLA.includes(t.unidad) ? (n === 1 ? "" : "× " + n) : t.unidad === "vez" ? "× " + n : t.unidad === "minuto" ? horasMin(n) : n.toLocaleString(LOC, { maximumFractionDigits: 2 }) + " " + QUE()[t.unidad];
  // v96: nacional, internacional y GB-CG-MA tienen conceptos que se llaman igual (Dormir, Desayuno…): cada fila lleva su etiqueta (lo pidió el padre)
  const zona = (t) => /GB-CG-MA/i.test(t.grupo) ? "gb" : /internacional/i.test(t.grupo) ? "int" : /nacional/i.test(t.grupo) ? "nac" : "";
  const ZONA_TXT = () => ({ nac: T("Nacional"), int: T("Internacional"), gb: T("GB-CG-MA") });
  const zonaHTML = (t) => { const z = zona(t); return z && !new RegExp(z === "gb" ? "GB-CG-MA" : z === "int" ? "internacional" : "\\bnacional", "i").test(t.concepto) ? `<span class="gan-zona z-${z}">${esc(ZONA_TXT()[z])}</span>` : ""; };
  const nombreC = (t) => { const z = zona(t); return t.concepto + (zonaHTML(t) ? " (" + { nac: "nacional", int: "internacional", gb: "GB-CG-MA" }[z] + ")" : ""); };
  const desglose = (r) => r.por.length ? `<ul class="gan-desglose">${r.por.map(p => `<li><span>${esc(TD(p.t.concepto))}${p.t.grupo && !p.t.concepto.includes(p.t.grupo) ? ` <small>· ${esc(TD(p.t.grupo))}</small>` : ""}${p.n && cantidadTxt(p.t, p.n) ? ` <small>${esc(cantidadTxt(p.t, p.n))}</small>` : ""}${p.tope ? ` <small class="gan-tope">${esc(p.n ? T("con tope al mes") : T("no suma: ya estaba el máximo del mes"))}</small>` : ""}</span><b>${esc(eur(p.imp))}</b></li>`).join("")}</ul>` : "";
  const reparto = (r) => r.semanal && r.mensual ? `<p class="gan-reparto"><span>${esc(T("Cobro semanal"))}: <b>${esc(eur(r.semanal))}</b></span><span>${esc(T("En la nómina de fin de mes"))}: <b>${esc(eur(r.mensual))}</b></span></p>` : "";

  // ---------- Pintar ----------
  // Las cifras que cambian dan un pequeño «salto» (clase gan-pulsa): se compara el texto de antes con el de después
  const antesDe = (sel) => [...document.querySelectorAll(sel)].map(e => e.textContent);
  const pulsa = (sel, antes) => { if (!antes.length) return; [...document.querySelectorAll(sel)].forEach((e, i) => { if (antes[i] !== undefined && antes[i] !== e.textContent) { e.classList.remove("gan-pulsa"); void e.offsetWidth; e.classList.add("gan-pulsa"); } }); };
  function pintaTira(c) {
    const caja = $("gan-tira"); if (!caja) return;
    const h = hoy(), l = lunesDe(h), m = h.slice(0, 7), w = semDe(h), rs = resumen(c, diasDe(l)), k = cuentasMes(c, m), TAB = DATOS.tab || "dia";
    const antes = antesDe("#gan-tira b");
    const celda = (tab, et, v, extra) => `<button type="button" data-tira="${tab}" class="${TAB === tab ? "activa" : ""}" aria-current="${TAB === tab ? "true" : "false"}"><span>${esc(et)}</span><b>${esc(eur(v))}</b>${extra ? `<small>${esc(extra)}</small>` : ""}</button>`;
    caja.innerHTML = celda("dia", T("Hoy"), c[h]?.total || 0, fDia(h)) + celda("semana", T("Semana {n}", { n: w.n }), rs.total, T("incentivos")) + celda("mes", fMes(m).replace(/ de \d{4}$| \d{4}$/, ""), k.total, T("con el salario"));
    pulsa("#gan-tira b", antes);
    caja.querySelectorAll("[data-tira]").forEach(b => b.onclick = () => { DATOS.tab = b.dataset.tira; DATOS.dia = h; DATOS.semana = ""; DATOS.mes = ""; guarda(); pinta(); });
  }
  function pinta() {
    const v = $("v-ganancias"); if (!v) return;
    const TAB = DATOS.tab || "dia";
    v.querySelectorAll("[data-gtab]").forEach(b => { const on = b.dataset.gtab === TAB; b.classList.toggle("activa", on); b.setAttribute("aria-selected", String(on)); });
    v.querySelectorAll("[data-gpanel]").forEach(p => { p.hidden = p.dataset.gpanel !== TAB; });
    const inst = typeof INSTALADA === "function" && INSTALADA();
    $("gan-app").innerHTML = `<details class="desc-mini"><summary>${icono(inst ? "alerta" : "movil", "p")}<span>${esc(inst ? T("Para no perder lo apuntado") : T("Instala la app para no perder lo apuntado"))}</span></summary><div><p>${esc(T("Se guarda solo en este móvil (no en internet). Se pierde si borras los datos de la app o del navegador, si usas una pestaña de incógnito o si cambias de móvil. Guarda de vez en cuando la copia en PDF (en «Ajustes»)."))}</p>${inst ? "" : `<button class="btn" id="gan-instalar">${icono("descargar", "p")}${esc(T("Instalar la app"))}</button>`}</div></details>`;
    if ($("gan-instalar")) $("gan-instalar").onclick = () => instalar();
    if (!TARIFAS.length) { ["gan-dia", "gan-semana", "gan-mes"].forEach(id => $(id).innerHTML = `<p class="desc-vacio">${esc(T("Cargando los importes… Si no salen, comprueba la conexión."))}</p>`); $("gan-tira").innerHTML = ""; pintaAjustes(); return; }
    const c = calcula();
    pintaTira(c);
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
      if (t.unidad === "minuto") { const { h, m } = hm(n), val = (x) => x ? esc(String(x).replace(".", ",")) : ""; // v94: horas arriba y minutos abajo (se guardan como minutos)
        return `<span class="gan-hm"><label><input id="${id}" class="gan-hm-i" data-hm="${t.id}" data-parte="h" inputmode="numeric" value="${val(h)}" placeholder="0" aria-label="${esc(T("horas"))}"><small>${esc(T("horas"))}</small></label><label><input class="gan-hm-i" data-hm="${t.id}" data-parte="m" inputmode="decimal" value="${val(m)}" placeholder="0" aria-label="${esc(T("minutos"))}"><small>${esc(T("minutos"))}</small></label></span>`; }
      return `<input id="${id}" class="gan-num" data-c="${t.id}" inputmode="decimal" value="${n ? esc(String(n).replace(".", ",")) : ""}" placeholder="0" aria-label="${esc(QUE()[t.unidad])}"><small>${esc(QUE()[t.unidad])}</small>`;
    };
    const fila = (t) => { const l = linea(t), nota = [t.nota && TD(t.nota),
        // v89: si el precio va a cambiar después de este día, se avisa («Desde el 1 de enero de 2027: 50,82 €»)
        t.nuevo != null && t.desde && f < t.desde && !esPropio(t, t.desde) ? T("Desde el {d}: {p}", { d: deIso(t.desde).toLocaleDateString(LOC, { day: "numeric", month: "long", year: "numeric" }), p: precio(t.nuevo) }) : "", t.sin_pagar ? (t.sin_pagar === 1 ? T("La primera de cada día no se paga.") : T("Las primeras {n} de cada día no se pagan.", { n: t.sin_pagar })) : "", t.max_mes != null ? T("Como mucho {n} al mes.", { n: t.max_mes }) : ""].filter(Boolean);
      const unicos = [...new Set(nota)];
      return `<li class="gan-fila ${l ? "con" : ""} ${zonaHTML(t) ? "con-zona" : ""}">${zonaHTML(t)}<label for="gan-c${t.id}"><b>${esc(TD(t.concepto))}</b><small>${imp(t, f) ? `${t.unidad === "minuto" ? esc(T("{h} por hora · {m} por minuto", { h: eur(imp(t, f) * 60), m: precio(imp(t, f)) })) : `${esc(precio(imp(t, f)))} ${esc(UNIDAD()[t.unidad])}`}${esPropio(t, f) ? " · " + esc(T("el tuyo")) : ""}` : `<span class="gan-tope">${esc(T("Pon tu precio en «Ajustes»"))}</span>`}${t.pago === "Mensual" ? " · " + esc(T("en la nómina")) : " · " + esc(T("cobro semanal"))}</small>${unicos.map(x => `<small class="gan-nota">${esc(x)}</small>`).join("")}${l?.tope ? `<small class="gan-tope">${esc(T("Ya llevas el máximo de este mes: este no suma."))}</small>` : ""}</label>
        <div class="gan-ctrl">${control(t)}</div><span class="gan-imp">${l ? esc(eur(l.imp)) : ""}</span></li>`; };
    // ¿Dieta completa y partes el mismo día? Normalmente es una u otra
    const lleva = (p) => r.lineas.some(l => /dieta/i.test(l.t.grupo + " " + l.t.concepto) && p(l.t));
    const doble = lleva(t => CASILLA.includes(t.unidad) && /complet/i.test(t.grupo + " " + t.concepto)) && lleva(t => t.unidad === "vez" && !/carga/i.test(t.concepto));
    const anterior = Object.keys(DATOS.dias).filter(x => x < f && Object.keys(DATOS.dias[x] || {}).length).sort().pop();
    const antes = antesDe("#gan-dia .gan-total b, #gan-dia .gan-mini-mes b");
    $("gan-dia").innerHTML = `<div class="gan-nav"><button type="button" class="btn-ic" data-dia="-1" aria-label="${esc(T("Día anterior"))}">${icono("izq")}</button>
        <label class="gan-fecha"><span>${esc(fDia(f, true))}${f === hoy() ? ` · ${esc(T("hoy"))}` : ""}</span><small class="gan-sem-n">${esc(semTxt(f))}</small><input type="date" id="gan-fecha" value="${f}" aria-label="${esc(T("Elegir día"))}"></label>
        <button type="button" class="btn-ic" data-dia="1" aria-label="${esc(T("Día siguiente"))}">${icono("der")}</button></div>
      <div class="gan-total"><span>${esc(T("Este día"))}</span><b>${esc(eur(r.total))}</b></div>
      ${(() => { const k = cuentasMes(c, f.slice(0, 7)); return `<button type="button" class="gan-mini-mes" data-ir-mes><span>${esc(T("Nómina de {mes}", { mes: fMes(f.slice(0, 7)) }))} <b>${esc(eur(k.nomina))}</b></span> <span>${esc(T("Cobro semanal del mes"))} <b>${esc(eur(k.semanal))}</b></span>${icono("der", "p")}</button>`; })()}
      ${doble ? `<p class="desc-alerta">${icono("alerta", "p")}<span>${esc(T("Has marcado la dieta completa y también partes de la dieta. Normalmente se cobra una cosa o la otra: revísalo."))}</span></p>` : ""}
      ${grupos.map(g => `<section class="gan-grupo ${g.ts[0] && zona(g.ts[0]) ? "z-" + zona(g.ts[0]) : ""}">${g.n ? `<h3>${esc(TD(g.n))}</h3>` : ""}<ul>${g.ts.map(fila).join("")}</ul></section>`).join("")}
      ${lista.length < variables().length ? `<p class="ayuda">${esc(T("Hay conceptos escondidos. Los vuelves a sacar en «Ajustes»."))}</p>` : ""}
      <div class="botones">${anterior && !Object.keys(dia).length ? `<button class="btn sec" id="gan-copiar">${icono("copia", "p")}${esc(T("Copiar el día anterior ({fecha})", { fecha: fDia(anterior) }))}</button>` : ""}
        ${Object.keys(dia).length ? `<button class="btn sec" id="gan-vaciar">${icono("borrar", "p")}${esc(T("Vaciar este día"))}</button>` : ""}</div>`;
    pulsa("#gan-dia .gan-total b, #gan-dia .gan-mini-mes b", antes);
    const v = $("gan-dia"), pon = (id, n) => { const d = { ...(DATOS.dias[f] || {}) }; if (n > 0) d[id] = Math.round(n * 100) / 100; else delete d[id]; if (Object.keys(d).length) DATOS.dias[f] = d; else delete DATOS.dias[f]; guarda(); };
    v.querySelectorAll("[data-dia]").forEach(b => b.onclick = () => { DATOS.dia = suma(f, +b.dataset.dia); guarda(); pinta(); });
    v.querySelector("[data-ir-mes]").onclick = () => { DATOS.mes = f.slice(0, 7); DATOS.tab = "mes"; guarda(); pinta(); };
    $("gan-fecha").onchange = () => { if (/^\d{4}-\d\d-\d\d$/.test($("gan-fecha").value)) { DATOS.dia = $("gan-fecha").value; guarda(); pinta(); } };
    v.querySelectorAll("input[type=checkbox][data-c]").forEach(i => i.onchange = () => { pon(i.dataset.c, i.checked ? 1 : 0); pinta(); });
    v.querySelectorAll("[data-mas],[data-menos]").forEach(b => b.onclick = () => { const id = b.dataset.mas || b.dataset.menos; pon(id, Math.max(0, num(dia[id]) + (b.dataset.mas ? 1 : -1))); pinta(); $(`gan-c${id}`)?.parentElement.querySelector(b.dataset.mas ? "[data-mas]" : "[data-menos]")?.focus(); });
    v.querySelectorAll(".gan-hm-i").forEach(i => i.onchange = () => { const q = (p) => v.querySelector(`[data-hm="${i.dataset.hm}"][data-parte="${p}"]`).value; pon(i.dataset.hm, Math.min(Math.floor(num(q("h"))) * 60 + num(q("m")), 100000)); pinta(); });
    v.querySelectorAll(".gan-num").forEach(i => i.onchange = () => { pon(i.dataset.c, Math.min(num(i.value), 100000)); pinta(); });
    if ($("gan-copiar")) $("gan-copiar").onclick = () => { DATOS.dias[f] = { ...DATOS.dias[anterior] }; guarda(); pinta(); };
    if ($("gan-vaciar")) $("gan-vaciar").onclick = () => { if (!confirm(T("¿Vaciar lo apuntado este día?"))) return; delete DATOS.dias[f]; guarda(); pinta(); };
  }

  // ---------- Hoja de trabajo de la semana (v94): fotos guardadas SOLO en este móvil (IndexedDB) y pasadas a PDF A4 ----------
  const HOJAS_MAX = 6;
  const hojaBD = () => new Promise((ok, no) => { try { const r = indexedDB.open("ccoo-ganancias-hojas", 1); r.onupgradeneeded = () => r.result.createObjectStore("hojas"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } });
  const hojaOp = async (modo, f) => { const db = await hojaBD(); return new Promise((ok, no) => { const t = db.transaction("hojas", modo), r = f(t.objectStore("hojas")); t.oncomplete = () => { db.close(); ok(r.result); }; t.onerror = t.onabort = () => { db.close(); no(t.error); }; }); };
  const hojaClave = (w) => w.a + "-" + String(w.n).padStart(2, "0");
  const hojaLee = (w) => hojaOp("readonly", st => st.get(hojaClave(w))).then(x => Array.isArray(x) ? x : []).catch(() => []);
  const hojaGuarda = (w, paginas) => hojaOp("readwrite", st => paginas.length ? st.put(paginas, hojaClave(w)) : st.delete(hojaClave(w)));
  // La foto se endereza (EXIF), se reduce a 2000 px y pasa a JPEG: pesa poco y cabe bien en una hoja A4
  async function fotoAJpeg(file) {
    const bm = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, 2000 / Math.max(bm.width, bm.height)), c = document.createElement("canvas");
    c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(bm, 0, 0, c.width, c.height); bm.close && bm.close();
    const blob = await new Promise(res => c.toBlob(res, "image/jpeg", .85));
    if (!blob) throw 0;
    return { w: c.width, h: c.height, blob };
  }
  // PDF con una foto por página (A4, vertical u horizontal según la foto), hecho a mano como los demás
  async function pdfHoja(paginas, titulo) {
    const enc = (t) => Uint8Array.from(t, ch => ch.charCodeAt(0) & 255), trozos = [], pos = [];
    let largo = 0; const pon = (x) => { const u = typeof x === "string" ? enc(x) : x; trozos.push(u); largo += u.length; };
    const obj = (n, cabeza, datos) => { pos[n] = largo; pon(`${n} 0 obj\n${cabeza}\n`); if (datos) { pon("stream\n"); pon(datos); pon("\nendstream\n"); } pon("endobj\n"); };
    pon("%PDF-1.4\n");
    const kids = paginas.map((_, i) => 4 + i * 3);
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(2, `<< /Type /Pages /Count ${paginas.length} /Kids [${kids.map(k => k + " 0 R").join(" ")}] >>`);
    obj(3, "<< /Title (" + titulo.replace(/[^\x20-\x7e]/g, "").replace(/[()\\]/g, "") + ") >>");
    for (let i = 0; i < paginas.length; i++) {
      const p = paginas[i], n = 4 + i * 3, ap = p.w > p.h, W = ap ? 842 : 595, H = ap ? 595 : 842, M = 18;
      const k = Math.min((W - 2 * M) / p.w, (H - 2 * M) / p.h), w = p.w * k, h = p.h * k, x = (W - w) / 2, y = (H - h) / 2;
      const cont = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
      obj(n, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`);
      obj(n + 1, `<< /Length ${cont.length} >>`, enc(cont));
      const bytes = new Uint8Array(await p.blob.arrayBuffer());
      obj(n + 2, `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`, bytes);
    }
    const ini = largo, total = 4 + paginas.length * 3;
    pon(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let n = 1; n < total; n++) pon(String(pos[n]).padStart(10, "0") + " 00000 n \n");
    pon(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${ini}\n%%EOF\n`);
    return new Blob(trozos, { type: "application/pdf" });
  }
  async function hojaPDF(w, accion) {
    const paginas = await hojaLee(w); if (!paginas.length) return;
    const nombre = `hoja-de-trabajo-semana-${w.n}-${w.a}.pdf`, pdf = await pdfHoja(paginas, "Hoja de trabajo semana " + w.n + " de " + w.a);
    if (accion === "enviar") { try { await navigator.share({ files: [new File([pdf], nombre, { type: "application/pdf" })], title: nombre }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(pdf); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function pintaHoja(w) {
    const caja = $("gan-hoja"); if (!caja) return;
    const pag = await hojaLee(w); if (!$("gan-hoja") || $("gan-hoja") !== caja) return;
    const urls = pag.map(p => URL.createObjectURL(p.blob)), llena = pag.length >= HOJAS_MAX;
    caja.innerHTML = `<h3 class="gan-sub">${esc(T("Hoja de trabajo de la semana {n}", { n: w.n }))}</h3>
      <p class="ayuda">${esc(T("Haz una foto a la hoja de la semana: se guarda aquí y la puedes bajar en PDF para imprimirla. Se queda solo en este móvil."))}</p>
      ${pag.length ? `<ul class="gan-hoja-lista">${pag.map((p, i) => `<li><img src="${urls[i]}" alt="${esc(T("Página {n} de la hoja", { n: i + 1 }))}" loading="lazy"><button type="button" class="btn sec" data-hoja-quita="${i}">${esc(T("Quitar"))}</button></li>`).join("")}</ul>` : ""}
      <div class="botones">
        <label class="btn ${pag.length ? "sec" : ""} ${llena ? "desact" : ""}" for="gan-hoja-cam">${icono("camara", "p")}${esc(pag.length ? T("Otra foto") : T("Hacer foto a la hoja"))}</label>
        <label class="btn sec ${llena ? "desact" : ""}" for="gan-hoja-gal">${icono("subir", "p")}${esc(T("Elegir de la galería"))}</label>
        <input type="file" id="gan-hoja-cam" accept="image/*" capture="environment" hidden><input type="file" id="gan-hoja-gal" accept="image/*" multiple hidden>
      </div>
      ${pag.length ? `<div class="botones"><button class="btn" id="gan-hoja-pdf">${icono("descargar", "p")}${esc(T("Descargar la hoja en PDF"))}</button>${puedeCompartir() ? `<button class="btn sec" id="gan-hoja-env">${icono("compartir", "p")}${esc(T("Enviar"))}</button>` : ""}</div>` : ""}
      <p class="msg" id="gan-hoja-msg" role="status"></p>`;
    const m = (t, mal) => { const e = $("gan-hoja-msg"); if (e) { e.textContent = t; e.className = "msg " + (mal ? "err" : "ok"); } };
    const anade = async (ficheros) => {
      const lista = [...ficheros].filter(f => /^image\//.test(f.type)).slice(0, HOJAS_MAX - pag.length);
      if (!lista.length) return m(llena ? T("Ya hay {n} páginas: quita alguna para añadir otra.", { n: HOJAS_MAX }) : T("Elige una foto."), true);
      m(T("Guardando…"));
      try { const nuevas = []; for (const f of lista) nuevas.push(await fotoAJpeg(f)); await hojaGuarda(w, [...pag, ...nuevas]); if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); }
      catch (_) { return m(T("No he podido guardar la foto. Prueba con otra."), true); }
      urls.forEach(u => URL.revokeObjectURL(u)); pintaHoja(w);
    };
    $("gan-hoja-cam").onchange = (e) => { const f = [...e.target.files]; e.target.value = ""; anade(f); };
    $("gan-hoja-gal").onchange = (e) => { const f = [...e.target.files]; e.target.value = ""; anade(f); };
    caja.querySelectorAll("[data-hoja-quita]").forEach(b => b.onclick = async () => { if (!confirm(T("¿Quitar esta página de la hoja?"))) return; await hojaGuarda(w, pag.filter((_, i) => i !== +b.dataset.hojaQuita)).catch(() => {}); urls.forEach(u => URL.revokeObjectURL(u)); pintaHoja(w); });
    if ($("gan-hoja-pdf")) $("gan-hoja-pdf").onclick = () => hojaPDF(w, "descarga").catch(() => m(T("No he podido hacer el PDF."), true));
    if ($("gan-hoja-env")) $("gan-hoja-env").onclick = () => hojaPDF(w, "enviar").catch(() => m(T("No he podido hacer el PDF."), true));
  }

  function pintaSemana(c) {
    const l = DATOS.semana || lunesDe(DATOS.dia || hoy()), dias = diasDe(l), r = resumen(c, dias), w = semDe(l), esta = lunesDe(hoy());
    const pasada = resumen(c, diasDe(suma(l, -7))), wp = semDe(suma(l, -7));
    $("gan-semana").innerHTML = `<div class="gan-nav"><button type="button" class="btn-ic" data-sem="-7" aria-label="${esc(T("Semana anterior"))}">${icono("izq")}</button>
        <b class="gan-fecha"><span>${esc(T("Semana {n}", { n: w.n }))}${l === esta ? ` · ${esc(T("esta semana"))}` : ""}</span><small>${esc(T("Del {a} al {b}", { a: fDia(dias[0]), b: fDia(dias[6]) }))}${w.a !== +l.slice(0, 4) ? " · " + w.a : ""}</small></b>
        <button type="button" class="btn-ic" data-sem="7" aria-label="${esc(T("Semana siguiente"))}">${icono("der")}</button></div>
      <div class="gan-total"><span>${esc(T("Esta semana"))}</span><b>${esc(eur(r.total))}</b></div>${reparto(r)}
      <ul class="gan-dias">${dias.map(f => { const x = c[f]; return `<li><button type="button" data-ir-dia="${f}" class="${f === hoy() ? "hoy" : ""}"><span>${esc(fDia(f))}</span><b>${x && x.lineas.length ? esc(eur(x.total)) : `<small>${esc(T("Sin apuntar"))}</small>`}</b>${icono("der", "p")}</button></li>`; }).join("")}</ul>
      <details class="gan-ir-caja"><summary>${icono("calendario", "p")}<span>${esc(T("Ir a otra semana"))}</span></summary>
        <form class="gan-ir-sem" id="gan-ir-sem"><label><span>${esc(T("Semana número"))}</span><input type="number" id="gan-sem-n" min="1" max="53" inputmode="numeric" value="${w.n}" aria-label="${esc(T("Número de semana"))}"></label>
        <label><span>${esc(T("del año"))}</span><input type="number" id="gan-sem-a" min="2020" max="2100" inputmode="numeric" value="${w.a}" aria-label="${esc(T("Año"))}"></label>
        <button class="btn sec">${esc(T("Ir"))}</button>${l !== esta ? `<button type="button" class="btn sec" data-sem="hoy">${esc(T("Esta semana"))}</button>` : ""}</form></details>
      ${pasada.apuntados ? `<p class="gan-compara">${esc(T("La semana pasada (semana {n}): {total}", { n: wp.n, total: eur(pasada.total) }))}${r.apuntados ? ` · <b class="${r.total >= pasada.total ? "mas" : "menos"}">${r.total >= pasada.total ? "+" : "−"}${esc(eur(Math.abs(r.total - pasada.total)))}</b>` : ""}</p>` : ""}
      ${r.por.length ? `<h3 class="gan-sub">${esc(T("Por conceptos"))}</h3>${desglose(r)}` : `<p class="desc-vacio">${esc(T("Esta semana todavía no has apuntado ningún día. Toca un día para apuntar."))}</p>`}
      <p class="ayuda">${esc(T("Cobro semanal: dietas, suplementos, cargas, kilómetros, festivos, ADR por minuto y horas sindicales (te los pagan por semanas). En la nómina: nocturnidad y el ADR fijo (van con el salario a fin de mes, en «Mes»)."))}</p>
      <div class="gan-hoja" id="gan-hoja"></div>
      <div class="botones"><button class="btn sec" id="gan-pdf-semana">${icono("descargar", "p")}${esc(T("Descargar esta semana (PDF)"))}</button>${botonEnviar("gan-env-semana")}</div>`;
    const v = $("gan-semana"); pintaHoja(w);
    $("gan-pdf-semana").onclick = () => descarga(dias, nombreSem(l));
    if ($("gan-env-semana")) $("gan-env-semana").onclick = () => comparte(dias, nombreSem(l));
    v.querySelectorAll("[data-sem]").forEach(b => b.onclick = () => { DATOS.semana = b.dataset.sem === "hoy" ? esta : suma(l, +b.dataset.sem); guarda(); pinta(); });
    $("gan-ir-sem").onsubmit = (e) => {
      e.preventDefault();
      const n = parseInt($("gan-sem-n").value, 10), a = parseInt($("gan-sem-a").value, 10);
      if (!(a >= 2020 && a <= 2100) || !(n >= 1 && n <= semanasDelAnio(a))) return msg(T("Ese año tiene {n} semanas: escribe un número entre 1 y {n}.", { n: semanasDelAnio(a) }), true);
      DATOS.semana = iso(lunesSemanaISO(a, n)); guarda(); pinta();
    };
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
        <div><b>${esc(eur(k.nomina))}</b><span>${esc(T("En la nómina de fin de mes: salario y lo que se paga con la nómina (nocturnidad, ADR fijo)"))}</span></div>
        <div><b>${esc(eur(k.semanal))}</b><span>${esc(T("Cobro semanal: dietas, suplementos, cargas, kilómetros, festivos, ADR por minuto y horas sindicales de {n} días apuntados (te los pagan por semanas)", { n: r.apuntados }))}</span></div>
      </div>
      ${(() => { const ult = `${m}-${String(new Date(a, mm, 0).getDate()).padStart(2, "0")}`, sems = []; for (let l = lunesDe(m + "-01"); l <= ult; l = suma(l, 7)) sems.push(l);
        const filas = sems.map(l => { const todos = diasDe(l), ds = todos.filter(f => f.slice(0, 7) === m), x = resumen(c, ds), w = semDe(l); return { l, ds, x, w, parte: ds.length < 7 }; }).filter(f => f.x.apuntados);
        return filas.length ? `<h3 class="gan-sub">${esc(T("Por semanas"))}</h3><ul class="gan-dias gan-semanas">${filas.map(f => `<li><button type="button" data-ir-sem="${f.l}"><span>${esc(T("Semana {n}", { n: f.w.n }))}<small>${esc(T("Del {a} al {b}", { a: fDia(f.ds[0]), b: fDia(f.ds[f.ds.length - 1]) }))}${f.parte ? " · " + esc(T("solo los días de este mes")) : ""}</small></span><b>${esc(eur(f.x.total))}</b>${icono("der", "p")}</button></li>`).join("")}</ul>` : ""; })()}
      <h3 class="gan-sub">${esc(T("En la nómina"))}</h3>
      <ul class="gan-desglose">${k.fijos.map(x => `<li><span>${esc(TD(x.t.concepto))}${esPropio(x.t) ? ` <small>${esc(T("el tuyo, de «Ajustes»"))}</small>` : ""}</span><b>${esc(eur(x.imp))}</b></li>`).join("")}</ul>
      ${desglose({ por: enNomina })}
      ${semanales.length ? `<h3 class="gan-sub">${esc(T("Cobro semanal"))}</h3>${desglose({ por: semanales })}` : ""}
      ${r.por.length ? "" : `<p class="desc-vacio">${esc(T("Este mes todavía no has apuntado ningún día."))}</p>`}
      <p class="ayuda">${esc(T("Las horas extra y los descuentos (IRPF, Seguridad Social) no están incluidos. Si cobras antigüedad, pon tu salario en «Ajustes»."))}</p>
      <div class="botones"><button class="btn sec" id="gan-pdf-mes">${icono("descargar", "p")}${esc(T("Descargar este mes (PDF)"))}</button>${botonEnviar("gan-env-mes")}</div>`;
    $("gan-mes").querySelectorAll("[data-mes]").forEach(b => b.onclick = () => { DATOS.mes = otroMes(+b.dataset.mes); guarda(); pinta(); });
    // v88: el mes entero en PDF, con la nómina al final; título «Octubre de 2026»
    const diasMes = Array.from({ length: new Date(a, mm, 0).getDate() }, (_, i) => `${m}-${String(i + 1).padStart(2, "0")}`), tituloMes = fMes(m).replace(/^./, ch => ch.toUpperCase()), opMes = { titulo: tituloMes, mes: m };
    $("gan-pdf-mes").onclick = () => descarga(diasMes, "mes-" + m, opMes);
    if ($("gan-env-mes")) $("gan-env-mes").onclick = () => comparte(diasMes, "mes-" + m, opMes);
    $("gan-mes").querySelectorAll("[data-ir-sem]").forEach(b => b.onclick = () => { DATOS.semana = b.dataset.irSem; DATOS.tab = "semana"; guarda(); pinta(); });
  }

  // ---------- Ajustes ----------
  function pintaResumenAj() {
    const caja = $("gan-aj-resumen"); if (!caja) return;
    const m = hoy().slice(0, 7), k = cuentasMes(calcula(), m);
    caja.innerHTML = `<b>${esc(T("Así queda {mes}", { mes: fMes(m) }))}</b><span>${esc(T("En la nómina"))}: <b>${esc(eur(k.nomina))}</b></span><span>${esc(T("Cobro semanal"))}: <b>${esc(eur(k.semanal))}</b></span><span>${esc(T("Total"))}: <b>${esc(eur(k.total))}</b></span>`;
  }
  function pintaAjustes() {
    const fm = fijosMes(), vs = variables(), sal = fm[0];
    const valor = (t) => { const p = DATOS.precio[t.id]; if (typeof p === "number") return String(p).replace(".", ","); return t === sal && DATOS.salario ? String(DATOS.salario).replace(".", ",") : ""; };
    const grupos = []; TARIFAS.forEach(t => { let g = grupos.find(x => x.n === t.grupo); if (!g) grupos.push(g = { n: t.grupo, ts: [] }); g.ts.push(t); });
    $("gan-ajustes").innerHTML = `<div class="gan-aj-resumen" id="gan-aj-resumen" aria-live="polite"></div>
      <details class="gan-checks gan-precios" open><summary>${esc(T("Lo que cobras tú"))}</summary>
        <p class="ayuda">${esc(T("Cada persona cobra distinto (antigüedad, horas sindicales…). Pon tu importe donde no te cuadre la tabla; si lo dejas vacío, se usa el de la tabla."))}</p>
        ${grupos.map(g => `<div class="gan-precios-grupo">${g.n ? `<h4>${esc(TD(g.n))}</h4>` : ""}${g.ts.map(t => `<label class="gan-precio"><span>${zonaHTML(t)}${esc(TD(t.concepto))}<small>${esc(UNIDAD()[t.unidad])}${t === sal ? " · " + esc(T("con antigüedad")) : ""}</small></span>
          <input inputmode="decimal" data-precio="${t.id}" value="${esc(valor(t))}" placeholder="${esc(base(t) ? precio(base(t)) : T("tu precio"))}" aria-label="${esc(TD(t.concepto) + " · " + UNIDAD()[t.unidad])}"></label>`).join("")}</div>`).join("")}
      </details>
      ${fm.length ? `<fieldset class="gan-checks"><legend>${esc(T("Lo que cobro fijo cada mes"))}</legend>${fm.map(t => `<label class="check"><input type="checkbox" data-fijo="${t.id}" ${cobraFijo(t) ? "checked" : ""}><span>${esc(TD(t.concepto))} · ${esc(precio(imp(t)))}</span></label>`).join("")}</fieldset>` : ""}
      <fieldset class="gan-checks gan-inicio"><legend>${esc(T("Al abrir «Mis incentivos», enséñame"))}</legend><div class="gan-cal-rapido">${[["", T("Lo último que miré")], ["dia", T("Día")], ["semana", T("Semana")], ["mes", T("Mes")]].map(([k, n]) => `<label class="filtro ${(DATOS.inicio || "") === k ? "activo" : ""}"><input type="radio" name="gan-inicio" value="${k}" ${(DATOS.inicio || "") === k ? "checked" : ""}>${esc(n)}</label>`).join("")}</div></fieldset>
      ${vs.length ? `<fieldset class="gan-checks"><legend>${esc(T("Conceptos que uso"))}</legend><p class="ayuda">${esc(T("Quita los que no usas nunca: salen de «Día» y no cuentan en los totales."))}</p>${vs.map(t => `<label class="check"><input type="checkbox" data-ver="${t.id}" ${DATOS.oculto[t.id] ? "" : "checked"}><span>${esc(TD(t.concepto))}${t.grupo && !t.concepto.includes(t.grupo) ? ` <small>· ${esc(TD(t.grupo))}</small>` : ""}</span></label>`).join("")}</fieldset>` : ""}`;
    const v = $("gan-ajustes");
    v.querySelectorAll("[data-precio]").forEach(i => i.onchange = () => {
      const id = i.dataset.precio, txt = String(i.value).trim(), n = parseFloat(txt.replace(",", "."));
      if (!txt) delete DATOS.precio[id]; else if (Number.isFinite(n) && n >= 0 && n < 100000) DATOS.precio[id] = Math.round(n * 1e8) / 1e8; else { i.value = valor(TARIFAS.find(t => String(t.id) === id)); return msg(T("Escribe solo el número, por ejemplo 12,50."), true); }
      if (sal && id === String(sal.id)) DATOS.salario = ""; // el salario va ya con los demás importes
      guarda(); msg(T("Guardado.")); pintaResumenAj();
      v.querySelectorAll("[data-fijo]").forEach(c => { const t = TARIFAS.find(x => String(x.id) === c.dataset.fijo); c.nextElementSibling.textContent = TD(t.concepto) + " · " + precio(imp(t)); });
    });
    v.querySelectorAll("[data-fijo]").forEach(i => i.onchange = () => { DATOS.fijo[i.dataset.fijo] = i.checked; guarda(); pintaResumenAj(); });
    v.querySelectorAll("[name=gan-inicio]").forEach(i => i.onchange = () => { DATOS.inicio = i.value; guarda(); msg(T("Guardado.")); v.querySelectorAll(".gan-inicio .filtro").forEach(f => f.classList.toggle("activo", f.querySelector("input").checked)); });
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
          return `<button type="button" class="gan-cal-sem ${todas ? "sel" : ""}" data-csem="${l}" aria-pressed="${todas}" aria-label="${esc(T("Semana {n}", { n: semDe(l).n }) + ", " + T("Del {a} al {b}", { a: fDia(ds[0]), b: fDia(ds[6]) }))}">${esc(T("S{n}", { n: semDe(l).n }))}</button>` +
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
    $("gan-pdf-elegidos").onclick = () => { const ds = [...ELEGIDOS].sort(), l = lunesDe(ds[0]); descarga(ds, ds.length === 1 ? ds[0] : ds.length === 7 && ds.join() === diasDe(l).join() ? nombreSem(l) : ds[0] + "-a-" + ds[ds.length - 1]); };
  }

  // ---------- PDF (siempre en español) ----------
  // Lleva dentro (en la «marca») los días que salen, para poder recuperarlos con «Recuperar una copia».
  const MARCA = "%CCOO-GANANCIAS:";
  // op.titulo: encabezado grande propio (p. ej. el mes); op.mes: «AAAA-MM» para añadir la nómina del mes al final
  function hazPDF(elegidos, op = {}) {
    const locAntes = LOC, mapaAntes = MAPA; LOC = "es-ES"; MAPA = {};
    try {
      const c = calcula(), L = [], todos = !elegidos;
      const dias = (elegidos || Object.keys(DATOS.dias)).filter(f => c[f]?.lineas.length).sort();
      // v88 (lo pidió el padre): banda roja de encabezado, la semana del año grande y colores fijos para que se vea de un vistazo:
      // verde = total (lo que ganas; Lorena no lo quiere en rojo, «parece que pierdes dinero»), azul = cobro semanal, gris oscuro = en la nómina.
      // Los mismos que en la app. El rojo solo en la banda y el título.
      const ROJO = [0.671, 0.063, 0.071], VERDE = [0.106, 0.498, 0.231], AZUL = [0.118, 0.31, 0.612], GRIS = [0.42, 0.42, 0.42], OSCURO = [0.27, 0.27, 0.27];
      const C_TOT = VERDE, C_SEM = AZUL, C_NOM = OSCURO;
      // Con el logo a la izquierda (v88, lo pidió Lorena): la banda y el título van desplazados 70 pt
      const X = LOGO ? 70 : 0;
      L.push({ banda: "Mis incentivos · Sección Sindical CCOO Calsina Carré", color: ROJO, tam: 13, x: X }, ["", 4]);
      // «Semana 44 de 2026» o «Semanas 43 a 44 de 2026»
      if (op.titulo) L.push([op.titulo, 22, true, X, ROJO]);
      else if (dias.length && !todos) { const ws = [...new Set(dias.map(f => { const w = semDe(f); return w.n + " de " + w.a; }))]; L.push([ws.length === 1 ? "Semana " + ws[0] : "Semanas " + ws[0].replace(/ de \d+$/, "") + " a " + ws[ws.length - 1], 22, true, X, ROJO]); }
      else L.push([todos ? "Todo lo apuntado" : "Días elegidos", 22, true, X, ROJO]);
      if (dias.length) L.push(["Del " + fDia(dias[0], true) + " al " + fDia(dias[dias.length - 1], true), 12, true]);
      L.push(["Hecho el " + new Date().toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }), 9, false, 0, GRIS]);
      L.push(["Verde: total (lo que ganas) · Azul: cobro semanal (dietas, suplementos, cargas, kilómetros, horas sindicales) · Gris: en la nómina de fin de mes", 9, false, 0, GRIS], [""]);
      if (!dias.length) L.push(["No hay nada apuntado en esos días."]);
      const semanas = [...new Set(dias.map(lunesDe))];
      semanas.forEach(l => {
        const ds = dias.filter(f => lunesDe(f) === l), r = resumen(c, ds);
        // Cada semana con su banda oscura (lo pidió Lorena: que la semana se vea bien, es lo que busca la gente)
        L.push({ banda: "Semana " + semDe(l).n + " de " + semDe(l).a + " · del " + fDia(l, true) + " al " + fDia(suma(l, 6), true), color: [0.082, 0.098, 0.118], tam: 12 }, ["", 3]);
        ds.forEach(f => { const x = c[f]; L.push([fDia(f, true) + ": " + eur(x.total), 10, true, 6]); L.push([x.lineas.map(li => nombreC(li.t) + (cantidadTxt(li.t, li.n) ? " " + cantidadTxt(li.t, li.n) : "") + " " + eur(li.imp)).join(" · "), 9, false, 14]); });
        // Resumen por conceptos de la semana (v88): para comparar con lo que paga la empresa
        if (r.por.length) { L.push(["Por conceptos:", 10, true, 6, GRIS]); r.por.forEach(p => L.push([nombreC(p.t) + (p.n && cantidadTxt(p.t, p.n) ? " " + cantidadTxt(p.t, p.n) : "") + ": " + eur(p.imp) + (p.tope ? (p.n ? " (con tope al mes)" : " (no suma: ya estaba el máximo del mes)") : ""), 9, false, 14, p.t.pago === "Mensual" ? C_NOM : C_SEM])); }
        L.push(["Cobro semanal: " + eur(r.semanal), 11, true, 6, C_SEM], ["En la nómina: " + eur(r.mensual), 11, true, 6, C_NOM], ["Total de la semana: " + eur(r.total), 13, true, 6, C_TOT], [""]);
      });
      if (op.mes) { // v88: el mes entero con la nómina (salario y fijos) y lo semanal
        const k = cuentasMes(c, op.mes);
        L.push(["Cuentas del mes", 15, true], ["Cobro semanal del mes: " + eur(k.semanal), 11, true, 6, C_SEM]);
        k.fijos.forEach(x => L.push([x.t.concepto + ": " + eur(x.imp), 9, false, 14, C_NOM]));
        L.push(["Lo que va con la nómina de estos días (nocturnidad, ADR fijo…): " + eur(k.r.mensual), 9, false, 14, C_NOM], ["En la nómina de fin de mes: " + eur(k.nomina), 11, true, 6, C_NOM], ["Total del mes (bruto): " + eur(k.total), 15, true, 6, C_TOT], [""]);
      }
      if (semanas.length > 1 && !op.mes) { const r = resumen(c, dias); L.push(["Cobro semanal de estos días: " + eur(r.semanal), 11, true, 0, C_SEM], ["En la nómina: " + eur(r.mensual), 11, true, 0, C_NOM], ["Total de estos días: " + eur(r.total), 15, true, 0, C_TOT], [""]); }
      L.push([(op.mes ? "" : "Sin el salario ni los fijos del mes. ") + "Orientativo y en bruto (antes de impuestos y descuentos): manda tu nómina.", 8], ["Para volver a cargar estos días en la app: Zona Conductores > Mis incentivos > Ajustes > Recuperar una copia, y elige este PDF.", 8]);
      const datos = { app: "ccoo-ganancias", dias: Object.fromEntries((elegidos ? dias : Object.keys(DATOS.dias)).map(f => [f, DATOS.dias[f]])), salario: DATOS.salario, precio: DATOS.precio, oculto: DATOS.oculto, fijo: DATOS.fijo };
      return pdfSencillo(L, MARCA + btoa(unescape(encodeURIComponent(JSON.stringify(datos)))), { logo: LOGO });
    } finally { LOC = locAntes; MAPA = mapaAntes; }
  }
  // v88: enviar el PDF por WhatsApp u otra app con el menú de compartir del móvil (si el navegador lo permite con archivos)
  const puedeCompartir = () => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(["x"], "x.pdf", { type: "application/pdf" })] })); } catch (_) { return false; } };
  const botonEnviar = (id) => puedeCompartir() ? `<button class="btn sec" id="${id}">${icono("compartir", "p")}${esc(T("Enviar por WhatsApp u otra app"))}</button>` : "";
  async function comparte(dias, nombre, op) {
    const nom = "mis-incentivos-" + nombre + ".pdf", f = new File([hazPDF(dias, op)], nom, { type: "application/pdf" });
    try { await navigator.share({ files: [f], title: nom }); } catch (e) { if (e && e.name !== "AbortError") descarga(dias, nombre, op); }
  }
  function descarga(dias, nombre, op) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(hazPDF(dias, op)); a.download = "mis-incentivos-" + nombre + ".pdf";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- Arranque ----------
  let LOGO = null; // el logo para el PDF, listo en cuanto carga (v88)
  function prepara() {
    if (!$("v-ganancias")) return;
    if (typeof logoParaPDF === "function") logoParaPDF().then(l => { LOGO = l; });
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
    const alEntrar = () => { if (location.hash === "#ganancias") { DATOS.dia = hoy(); DATOS.semana = ""; DATOS.mes = ""; if (["dia", "semana", "mes"].includes(DATOS.inicio)) DATOS.tab = DATOS.inicio; pinta(); } };
    addEventListener("hashchange", alEntrar);
    pintaFijos(); alEntrar(); pinta();
    cargaTarifas().then(async () => { await cargaIdioma(); pintaFijos(); pinta(); });
  }
  prepara();
})();
