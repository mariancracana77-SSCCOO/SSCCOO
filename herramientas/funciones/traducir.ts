// Traduce avisos, actas, preguntas, apartados del convenio, publicaciones, fechas del calendario y documentos
// con la IA gratuita de Google (Gemini). Pública (la usan los trabajadores), pero solo traduce lo que ya está publicado
// y guarda cada traducción para no volver a pedirla mientras el texto no cambie.
// Modo «textos» (v58): traduce los textos fijos de «Mis descansos» y (v81) de «Mis ganancias». No acepta texto de fuera: los saca él mismo
// del archivo publicado en la web (las cadenas escritas como T("...") o TH("...")), así nadie puede usarla para otra cosa.
// En «ganancias» añade los nombres, grupos y notas de la tabla tarifas_conductor (los escribe el admin en el panel).
// v77: si Gemini contesta «mucha demanda» (503/500) o «cuota» (429), reintenta con espera y apunta cada fallo en el registro.
// v96: grupo «aparcar» (la guía rápida de «Aparcamientos en mi ruta»).
// v170: en «aparcar» añade también la ficha de normas por país (normas_pais visibles) y los nombres y notas de prohibiciones_camion.
// v177 (petición n.º 45 del padre): grupos «finiquito», «hora», «diccionario» y «adr» (herramientas nuevas de Zona Conductores).
// Además de T("...") sacan las cadenas de entre /* textos */ y /* fin textos */ de sus .js y el texto que se ve en su
// sección de index.html («textosVista»: misma forma de partirlo que zona-idioma.js en la web). Copia de antes en privado.respaldo_funciones (id 14).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODELOS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
const ESPERAS = [0, 2500, 6000]; // ms antes de cada intento con el mismo modelo
const TOPE_MS = 40000; // v81: si un modelo no contesta en 40 s, se pasa al siguiente (antes esperaba hasta el límite de 150 s de la función)
const IDIOMAS: Record<string, string> = { ca: "catalán", en: "inglés", ro: "rumano", ar: "árabe", fr: "francés", pt: "portugués", de: "alemán", pl: "polaco", sr: "serbio" };
const CAMPOS: Record<string, string[]> = {
  comunicados: ["titulo", "contenido"],
  actas: ["titulo", "resumen", "acuerdos"],
  preguntas: ["pregunta", "respuesta"],
  convenio_secciones: ["titulo", "resumen", "contenido"],
  publicaciones: ["titulo", "contenido"],
  eventos: ["titulo", "descripcion", "lugar"],
  documentos: ["titulo", "descripcion"],
};
const GRUPOS: Record<string, { archivo: string; tema: string; mas?: string[]; vista?: string }> = {
  descansos: { archivo: "descansos.js", tema: "una calculadora de descansos semanales para conductores de camión (Reglamento CE 561/2006)" },
  ganancias: { archivo: "ganancias.js", tema: "una calculadora de lo que gana un conductor de camión (salario, dietas, suplementos, pluses, kilómetros)" },
  aparcar: { archivo: "aparcar.js", tema: "una herramienta para conductores de camión que busca aparcamientos en la ruta (con mapa, cortes de carretera y peajes) y explica por país las normas para camiones: peajes, cadenas e invierno, prohibiciones de circular y festivos" },
  finiquito: { archivo: "finiquito.js", mas: ["convenio-girona.js"], vista: "v-finiquito", tema: "una calculadora del finiquito y la indemnización de un conductor de camión según el convenio de transporte de mercancías de Girona y el Estatuto de los Trabajadores (salario, pagas extra, vacaciones, antigüedad, tipos de despido)" },
  hora: { archivo: "hora.js", mas: ["convenio-girona.js"], vista: "v-hora", tema: "una calculadora del precio de la hora ordinaria y la hora extra de un conductor de camión según el convenio de transporte de mercancías de Girona" },
  diccionario: { archivo: "diccionario.js", vista: "v-diccionario", tema: "un diccionario de siglas y palabras del transporte por carretera para conductores de camión (papeles y aduanas, conducción, nómina, vehículo). Las siglas y palabras técnicas (CMR, DUA, TIR, AdBlue, ITV...) se dejan igual si en ese idioma se usan así" },
  adr: { archivo: "adr.js", vista: "v-adr", tema: "un test de preguntas para el examen del ADR (transporte de mercancías peligrosas por carretera), con la placa naranja y cómo sacar el carnet. Usa los términos oficiales del ADR en ese idioma (clases, número ONU, número de peligro, instrucciones escritas)" },
};
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function huellaDe(t: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function claveGemini() {
  const { data: cl } = await admin.from("config_privada").select("valor").eq("clave", "gemini").maybeSingle();
  return Deno.env.get("GEMINI_API_KEY") || cl?.valor;
}
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ultimoEstado = 0; // último código de error de Gemini, para decir bien qué pasa
const msgFallo = () => ultimoEstado === 429 || ultimoEstado === 503 || ultimoEstado === 500
  ? "Hay mucha demanda ahora mismo. Prueba en un minuto."
  : "No se ha podido traducir ahora mismo. Prueba más tarde.";

async function gemini(clave: string, sistema: string, entrada: unknown, esquema: unknown) {
  ultimoEstado = 0;
  for (const modelo of MODELOS) {
    for (let n = 0; n < ESPERAS.length; n++) {
      if (ESPERAS[n]) await espera(ESPERAS[n]);
      let r: Response;
      try {
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": clave, "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sistema }] },
            contents: [{ role: "user", parts: [{ text: JSON.stringify(entrada) }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema: esquema, temperature: 0.2 },
          }),
          signal: AbortSignal.timeout(TOPE_MS),
        });
      } catch (e) {
        console.error("Gemini red", modelo, "intento", n + 1, String(e).slice(0, 200));
        if ((e as Error)?.name === "TimeoutError") break; // no contesta: siguiente modelo
        continue;
      }
      if (!r.ok) {
        ultimoEstado = r.status;
        console.error("Gemini", modelo, r.status, "intento", n + 1, (await r.text()).slice(0, 200));
        if ([429, 500, 502, 503, 504].includes(r.status)) continue; // pasajero: se reintenta
        break; // otro error (clave, modelo...): pasa al siguiente modelo
      }
      let res;
      try { res = await r.json(); } catch (e) { console.error("Gemini lectura", modelo, String(e).slice(0, 200)); break; }
      const texto = (res.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
      try { ultimoEstado = 0; return JSON.parse(texto.replace(/^```(?:json)?\s*|\s*```$/g, "")); } catch { console.error("JSON", modelo, texto.slice(0, 200)); break; }
    }
  }
  return null;
}
const marcas = (t: string) => [...(t.match(/\{\w+\}/g) ?? [])].sort().join(",") + "|" + (t.match(/\*\*/g) ?? []).length;

// --- textosVista (v177) --- Misma forma de partir el texto que zona-idioma.js en la web (si se cambia una, la otra):
// un elemento con solo texto y <b>/<strong>/<i>/<em> (con solo texto dentro) es un bloque entero, con ** ** en las
// negritas; si no, cada trozo de texto suelto va aparte. Espacios juntados. Se saltan script, style, svg, textarea,
// input, template y lo que lleva translate="no". También placeholder, aria-label y title.
// Está escrito sin tipos para poder probarlo igual con Node (pruebas/traducir-textos.cjs).
const EN_LINEA_V = { b: "**", strong: "**", i: "", em: "" };
const SALTA_V = { script: 1, style: 1, textarea: 1, input: 1, template: 1, svg: 1 };
const VACIOS_V = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
const LETRA_V = /\p{L}/u;
const juntaV = (s) => s.replace(/\s+/g, " ").trim();
const entidadesV = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e) => {
  const l = e.toLowerCase();
  if (l[0] === "#") return String.fromCodePoint(l[1] === "x" ? parseInt(l.slice(2), 16) : parseInt(l.slice(1), 10));
  return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[l];
});
function arbolV(html, id) {
  const ini = html.search(new RegExp(`<[a-z]+[^>]*\\sid="${id}"`, "i"));
  if (ini < 0) return null;
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  re.lastIndex = ini;
  const raiz = { tag: "#raiz", attrs: {}, hijos: [] }, pila = [raiz];
  let m;
  while ((m = re.exec(html))) {
    const arriba = pila[pila.length - 1];
    if (m[0].startsWith("<!--")) continue;
    if (m[1]) { // cierre
      const t = m[1].toLowerCase();
      for (let i = pila.length - 1; i > 0; i--) if (pila[i].tag === t) { pila.length = i; break; }
      if (pila.length === 1) break; // se cerró la sección
      continue;
    }
    if (m[2]) {
      const t = m[2].toLowerCase(), attrs = {};
      for (const a of (m[3] || "").matchAll(/([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1].toLowerCase()] = entidadesV(a[2] ?? a[3] ?? a[4] ?? "");
      const nodo = { tag: t, attrs, hijos: [] };
      arriba.hijos.push(nodo);
      if (!m[4] && !VACIOS_V[t]) pila.push(nodo);
      continue;
    }
    if (m[5] != null && pila.length > 1) arriba.hijos.push({ texto: entidadesV(m[5]) });
  }
  return raiz.hijos[0] || null;
}
const textoDeV = (n) => n.texto != null ? n.texto : (n.hijos || []).map(textoDeV).join("");
function esBloqueV(el) {
  let letra = false;
  for (const n of el.hijos) {
    if (n.texto != null) { if (LETRA_V.test(n.texto)) letra = true; continue; }
    if (!(n.tag in EN_LINEA_V) || n.hijos.some((x) => x.texto == null)) return false;
    if (LETRA_V.test(textoDeV(n))) letra = true;
  }
  return letra;
}
const marcadoV = (el) => juntaV(el.hijos.map((n) => n.texto != null ? n.texto : EN_LINEA_V[n.tag] + textoDeV(n) + EN_LINEA_V[n.tag]).join(""));
function textosVista(html, id) {
  const lista = [], pon = (s) => { if (s && LETRA_V.test(s) && !lista.includes(s)) lista.push(s); };
  const recorre = (el) => {
    if (SALTA_V[el.tag] || el.attrs.translate === "no") return;
    for (const a of ["placeholder", "aria-label", "title"]) if (el.attrs[a]) pon(juntaV(el.attrs[a]));
    if (esBloqueV(el)) { pon(marcadoV(el)); return; }
    for (const n of el.hijos) { if (n.texto != null) pon(juntaV(n.texto)); else recorre(n); }
  };
  const raiz = arbolV(html, id);
  if (raiz) recorre(raiz);
  return lista;
}
// Cadenas de los .js: T("...")/TH("...") y las de entre /* textos */ y /* fin textos */ (con alguna letra)
function textosJS(fuente) {
  const lista = [], pon = (s) => { if (s && LETRA_V.test(s) && !lista.includes(s)) lista.push(s); };
  for (const m of fuente.matchAll(/\bTH?\("((?:[^"\\]|\\.)*)"/g)) { try { pon(JSON.parse('"' + m[1] + '"')); } catch { /* */ } }
  for (const z of fuente.matchAll(/\/\* textos \*\/([\s\S]*?)\/\* fin textos \*\//g)) {
    for (const m of z[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)) { try { pon(JSON.parse('"' + m[1] + '"')); } catch { /* */ } }
  }
  return lista;
}
// --- fin textosVista ---

async function textos(grupo: string, codigo: string, idioma: string) {
  const { data: w } = await admin.from("config_privada").select("valor").eq("clave", "web_url").maybeSingle();
  const web = String(w?.valor || "").replace(/\/?$/, "/");
  const G = GRUPOS[grupo], baja = async (f: string) => {
    const r = await fetch(web + f + "?t=" + Date.now(), { headers: { "Cache-Control": "no-cache" } });
    return r.ok ? await r.text() : null;
  };
  const fuente = await baja(G.archivo);
  if (fuente == null) return json({ error: "La traducción no está disponible ahora mismo." }, 503);
  const lista: string[] = [];
  if (!G.vista) { // los de siempre: solo T("...")/TH("..."), como antes
    for (const m of fuente.matchAll(/\bTH?\("((?:[^"\\]|\\.)*)"/g)) { try { const s = JSON.parse('"' + m[1] + '"'); if (s && !lista.includes(s)) lista.push(s); } catch { /* */ } }
  } else { // v177: lo que se ve en su sección de index.html y las cadenas de sus .js
    const html = await baja("index.html");
    if (html == null) return json({ error: "La traducción no está disponible ahora mismo." }, 503);
    const fuentes = [fuente];
    for (const f of G.mas ?? []) { const x = await baja(f); if (x == null) return json({ error: "La traducción no está disponible ahora mismo." }, 503); fuentes.push(x); }
    for (const s of [...textosVista(html, G.vista), ...fuentes.flatMap((x) => textosJS(x))]) if (!lista.includes(s)) lista.push(s);
  }
  if (grupo === "ganancias") {
    const { data: tar } = await admin.from("tarifas_conductor").select("grupo, concepto, nota").eq("visible", true);
    for (const t of tar ?? []) for (const s of [t.grupo, t.concepto, t.nota]) if (s && !lista.includes(s)) lista.push(s);
  }
  if (grupo === "aparcar") {
    // Solo lo que se ve en la web: normas comprobadas y prohibiciones en uso
    const { data: nor } = await admin.from("normas_pais").select("titulo, texto, peso, fechas").eq("visible", true);
    for (const n of nor ?? []) for (const s of [n.titulo, n.texto, n.peso, n.fechas]) if (s && !lista.includes(s)) lista.push(s);
    const { data: pro } = await admin.from("prohibiciones_camion").select("motivo, nota, visible");
    for (const x of (pro ?? []).filter((x) => x.visible !== false)) for (const s of [x.motivo, x.nota]) if (s && !lista.includes(s)) lista.push(s);
  }
  if (!lista.length || lista.length > 500) return json({ error: "Nada que traducir." }, 400);
  const huella = await huellaDe(JSON.stringify(lista)), tabla = "textos-" + grupo;
  const { data: guardada } = await admin.from("traducciones").select("*").eq("tabla", tabla).eq("id_reg", 0).eq("idioma", codigo).maybeSingle();
  if (guardada && guardada.huella === huella) return json({ textos: guardada.texto, guardada: true });
  const clave = await claveGemini();
  if (!clave) return json({ error: "La traducción no está disponible ahora mismo." }, 503);
  const sistema = `Traduce del español al ${idioma} los textos de ${GRUPOS[grupo].tema}, de la Sección Sindical CCOO.
Recibes una lista JSON de textos y devuelves {"t": [...]} con la traducción de cada uno, en el mismo orden y el mismo número de elementos.
Reglas: traducción clara y natural para un camionero. Deja igual lo que va entre llaves, como {fecha} o {horas} (son huecos que se rellenan luego: no los traduzcas), y conserva las marcas ** ** alrededor de la parte traducida equivalente. Si un texto empieza en minúscula o acaba en coma, respeta eso (son trozos de una lista). Mantén siglas (CCOO, CE, PDF, ADR, GB-CG-MA, DGT, BALM, ASFINAG, GO-Maut, Lkw-Maut, MMA, 3PMSF), cifras y nombres propios (FENADISMER, II Acuerdo Marco, España, Cataluña).`;
  const res: Record<string, string> = {};
  // En tandas de 50 para que la respuesta no se corte, todas a la vez (v81): una detrás de otra pasaban
  // del límite de 150 s de la función con «Mis ganancias»
  const partes: string[][] = [];
  for (let i = 0; i < lista.length; i += 50) partes.push(lista.slice(i, i + 50));
  const tandas = await Promise.all(partes.map((parte) => gemini(clave, sistema, parte, { type: "OBJECT", properties: { t: { type: "ARRAY", items: { type: "STRING" } } }, required: ["t"] })));
  for (let k = 0; k < partes.length; k++) {
    const parte = partes[k], t = tandas[k];
    if (!t || !Array.isArray(t.t) || t.t.length !== parte.length) return json({ error: msgFallo() }, 502);
    parte.forEach((s, j) => { const x = t.t[j]; if (typeof x === "string" && x.trim() && marcas(x) === marcas(s)) res[s] = x; });
  }
  await admin.from("traducciones").upsert({ tabla, id_reg: 0, idioma: codigo, huella, texto: res, creado: new Date().toISOString() });
  return json({ textos: res });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  let body: { tabla?: string; id?: number; idioma?: string; modo?: string; grupo?: string } = {};
  try { body = await req.json(); } catch { /* */ }
  const idioma = IDIOMAS[body.idioma ?? ""];
  if (body.modo === "textos") {
    if (!idioma || !Object.hasOwn(GRUPOS, body.grupo ?? "")) return json({ error: "Petición no válida." }, 400);
    return await textos(body.grupo!, body.idioma!, idioma);
  }
  const campos = CAMPOS[body.tabla ?? ""];
  if (!campos || !idioma || !Number.isInteger(body.id)) return json({ error: "Petición no válida." }, 400);

  const { data: x } = await admin.from(body.tabla!).select("*").eq("id", body.id!).maybeSingle();
  if (!x) return json({ error: "No encontrado." }, 404);
  // Solo lo que se ve en la web
  if (body.tabla === "comunicados" && x.publicar_en && new Date(x.publicar_en) > new Date()) return json({ error: "No encontrado." }, 404);
  if (body.tabla === "convenio_secciones" && x.visible === false) return json({ error: "No encontrado." }, 404);
  if (body.tabla === "publicaciones") {
    if (x.publicado === false) return json({ error: "No encontrado." }, 404);
    const { data: ap } = await admin.from("apartados").select("visible").eq("id", x.apartado_id).maybeSingle();
    if (!ap || ap.visible === false) return json({ error: "No encontrado." }, 404);
  }

  const original = Object.fromEntries(campos.map((c) => [c, x[c] ?? ""]));
  const huella = await huellaDe(JSON.stringify(original));
  const { data: guardada } = await admin.from("traducciones").select("*").eq("tabla", body.tabla!).eq("id_reg", body.id!).eq("idioma", body.idioma!).maybeSingle();
  if (guardada && guardada.huella === huella) return json({ texto: guardada.texto, guardada: true });

  const clave = await claveGemini();
  if (!clave) return json({ error: "La traducción no está disponible ahora mismo." }, 503);
  const esquema = { type: "OBJECT", properties: Object.fromEntries(campos.map((c) => [c, { type: "STRING" }])), required: campos };
  const sistema = `Traduce del español al ${idioma} un texto de la Sección Sindical CCOO de una empresa de transporte, para que lo entiendan compañeros de trabajo.\nReglas: traducción fiel y clara, sin añadir ni quitar información. Mantén igual los nombres propios, siglas (CCOO), cifras, fechas, horas y enlaces. Los nombres de lugares y direcciones déjalos como están.\nConserva el formato: saltos de línea, líneas que empiezan por "- " y el texto entre ** **. Si un campo está vacío, devuélvelo vacío.`;
  const t = await gemini(clave, sistema, original, esquema);
  if (!t) return json({ error: msgFallo() }, 502);
  const limpio = Object.fromEntries(campos.map((c) => [c, typeof t[c] === "string" ? t[c] : ""]));
  await admin.from("traducciones").upsert({ tabla: body.tabla, id_reg: body.id, idioma: body.idioma, huella, texto: limpio, creado: new Date().toISOString() });
  return json({ texto: limpio });
});
