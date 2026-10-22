// ===== «Mis descansos»: descansos diario y semanal de los conductores (Zona Conductores) =====
// v60: jornadas (descanso diario normal 11 h, reducido 9 h —máx. 3 entre dos semanales—, partido 3 h + 9 h, doble
// tripulación 9 h en 30 h, ferry/tren). v63: solo descansos (sin horas de conducción ni pausas, lo pidió el padre),
// pantalla en cuatro pestañas (Hoy, Apuntar, Lo apuntado, Ajustes) y guía rápida plegable.
// Según el Reglamento (CE) 561/2006 y el cuadernillo «Tiempos de conducción y descanso» de FENADISMER (mayo 2026),
// más los mínimos del II Acuerdo Marco (descansos en casa). Es orientativo: manda lo que registra el tacógrafo.
// Los horarios se guardan SOLO en este móvil (localStorage «ccoo-descansos»). Si el conductor quiere avisos, al servidor
// va únicamente cuándo avisar y el texto (RPC programar_descanso, unido al permiso de avisos del móvil); se borra al enviarse.
(function () {
  const CLAVE = "ccoo-descansos", H = 3600000, DIA = 24 * H;
  const MIN = 60000;
  const DEF = () => ({ lista: [], jornadas: [], hoy: null, internacional: false, doble: false, avisos: true, filtro: "todo", tab: "hoy", apunte: "jornada",
    ver: { semanal: true, diario: true }, aviso: { semanal: [12, 2], diario: 1 } });
  const completa = (d) => { const b = DEF(); return { ...b, ...d, jornadas: Array.isArray(d.jornadas) ? d.jornadas : [], ver: { ...b.ver, ...(d.ver || {}) }, aviso: { ...b.aviso, ...(d.aviso || {}) } }; };
  const lee = () => { try { const d = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (d && Array.isArray(d.lista)) return completa(d); } catch (_) {} return DEF(); };
  let DATOS = lee();
  const guarda = () => {
    try { localStorage.setItem(CLAVE, JSON.stringify(DATOS)); } catch (_) { aviso(T("No se ha podido guardar en este móvil (¿modo incógnito?). Haz una copia.")); }
    try { navigator.storage?.persist?.(); } catch (_) {} // que el navegador no lo borre solo si le falta espacio
  };
  const aviso = (t) => { const m = $("desc-msg"); if (m) { m.textContent = t; m.className = "msg err"; } };
  const ok = (t) => { const m = $("desc-msg"); if (m) { m.textContent = t; m.className = "msg ok"; } };

  // ---------- Idioma (v58) ----------
  // Los textos van escritos con T(texto) o TH(texto con **negrita**) y huecos {así}. La función «traducir» (modo textos) saca ella misma
  // esas frases de este archivo publicado y las traduce de una vez (solo estas: no acepta texto de fuera).
  // El idioma elegido (localStorage «ccoo-mi-idioma») vale también para los avisos al móvil. La copia en PDF va en español.
  const LOCALES = { ca: "ca-ES", en: "en-GB", ro: "ro-RO", ar: "ar-u-nu-latn", fr: "fr-FR", pt: "pt-PT", de: "de-DE", pl: "pl-PL", sr: "sr-Cyrl-RS" };
  let MAPA = {}, LOC = "es-ES";
  const T = (s, v) => (MAPA[s] || s).replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
  const TH = (s, v) => esc(T(s, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const FIJOS = () => ({
    titulo: T("Mis descansos"),
    intro: T("Tu descanso diario y semanal: cuándo te toca y cuántas horas tienes que compensar. Se guarda solo en este móvil."),
    guiatit: T("Cómo se usa (guía rápida)"),
    tabhoy: T("Hoy"), tabapuntar: T("Apuntar"), tablista: T("Lo apuntado"), tabajustes: T("Ajustes"),
    apjornada: T("Una jornada"), apsemanal: T("Un descanso semanal"), apcomp: T("Una compensación"),
    ayudaj: T("Desde que empezaste a trabajar después de un descanso hasta que paraste para el descanso diario. Si usas «Empiezo la jornada» en «Hoy», se apunta sola."),
    jini: T("Empecé a trabajar"), jfin: T("Terminé (empieza el descanso)"),
    jpartido: T("Hice el descanso partido: una parada de 3 h o más durante la jornada (y 9 h al final)"),
    jdoble: T("Fui con otro conductor (doble tripulación)"), jferry: T("El descanso se cortó por un ferry o un tren"), jguardar: T("Guardar jornada"),
    ayudasem: T("El descanso semanal puede ser cualquier día de la semana: no tiene por qué caer en fin de semana."),
    empezo: T("Empezó"), acabo: T("Acabó"),
    casa: T("Lo hice en casa (o en la base de la empresa)"), cabina: T("Lo hice en la cabina del camión"), guardar: T("Guardar descanso"),
    ayudacomp: T("Cuando devuelves horas de un descanso semanal reducido sumándolas a un descanso diario, apúntalo aquí."),
    compfin: T("Cuándo acabó ese descanso"), comph: T("Horas de compensación"), compguardar: T("Apuntar compensación"),
    internacional: T("Hago transporte internacional"), doble: T("Suelo ir con otro conductor (doble tripulación)"),
    avisar: T("Avisarme en el móvil antes de mis descansos y de los plazos de compensación. Al servidor solo va cuándo avisarte y el texto del aviso, sin tu nombre; se borra al enviarse."),
    copia: T("Guardar una copia (PDF)"), recupera: T("Recuperar una copia"), borrar: T("Borrar todo"),
    ayudacopia: T("Guarda una copia de vez en cuando (y antes de cambiar de móvil): si se borran los datos del navegador, se pierde lo apuntado."),
    oficial: T("Orientativo. Manda lo que registra el tacógrafo y el Reglamento (CE) 561/2006. Cálculos según el cuadernillo «Tiempos de conducción y descanso» de FENADISMER (mayo 2026) y el II Acuerdo Marco. Ante la duda, pregunta a un delegado."),
  });
  // Guía rápida (plegable, traducible)
  const GUIA = () => [
    [T("Al empezar a trabajar"), T("En «Hoy», pulsa «Empiezo la jornada». Te digo hasta qué hora puedes estar antes de parar para el descanso diario (11 h, 9 h reducido o partido 3 h + 9 h).")],
    [T("Al parar"), T("Pulsa «Termino la jornada»: se apunta sola y empieza a contar tu descanso diario.")],
    [T("El descanso semanal"), T("Cuando lo termines, ve a «Apuntar» > «Un descanso semanal» y pon cuándo empezó y acabó. Te calculo cuándo te toca el siguiente y si tienes horas que compensar.")],
    [T("Si se te olvidó"), T("En «Apuntar» puedes poner a mano cualquier jornada o descanso de días pasados.")],
    [T("Revisar"), T("En «Lo apuntado» ves todo, con filtros (semanales, en fin de semana, entre semana o jornadas). Lo que no cumple sale marcado en rojo.")],
    [T("Avisos y copia"), T("En «Ajustes» eliges cuándo te avisa el móvil. Guarda de vez en cuando la copia en PDF para no perder nada.")],
  ];
  function pintaGuia() {
    $("desc-guia-cuerpo").innerHTML = `<ol class="desc-guia-pasos">${GUIA().map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ol>
      <p class="ayuda">${esc(T("Los descansos: diario de 11 h (o 9 h reducido, como mucho 3 veces entre dos semanales); semanal de 45 h (o 24 h reducido, devolviendo lo que falta antes de que acabe la tercera semana siguiente). Empieza el semanal antes de que pasen 6 días (144 h) desde el anterior."))}</p>`;
  }
  function pintaFijos() {
    const f = FIJOS(), v = $("v-descansos"), idi = miIdioma();
    v.querySelectorAll("[data-dt]").forEach(el => { const t = f[el.dataset.dt]; if (t) el.textContent = t; });
    $("desc-comp-h").placeholder = T("Ej: 9"); pintaGuia();
    v.setAttribute("dir", idi === "ar" ? "rtl" : "ltr"); v.setAttribute("lang", idi || "es");
    const sel = $("desc-idioma");
    if (!sel.options.length) sel.innerHTML = `<option value="">Español</option>` + Object.entries(IDIOMAS).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join("");
    sel.value = idi;
  }
  async function cargaIdioma() {
    const idi = miIdioma(), m = $("desc-idioma-msg");
    LOC = LOCALES[idi] || "es-ES"; m.textContent = ""; m.className = "msg";
    if (!idi) { MAPA = {}; return; }
    const CACHE = "ccoo-textos-descansos";
    try { const c = JSON.parse(localStorage.getItem(CACHE) || "null"); if (c && c.idioma === idi && c.v === VERSION_WEB && Date.now() - c.t < 86400000) { MAPA = c.mapa; return; } } catch (_) {}
    m.textContent = "…"; m.className = "msg";
    try {
      const { data, error } = await sb.functions.invoke("traducir", { body: { modo: "textos", grupo: "descansos", idioma: idi } });
      if (error || !data?.textos) throw 0;
      if (miIdioma() !== idi) return;
      MAPA = data.textos; m.textContent = "";
      try { localStorage.setItem(CACHE, JSON.stringify({ idioma: idi, v: VERSION_WEB, t: Date.now(), mapa: MAPA })); } catch (_) {}
    } catch (_) { MAPA = {}; LOC = "es-ES"; m.textContent = "La traducción no está disponible ahora mismo. Prueba más tarde."; m.className = "msg err"; }
  }

  // ---------- Fechas ----------
  const lunes = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const fmt = (t) => new Date(t).toLocaleString(LOC, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const fmtDia = (t) => new Date(t).toLocaleDateString(LOC, { weekday: "long", day: "numeric", month: "long" });
  const horas = (h) => { const e = Math.floor(h + 1e-6), m = Math.round((h - e) * 60); return m ? `${e} h ${m} min` : `${e} h`; };
  const falta = (ms) => {
    const h = Math.floor(ms / H), d = Math.floor(h / 24), mi = Math.round(ms / 60000) % 60;
    if (d) return h % 24 ? (d === 1 ? T("1 día y {h} h", { h: h % 24 }) : T("{d} días y {h} h", { d, h: h % 24 })) : (d === 1 ? T("1 día") : T("{d} días", { d }));
    if (h) return mi ? `${h} h ${mi} min` : `${h} h`;
    return `${Math.max(1, Math.round(ms / 60000))} min`;
  };
  const aLocal = (t) => { const d = new Date(t - new Date(t).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
  // ¿El descanso toca sábado o domingo? (el II Acuerdo Marco lo cuenta como «en fin de semana»)
  const tocaFinde = (ini, fin) => { for (let t = ini; t < fin; t += H) { const d = new Date(t).getDay(); if (d === 0 || d === 6) return true; } return false; };

  // ---------- Cálculo ----------
  function calcula() {
    const sem = DATOS.lista.filter(x => x.tipo !== "comp").map(x => ({ ...x, h: (x.fin - x.ini) / H })).sort((a, b) => a.ini - b.ini);
    sem.forEach(x => x.clase = x.h >= 45 ? "normal" : x.h >= 24 ? "reducido" : "corto");
    const validos = sem.filter(x => x.clase !== "corto"), alertas = [];
    // Empezar tarde: después de 6 periodos de 24 h (144 h) desde el final del anterior
    validos.forEach((x, i) => { if (i) { const lim = validos[i - 1].fin + 144 * H; if (x.ini > lim + 60000) x.tarde = (x.ini - lim) / H; } });
    // Dos semanas seguidas sin descanso normal (en internacional se permiten dos reducidos seguidos fuera de España)
    validos.forEach((x, i) => {
      const p = validos[i - 1], pp = validos[i - 2];
      if (x.clase === "reducido" && p?.clase === "reducido" && lunes(x.ini) - lunes(p.ini) <= 7 * DIA) {
        if (!DATOS.internacional || (pp?.clase === "reducido" && lunes(p.ini) - lunes(pp.ini) <= 7 * DIA)) x.seguidos = true;
      }
    });
    // Deudas de los reducidos: lo que falta hasta 45 h, antes de que acabe la 3.ª semana siguiente
    const deudas = validos.filter(x => x.clase === "reducido").map(x => ({ de: x, horas: 45 - x.h, queda: 45 - x.h, plazo: lunes(x.ini) + 4 * 7 * DIA }));
    // Con qué se compensa: horas de más en un descanso semanal (por encima de 45 h) o las que se apuntan sumadas a un descanso diario
    const fuentes = [...validos.filter(x => x.h > 45).map(x => ({ t: x.ini, h: x.h - 45 })),
      ...DATOS.lista.filter(x => x.tipo === "comp").map(x => ({ t: x.fin - x.horas * H, h: +x.horas || 0 }))].sort((a, b) => a.t - b.t);
    fuentes.forEach(f => { for (const d of deudas) { if (f.h <= 0) break; if (d.queda > 0 && d.de.fin <= f.t + 60000 && f.t <= d.plazo) { const u = Math.min(d.queda, f.h); d.queda -= u; f.h -= u; } } });
    const pendientes = deudas.filter(d => d.queda > 0.05);
    // Próximo descanso semanal
    const ult = validos[validos.length - 1], prev = validos[validos.length - 2];
    let prox = null;
    if (ult) {
      const limite = ult.fin + 144 * H;
      let normal = false;
      if (ult.clase === "reducido") normal = !DATOS.internacional || (prev?.clase === "reducido" && lunes(ult.ini) - lunes(prev.ini) <= 7 * DIA);
      prox = { limite, normal, casa: DATOS.internacional && ult.clase === "reducido" && prev?.clase === "reducido" };
    }
    // II Acuerdo Marco: de cada 12 descansos semanales, en casa al menos 7 (nacional) o 5 (internacional); uno en fin de semana cada 12 semanas
    const ultimos12 = validos.slice(-12), enCasa = ultimos12.filter(x => x.casa).length, findeCasa = ultimos12.filter(x => x.casa && tocaFinde(x.ini, x.fin)).length;
    const ultimoNormalCasa = [...validos].reverse().find(x => x.casa && x.h >= 45);
    validos.forEach(x => { if (x.cabina && x.h >= 45) x.enCabina = true; });
    return { sem, validos, deudas, pendientes, prox, ultimos12, enCasa, findeCasa, ultimoNormalCasa, alertas };
  }

  // ---------- Descanso diario (v60) ----------
  // Una jornada va desde que se empieza a trabajar tras un descanso hasta que empieza el siguiente descanso diario.
  // Dentro de las 24 h desde que empieza (30 h con doble tripulación) tiene que caber el descanso diario:
  // 11 h (normal), 9 h (reducido, como mucho 3 entre dos descansos semanales), partido 3 h + 9 h, o 9 h con doble tripulación.
  function calculaDiario(c) {
    const js = DATOS.jornadas.filter(j => Number.isFinite(j.ini) && Number.isFinite(j.fin) && j.fin > j.ini).map(j => ({ ...j })).sort((a, b) => a.ini - b.ini);
    js.forEach((j, i) => {
      j.limite = j.ini + (j.doble ? 30 : 24) * H;
      const ns = c.validos.find(x => x.ini >= j.fin - MIN), nj = js[i + 1];
      const cand = [nj && nj.ini >= j.fin - MIN ? nj.ini : null, ns ? ns.ini : null].filter(x => x != null);
      const prox = cand.length ? Math.min(...cand) : null;
      if (prox == null) { j.clase = "pendiente"; return; }
      j.semanal = !!ns && prox === ns.ini;
      j.descanso = (prox - j.fin) / H;
      // Lo que cae dentro de las 24 h (o 30 h); si sigue el semanal (24 h o más), todo lo que queda de esas horas es descanso
      const fin = j.semanal ? j.limite : Math.min(prox, j.limite);
      const d = Math.max(0, (fin - j.fin) / H), e = 1e-6;
      j.dentro = d;
      j.clase = j.doble ? (d >= 9 - e ? "normal" : "falta") : d >= 11 - e ? "normal" : j.partido && d >= 9 - e ? "partido" : d >= 9 - e ? "reducido" : "falta";
    });
    // Reducidos entre dos descansos semanales (como mucho 3)
    const periodo = (t) => c.validos.filter(x => x.fin <= t + MIN).length;
    const red = {};
    js.forEach(j => { if (j.clase !== "reducido") return; const k = periodo(j.ini); red[k] = (red[k] || 0) + 1; if (red[k] > 3) j.demasiados = true; });
    const reducidosAhora = red[periodo(Date.now())] || 0;
    return { js, reducidosAhora };
  }

  // ---------- Avisos al móvil ----------
  const endpoint = () => { try { return localStorage.getItem("ccoo-push") || ""; } catch (_) { return ""; } };
  const avisosPosibles = () => typeof suscrito !== "undefined" && suscrito && !!endpoint();
  let tAvisos = 0;
  let ultimoEnvio = "";
  function programaAvisos(c) {
    clearTimeout(tAvisos);
    tAvisos = setTimeout(async () => {
      const ep = endpoint(); if (!ep || typeof suscrito === "undefined" || !suscrito) return;
      const lista = [], ahora = Date.now(), A = DATOS.aviso, V = DATOS.ver;
      const pon = (cuando, titulo, cuerpo) => { if (cuando > ahora + MIN) lista.push({ cuando: new Date(Math.round(cuando / MIN) * MIN).toISOString(), titulo: titulo.slice(0, 80), cuerpo: cuerpo.slice(0, 180) }); };
      if (DATOS.avisos && V.semanal && c.prox) {
        const fecha = fmt(c.prox.limite), cuerpo = c.prox.normal ? T("Tu descanso semanal tiene que empezar antes del {fecha} y tiene que ser normal (45 h).", { fecha }) : T("Tu descanso semanal tiene que empezar antes del {fecha}.", { fecha });
        [...new Set((A.semanal || []).map(Number).filter(n => n > 0))].slice(0, 2).forEach(n => pon(c.prox.limite - n * H, T("Descanso semanal: quedan {tiempo}", { tiempo: falta(n * H) }), cuerpo));
      }
      if (DATOS.avisos && V.semanal) c.pendientes.slice(0, 3).forEach(d => pon(d.plazo - 3 * DIA, T("Compensación de descanso pendiente"), T("Te quedan {horas} por compensar antes del {dia} a medianoche.", { horas: horas(d.queda), dia: fmtDia(d.plazo - 1) })));
      const h = DATOS.hoy;
      if (DATOS.avisos && V.diario && h && +A.diario > 0) {
        const lim = h.ini + (h.doble ? 21 : 13) * H, hora = new Date(lim).toLocaleTimeString(LOC, { hour: "2-digit", minute: "2-digit" });
        pon(lim - A.diario * H, T("Descanso diario"), h.doble ? T("Tu descanso diario de 9 h tiene que empezar antes de las {hora}.", { hora }) : T("Tu descanso diario de 11 h tiene que empezar antes de las {hora}.", { hora }));
      }
      const firma = ep + JSON.stringify(lista);
      if (firma === ultimoEnvio) return; // no repetir lo mismo cada minuto
      try { const { error } = await sb.rpc("programar_descanso", { p_endpoint: ep, p_avisos: lista }); if (!error) ultimoEnvio = firma; } catch (_) {}
    }, 800);
  }

  // ---------- Jornada de hoy ----------
  const hora = (t) => new Date(t).toLocaleTimeString(LOC, { hour: "2-digit", minute: "2-digit" });
  function pintaHoy(dd) {
    const h = DATOS.hoy, ahora = Date.now(), quedanRed = Math.max(0, 3 - dd.reducidosAhora);
    const red = `<p class="desc-red"><span class="desc-puntos">${[0, 1, 2].map(i => `<i class="${i < dd.reducidosAhora ? "usado" : ""}"></i>`).join("")}</span>${esc(T("Descansos diarios reducidos usados: {n} de 3 (hasta el próximo descanso semanal).", { n: Math.min(3, dd.reducidosAhora) }))}</p>`;
    if (!h) {
      $("desc-hoy").innerHTML = `<h2 class="desc-tit">${icono("reloj", "p")}${esc(T("Descanso diario"))}</h2>
        <p class="desc-vacio">${esc(T("Pulsa al empezar a trabajar y te digo hasta qué hora puedes estar antes de parar para el descanso diario."))}</p>
        <button class="btn grande" id="desc-empieza">${icono("reloj", "p")}${esc(T("Empiezo la jornada"))}</button>
        <label class="check"><input type="checkbox" id="desc-hoy-doble" ${DATOS.doble ? "checked" : ""}><span>${esc(T("Hoy voy con otro conductor (doble tripulación)"))}</span></label>
        ${red}`;
      $("desc-empieza").onclick = () => { DATOS.hoy = { ini: Date.now(), doble: $("desc-hoy-doble").checked, partido: false }; guarda(); pinta(); };
      return;
    }
    const l11 = h.ini + 13 * H, l9 = h.ini + 15 * H, l30 = h.ini + 21 * H;
    const lim = h.doble ? [`<li>${TH("Tu descanso diario de **9 h** tiene que empezar antes de las **{hora}** (doble tripulación: 9 h dentro de 30 h).", { hora: fmt(l30) })}</li>`]
      : [`<li>${TH("Descanso normal de **11 h**: empieza antes de las **{hora}**.", { hora: fmt(l11) })}</li>`,
        quedanRed ? `<li>${TH("O reducido de **9 h**: antes de las **{hora}** (te quedan {n} de 3 hasta el próximo descanso semanal).", { hora: fmt(l9), n: quedanRed })}</li>` : `<li>${esc(T("Ya has usado los 3 descansos reducidos: hasta el próximo semanal tienen que ser de 11 h."))}</li>`,
        `<li>${TH("O partido: una parada de **3 h** durante la jornada y **9 h** al final, antes de las **{hora}**.", { hora: fmt(l9) })}</li>`];
    const limActual = h.doble ? l30 : l11, tarde = ahora > (h.doble ? l30 : l9), queda = limActual - ahora;
    $("desc-hoy").innerHTML = `<h2 class="desc-tit">${icono("reloj", "p")}${esc(T("Descanso diario"))}</h2>
      <div class="desc-prox ${tarde ? "tarde" : queda < H ? "pronto" : ""}">
        <span class="desc-et">${esc(T("Jornada empezada el {fecha}", { fecha: fmt(h.ini) }))}</span>
        <b class="desc-fecha">${esc(T("Para antes de las {hora}", { hora: hora(limActual) }))}</b>
        <span class="desc-quedan">${esc(queda > 0 ? T("Quedan {tiempo}", { tiempo: falta(queda) }) : T("Te has pasado {tiempo}", { tiempo: falta(-queda) }))}</span>
      </div>
      <details class="desc-mas"><summary>${esc(T("Otras opciones (reducido o partido)"))}</summary><ul class="desc-limites">${lim.join("")}</ul></details>
      ${h.doble ? "" : `<label class="check"><input type="checkbox" id="desc-hoy-partido" ${h.partido ? "checked" : ""}><span>${esc(T("Hoy hago el descanso partido (una parada de 3 h o más y 9 h al final)"))}</span></label>`}
      <div class="botones desc-hoy-bot">
        <button class="btn grande" id="desc-termina">${esc(T("Termino la jornada"))}</button>
        <button class="enlace-desact" id="desc-cancela">${esc(T("Anular esta jornada"))}</button></div>
      ${red}`;
    $("desc-termina").onclick = () => {
      const t = Date.now();
      if (t - h.ini < 10 * MIN) { DATOS.hoy = null; guarda(); pinta(); return; }
      DATOS.jornadas.push({ id: Date.now().toString(36), ini: h.ini, fin: t, doble: !!h.doble, partido: !!h.partido, ferry: false });
      DATOS.hoy = null; guarda(); pinta();
      const m = $("desc-j-msg"); m.textContent = T("Jornada apuntada. Tu descanso diario empieza ahora."); m.className = "msg ok";
    };
    if ($("desc-hoy-partido")) $("desc-hoy-partido").onchange = () => { h.partido = $("desc-hoy-partido").checked; guarda(); };
    $("desc-cancela").onclick = () => { if (!confirm(T("¿Anular la jornada de hoy? No se apuntará."))) return; DATOS.hoy = null; guarda(); pinta(); };
  }
  function pintaPersonaliza() {
    const c = $("desc-personaliza-cuerpo"), firma = (miIdioma() || "es") + JSON.stringify(DATOS.ver) + JSON.stringify(DATOS.aviso);
    if (!c || c.dataset.firma === firma) return;
    c.dataset.firma = firma;
    const V = DATOS.ver, A = DATOS.aviso;
    const sel = (id, ops, val) => `<select id="${id}">${ops.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
    const hOps = [[0, T("No avisar")], [0.5, "30 min"], [1, "1 h"], [2, "2 h"], [3, "3 h"], [6, "6 h"], [12, "12 h"], [24, "24 h"]];
    c.innerHTML = `<div class="desc-perso">
      <fieldset><legend>${esc(T("Qué quiero ver en «Hoy»"))}</legend>
        ${[["diario", T("Descanso diario (jornada de hoy)")], ["semanal", T("Descanso semanal y compensaciones")]].map(([k, t]) => `<label class="check"><input type="checkbox" data-ver="${k}" ${V[k] ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}
      </fieldset>
      <fieldset><legend>${esc(T("Cuándo avisarme"))}</legend>
        <label>${esc(T("Descanso semanal, primer aviso"))} ${sel("desc-av-s1", hOps, (A.semanal || [])[0] ?? 0)}</label>
        <label>${esc(T("Descanso semanal, segundo aviso"))} ${sel("desc-av-s2", hOps, (A.semanal || [])[1] ?? 0)}</label>
        <label>${esc(T("Descanso diario"))} ${sel("desc-av-d", hOps.slice(0, 5), A.diario)}</label>
        <p class="ayuda">${esc(T("Antes de la hora límite. Los avisos solo llegan si los tienes activados en este móvil."))}</p>
      </fieldset>
      <p class="ayuda">${esc(T("La semana va de lunes a las 00:00 a domingo a las 24:00: lo dice el Reglamento (CE) 561/2006 y no se puede cambiar."))}</p></div>`;
    c.querySelectorAll("[data-ver]").forEach(i => i.onchange = () => { DATOS.ver[i.dataset.ver] = i.checked; guarda(); pinta(); });
    const num = (id) => +$(id).value || 0;
    ["desc-av-s1", "desc-av-s2", "desc-av-d"].forEach(id => $(id).onchange = () => {
      DATOS.aviso = { semanal: [num("desc-av-s1"), num("desc-av-s2")], diario: num("desc-av-d") }; guarda(); pinta();
    });
  }

  // ---------- Pintar ----------
  const lista = (items) => `<ul class="desc-riesgos">${items.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`;
  function pinta() {
    const v = $("v-descansos"); if (!v) return;
    const c = calcula(), ahora = Date.now();
    // Invitar a instalar la app y a activar los avisos (sin ellos se pierden datos o no llegan los avisos)
    const inst = typeof INSTALADA === "function" && INSTALADA();
    // Avisos de abajo, recogidos en una línea cada uno: se abren al tocarlos (para que la pantalla no pese)
    $("desc-app").innerHTML = `<details class="desc-mini">${inst
      ? `<summary>${icono("alerta", "p")}<span>${esc(T("Para no perder tus descansos"))}</span></summary><div><p>${esc(T("Se guardan solo en este móvil (no en internet). Se pierden si:"))}</p>${lista([T("desinstalas la app,"), T("borras los datos de la app o del navegador en los ajustes del móvil,"), T("cambias de móvil o lo restableces.")])}<p>${esc(T("Descarga de vez en cuando la copia en PDF: con ella lo recuperas todo."))}</p></div>`
      : `<summary>${icono("movil", "p")}<span>${esc(T("Instala la app para no perder tus descansos"))}</span></summary><div><p>${TH("Ahora lo estás usando desde el navegador. Tus descansos se guardan solo en este móvil y aquí **se pueden borrar** si:")}</p>${lista([T("borras el historial o los datos de navegación,"), T("usas una pestaña de incógnito (se pierde todo al cerrarla),"), T("en iPhone, pasas unos días sin entrar (Safari lo borra solo),"), T("cambias de móvil o lo restableces.")])}<p>${esc(T("Con la app se guardan mejor y te llegan los avisos. Descarga de vez en cuando la copia en PDF (en iPhone, sirve también para pasar tus datos a la app)."))}</p><button class="btn" id="desc-instalar">${icono("descargar", "p")}${esc(T("Instalar la app"))}</button></div>`}</details>` +
      (!avisosPosibles() ? `<div class="desc-mini fila-aviso">${icono("campana", "p")}<span>${esc(T("Activa los avisos y te recuerdo tus descansos."))}</span><button class="btn peq" id="desc-avisos">${esc(T("Activar"))}</button></div>` : "");
    if ($("desc-instalar")) $("desc-instalar").onclick = () => instalar();
    if ($("desc-avisos")) $("desc-avisos").onclick = async () => { await activarAvisos(); pinta(); };

    // Estado
    let h = `<h2 class="desc-tit">${icono("calendario", "p")}${esc(T("Descanso semanal"))}</h2>`;
    if (!c.validos.length) h += `<p class="desc-vacio">${esc(T("Apunta tu último descanso semanal (en «Apuntar») y te calculo cuándo te toca el siguiente."))}</p><button class="btn sec" data-ir-apunte="semanal">${esc(T("Apuntar un descanso semanal"))}</button>`;
    else {
      const p = c.prox, quedan = p.limite - ahora, tarde = quedan < 0;
      const tipo = p.normal
        ? (p.casa ? TH("Tiene que ser **normal: 45 horas seguidas** o más, en tu casa o en la base de la empresa, sumando las horas que debes.") : TH("Tiene que ser **normal: 45 horas seguidas** o más."))
        : TH("Puede ser **reducido (24 horas)** o **normal (45 horas)**.") + (DATOS.internacional ? " " + esc(T("Dos reducidos seguidos solo si los dos son fuera de España.")) : "");
      h += `<div class="desc-prox ${tarde ? "tarde" : quedan < 12 * H ? "pronto" : ""}">
        <span class="desc-et">${esc(T("Tu próximo descanso semanal tiene que empezar antes del"))}</span>
        <b class="desc-fecha">${esc(fmt(p.limite))}</b>
        <span class="desc-quedan">${esc(tarde ? T("Te has pasado {tiempo}", { tiempo: falta(-quedan) }) : T("Quedan {tiempo}", { tiempo: falta(quedan) }))}</span>
        <span class="desc-tipo">${tipo}</span>
      </div>`;
      const total = c.pendientes.reduce((t, d) => t + d.queda, 0);
      if (c.pendientes.length) h += `<div class="desc-bloque"><h3>${esc(T("Horas por compensar"))}</h3>
        <p class="desc-total"><span>${esc(T("Total por compensar"))}</span><b>${esc(horas(total))}</b></p><ul class="desc-deudas">${c.pendientes.map(d => { const v = { horas: horas(d.queda), desde: fmt(d.de.ini), dia: fmtDia(d.plazo - 1) };
          return `<li class="${d.plazo < ahora ? "vencida" : ""}">${d.plazo < ahora ? TH("**{horas}** del descanso del {desde}. El plazo acabó el {dia} a medianoche.", v) : TH("**{horas}** del descanso del {desde}. Antes del {dia} a medianoche.", v)}</li>`; }).join("")}</ul>
        <p class="ayuda">${esc(T("Se compensan de una vez, sumándolas a otro descanso de al menos 9 horas (por ejemplo, a tu próximo descanso semanal)."))}</p></div>`;
      const min = DATOS.internacional ? 5 : 7, n = c.ultimos12.length;
      h += `<details class="desc-bloque desc-mas"><summary>${esc(T("En casa y en fin de semana"))} · ${c.enCasa}/${n}</summary><div class="desc-cifras">
        <div><b>${c.enCasa}<small> ${esc(T("de {n}", { n }))}</small></b><span>${esc(n < 12 ? T("descansos en casa. Mínimo {min} de cada 12.", { min }) : T("descansos en casa (últimos 12). Mínimo {min} de cada 12.", { min }))}</span></div>
        <div><b>${c.findeCasa}</b><span>${esc(T("en casa y en fin de semana (sábado o domingo). Al menos 1 cada 12 semanas."))}</span></div></div>
        <p class="ayuda">${esc(DATOS.internacional ? T("Según el II Acuerdo Marco del transporte de mercancías (internacional). Al menos la mitad de los descansos en casa del año deben ser normales.") : T("Según el II Acuerdo Marco del transporte de mercancías (nacional). Al menos la mitad de los descansos en casa del año deben ser normales."))}</p></details>`;
      if (c.ultimoNormalCasa && ahora - c.ultimoNormalCasa.fin > 28 * DIA || !c.ultimoNormalCasa && c.validos.length >= 4)
        h += `<p class="desc-alerta">${icono("alerta", "p")}<span>${esc(T("Hace más de 4 semanas que no apuntas un descanso normal en casa o en la base. La empresa debe organizar el trabajo para que puedas volver cada 4 semanas."))}</span></p>`;
    }
    $("desc-estado").innerHTML = h;

    v.querySelectorAll("[data-ir-apunte]").forEach(b => b.onclick = () => { DATOS.apunte = b.dataset.irApunte; DATOS.tab = "apuntar"; guarda(); pinta(); });

    // Jornada de hoy y descanso diario
    const dd = calculaDiario(c), V = DATOS.ver;
    pintaHoy(dd); pintaPersonaliza();
    v.querySelectorAll("[data-bloque]").forEach(el => { el.hidden = !V[el.dataset.bloque]; });
    // Pestañas: solo se ve una parte cada vez
    const TAB = DATOS.tab || "hoy";
    v.querySelectorAll("[data-tab]").forEach(b => { const on = b.dataset.tab === TAB; b.classList.toggle("activa", on); b.setAttribute("aria-selected", String(on)); });
    v.querySelectorAll("[data-panel]").forEach(p => { p.hidden = p.dataset.panel !== TAB; });
    const AP = DATOS.apunte || "jornada";
    v.querySelectorAll("[data-apunte]").forEach(b => { const on = b.dataset.apunte === AP; b.classList.toggle("activo", on); b.setAttribute("aria-pressed", String(on)); });
    v.querySelectorAll("[data-form]").forEach(f => { f.hidden = f.dataset.form !== AP; });

    // Lo apuntado: descansos semanales, compensaciones y jornadas, con filtro
    const F = DATOS.filtro || "todo";
    const FILTROS = [["todo", T("Todo")], ["semanal", T("Descansos semanales")], ["finde", T("En fin de semana")], ["entre", T("Entre semana")], ["jornadas", T("Jornadas")]];
    $("desc-filtro").innerHTML = FILTROS.map(([k, t]) => `<button type="button" class="filtro ${k === F ? "activo" : ""}" data-filtro-desc="${k}" aria-pressed="${k === F}">${esc(t)}</button>`).join("");
    $("desc-filtro").querySelectorAll("[data-filtro-desc]").forEach(b => b.onclick = () => { DATOS.filtro = b.dataset.filtroDesc; guarda(); pinta(); });
    const pasa = (x) => {
      if (F === "todo") return true;
      if (F === "jornadas") return x._j;
      if (x._j) return false;
      if (F === "semanal") return true;
      if (x.tipo === "comp") return false;
      return F === "finde" ? tocaFinde(x.ini, x.fin) : !tocaFinde(x.ini, x.fin);
    };
    const filas = [...DATOS.lista, ...dd.js.map(j => ({ ...j, _j: true }))].filter(pasa).sort((a, b) => b.fin - a.fin);
    const quitar = (id, txt) => `<button class="btn-ic" data-quita="${esc(id)}" aria-label="${esc(txt)}">${icono("borrar", "p")}</button>`;
    $("desc-lista").innerHTML = filas.length ? filas.map(x => {
      if (x._j) {
        const et = { normal: x.doble ? T("Descanso diario de 9 h (doble tripulación)") : T("Descanso diario normal"), reducido: T("Descanso diario reducido"), partido: T("Descanso diario partido (3 h + 9 h)"), falta: T("Descanso diario insuficiente"), pendiente: T("Falta apuntar lo siguiente") }[x.clase];
        const notas = [x.descanso != null ? T("descanso después: {horas}", { horas: horas(x.descanso) }) : "", x.semanal ? T("le sigue el descanso semanal") : "", x.ferry ? T("cortado por ferry o tren") : ""].filter(Boolean);
        const malas = [x.clase === "falta" ? (x.doble ? T("No caben 9 h de descanso dentro de las 30 h desde que empezaste.") : T("No caben 9 h de descanso dentro de las 24 h desde que empezaste.")) : "",
          x.demasiados ? T("Más de 3 descansos diarios reducidos entre dos descansos semanales.") : "",
          x.ferry ? T("Con ferry o tren, el descanso se puede cortar como mucho 2 veces y 1 h en total, y hay que tener cama o litera.") : ""].filter(Boolean);
        return `<li class="desc-fila jornada ${x.clase}"><div><b>${esc(fmt(x.ini))} → ${esc(fmt(x.fin))}</b>
          <small><span class="desc-clase">${esc(T("Jornada"))}</span> · ${esc(horas((x.fin - x.ini) / H))}${notas.length ? " · " + notas.map(esc).join(" · ") : ""}</small>
          <small><span class="desc-clase">${esc(et)}</span></small>
          ${malas.map(m => `<span class="desc-mal">${icono("alerta", "p")}${esc(m)}</span>`).join("")}</div>${quitar(x.id, T("Quitar esta jornada"))}</li>`;
      }
      if (x.tipo === "comp") return `<li class="desc-fila comp"><div><b>${esc(T("Compensación: {horas}", { horas: horas(+x.horas) }))}</b><small>${esc(T("Sumadas a un descanso diario que acabó el {fecha}", { fecha: fmt(x.fin) }))}</small></div>${quitar(x.id, T("Quitar"))}</li>`;
      const s = c.sem.find(y => y.id === x.id), et = s.clase === "normal" ? T("Normal") : s.clase === "reducido" ? T("Reducido") : T("No llega a 24 h"), deuda = c.deudas.find(d => d.de.id === x.id);
      const notas = [x.casa ? T("En casa") : "", tocaFinde(x.ini, x.fin) ? T("Fin de semana") : T("Entre semana"), x.cabina ? T("En la cabina") : ""].filter(Boolean);
      const malas = [s.clase === "corto" ? T("Un descanso semanal tiene que ser de 24 horas o más.") : "",
        s.tarde ? T("Empezó {horas} tarde: tenía que empezar antes de 6 días (144 h) desde el anterior.", { horas: horas(s.tarde) }) : "",
        s.seguidos ? T("Dos semanas seguidas sin descanso normal: en dos semanas tiene que haber al menos uno normal.") : "",
        s.enCabina ? T("El descanso normal (45 h o más) no se puede hacer en la cabina: la empresa paga un alojamiento.") : ""].filter(Boolean);
      const dTxt = deuda ? (deuda.queda > 0.05 ? T("faltan {horas} por compensar", { horas: horas(deuda.queda) }) : T("compensado")) : "";
      return `<li class="desc-fila ${s.clase}"><div><b>${esc(fmt(x.ini))} → ${esc(fmt(x.fin))}</b>
        <small><span class="desc-clase">${esc(T("Descanso semanal"))} · ${esc(et)}</span> · ${esc(horas(s.h))}${dTxt ? " · " + esc(dTxt) : ""}${notas.length ? " · " + notas.map(esc).join(" · ") : ""}</small>
        ${malas.map(m => `<span class="desc-mal">${icono("alerta", "p")}${esc(m)}</span>`).join("")}</div>${quitar(x.id, T("Quitar este descanso"))}</li>`;
    }).join("") : `<li class="desc-vacio">${esc(F === "todo" ? T("Todavía no has apuntado nada.") : T("No hay nada de este tipo."))}</li>`;
    $("desc-lista").querySelectorAll("[data-quita]").forEach(b => b.onclick = () => {
      if (!confirm(T("¿Quitarlo de tu lista?"))) return;
      DATOS.lista = DATOS.lista.filter(x => x.id !== b.dataset.quita); DATOS.jornadas = DATOS.jornadas.filter(x => x.id !== b.dataset.quita); guarda(); pinta();
    });
    $("desc-doble").checked = !!DATOS.doble;
    $("desc-internacional").checked = !!DATOS.internacional;
    $("desc-avisar").checked = DATOS.avisos !== false;
    $("desc-avisar-caja").hidden = !avisosPosibles();
    programaAvisos(c);
  }

  // ---------- Copia en PDF ----------
  // Un PDF sencillo hecho aquí mismo (sin librerías ni servidores): se puede leer, imprimir o mandar.
  // Lleva dentro, en una línea de comentario que los lectores de PDF no enseñan, los datos para recuperarlos
  // con «Recuperar una copia» (también valen las copias antiguas en .json).
  const MARCA = "%CCOO-DESCANSOS:";
  function hazPDF() {
    const locAntes = LOC; LOC = "es-ES"; // la copia va siempre en español (y la letra del PDF no tiene alfabetos como el árabe)
    try { return hazPDFes(); } finally { LOC = locAntes; }
  }
  function hazPDFes() {
    const c = calcula(), lineas = []; // [texto, tamaño, negrita, sangría]
    const L = (t, tam = 10, neg = false, x = 0) => lineas.push([t, tam, neg, x]);
    L("Mis descansos", 18, true); L("Sección Sindical CCOO Calsina Carré", 11);
    L("Copia hecha el " + new Date().toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " · Transporte " + (DATOS.internacional ? "internacional" : "nacional"), 9); L("");
    if (c.prox) {
      L("Próximo descanso semanal", 13, true);
      L("Tiene que empezar antes del " + fmt(c.prox.limite) + ".", 11);
      L(c.prox.normal ? "Tiene que ser normal: 45 horas seguidas o más." : "Puede ser reducido (24 horas) o normal (45 horas).", 11); L("");
    }
    if (c.pendientes.length) {
      L("Horas por compensar", 13, true);
      L("Total por compensar: " + horas(c.pendientes.reduce((t, d) => t + d.queda, 0)) + ".", 11, true);
      c.pendientes.forEach(d => L("- " + horas(d.queda) + " del descanso del " + fmt(d.de.ini) + ". " + (d.plazo < Date.now() ? "El plazo acabó el " : "Antes del ") + fmtDia(d.plazo - 1) + " a medianoche."));
      L("");
    }
    if (c.ultimos12.length) {
      L("En casa y en fin de semana", 13, true);
      L(`${c.enCasa} de ${c.ultimos12.length} descansos en casa (mínimo ${DATOS.internacional ? 5 : 7} de cada 12). ${c.findeCasa} en casa y en fin de semana (al menos 1 cada 12 semanas).`); L("");
    }
    const dd = calculaDiario(c);
    if (dd.js.length) {
      L("Jornadas y descanso diario", 13, true);
      [...dd.js].reverse().forEach(j => {
        L(fmt(j.ini) + "  a  " + fmt(j.fin), 10, true);
        const et = { normal: j.doble ? "descanso diario de 9 h (doble tripulación)" : "descanso diario normal", reducido: "descanso diario reducido", partido: "descanso diario partido (3 h + 9 h)", falta: "descanso diario insuficiente", pendiente: "falta apuntar lo siguiente" }[j.clase];
        L([horas((j.fin - j.ini) / H) + " de jornada", j.descanso != null ? "descanso después: " + horas(j.descanso) : "", et, j.semanal ? "le sigue el descanso semanal" : "", j.ferry ? "cortado por ferry o tren" : ""].filter(Boolean).join(" · "), 10, false, 12);
        if (j.demasiados) L("Atención: más de 3 descansos diarios reducidos entre dos semanales.", 9, false, 12);
      });
      L("");
    }
    L("Descansos semanales", 13, true);
    const filas = [...DATOS.lista].sort((a, b) => b.fin - a.fin);
    if (!filas.length) L("Todavía no hay nada apuntado.");
    filas.forEach(x => {
      if (x.tipo === "comp") { L("Compensación de " + horas(+x.horas) + ", sumada a un descanso que acabó el " + fmt(x.fin) + ".", 10, true); return; }
      const sd = c.sem.find(y => y.id === x.id), deuda = c.deudas.find(d => d.de.id === x.id);
      L(fmt(x.ini) + "  a  " + fmt(x.fin), 10, true);
      L([sd.clase === "normal" ? "Normal" : sd.clase === "reducido" ? "Reducido" : "No llega a 24 h", horas(sd.h), deuda ? (deuda.queda > 0.05 ? "faltan " + horas(deuda.queda) + " por compensar" : "compensado") : "", x.casa ? "en casa" : "", tocaFinde(x.ini, x.fin) ? "fin de semana" : "", x.cabina ? "en la cabina" : ""].filter(Boolean).join(" · "), 10, false, 12);
      if (sd.tarde) L("Atención: empezó " + horas(sd.tarde) + " tarde (más de 6 días desde el anterior).", 9, false, 12);
      if (sd.seguidos) L("Atención: dos semanas seguidas sin descanso normal.", 9, false, 12);
      if (sd.enCabina) L("Atención: el descanso normal no se puede hacer en la cabina.", 9, false, 12);
    });
    L("");
    L("Orientativo. Manda lo que registra el tacógrafo y el Reglamento (CE) 561/2006. Cálculos según el cuadernillo «Tiempos de conducción y descanso» de FENADISMER (mayo 2026) y el II Acuerdo Marco.", 8);
    L("Para volver a cargar estos datos en la app: Zona Conductores > Mis descansos > Recuperar una copia, y elige este PDF.", 8);
    // Partir en renglones que quepan (Helvetica ~0,5 em por letra) y en páginas A4
    const ANCHO = 515, renglones = [];
    lineas.forEach(([t, tam, neg, x]) => {
      const max = Math.floor((ANCHO - x) / (tam * 0.5)); let resto = String(t);
      if (!resto) { renglones.push(["", tam, neg, x]); return; }
      while (resto.length > max) { let i = resto.lastIndexOf(" ", max); if (i < max * 0.5) i = max; renglones.push([resto.slice(0, i), tam, neg, x]); resto = resto.slice(i).trimStart(); }
      renglones.push([resto, tam, neg, x]);
    });
    const paginas = [[]]; let y = 800;
    renglones.forEach(r => { const alto = r[1] * 1.45; if (y - alto < 50) { paginas.push([]); y = 800; } y -= alto; paginas[paginas.length - 1].push([...r, y]); });
    // Texto en Windows-1252 (letras con tilde, ñ, «») y escapado para el PDF
    const cp = (t) => [...t].map(ch => { const n = ch.charCodeAt(0); return n < 256 ? ch : ({ "–": "\x96", "—": "\x97", "‘": "'", "’": "'", "“": '"', "”": '"', "€": "\x80", "…": "..." }[ch] || "?"); }).join("").replace(/[\\()]/g, m => "\\" + m);
    const objs = [], pag = [];
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    paginas.forEach((ls, i) => {
      const n = 5 + i * 2, cont = ls.map(([t, tam, neg, x, yy]) => t ? `BT /${neg ? "F2" : "F1"} ${tam} Tf ${40 + x} ${yy.toFixed(1)} Td (${cp(t)}) Tj ET` : "").filter(Boolean).join("\n")
        + `\nBT /F1 8 Tf 40 30 Td (${cp("Página " + (i + 1) + " de " + paginas.length)}) Tj ET`;
      objs[n] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${n + 1} 0 R >>`;
      objs[n + 1] = `<< /Length ${cont.length} >>\nstream\n${cont}\nendstream`;
      pag.push(`${n} 0 R`);
    });
    objs[2] = `<< /Type /Pages /Kids [${pag.join(" ")}] /Count ${pag.length} >>`;
    const datos = btoa(JSON.stringify({ app: "ccoo-descansos", ...DATOS }));
    let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n" + MARCA + datos + "\n";
    const pos = [];
    for (let i = 1; i < objs.length; i++) { pos[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
    const xref = out.length;
    out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + pos.slice(1).map(p => String(p).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return new Blob([Uint8Array.from(out, ch => ch.charCodeAt(0) & 255)], { type: "application/pdf" });
  }

  // ---------- Formularios ----------
  function prepara() {
    if (!$("v-descansos")) return;
    const ahora = new Date(); ahora.setMinutes(0, 0, 0);
    $("desc-ini").value = aLocal(ahora.getTime() - 48 * H); $("desc-fin").value = aLocal(ahora.getTime());
    $("desc-guardar").onclick = () => {
      const ini = new Date($("desc-ini").value).getTime(), fin = new Date($("desc-fin").value).getTime(), m = $("desc-msg");
      m.className = "msg";
      if (!ini || !fin) return aviso(T("Pon cuándo empezó y cuándo acabó el descanso."));
      if (fin <= ini) return aviso(T("El final tiene que ser después del principio."));
      if (fin - ini > 14 * DIA) return aviso(T("Un descanso de más de 14 días no parece un descanso semanal (¿vacaciones?). Revisa las fechas."));
      if (DATOS.lista.some(x => x.tipo !== "comp" && ini < x.fin && fin > x.ini)) return aviso(T("Se solapa con otro descanso que ya tienes apuntado."));
      DATOS.lista.push({ id: Date.now().toString(36), ini, fin, casa: $("desc-casa").checked, cabina: $("desc-cabina").checked });
      guarda(); ok(T("Descanso guardado en este móvil."));
      $("desc-casa").checked = $("desc-cabina").checked = false; pinta();
    };
    $("desc-comp-guardar").onclick = () => {
      const fin = new Date($("desc-comp-fin").value).getTime(), n = parseFloat(String($("desc-comp-h").value).replace(",", "."));
      if (!fin || !(n > 0 && n < 45)) return aviso(T("Pon cuándo acabó ese descanso y cuántas horas de compensación le sumaste."));
      DATOS.lista.push({ id: Date.now().toString(36), tipo: "comp", fin, horas: n });
      guarda(); $("desc-comp-h").value = ""; ok(T("Compensación apuntada.")); pinta();
    };
    $("desc-comp-fin").value = aLocal(ahora.getTime());
    $("desc-internacional").onchange = () => { DATOS.internacional = $("desc-internacional").checked; guarda(); pinta(); };
    $("desc-doble").onchange = () => { DATOS.doble = $("desc-doble").checked; $("desc-j-doble").checked = DATOS.doble; guarda(); pinta(); };
    // Jornada apuntada a mano
    $("desc-j-ini").value = aLocal(ahora.getTime() - 10 * H); $("desc-j-fin").value = aLocal(ahora.getTime()); $("desc-j-doble").checked = !!DATOS.doble;
    $("desc-j-guardar").onclick = () => {
      const ini = new Date($("desc-j-ini").value).getTime(), fin = new Date($("desc-j-fin").value).getTime(), m = $("desc-j-msg");
      const mal = (t) => { m.textContent = t; m.className = "msg err"; };
      if (!ini || !fin) return mal(T("Pon cuándo empezaste y cuándo terminaste."));
      if (fin <= ini) return mal(T("El final tiene que ser después del principio."));
      if (fin - ini > 30 * H) return mal(T("Una jornada no puede pasar de 30 horas. Revisa las fechas."));
      if (DATOS.jornadas.some(x => ini < x.fin && fin > x.ini)) return mal(T("Se solapa con otra jornada que ya tienes apuntada."));
      if (DATOS.lista.some(x => x.tipo !== "comp" && ini < x.fin && fin > x.ini)) return mal(T("Se solapa con un descanso semanal apuntado."));
      DATOS.jornadas.push({ id: Date.now().toString(36), ini, fin, partido: $("desc-j-partido").checked, doble: $("desc-j-doble").checked, ferry: $("desc-j-ferry").checked });
      guarda(); m.textContent = T("Jornada guardada en este móvil."); m.className = "msg ok";
      $("desc-j-partido").checked = $("desc-j-ferry").checked = false; pinta();
    };
    $("desc-avisar").onchange = () => { DATOS.avisos = $("desc-avisar").checked; guarda(); pinta(); };
    // Copia en un archivo: para el móvil nuevo o por si se borran los datos del navegador
    $("desc-copia").onclick = () => {
      const blob = hazPDF();
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mis-descansos-" + new Date().toISOString().slice(0, 10) + ".pdf";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    $("desc-recupera").onchange = async () => {
      const f = $("desc-recupera").files[0]; $("desc-recupera").value = ""; if (!f) return;
      try {
        const txt = await f.text(), i = txt.indexOf(MARCA);
        const d = JSON.parse(txt.startsWith("%PDF") ? (i < 0 ? "" : atob(txt.slice(i + MARCA.length, txt.indexOf("\n", i)).trim())) : txt);
        if (d.app !== "ccoo-descansos" || !Array.isArray(d.lista)) throw 0;
        const lista = d.lista.filter(x => x && typeof x.id === "string" && Number.isFinite(x.fin) && (x.tipo === "comp" ? Number.isFinite(+x.horas) : Number.isFinite(x.ini)))
          .map(x => x.tipo === "comp" ? { id: x.id, tipo: "comp", fin: x.fin, horas: +x.horas } : { id: x.id, ini: x.ini, fin: x.fin, casa: !!x.casa, cabina: !!x.cabina });
        const jornadas = (Array.isArray(d.jornadas) ? d.jornadas : []).filter(j => j && typeof j.id === "string" && Number.isFinite(j.ini) && Number.isFinite(j.fin))
          .map(j => ({ id: j.id, ini: j.ini, fin: j.fin, cond: Number.isFinite(+j.cond) ? +j.cond : 0, doble: !!j.doble, partido: !!j.partido, ferry: !!j.ferry }));
        if (!confirm(T("La copia tiene {n} apuntes. ¿Sustituir lo que hay ahora en este móvil?", { n: lista.length + jornadas.length }))) return;
        DATOS = completa({ lista, jornadas, internacional: !!d.internacional, doble: !!d.doble, avisos: d.avisos !== false, ver: d.ver || {}, aviso: d.aviso || {} }); guarda(); pinta();
        ok(T("Copia recuperada."));
      } catch (_) { aviso(T("Ese archivo no es una copia de «Mis descansos». Elige el PDF (o el .json antiguo) que guardaste con «Guardar una copia».")); }
    };
    $("desc-borrar").onclick = () => {
      if (!confirm(T("¿Borrar todos tus descansos de este móvil? Si no tienes copia, no se podrán recuperar."))) return;
      DATOS = completa({ lista: [], jornadas: [], hoy: null, internacional: DATOS.internacional, doble: DATOS.doble, avisos: DATOS.avisos, ver: DATOS.ver, aviso: DATOS.aviso }); guarda();
      const ep = endpoint(); if (ep) sb.rpc("programar_descanso", { p_endpoint: ep, p_avisos: [] }).then(() => {}, () => {});
      pinta();
    };
    document.querySelectorAll("#v-descansos [data-tab]").forEach(b => b.onclick = () => { DATOS.tab = b.dataset.tab; guarda(); pinta(); });
    document.querySelectorAll("#v-descansos [data-apunte]").forEach(b => b.onclick = () => { DATOS.apunte = b.dataset.apunte; guarda(); pinta(); });
    $("desc-idioma").onchange = async () => { ponMiIdioma($("desc-idioma").value); };
    addEventListener("mi-idioma", async () => { await cargaIdioma(); pintaFijos(); pinta(); });
    pintaFijos(); pinta();
    cargaIdioma().then(() => { if (miIdioma()) { pintaFijos(); pinta(); } });
    // Cada minuto se actualiza la cuenta atrás si está a la vista
    setInterval(() => { if ($("v-descansos").classList.contains("activa")) pinta(); }, 30000);
    addEventListener("hashchange", () => { if (location.hash === "#descansos") pinta(); });
  }
  prepara();
})();
