// Copia de la edge function «alerta-web» (v1). La que manda es la de Supabase.
// Modo alerta (lo pidió Lorena, 5/11/2026): la llama solo privado.web_vigila() (tarea vigila-web) con x-cron-secret.
// Deja un comentario en la PR de alertas n.º 3 (despierta a la sesión «Lorena-web») y en la PR buzón n.º 2 (despierta a «Timbres»).
// Usa el secreto GITHUB_TOKEN de siempre. El comentario solo dice qué archivo falla (el repositorio es público).
const REPO = "mariancracana77-SSCCOO/SSCCOO";
const PRS = (Deno.env.get("ALERTA_PRS") || "3,2").split(",");
const URL_SB = Deno.env.get("SUPABASE_URL")!, SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const cron = req.headers.get("x-cron-secret") || "";
  const cfg = await fetch(`${URL_SB}/rest/v1/config_privada?select=valor&clave=eq.cron_secreto`, { headers: { apikey: SERVICIO, Authorization: `Bearer ${SERVICIO}` } }).then(r => r.json()).catch(() => []);
  if (!cron || !cfg?.[0]?.valor || cron !== cfg[0].valor) return json({ error: "No autorizado" }, 401);
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) return json({ ok: false, motivo: "sin_configurar" });
  let b: { modo?: string; version?: string; detalle?: string } = {};
  try { b = await req.json(); } catch { /* sin cuerpo */ }
  const limpio = (s: unknown) => String(s ?? "").replace(/[^\w .,:?=()\/-]/g, "").slice(0, 400);
  const texto = b.modo === "resuelto"
    ? `Resuelto: la web publicada vuelve a ir bien (versión ${limpio(b.version)}).`
    : `ALERTA: la web publicada falla desde hace unos 10 minutos (versión ${limpio(b.version) || "?"}). Falla: ${limpio(b.detalle) || "?"}. Coger el turno ajustes/publicando y volver a la última versión buena.`;
  const res: Record<string, number> = {};
  for (const pr of PRS) {
    const r = await fetch(`https://api.github.com/repos/${REPO}/issues/${encodeURIComponent(pr.trim())}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "ccoo-calsina-alerta", "Content-Type": "application/json" },
      body: JSON.stringify({ body: texto }),
    });
    res[pr.trim()] = r.status;
  }
  return json({ ok: true, res });
});
