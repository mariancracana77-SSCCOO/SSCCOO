// Conexión con Supabase. Esta clave es pública: solo permite LEER.
// Para publicar hace falta iniciar sesión con la cuenta de admin.
window.SUPABASE_URL = "https://kdfedwcskymaitvpryvg.supabase.co";
window.SUPABASE_KEY = "sb_publishable_RLt0HuAMskXkKl2hxhUF2w_sCexGznp";
window.sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
window.VERSION_WEB = "28"; // cambiar junto con ?v= en los HTML y VERSION en sw.js
window.WEB_URL = "https://mariancracana77-ssccoo.github.io/SSCCOO/";
// Clave pública de las notificaciones (la privada solo está en el servidor)
window.VAPID_PUBLICA = "BMMdZjehtNipsScHJ__kzOIn9XCgIpya3UDDRlexxOAWJU-J6ZICDlf72ItPOebzl-SfzoU234pd82Chp87Vm1w";

// ---- Listas editables (categorías y tipos) ----
// Se guardan en la tabla "opciones" y se editan desde Ajustes en el panel.
// Estas de aquí solo se usan si no se puede leer la base de datos.
window.OPC = {
  aviso: [["General", "gris"], ["Asamblea", "rojo"], ["Convenio", "azul"], ["Nóminas", "verde"]],
  evento: [["Asamblea", "rojo"], ["Reunión", "azul"], ["Negociación", "ambar"], ["Elecciones", "morado"], ["Festivo", "verde"], ["Otro", "gris"]],
  acta: [["Comité de empresa", "azul"], ["Asamblea", "rojo"], ["Negociación", "ambar"], ["Otra", "gris"]],
  convenio: [["General", "gris"], ["Jornada", "azul"], ["Vacaciones", "ambar"], ["Permisos", "verde"], ["Salario", "rojo"]],
  documento: [["Convenio", "azul"], ["Otros", "gris"]],
  pregunta: [["General", "gris"]],
};
window.COLORES = { rojo: "Rojo", azul: "Azul", ambar: "Ámbar", verde: "Verde", morado: "Morado", turquesa: "Turquesa", rosa: "Rosa", gris: "Gris" };
window.cargarOpciones = async () => {
  const { data, error } = await sb.from("opciones").select("*").order("orden").order("id");
  if (error || !data?.length) return;
  const n = {}; data.forEach(o => (n[o.lista] ||= []).push([o.nombre, o.color, o.id]));
  Object.keys(OPC).forEach(k => OPC[k] = n[k] || []);
  window.OPC_FILAS = data;
};
window.nombres = (lista) => (OPC[lista] || []).map(o => o[0]);
const colorDe = (t) => { for (const l of ["evento", "acta", "aviso", "convenio", "documento", "pregunta"]) { const o = (OPC[l] || []).find(x => x[0] === t); if (o) return o[1]; } return "gris"; };

// ---- Utilidades ----
window.esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Convierte texto sencillo en HTML: párrafos, listas con "- ", **negrita** y enlaces.
window.textoHTML = (s, resaltar) => {
  const linea = (t) => {
    let h = esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    if (resaltar) {
      const r = resaltar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      h = h.replace(new RegExp(`(?![^<]*>)(${r})`, "gi"), "<mark>$1</mark>");
    }
    return h;
  };
  // Agrupa las líneas: las que empiezan por "- " forman listas; el resto, párrafos.
  const esLista = (l) => /^\s*[-•*]\s+/.test(l);
  return String(s ?? "").trim().split(/\n\s*\n/).map(bloque => {
    const out = []; let lista = [], texto = [];
    const cerrarTexto = () => { if (texto.length) out.push("<p>" + texto.map(linea).join("<br>") + "</p>"); texto = []; };
    const cerrarLista = () => { if (lista.length) out.push("<ul>" + lista.map(l => "<li>" + linea(l.replace(/^\s*[-•*]\s+/, "")) + "</li>").join("") + "</ul>"); lista = []; };
    bloque.split("\n").forEach(l => { if (esLista(l)) { cerrarTexto(); lista.push(l); } else { cerrarLista(); texto.push(l); } });
    cerrarTexto(); cerrarLista();
    return out.join("");
  }).join("");
};

window.fechaLarga = (d) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
window.fechaDia = (iso) => new Date(iso + "T12:00:00");
window.hoyISO = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
window.claseTipo = (t, lista) => {
  const o = lista && (OPC[lista] || []).find(x => x[0] === t);
  return "c-" + (o ? o[1] : colorDe(t));
};
window.cartel = (iso, tipo, lista) => {
  const d = fechaDia(iso);
  return `<div class="cartel ${claseTipo(tipo, lista)}"><b>${d.getDate()}</b><span>${d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")}</span></div>`;
};

// ---- Compartir y calendario ----
const limpioTxt = (t, n) => { t = String(t || "").replace(/\*\*/g, "").trim(); return n && t.length > n ? t.slice(0, n - 1) + "…" : t; };
window.textoCompartir = (titulo, cuerpo, ancla) => `*${limpioTxt(titulo)}*\n\n${limpioTxt(cuerpo, 500)}\n\nMás información: ${WEB_URL}${ancla ? "#" + ancla : ""}`;
window.enlaceWhatsApp = (texto) => "https://wa.me/?text=" + encodeURIComponent(texto);
window.compartir = async (titulo, texto) => {
  if (navigator.share) { try { await navigator.share({ title: titulo, text: texto }); return; } catch (e) { if (e.name === "AbortError") return; } }
  window.open(enlaceWhatsApp(texto), "_blank");
};
// Archivo .ics para añadir una fecha al calendario del móvil
window.descargarICS = (e) => {
  const d = e.fecha.replace(/-/g, ""), ahora = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const hm = (h) => (h || "").replace(":", "").padEnd(4, "0") + "00";
  const escI = (t) => String(t || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  let ini, fin;
  if (e.hora && !window.esTodoElDia?.(e)) { ini = `DTSTART;TZID=Europe/Madrid:${d}T${hm(e.hora)}`; fin = `DTEND;TZID=Europe/Madrid:${d}T${hm(e.hora_fin || (String(+e.hora.slice(0, 2) + 1).padStart(2, "0") + e.hora.slice(2)))}`; }
  else { const sig = new Date(fechaDia(e.fecha).getTime() + 86400000); ini = `DTSTART;VALUE=DATE:${d}`; fin = `DTEND;VALUE=DATE:${sig.getFullYear()}${String(sig.getMonth() + 1).padStart(2, "0")}${String(sig.getDate()).padStart(2, "0")}`; }
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CCOO Calsina Carre//ES", "BEGIN:VEVENT", `UID:evento-${e.id || d}@ccoo-calsina`, `DTSTAMP:${ahora}`, ini, fin,
    `SUMMARY:${escI(e.titulo)}`, e.lugar ? `LOCATION:${escI(e.lugar)}` : "", `DESCRIPTION:${escI((e.descripcion || "") + "\nSección Sindical CCOO Calsina Carré")}`,
    "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", `DESCRIPTION:${escI(e.titulo)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = (e.titulo || "evento").replace(/[^\wáéíóúñ ]+/gi, "").slice(0, 40) + ".ics";
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
};

// ---- Ajustes de lectura (botón Aa): se guardan solo en este móvil ----
window.LECTURA = (() => { try { return JSON.parse(localStorage.getItem("ccoo-lectura") || "{}"); } catch (_) { return {}; } })();
window.aplicarLectura = () => {
  const h = document.documentElement, L = window.LECTURA;
  L.letra && L.letra !== "normal" ? h.setAttribute("data-letra", L.letra) : h.removeAttribute("data-letra");
  L.contraste === "alto" ? h.setAttribute("data-contraste", "alto") : h.removeAttribute("data-contraste");
  L.tema && L.tema !== "auto" ? h.setAttribute("data-theme", L.tema) : h.removeAttribute("data-theme");
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = "#c4122f";
};
window.abrirLectura = () => {
  const L = window.LECTURA, op = (grupo, val, txt, muestra) => `<button data-g="${grupo}" data-v="${val}" class="${(L[grupo] || (grupo === "letra" ? "normal" : grupo === "tema" ? "auto" : "normal")) === val ? "activa" : ""}">${muestra || ""}<span>${txt}</span></button>`;
  const v = document.createElement("div"); v.className = "modal-velo";
  v.innerHTML = `<div class="modal lectura" role="dialog" aria-modal="true" aria-label="Ajustes de lectura"><h2>Ajustes de lectura</h2>
    <p class="fecha-txt" style="margin:0">Solo cambian en este móvil u ordenador.</p>
    <h3>Tamaño de letra</h3><div class="opciones-lectura">
      ${op("letra", "normal", "Normal", '<span class="muestra" style="font-size:1.1rem">Aa</span>')}
      ${op("letra", "grande", "Grande", '<span class="muestra" style="font-size:1.45rem">Aa</span>')}
      ${op("letra", "muy-grande", "Muy grande", '<span class="muestra" style="font-size:1.8rem">Aa</span>')}</div>
    <h3>Contraste</h3><div class="opciones-lectura" style="grid-template-columns:1fr 1fr">
      ${op("contraste", "normal", "Normal")}${op("contraste", "alto", "Alto")}</div>
    <h3>Colores</h3><div class="opciones-lectura">
      ${op("tema", "auto", "Automático")}${op("tema", "light", "Claro")}${op("tema", "dark", "Oscuro")}</div>
    <div class="botones"><button class="btn" data-cerrar>Listo</button></div></div>`;
  v.onclick = (e) => {
    const b = e.target.closest("[data-g]");
    if (b) { L[b.dataset.g] = b.dataset.v; try { localStorage.setItem("ccoo-lectura", JSON.stringify(L)); } catch (_) {} aplicarLectura();
      v.querySelectorAll(`[data-g="${b.dataset.g}"]`).forEach(x => x.classList.toggle("activa", x === b)); return; }
    if (e.target === v || e.target.closest("[data-cerrar]")) v.remove();
  };
  document.body.appendChild(v); v.querySelector(".activa")?.focus();
};
aplicarLectura();

// Botón «Aa» (tamaño de letra y colores)
document.addEventListener("click", (e) => { if (e.target.closest?.("[data-aa]")) abrirLectura(); });

// Solo enlaces web, email o teléfono (nunca «javascript:» ni otros esquemas)
window.urlSegura = (u) => { u = String(u || "").trim(); return /^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : "#"; };
