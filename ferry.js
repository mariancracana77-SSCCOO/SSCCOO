// Ferry y tren (Zona Conductores > Utilidades en ruta, petición n.º 64 del padre, v196). Dice si el descanso que
// haces con el camión en un barco o en un tren vale según el artículo 9 del Reglamento (CE) 561/2006, cambiado por
// el Reglamento (UE) 2020/1054:
// - El descanso diario normal (11 h, o la parte de 9 h del de dos partes) y el semanal reducido (24 h) se pueden
//   cortar como mucho 2 veces, con 1 hora en total entre los dos cortes, y a bordo hay que tener litera o camarote.
// - El semanal normal (45 h) solo vale a bordo si el viaje está previsto de 8 h o más y tienes camarote.
// - El diario reducido (9 h) no se puede cortar.
// Cuentas sin pantalla en «FerryCuentas» (las prueba pruebas/utilidades-v196.cjs). Sin nada en línea (CSP), textos
// con esc(). Solo en español (la función «traducir» no tiene este grupo). Guarda lo escrito en localStorage
// «ccoo-ferry» {tipo, litera, m1, m2} (las horas no: cambian cada viaje).
(function () {
  const TIPOS = [
    { id: "diario", n: "Diario normal (11 h)", h: 11, corte: true },
    { id: "partido", n: "Diario en dos partes (la de 9 h)", h: 9, corte: true },
    { id: "reducido", n: "Diario reducido (9 h)", h: 9, corte: false },
    { id: "sem-red", n: "Semanal reducido (24 h)", h: 24, corte: true },
    { id: "semanal", n: "Semanal normal (45 h)", h: 45, corte: true, viaje8: true },
  ];
  const MAX_CORTES_MIN = 60;
  const ms = (s) => { const t = Date.parse(s); return isFinite(t) ? t : NaN; };
  const min = (x) => Math.max(0, Math.round(parseFloat(String(x ?? "").replace(",", ".")) || 0));

  // d = {tipo, litera: "camarote"|"litera"|"no", ini, fin, emb, des (fecha y hora), m1, m2 (minutos)}
  // → {falta} o {ok, fallos: [texto], descanso (min), cortes: [{q, m}], viaje (min), vuelve (ms), abordo}
  function calcula(d) {
    const t = TIPOS.find(x => x.id === d.tipo) || TIPOS[0];
    const ini = ms(d.ini), fin = ms(d.fin), emb = ms(d.emb), des = ms(d.des);
    if (![ini, fin, emb, des].every(isFinite)) return { falta: true };
    const fallos = [];
    if (fin <= ini) return { mal: "La hora en que terminas de descansar tiene que ir después de la hora en que empiezas." };
    if (des <= emb) return { mal: "La hora de desembarcar tiene que ir después de la de embarcar." };
    // Un corte cuenta si el descanso ya había empezado al embarcar o sigue después de desembarcar
    const cortes = [];
    if (emb > ini && emb < fin) cortes.push({ q: "Embarcar", m: min(d.m1) });
    if (des > ini && des < fin) cortes.push({ q: "Desembarcar", m: min(d.m2) });
    const enCortes = cortes.reduce((a, c) => a + c.m, 0);
    const descanso = Math.round((fin - ini) / 60000) - enCortes;
    const viaje = Math.round((des - emb) / 60000);
    const abordo = Math.max(ini, emb) < Math.min(fin, des); // parte del descanso es a bordo
    const pedido = t.h * 60;
    if (descanso < pedido) fallos.push(`Te faltan ${hm(pedido - descanso)} de descanso: necesitas ${t.h} h y llevas ${hm(descanso)} (sin contar los cortes).`);
    if (cortes.length && !t.corte) fallos.push("El descanso diario reducido (9 h) no se puede cortar para embarcar o desembarcar. Haz uno normal de 11 h o empieza a descansar ya a bordo.");
    if (t.corte && enCortes > MAX_CORTES_MIN) fallos.push(`Los cortes suman ${hm(enCortes)}: como mucho puede ser 1 hora entre embarcar y desembarcar.`);
    if (abordo && d.litera === "no") fallos.push("A bordo necesitas litera o camarote para que cuente como descanso. Solo con asiento no vale.");
    if (abordo && t.viaje8) {
      if (viaje < 8 * 60) fallos.push(`El semanal normal solo vale a bordo si el viaje está previsto de 8 h o más. El tuyo es de ${hm(viaje)}.`);
      if (d.litera !== "camarote") fallos.push("El semanal normal a bordo necesita camarote (cabina con cama). La litera o el asiento-cama no valen para este descanso.");
    }
    const vuelve = ini + (pedido + enCortes) * 60000;
    return { ok: !fallos.length, fallos, descanso, cortes, enCortes, viaje, abordo, vuelve, tipo: t };
  }
  function hm(m) {
    m = Math.max(0, Math.round(m));
    const h = Math.floor(m / 60), r = m % 60;
    return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`;
  }
  window.FerryCuentas = { TIPOS, calcula, hm };

  const $ = (i) => document.getElementById(i);
  if (!$("v-ferry")) return;
  const KEY = "ccoo-ferry";
  let g = {};
  try { g = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { /* sin datos */ }
  let tipo = TIPOS.some(x => x.id === g.tipo) ? g.tipo : "diario";
  if (["camarote", "litera", "no"].includes(g.litera)) $("fe-litera").value = g.litera;
  if (g.m1 != null) $("fe-m1").value = min(g.m1);
  if (g.m2 != null) $("fe-m2").value = min(g.m2);
  const guarda = () => { try { localStorage.setItem(KEY, JSON.stringify({ tipo, litera: $("fe-litera").value, m1: min($("fe-m1").value), m2: min($("fe-m2").value) })); } catch (e) { /* sin almacenamiento */ } };
  const fecha = (t) => new Date(t).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  function chips() {
    $("fe-tipo").innerHTML = TIPOS.map(x => `<button type="button" class="zc-chip${x.id === tipo ? " activa" : ""}" data-t="${esc(x.id)}" aria-pressed="${x.id === tipo}">${esc(x.n)}</button>`).join("");
  }
  function calc() {
    guarda();
    const r = calcula({ tipo, litera: $("fe-litera").value, ini: $("fe-ini").value, fin: $("fe-fin").value, emb: $("fe-emb").value, des: $("fe-des").value, m1: $("fe-m1").value, m2: $("fe-m2").value });
    if (r.falta) { $("fe-out").innerHTML = `<div class="zc-aviso">Pon las cuatro horas: cuándo empiezas y terminas de descansar, y cuándo embarcas y desembarcas.</div>`; return; }
    if (r.mal) { $("fe-out").innerHTML = `<div class="zc-mal">${esc(r.mal)}</div>`; return; }
    const cortes = r.cortes.length
      ? `<li>Cortes: ${r.cortes.map(c => esc(`${c.q} (${hm(c.m)})`)).join(" y ")}, ${esc(hm(r.enCortes))} en total.</li>`
      : "<li>Sin cortes: todo el descanso seguido.</li>";
    const datos = `<ul><li>Descanso que cuenta: <b>${esc(hm(r.descanso))}</b> de ${r.tipo.h} h.</li>${cortes}<li>Viaje en barco o tren: ${esc(hm(r.viaje))}.</li></ul>`;
    $("fe-out").innerHTML = r.ok
      ? `<div class="zc-ok"><b>Este descanso vale.</b>${datos}<p class="fe-vuelve">Puedes volver a conducir a partir del <b>${esc(fecha(r.vuelve))}</b>.</p></div>`
      : `<div class="zc-mal"><b>Así no vale como descanso ${esc(r.tipo.n.toLowerCase())}.</b><ul>${r.fallos.map(f => `<li>${esc(f)}</li>`).join("")}</ul>${datos}</div>`;
  }
  chips();
  $("fe-tipo").addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    tipo = b.dataset.t;
    chips();
    calc();
  });
  for (const id of ["fe-litera", "fe-ini", "fe-fin", "fe-emb", "fe-des", "fe-m1", "fe-m2"]) $(id).addEventListener("input", calc);
  $("fe-litera").addEventListener("change", calc);
  calc();
})();
