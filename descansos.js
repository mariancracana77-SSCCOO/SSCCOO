// ===== «Mis descansos»: descanso semanal de los conductores (Zona Conductores) =====
// Según el Reglamento (CE) 561/2006 y el cuadernillo «Tiempos de conducción y descanso» de FENADISMER (mayo 2026),
// más los mínimos del II Acuerdo Marco (descansos en casa). Es orientativo: manda lo que registra el tacógrafo.
// Los horarios se guardan SOLO en este móvil (localStorage «ccoo-descansos»). Si el conductor quiere avisos, al servidor
// va únicamente cuándo avisar y el texto (RPC programar_descanso, unido al permiso de avisos del móvil); se borra al enviarse.
(function () {
  const CLAVE = "ccoo-descansos", H = 3600000, DIA = 24 * H;
  const lee = () => { try { const d = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (d && Array.isArray(d.lista)) return d; } catch (_) {} return { lista: [], internacional: false, avisos: true }; };
  let DATOS = lee();
  const guarda = () => {
    try { localStorage.setItem(CLAVE, JSON.stringify(DATOS)); } catch (_) { aviso("No se ha podido guardar en este móvil (¿modo incógnito?). Haz una copia."); }
    try { navigator.storage?.persist?.(); } catch (_) {} // que el navegador no lo borre solo si le falta espacio
  };
  const aviso = (t) => { const m = $("desc-msg"); if (m) { m.textContent = t; m.className = "msg err"; } };

  // ---------- Fechas ----------
  const lunes = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const fmt = (t) => new Date(t).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const fmtDia = (t) => new Date(t).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const horas = (h) => { const e = Math.floor(h + 1e-6), m = Math.round((h - e) * 60); return m ? `${e} h ${m} min` : `${e} h`; };
  const falta = (ms) => { const h = Math.floor(ms / H), d = Math.floor(h / 24); return d ? `${d} ${d === 1 ? "día" : "días"}${h % 24 ? " y " + (h % 24) + " h" : ""}` : h ? `${h} h${Math.round(ms / 60000) % 60 ? " y " + (Math.round(ms / 60000) % 60) + " min" : ""}` : `${Math.max(1, Math.round(ms / 60000))} min`; };
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

  // ---------- Avisos al móvil ----------
  const endpoint = () => { try { return localStorage.getItem("ccoo-push") || ""; } catch (_) { return ""; } };
  const avisosPosibles = () => typeof suscrito !== "undefined" && suscrito && !!endpoint();
  let tAvisos = 0;
  function programaAvisos(c) {
    clearTimeout(tAvisos);
    tAvisos = setTimeout(async () => {
      const ep = endpoint(); if (!ep || typeof suscrito === "undefined" || !suscrito) return;
      const lista = [], ahora = Date.now();
      if (DATOS.avisos && c.prox) {
        const tipo = c.prox.normal ? " y tiene que ser normal (45 h)" : "";
        [[12, "quedan 12 horas"], [2, "quedan 2 horas"]].forEach(([n, t]) => {
          const cuando = c.prox.limite - n * H;
          if (cuando > ahora + 60000) lista.push({ cuando: new Date(cuando).toISOString(), titulo: "Descanso semanal: " + t, cuerpo: `Tu descanso semanal tiene que empezar antes del ${fmt(c.prox.limite)}${tipo}.` });
        });
      }
      if (DATOS.avisos) c.pendientes.slice(0, 3).forEach(d => {
        const cuando = d.plazo - 3 * DIA;
        if (cuando > ahora + 60000) lista.push({ cuando: new Date(cuando).toISOString(), titulo: "Compensación de descanso pendiente", cuerpo: `Te quedan ${horas(d.queda)} por compensar antes del ${fmtDia(d.plazo - 1)} a medianoche.` });
      });
      try { await sb.rpc("programar_descanso", { p_endpoint: ep, p_avisos: lista }); } catch (_) {}
    }, 800);
  }

  // ---------- Pintar ----------
  function pinta() {
    const v = $("v-descansos"); if (!v) return;
    const c = calcula(), ahora = Date.now();
    // Invitar a instalar la app y a activar los avisos (sin ellos se pierden datos o no llegan los avisos)
    const inst = typeof INSTALADA === "function" && INSTALADA();
    $("desc-app").innerHTML = (!inst ? `<div class="desc-banda">${icono("movil")}<div><b>Instala la app en tu móvil</b><p>Así tus descansos se guardan mejor y te llegan los avisos aunque no la abras.</p><button class="btn" id="desc-instalar">${icono("descargar", "p")}Instalar la app</button></div></div>` : "") +
      (!avisosPosibles() ? `<div class="desc-banda">${icono("campana")}<div><b>Activa los avisos</b><p>Te avisamos 12 horas y 2 horas antes de que tengas que empezar tu descanso semanal, y 3 días antes de que acabe el plazo de una compensación.</p><button class="btn" id="desc-avisos">${icono("campana", "p")}Activar avisos</button></div></div>` : "");
    if ($("desc-instalar")) $("desc-instalar").onclick = () => instalar();
    if ($("desc-avisos")) $("desc-avisos").onclick = async () => { await activarAvisos(); pinta(); };

    // Estado
    let h = "";
    if (!c.validos.length) h = `<p class="desc-vacio">Apunta abajo tu último descanso semanal (cuándo empezó y cuándo acabó) y te calculo cuándo te toca el siguiente.</p>`;
    else {
      const p = c.prox, quedan = p.limite - ahora, tarde = quedan < 0;
      h += `<div class="desc-prox ${tarde ? "tarde" : quedan < 12 * H ? "pronto" : ""}">
        <span class="desc-et">Tu próximo descanso semanal tiene que empezar antes del</span>
        <b class="desc-fecha">${esc(fmt(p.limite))}</b>
        <span class="desc-quedan">${tarde ? "Te has pasado " + esc(falta(-quedan)) : "Quedan " + esc(falta(quedan))}</span>
        <span class="desc-tipo">${p.normal ? "Tiene que ser <b>normal: 45 horas seguidas</b> o más" + (p.casa ? ", en tu casa o en la base de la empresa, sumando las horas que debes" : "") + "." : "Puede ser <b>reducido (24 horas)</b> o <b>normal (45 horas)</b>." + (DATOS.internacional ? " Dos reducidos seguidos solo si los dos son fuera de España." : "")}</span>
      </div>`;
      if (c.pendientes.length) h += `<div class="desc-bloque"><h3>Horas por compensar</h3><ul class="desc-deudas">${c.pendientes.map(d => `<li class="${d.plazo < ahora ? "vencida" : ""}"><b>${esc(horas(d.queda))}</b> del descanso del ${esc(fmt(d.de.ini))}. ${d.plazo < ahora ? "El plazo acabó el " : "Antes del "}${esc(fmtDia(d.plazo - 1))} a medianoche.</li>`).join("")}</ul>
        <p class="ayuda">Se compensan de una vez, sumándolas a otro descanso de al menos 9 horas (por ejemplo, a tu próximo descanso semanal).</p></div>`;
      const min = DATOS.internacional ? 5 : 7, n = c.ultimos12.length;
      h += `<div class="desc-bloque"><h3>En casa y en fin de semana</h3><div class="desc-cifras">
        <div><b>${c.enCasa}<small> de ${n}</small></b><span>descansos en casa${n < 12 ? "" : " (últimos 12)"}. Mínimo ${min} de cada 12.</span></div>
        <div><b>${c.findeCasa}</b><span>en casa y en fin de semana (sábado o domingo). Al menos 1 cada 12 semanas.</span></div></div>
        <p class="ayuda">Según el II Acuerdo Marco del transporte de mercancías${DATOS.internacional ? " (internacional)" : " (nacional)"}. Al menos la mitad de los descansos en casa del año deben ser normales.</p></div>`;
      if (c.ultimoNormalCasa && ahora - c.ultimoNormalCasa.fin > 28 * DIA || !c.ultimoNormalCasa && c.validos.length >= 4)
        h += `<p class="desc-alerta">${icono("alerta", "p")}<span>Hace más de 4 semanas que no apuntas un descanso normal en casa o en la base. La empresa debe organizar el trabajo para que puedas volver cada 4 semanas.</span></p>`;
    }
    $("desc-estado").innerHTML = h;

    // Historial
    const filas = [...DATOS.lista].sort((a, b) => b.fin - a.fin);
    $("desc-lista").innerHTML = filas.length ? filas.map(x => {
      if (x.tipo === "comp") return `<li class="desc-fila comp"><div><b>Compensación: ${esc(horas(+x.horas))}</b><small>Sumadas a un descanso diario que acabó el ${esc(fmt(x.fin))}</small></div><button class="btn-ic" data-quita="${esc(x.id)}" aria-label="Quitar">${icono("borrar", "p")}</button></li>`;
      const s = c.sem.find(y => y.id === x.id), et = s.clase === "normal" ? "Normal" : s.clase === "reducido" ? "Reducido" : "No llega a 24 h", deuda = c.deudas.find(d => d.de.id === x.id);
      const notas = [x.casa ? "En casa" : "", tocaFinde(x.ini, x.fin) ? "Fin de semana" : "", x.cabina ? "En la cabina" : ""].filter(Boolean);
      const malas = [s.clase === "corto" ? "Un descanso semanal tiene que ser de 24 horas o más." : "",
        s.tarde ? `Empezó ${horas(s.tarde)} tarde: tenía que empezar antes de 6 días (144 h) desde el anterior.` : "",
        s.seguidos ? "Dos semanas seguidas sin descanso normal: en dos semanas tiene que haber al menos uno normal." : "",
        s.enCabina ? "El descanso normal (45 h o más) no se puede hacer en la cabina: la empresa paga un alojamiento." : ""].filter(Boolean);
      return `<li class="desc-fila ${s.clase}"><div><b>${esc(fmt(x.ini))} → ${esc(fmt(x.fin))}</b>
        <small><span class="desc-clase">${et}</span> · ${esc(horas(s.h))}${deuda ? (deuda.queda > 0.05 ? ` · faltan ${esc(horas(deuda.queda))} por compensar` : " · compensado") : ""}${notas.length ? " · " + notas.map(esc).join(" · ") : ""}</small>
        ${malas.map(m => `<span class="desc-mal">${icono("alerta", "p")}${esc(m)}</span>`).join("")}</div>
        <button class="btn-ic" data-quita="${esc(x.id)}" aria-label="Quitar este descanso">${icono("borrar", "p")}</button></li>`;
    }).join("") : `<li class="desc-vacio">Todavía no has apuntado ningún descanso.</li>`;
    $("desc-lista").querySelectorAll("[data-quita]").forEach(b => b.onclick = () => {
      if (!confirm("¿Quitar este descanso de tu lista?")) return;
      DATOS.lista = DATOS.lista.filter(x => x.id !== b.dataset.quita); guarda(); pinta();
    });
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
      c.pendientes.forEach(d => L("- " + horas(d.queda) + " del descanso del " + fmt(d.de.ini) + ". " + (d.plazo < Date.now() ? "El plazo acabó el " : "Antes del ") + fmtDia(d.plazo - 1) + " a medianoche."));
      L("");
    }
    if (c.ultimos12.length) {
      L("En casa y en fin de semana", 13, true);
      L(`${c.enCasa} de ${c.ultimos12.length} descansos en casa (mínimo ${DATOS.internacional ? 5 : 7} de cada 12). ${c.findeCasa} en casa y en fin de semana (al menos 1 cada 12 semanas).`); L("");
    }
    L("Lo apuntado", 13, true);
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
      if (!ini || !fin) return aviso("Pon cuándo empezó y cuándo acabó el descanso.");
      if (fin <= ini) return aviso("El final tiene que ser después del principio.");
      if (fin - ini > 14 * DIA) return aviso("Un descanso de más de 14 días no parece un descanso semanal (¿vacaciones?). Revisa las fechas.");
      if (DATOS.lista.some(x => x.tipo !== "comp" && ini < x.fin && fin > x.ini)) return aviso("Se solapa con otro descanso que ya tienes apuntado.");
      DATOS.lista.push({ id: Date.now().toString(36), ini, fin, casa: $("desc-casa").checked, cabina: $("desc-cabina").checked });
      guarda(); m.textContent = "Descanso guardado en este móvil."; m.className = "msg ok";
      $("desc-casa").checked = $("desc-cabina").checked = false; pinta();
    };
    $("desc-comp-guardar").onclick = () => {
      const fin = new Date($("desc-comp-fin").value).getTime(), n = parseFloat(String($("desc-comp-h").value).replace(",", "."));
      if (!fin || !(n > 0 && n < 45)) return aviso("Pon cuándo acabó ese descanso y cuántas horas de compensación le sumaste.");
      DATOS.lista.push({ id: Date.now().toString(36), tipo: "comp", fin, horas: n });
      guarda(); $("desc-comp-h").value = ""; $("desc-msg").textContent = "Compensación apuntada."; $("desc-msg").className = "msg ok"; pinta();
    };
    $("desc-comp-fin").value = aLocal(ahora.getTime());
    $("desc-internacional").onchange = () => { DATOS.internacional = $("desc-internacional").checked; guarda(); pinta(); };
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
        if (!confirm(`La copia tiene ${lista.length} apuntes. ¿Sustituir lo que hay ahora en este móvil?`)) return;
        DATOS = { lista, internacional: !!d.internacional, avisos: d.avisos !== false }; guarda(); pinta();
        $("desc-msg").textContent = "Copia recuperada."; $("desc-msg").className = "msg ok";
      } catch (_) { aviso("Ese archivo no es una copia de «Mis descansos». Elige el PDF (o el .json antiguo) que guardaste con «Guardar una copia»."); }
    };
    $("desc-borrar").onclick = () => {
      if (!confirm("¿Borrar todos tus descansos de este móvil? Si no tienes copia, no se podrán recuperar.")) return;
      DATOS = { lista: [], internacional: DATOS.internacional, avisos: DATOS.avisos }; guarda();
      const ep = endpoint(); if (ep) sb.rpc("programar_descanso", { p_endpoint: ep, p_avisos: [] }).then(() => {}, () => {});
      pinta();
    };
    pinta();
    // Cada minuto se actualiza la cuenta atrás si está a la vista
    setInterval(() => { if ($("v-descansos").classList.contains("activa")) pinta(); }, 60000);
    addEventListener("hashchange", () => { if (location.hash === "#descansos") pinta(); });
  }
  prepara();
})();
