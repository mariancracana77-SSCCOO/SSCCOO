// Ferry y tren (Zona Conductores > Utilidades en ruta, petición n.º 64 del padre; v196, rehecha en la v198 porque
// «no da resultado de nada»: pedía cuatro fechas con día y hora y hasta tenerlas todas no enseñaba nada).
// Ahora va como la calculadora de Gemini que usaba el padre: trae valores de ejemplo y SIEMPRE enseña un resultado,
// con la hora a la que puede volver a conducir y el desglose. Sin los fallos de la de Gemini (ver la nota del vault).
//
// La norma: artículo 9.1 del Reglamento (CE) 561/2006, cambiado por el Reglamento (UE) 2020/1054
// (comprobado en el texto consolidado de EUR-Lex el 21/11/2026):
// - Si acompañas al camión en un ferry o un tren y haces un descanso diario NORMAL o un semanal REDUCIDO, se puede
//   interrumpir como mucho 2 veces por otras actividades (embarcar y desembarcar) que juntas no pasen de 1 hora.
//   Durante ese descanso tienes que tener a tu disposición camarote, litera o cama.
// - El semanal NORMAL solo vale así si el viaje está previsto de 8 h o más y tienes camarote.
// - El diario REDUCIDO (9 h) no está en esa excepción: no se puede interrumpir.
// - El diario en dos partes (3 h + 9 h) es descanso diario normal (art. 4 g), así que su parte de 9 h se puede
//   interrumpir igual: es nuestra lectura del artículo, por eso la herramienta lo marca «compruébalo con tu empresa».
//
// Cuentas sin pantalla en «FerryCuentas» (las prueba pruebas/ferry-v198.cjs). Sin nada en línea (CSP), textos con
// esc(). Solo en español. Guarda lo escrito en localStorage «ccoo-ferry» (la misma clave de la v196).
(function () {
  const TIPOS = [
    { id: "diario", n: "Diario normal (11 h)", h: 11, corte: true },
    { id: "partido", n: "Diario en dos partes (la de 9 h)", h: 9, corte: true, duda: true },
    { id: "reducido", n: "Diario reducido (9 h)", h: 9, corte: false },
    { id: "sem-red", n: "Semanal reducido (24 h)", h: 24, corte: true },
    { id: "semanal", n: "Semanal normal (45 h)", h: 45, corte: true, viaje8: true },
  ];
  // Duraciones aproximadas de travesías conocidas: solo rellenan los minutos; lo que tienes a bordo lo eliges tú.
  const EJEMPLOS = [
    { id: "calais", n: "Calais – Dover", viaje: 90 },
    { id: "civita", n: "Barcelona – Civitavecchia", viaje: 1200 },
    { id: "tanger", n: "Algeciras – Tánger Med", viaje: 90 },
    { id: "eurotunel", n: "Eurotúnel (tren)", viaje: 35 },
  ];
  const DEF = { ini: "20:00", antes: 120, m1: 20, viaje: 90, m2: 15 };
  const MAX_CORTES = 60;
  const num = (x) => { const n = Math.round(parseFloat(String(x ?? "").replace(",", "."))); return isFinite(n) && n >= 0 ? Math.min(n, 99 * 60) : NaN; };
  const reloj = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || "")); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : NaN; };

  // d = {tipo, litera: "camarote"|"litera"|"no", ini: "HH:MM", antes, m1, viaje, m2 (minutos)}
  // → {falta: texto} o {ok, fallos, dudas, pasos: [{q, desde, hasta, cuenta}], descanso, enCortes, vuelve, ...}
  //   (desde, hasta y vuelve en minutos desde las 0:00 del día en que empiezas a descansar)
  function calcula(d) {
    const t = TIPOS.find(x => x.id === d.tipo) || TIPOS[0];
    const ini = reloj(d.ini), A = num(d.antes), m1 = num(d.m1), V = num(d.viaje), m2 = num(d.m2);
    if (!isFinite(ini)) return { falta: "Falta la hora en que empiezas a descansar." };
    if (!isFinite(V) || V <= 0) return { falta: "Falta cuánto dura el viaje en el barco o el tren." };
    if (!isFinite(A)) return { falta: "Falta cuánto descansas antes de embarcar (pon 0 si empiezas ya a bordo)." };
    if (!isFinite(m1) || !isFinite(m2)) return { falta: "Faltan los minutos de embarcar y desembarcar (pon 0 si no hay)." };
    const pedido = t.h * 60, fallos = [], dudas = [], pasos = [];
    const camaOk = d.litera === "camarote" || d.litera === "litera";
    let ahora = ini, hecho = 0, enCortes = 0, cortes = 0;
    const paso = (q, m, cuenta) => { if (m > 0) pasos.push({ q, desde: ahora, hasta: ahora + m, cuenta }); ahora += m; if (cuenta) hecho += m; };
    // 1) Descanso en tierra antes de embarcar
    if (A >= pedido) {
      paso("Descanso en tierra", pedido, true);
      return { ok: true, sinBarco: true, fallos, dudas, pasos, descanso: pedido, enCortes: 0, cortes: 0, vuelve: ahora, tipo: t, pedido };
    }
    paso("Descanso en tierra", A, true);
    // 2) Embarcar: si el descanso ya había empezado, es una interrupción; si no, aún no descansas
    if (A > 0) { paso("Embarcar (interrupción)", m1, false); if (m1 > 0) { enCortes += m1; cortes++; } } else paso("Embarcar (antes de descansar)", m1, false);
    // 3) A bordo: cuenta como descanso solo con camarote, litera o cama
    const falta = pedido - hecho;
    if (V >= falta) {
      paso("Descanso a bordo", falta, camaOk);
      const bajada = V - falta;
      if (bajada > 0) pasos.push({ q: "Sigues a bordo (descanso ya hecho)", desde: ahora, hasta: ahora + bajada, cuenta: false });
      const fin = ahora;
      ahora += bajada;
      pasos.push({ q: "Desembarcar", desde: ahora, hasta: ahora + m2, cuenta: false });
      var vuelve = fin, baja = ahora;
    } else {
      paso("Descanso a bordo", V, camaOk);
      paso("Desembarcar (interrupción)", m2, false);
      if (m2 > 0) { enCortes += m2; cortes++; }
      paso("Descanso en tierra al bajar", pedido - hecho, true);
      vuelve = ahora; baja = null;
    }
    const abordo = V > 0;
    if (!camaOk) fallos.push("A bordo necesitas camarote, litera o cama para que cuente como descanso. Solo con asiento, ese tiempo no es descanso.");
    if (cortes && !t.corte) fallos.push("El descanso diario reducido (9 h) no se puede interrumpir para embarcar o desembarcar. Haz uno normal de 11 h o empieza a descansar ya a bordo.");
    if (t.corte && enCortes > MAX_CORTES) fallos.push(`Las interrupciones suman ${hm(enCortes)}: como mucho puede ser 1 hora entre embarcar y desembarcar.`);
    if (t.viaje8 && abordo) {
      if (V < 8 * 60) fallos.push(`El semanal normal solo vale a bordo si el viaje está previsto de 8 h o más. El tuyo es de ${hm(V)}.`);
      if (d.litera !== "camarote") fallos.push("El semanal normal a bordo necesita camarote. La litera o el asiento no valen para este descanso.");
    }
    if (t.duda) dudas.push("Que la parte de 9 h del descanso en dos partes se pueda interrumpir es nuestra lectura del artículo: compruébalo con tu empresa.");
    const descanso = pasos.filter(p => p.cuenta).reduce((a, p) => a + p.hasta - p.desde, 0);
    return { ok: !fallos.length, fallos, dudas, pasos, descanso, enCortes, cortes, vuelve, baja, tipo: t, pedido, viaje: V };
  }
  function hm(m) {
    m = Math.max(0, Math.round(m));
    const h = Math.floor(m / 60), r = m % 60;
    return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`;
  }
  // Minutos desde las 0:00 del primer día → «8:30» o «8:30 (al día siguiente)»
  function hora(m) {
    const dia = Math.floor(m / 1440), r = ((m % 1440) + 1440) % 1440;
    const t = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`;
    return dia === 0 ? t : dia === 1 ? `${t} (al día siguiente)` : `${t} (${dia} días después)`;
  }
  window.FerryCuentas = { TIPOS, EJEMPLOS, DEF, calcula, hm, hora };

  const $ = (i) => document.getElementById(i);
  if (!$("v-ferry")) return;
  const KEY = "ccoo-ferry";
  const CAMPOS = ["ini", "antes", "m1", "viaje", "m2"];
  let g = {};
  try { g = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { /* sin datos */ }
  let tipo = TIPOS.some(x => x.id === g.tipo) ? g.tipo : "diario";
  if (["camarote", "litera", "no"].includes(g.litera)) $("fe-litera").value = g.litera;
  for (const k of CAMPOS) $("fe-" + k).value = k === "ini" ? (isFinite(reloj(g.ini)) ? g.ini : DEF.ini) : (isFinite(num(g[k])) ? num(g[k]) : DEF[k]);
  const guarda = () => { try { const o = { tipo, litera: $("fe-litera").value }; for (const k of CAMPOS) o[k] = $("fe-" + k).value; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };

  function chips() {
    $("fe-tipo").innerHTML = TIPOS.map(x => `<button type="button" class="zc-chip${x.id === tipo ? " activa" : ""}" data-t="${esc(x.id)}" aria-pressed="${x.id === tipo}">${esc(x.n)}</button>`).join("");
  }
  $("fe-ejemplos").innerHTML = EJEMPLOS.map(x => `<button type="button" class="zc-chip" data-ej="${esc(x.id)}">${esc(x.n)} <span class="fe-ej-h">${esc(hm(x.viaje))}</span></button>`).join("");
  let ultimo = "";
  function calc() {
    guarda();
    for (const k of ["antes", "m1", "viaje", "m2"]) { const n = num($("fe-" + k).value); $("fe-" + k + "-t").textContent = isFinite(n) && n >= 60 ? "= " + hm(n) : ""; }
    const r = calcula({ tipo, litera: $("fe-litera").value, ini: $("fe-ini").value, antes: $("fe-antes").value, m1: $("fe-m1").value, viaje: $("fe-viaje").value, m2: $("fe-m2").value });
    if (r.falta) { $("fe-barra-caja").innerHTML = ""; $("fe-out").innerHTML = `<div class="zc-aviso fe-semaforo"><b>${esc(r.falta)}</b></div>`; ultimo = ""; return; }
    const pct = Math.min(100, Math.round(r.enCortes / MAX_CORTES * 100));
    const barra = r.tipo.corte && r.cortes ? `<div class="fe-barra-t">Interrupciones: ${esc(hm(r.enCortes))} de 1 h como mucho</div><div class="fe-barra${r.enCortes > MAX_CORTES ? " pasa" : ""}"><span style="width:${pct}%"></span></div>` : "";
    const pasos = `<ol class="fe-pasos">${r.pasos.map(p => `<li class="${p.cuenta ? "si" : "no"}"><span class="fe-h">${esc(hora(p.desde))} a ${esc(hora(p.hasta))}</span> <b>${esc(p.q)}</b> · ${esc(hm(p.hasta - p.desde))}${p.cuenta ? "" : " · no es descanso"}</li>`).join("")}</ol>`;
    const vuelve = r.sinBarco
      ? `<p class="fe-vuelve">El descanso termina antes de embarcar: el barco o el tren no lo cortan.</p>`
      : `<p class="fe-vuelve">Puedes volver a conducir a las <b>${esc(hora(r.vuelve))}</b>.${r.baja != null ? ` El descanso acaba a bordo; bajas a las ${esc(hora(r.baja))}.` : ""}</p>`;
    $("fe-barra-caja").innerHTML = barra; // petición n.º 69: en el recuadro blanco, junto a los minutos
    const dudas = r.dudas.length ? `<p class="fe-duda">${r.dudas.map(esc).join(" ")}</p>` : "";
    $("fe-out").innerHTML = r.ok
      ? `<div class="zc-ok fe-semaforo"><p class="fe-sem-t">Descanso válido</p><p>${esc(r.tipo.n)}: ${esc(hm(r.descanso))} de descanso.</p>${vuelve}${dudas}${pasos}</div>`
      : `<div class="zc-mal fe-semaforo"><p class="fe-sem-t">No vale así</p><ul>${r.fallos.map(f => `<li>${esc(f)}</li>`).join("")}</ul>${dudas}${pasos}</div>`;
    ultimo = [`Ferry y tren · ${r.tipo.n}`, r.ok ? "Descanso válido" : "No vale así", ...r.fallos, ...r.pasos.map(p => `${hora(p.desde)} a ${hora(p.hasta)}: ${p.q} (${hm(p.hasta - p.desde)})`), r.ok && !r.sinBarco ? `Puedes volver a conducir a las ${hora(r.vuelve)}` : "", "Orientativo (Reg. 561/2006, art. 9). Sigue lo que marque tu tacógrafo."].filter(Boolean).join("\n");
  }
  chips();
  $("fe-tipo").addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    tipo = b.dataset.t; chips(); calc();
  });
  $("fe-ejemplos").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ej]"), x = b && EJEMPLOS.find(y => y.id === b.dataset.ej);
    if (!x) return;
    $("fe-viaje").value = x.viaje; calc();
  });
  $("v-ferry").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mas]");
    if (!b) return;
    const i = $(b.dataset.mas), n = num(i.value);
    i.value = Math.max(0, (isFinite(n) ? n : 0) + Number(b.dataset.paso)); calc();
  });
  for (const k of CAMPOS) $("fe-" + k).addEventListener("input", calc);
  $("fe-litera").addEventListener("change", calc);
  $("fe-copia").addEventListener("click", () => {
    if (!ultimo) return;
    const listo = () => { $("fe-copia-msg").textContent = "Resumen copiado."; };
    try { navigator.clipboard.writeText(ultimo).then(listo, () => { $("fe-copia-msg").textContent = "No se ha podido copiar."; }); } catch (e) { $("fe-copia-msg").textContent = "No se ha podido copiar."; }
  });
  calc();
})();
