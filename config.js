// Conexión con Supabase (esta clave es pública: solo permite LEER;
// para publicar hace falta iniciar sesión como admin).
window.SUPABASE_URL = "https://kdfedwcskymaitvpryvg.supabase.co";
window.SUPABASE_KEY = "sb_publishable_RLt0HuAMskXkKl2hxhUF2w_sCexGznp";
window.sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

// Utilidades comunes
window.esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
window.textoHTML = (s) => esc(s)
  .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  .replace(/\n/g, "<br>");
window.fechaLarga = (d) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
