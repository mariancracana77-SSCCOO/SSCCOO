// Envía avisos al móvil (notificaciones) y al canal de Telegram cuando se publica algo.
// La autenticación se hace aquí dentro: o un admin con su sesión, o la tarea programada con su secreto.
// v58: a quien eligió otro idioma (push_subs.idioma) le llega la notificación traducida con Gemini (gratuito);
// cada traducción se guarda en «traducciones» (tabla "push") y, si falla o tarda, se manda en español.
// v66: «cambio: true» (casilla «Avisar otra vez de este cambio» del panel) titula la notificación «Cambio: …».
// v102: el día en que un aviso sale destacado en Inicio («Destacar en Inicio el día»), la tarea manda «DESTACADO HOY: …» una vez.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const URL_SB = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(URL_SB, SERVICIO, { auth: { persistSession: false } });
const IDIOMAS: Record<string, string> = { ca: "catalán", en: "inglés", ro: "rumano", ar: "árabe", fr: "francés", pt: "portugués", de: "alemán", pl: "polaco", sr: "serbio" };
const MODELOS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

async function config(): Promise<Record<string, string>> {
  const { data } = await admin.from("config_privada").select("clave, valor");
  return Object.fromEntries((data ?? []).map((r) => [r.clave, r.valor]));
}
const recorta = (t: string, n: number) => { t = (t || "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
const escHTML = (t: string) => (t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fechaCorta = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
const opcionesDe = (t: string) => String(t || "").split("\n").map((o) => o.trim()).filter(Boolean).slice(0, 6);

const TABLAS: Record<string, (x: any, web: string) => { titulo: string; cuerpo: string; url: string; largo: string }> = {
  comunicados: (x, web) => ({
    titulo: (x.urgente ? "URGENTE: " : "Nuevo aviso: ") + x.titulo, cuerpo: recorta(x.contenido, 140), url: web + "#avisos",
    largo: recorta(x.contenido, 700) + ((x.adjuntos || []).length ? `\n\nArchivos adjuntos: ${(x.adjuntos || []).length}` : ""),
  }),
  actas: (x, web) => ({ titulo: "Nueva acta: " + x.titulo, cuerpo: recorta(x.resumen || "", 140), url: web + "#actas", largo: recorta(x.resumen || "", 500) + (x.acuerdos ? "\n\nAcuerdos:\n" + recorta(x.acuerdos, 500).replace(/ - /g, "\n- ") : "") }),
  documentos: (x, web) => ({ titulo: "Nuevo documento: " + x.titulo, cuerpo: recorta(x.descripcion || "Ya disponible en la web.", 140), url: web + "#documentos", largo: recorta(x.descripcion || "", 400) }),
  eventos: (x, web) => {
    const cuando = fechaCorta(x.fecha) + (x.hora ? ", " + x.hora : "") + (x.lugar ? " · " + x.lugar : "");
    return { titulo: "Nueva fecha: " + x.titulo, cuerpo: cuando, url: web + "#calendario", largo: cuando + (x.descripcion ? "\n\n" + recorta(x.descripcion, 400) : "") };
  },
  // Publicaciones de los apartados que crea el admin (Comité de empresa, etc.). x._ap es su apartado.
  publicaciones: (x, web) => {
    const n = (x.adjuntos || []).length, archivos = n ? `${n} archivo${n === 1 ? "" : "s"} (fotos o documentos)` : "";
    return {
      titulo: x._ap.titulo + ": " + x.titulo, cuerpo: recorta(x.contenido || archivos || "Ya disponible en la web.", 140), url: web + "#ap-" + x._ap.slug,
      largo: recorta(x.contenido || "", 600) + (archivos ? (x.contenido ? "\n\n" : "") + archivos : ""),
    };
  },
  // Encuestas anónimas: se vota en la portada (el enlace lleva directo a la encuesta)
  encuestas: (x, web) => {
    const ops = opcionesDe(x.opciones), cierre = x.cierra ? "Se cierra el " + fechaCorta(x.cierra) + "." : "";
    return {
      titulo: "Nueva encuesta: " + x.pregunta, cuerpo: recorta("Vota de forma anónima: " + ops.join(" / "), 140), url: web + "#encuesta-" + x.id,
      largo: ops.map((o) => "- " + o).join("\n") + "\n\nVota de forma anónima en la web: nadie puede saber qué ha votado cada uno." + (cierre ? " " + cierre : ""),
    };
  },
};

async function huellaDe(t: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
// Título y texto de una notificación en otro idioma (o null si no se puede: entonces va en español)
async function traducePush(cfg: Record<string, string>, m: { titulo: string; cuerpo: string }, idioma: string) {
  try {
    const original = { titulo: m.titulo, cuerpo: m.cuerpo };
    const huella = await huellaDe(JSON.stringify(original)), id = parseInt(huella.slice(0, 12), 16);
    const { data: g } = await admin.from("traducciones").select("huella, texto").eq("tabla", "push").eq("id_reg", id).eq("idioma", idioma).maybeSingle();
    if (g && g.huella === huella) return g.texto as { titulo: string; cuerpo: string };
    const clave = Deno.env.get("GEMINI_API_KEY") || cfg.gemini;
    if (!clave) return null;
    const sistema = `Traduce del español al ${IDIOMAS[idioma]} el título y el texto de una notificación de la Sección Sindical CCOO de una empresa de transporte.
Traducción fiel y breve. Mantén igual los nombres propios, siglas (CCOO), cifras, fechas, horas y nombres de lugares.`;
    for (const modelo of MODELOS) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: "POST", signal: AbortSignal.timeout(15000),
        headers: { "x-goog-api-key": clave, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistema }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(original) }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2,
            responseSchema: { type: "OBJECT", properties: { titulo: { type: "STRING" }, cuerpo: { type: "STRING" } }, required: ["titulo", "cuerpo"] } },
        }),
      }).catch(() => null);
      if (!r || !r.ok) { if (r) console.error("Gemini", modelo, r.status); continue; }
      const res = await r.json();
      const texto = (res.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
      try {
        const t = JSON.parse(texto.replace(/^```(?:json)?\s*|\s*```$/g, ""));
        if (typeof t.titulo !== "string" || !t.titulo.trim()) continue;
        const limpio = { titulo: recorta(t.titulo, 120), cuerpo: recorta(typeof t.cuerpo === "string" ? t.cuerpo : "", 180) };
        await admin.from("traducciones").upsert({ tabla: "push", id_reg: id, idioma, huella, texto: limpio, creado: new Date().toISOString() });
        return limpio;
      } catch { /* siguiente modelo */ }
    }
  } catch (e) { console.error("traducePush", String(e).slice(0, 200)); }
  return null;
}

async function enviarPush(cfg: Record<string, string>, m: { titulo: string; cuerpo: string; url: string }, etiqueta: string) {
  webpush.setVapidDetails(cfg.vapid_contacto, cfg.vapid_publica, cfg.vapid_privada);
  const { data: subs } = await admin.from("push_subs").select("*");
  let ok = 0, fallos = 0;
  // Lo que se manda a cada idioma («» = español); cada idioma se traduce una sola vez por aviso
  const cargas = new Map<string, string>([["", JSON.stringify({ titulo: m.titulo, cuerpo: m.cuerpo, url: m.url, etiqueta })]]);
  for (const s of subs ?? []) {
    const idi = s.idioma && IDIOMAS[s.idioma] ? s.idioma : "";
    if (!cargas.has(idi)) {
      const t = await traducePush(cfg, m, idi);
      cargas.set(idi, t ? JSON.stringify({ titulo: t.titulo, cuerpo: t.cuerpo, url: m.url, etiqueta }) : cargas.get("")!);
    }
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, cargas.get(idi)!, { TTL: 86400, urgency: "high" });
      ok++;
      await admin.from("push_subs").update({ ultimo_ok: new Date().toISOString() }).eq("endpoint", s.endpoint);
    } catch (e) {
      fallos++;
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await admin.from("push_subs").delete().eq("endpoint", s.endpoint); // móvil que ya no existe o desactivó los avisos
      else console.error("push", code, String(e).slice(0, 200));
    }
  }
  return { ok, fallos, total: (subs ?? []).length };
}

async function enviarTelegram(cfg: Record<string, string>, texto: string, url?: string) {
  if (!cfg.telegram_token || !cfg.telegram_chat) return { configurado: false };
  const r = await fetch(`https://api.telegram.org/bot${cfg.telegram_token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: cfg.telegram_chat, text: texto, parse_mode: "HTML", link_preview_options: { is_disabled: true },
      ...(url ? { reply_markup: { inline_keyboard: [[{ text: "Abrir en la web", url }]] } } : {}),
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) { console.error("telegram", r.status, JSON.stringify(j).slice(0, 300)); return { configurado: true, ok: false, error: j.description || "error" }; }
  return { configurado: true, ok: true };
}

// Avisa de un elemento si toca (y solo una vez: se marca antes de enviar)
async function avisarDe(tabla: string, id: number, cfg: Record<string, string>, cambio = false) {
  const { data: filas } = await admin.from(tabla).update({ notificado: true }).eq("id", id).eq("notificado", false).eq("notificar", true).select("*");
  const x = filas?.[0];
  if (!x) return { enviado: false, motivo: "ya avisado o sin aviso" };
  if (tabla === "comunicados" && x.publicar_en && new Date(x.publicar_en) > new Date()) {
    await admin.from(tabla).update({ notificado: false }).eq("id", id); // se avisará cuando se publique
    return { enviado: false, motivo: "programado" };
  }
  if (tabla === "publicaciones") {
    const { data: ap } = await admin.from("apartados").select("titulo, slug, visible").eq("id", x.apartado_id).maybeSingle();
    if (!ap || !ap.visible || !x.publicado) return { enviado: false, motivo: "apartado oculto" };
    x._ap = ap;
  }
  if (tabla === "encuestas" && !x.publicada) return { enviado: false, motivo: "encuesta oculta" };
  const m = TABLAS[tabla](x, cfg.web_url);
  // «Avisar otra vez de este cambio» (panel v66): el título dice que es un cambio, no algo nuevo
  if (cambio) m.titulo = tabla === "publicaciones" ? x._ap.titulo + " (cambio): " + x.titulo
    : (x.urgente ? "URGENTE, cambio: " : "Cambio: ") + (x.titulo || x.pregunta);
  const push = await enviarPush(cfg, m, tabla + "-" + id);
  const tg = await enviarTelegram(cfg, `<b>${escHTML(m.titulo)}</b>${m.largo ? "\n\n" + escHTML(m.largo) : ""}`, m.url);
  return { enviado: true, push, telegram: tg };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { /* vacío */ }
  const cfg = await config();

  // --- Tarea programada (cada 10 minutos): avisos programados que ya tocan y avisos pendientes ---
  if (body.modo === "cron") {
    if (!cfg.cron_secreto || req.headers.get("x-cron-secret") !== cfg.cron_secreto) return json({ error: "No autorizado" }, 401);
    // Primero, los avisos que se repiten solos y tocan ahora: se publican como avisos normales y se avisan abajo
    const { data: recurrentes, error: errRec } = await admin.rpc("publicar_recurrentes");
    if (errRec) console.error("recurrentes", errRec.message);
    const desde = new Date(Date.now() - 2 * 86400000).toISOString();
    const res: unknown[] = [];
    // v102: avisos que hoy salen destacados en Inicio: una notificación ese día, aunque el aviso sea antiguo (se marca antes de enviar)
    const ahoraIso = new Date().toISOString();
    const { data: dest, error: errDest } = await admin.from("comunicados").update({ destacado_avisado: true }).eq("destacado_avisado", false)
      .lte("destacar_desde", ahoraIso).gt("destacar_hasta", ahoraIso).or(`publicar_en.is.null,publicar_en.lte.${ahoraIso}`).select("*");
    if (errDest) console.error("destacados", errDest.message);
    for (const x of dest ?? []) {
      const m = TABLAS.comunicados(x, cfg.web_url);
      m.titulo = "DESTACADO HOY: " + x.titulo;
      const push = await enviarPush(cfg, m, "comunicados-" + x.id + "-destacado");
      const tg = await enviarTelegram(cfg, `<b>${escHTML(m.titulo)}</b>${m.largo ? "\n\n" + escHTML(m.largo) : ""}`, m.url);
      res.push({ t: "destacado", id: x.id, push, telegram: tg });
    }
    for (const t of Object.keys(TABLAS)) {
      let q = admin.from(t).select("id").eq("notificar", true).eq("notificado", false);
      if (t === "comunicados") q = q.or(`publicar_en.lte.${new Date().toISOString()},and(publicar_en.is.null,fecha.gte.${desde})`);
      else q = q.gte(t === "documentos" ? "fecha" : "creado", desde);
      if (t === "encuestas") q = q.eq("publicada", true);
      const { data } = await q.limit(10);
      for (const r of data ?? []) res.push({ t, id: r.id, ...(await avisarDe(t, r.id, cfg)) });
    }
    return json({ ok: true, recurrentes: recurrentes ?? 0, procesados: res });
  }

  // --- Resto: solo admins ---
  const usuario = createClient(URL_SB, ANON, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: esAdmin } = await usuario.rpc("is_admin");
  if (!esAdmin) return json({ error: "Solo las cuentas con permiso para publicar." }, 403);

  if (body.modo === "publicado") {
    if (!TABLAS[body.tabla] || !Number.isInteger(body.id)) return json({ error: "Datos no válidos" }, 400);
    return json(await avisarDe(body.tabla, body.id, cfg, body.cambio === true));
  }
  if (body.modo === "estado") {
    const { count } = await admin.from("push_subs").select("*", { count: "exact", head: true });
    return json({ suscritos: count ?? 0, telegram: !!(cfg.telegram_token && cfg.telegram_chat), telegram_canal: cfg.telegram_nombre || cfg.telegram_chat || "" });
  }
  if (body.modo === "telegram_config") {
    const token = String(body.token || "").trim(), chat = String(body.chat || "").trim();
    if (!/^\d+:[\w-]{30,}$/.test(token)) return json({ error: "El token no tiene el formato correcto. Debe parecerse a 123456789:AAH… (te lo da @BotFather)." }, 400);
    if (!chat) return json({ error: "Falta el canal. Escribe su nombre con @ (ej. @ccoocalsina)." }, 400);
    const yo = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json()).catch(() => ({}));
    if (!yo.ok) return json({ error: "Telegram no reconoce ese token. Cópialo otra vez de @BotFather." }, 400);
    const prueba = await enviarTelegram({ telegram_token: token, telegram_chat: chat }, "<b>Conexión correcta</b>\n\nA partir de ahora, los avisos de la Sección Sindical CCOO Calsina Carré se publicarán aquí automáticamente.");
    if (!prueba.ok) return json({ error: "El bot no puede escribir en ese canal. Añade el bot (@" + yo.result.username + ") como administrador del canal y vuelve a probar. Detalle: " + prueba.error }, 400);
    await admin.from("config_privada").upsert([{ clave: "telegram_token", valor: token }, { clave: "telegram_chat", valor: chat }, { clave: "telegram_nombre", valor: chat }]);
    return json({ ok: true, bot: yo.result.username });
  }
  if (body.modo === "telegram_quitar") {
    await admin.from("config_privada").delete().in("clave", ["telegram_token", "telegram_chat", "telegram_nombre"]);
    return json({ ok: true });
  }
  if (body.modo === "prueba") {
    const m = { titulo: "Prueba de avisos", cuerpo: "Si ves esto, las notificaciones funcionan.", url: cfg.web_url };
    return json({ push: await enviarPush(cfg, m, "prueba"), telegram: await enviarTelegram(cfg, "<b>Prueba de avisos</b>\n\nSi ves esto, Telegram está bien conectado.", cfg.web_url) });
  }
  return json({ error: "Acción desconocida" }, 400);
});
