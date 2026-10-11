// Conexión con Supabase. Esta clave es pública: solo permite LEER.
// Para publicar hace falta iniciar sesión con la cuenta de admin.
window.SUPABASE_URL = "https://kdfedwcskymaitvpryvg.supabase.co";
window.SUPABASE_KEY = "sb_publishable_RLt0HuAMskXkKl2hxhUF2w_sCexGznp";
window.sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

// ---- Listas editables (categorías y tipos) ----
// Se guardan en la tabla "opciones" y se editan desde Ajustes en el panel.
// Estas de aquí solo se usan si no se puede leer la base de datos.
window.OPC = {
  aviso: [["General", "gris"], ["Asamblea", "rojo"], ["Convenio", "azul"], ["Nóminas", "verde"]],
  evento: [["Asamblea", "rojo"], ["Reunión", "azul"], ["Negociación", "ambar"], ["Elecciones", "morado"], ["Festivo", "verde"], ["Otro", "gris"]],
  acta: [["Comité de empresa", "azul"], ["Asamblea", "rojo"], ["Negociación", "ambar"], ["Otra", "gris"]],
  convenio: [["General", "gris"], ["Jornada", "azul"], ["Vacaciones", "ambar"], ["Permisos", "verde"], ["Salario", "rojo"]],
  documento: [["Convenio", "azul"], ["Otros", "gris"]],
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
const colorDe = (t) => { for (const l of ["evento", "acta", "aviso", "convenio", "documento"]) { const o = (OPC[l] || []).find(x => x[0] === t); if (o) return o[1]; } return "gris"; };

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
  return String(s ?? "").trim().split(/\n\s*\n/).map(bloque => {
    const ls = bloque.split("\n");
    if (ls.every(l => /^\s*[-•*]\s+/.test(l)))
      return "<ul>" + ls.map(l => "<li>" + linea(l.replace(/^\s*[-•*]\s+/, "")) + "</li>").join("") + "</ul>";
    return "<p>" + ls.map(linea).join("<br>") + "</p>";
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
