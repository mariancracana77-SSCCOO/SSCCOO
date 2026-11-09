// Copia de la edge function «alerta-web». La que manda es la de Supabase.
// Modo alerta (lo pidió Lorena, 5/11/2026): la llama privado.web_vigila() (tarea vigila-web) con x-cron-secret.
// 7/11/2026 (opción A de Lorena): YA NO COMENTA EN GITHUB. En modo alerta y «resuelto» manda un aviso al móvil de Lorena
// (función avisar-padre con para = 'lorena'). Los modos «coordina» y «pages» no hacen nada aquí: coord_vigila y pages_vigila
// ya avisan a Lorena y apuntan la nota del coordinador por su cuenta.
const URL_SB = Deno.env.get("SUPABASE_URL")!, SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const cron = req.headers.get("x-cron-secret") || "";
  const cfg = await fetch(`${URL_SB}/rest/v1/config_privada?select=valor&clave=eq.cron_secreto`, { headers: { apikey: SERVICIO, Authorization: `Bearer ${SERVICIO}` } }).then(r => r.json()).catch(() => []);
  if (!cron || !cfg?.[0]?.valor || cron !== cfg[0].valor) return json({ error: "No autorizado" }, 401);
  let b: { modo?: string; version?: string; detalle?: string; repo?: string } = {};
  try { b = await req.json(); } catch { /* sin cuerpo */ }
  if (b.modo === "coordina" || b.modo === "pages") return json({ ok: true, aviso: "lo_avisa_el_coordinador" });
  const limpio = (s: unknown) => String(s ?? "").replace(/[^\w .,:?=()\/-]/g, "").slice(0, 300);
  const resuelto = b.modo === "resuelto";
  const r = await fetch(`${URL_SB}/functions/v1/avisar-padre`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cron-secret": cron },
    body: JSON.stringify({
      para: "lorena",
      titulo: resuelto ? "La web vuelve a ir bien" : "ALERTA: la web publicada falla",
      cuerpo: resuelto
        ? `La web publicada vuelve a ir bien (versión ${limpio(b.version)}).`
        : `Falla desde hace unos 10 minutos (versión ${limpio(b.version) || "?"}): ${limpio(b.detalle) || "?"}. Claude lo arregla en la revisión de cada hora; si es urgente, díselo en su chat.`,
      url: "admin.html#peticiones",
    }),
  });
  return json({ ok: r.ok, estado: r.status });
});
