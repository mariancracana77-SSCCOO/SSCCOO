// Prueba estática (sin navegador): archivos que listan sw.js/HTML/CSS existen, versiones iguales, nada en línea.
// Uso: node pruebas/estatica.cjs  (o node pruebas/estatica.cjs <carpeta de la web>)
const fs = require("fs"), path = require("path");
const R = process.argv[2] || path.join(__dirname, ".."), ex = (f) => fs.existsSync(path.join(R, f.split("?")[0]));
const leer = (f) => fs.readFileSync(path.join(R, f), "utf8"), fallos = [];
// 1. sw.js: lista de precache
const sw = leer("sw.js"), V = sw.match(/const VERSION = "(\d+)"/)[1];
const base = sw.match(/const BASE = \[(.*)\];/)[1];
[...base.matchAll(/"([^"]+)"/g)].map(m => m[1]).filter(x => !x.startsWith("?")).forEach(f => { if (f !== "./" && !ex(f)) fallos.push("sw.js precache no existe: " + f); });
[...base.matchAll(/\[(.*?)\]\.map/g)][0][1].match(/"[^"]+"/g).map(s => s.slice(1, -1)).forEach(f => { if (!ex(f)) fallos.push("sw.js precache (?v) no existe: " + f); });
// 2. versión igual en todos sitios
const cfg = leer("config.js").match(/VERSION_WEB = "(\d+)"/)[1]; if (cfg !== V) fallos.push(`config.js ${cfg} != sw.js ${V}`);
for (const h of ["index.html", "admin.html", "cartel.html"]) {
  const t = leer(h);
  new Set([...t.matchAll(/\?v=(\d+)/g)].map(m => m[1])).forEach(v => { if (v !== V) fallos.push(`${h}: ?v=${v} != ${V}`); });
  [...t.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(u => !/^(https?:|data:|mailto:|tel:)/.test(u)).forEach(u => { if (!ex(u)) fallos.push(`${h}: no existe ${u}`); });
  if (/<script(?![^>]*\bsrc=)[^>]*>[^<]/i.test(t)) fallos.push(h + ": <script> en línea");
  if (/\son(click|change|input|submit|load|error)\s*=/i.test(t)) fallos.push(h + ": manejador en línea");
}
// 3. plantillas JS sin onclick=""
for (const f of fs.readdirSync(R).filter(f => f.endsWith(".js") && !["qr.js"].includes(f))) if (/\bon(click|change|input|submit)\s*=\s*\\?["']/.test(leer(f))) fallos.push(f + ": onclick= en plantilla");
// 4. fuentes y manifest
[...leer("fuentes.css").matchAll(/url\(([^)]+)\)/g)].forEach(m => { if (!ex(m[1])) fallos.push("fuentes.css: no existe " + m[1]); });
const man = JSON.parse(leer("manifest.json")); [...man.icons, ...(man.screenshots || [])].forEach(i => { if (!ex(i.src)) fallos.push("manifest: no existe " + i.src); });
console.log(fallos.length ? "FALLOS:\n- " + fallos.join("\n- ") : "Estática: todo bien (versión " + V + ")");
process.exit(fallos.length ? 1 : 0);
