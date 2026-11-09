// Timbre de «Pedir un cambio a Claude». 7/11/2026 (opción A de Lorena): YA NO COMENTA EN GITHUB.
// La petición se queda en peticiones_claude (estado nueva) y la tarea «Revisar peticiones» de Claude (cada hora de 8 a 22) la recoge.
// Sigue comprobando lo mismo (is_admin, petición reciente) y contesta ok para que el panel no cambie. Copia en herramientas/funciones/timbre.ts.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_SB = Deno.env.get("SUPABASE_URL")!, SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function comenta(texto: string) {
  console.log("timbre (sin GitHub):", texto);
  return json({ ok: true, aviso: "sin_github" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const cron = req.headers.get("x-cron-secret");
  if (cron) {
    const cfg = await fetch(`${URL_SB}/rest/v1/config_privada?select=valor&clave=eq.cron_secreto`, { headers: { apikey: SERVICIO, Authorization: `Bearer ${SERVICIO}` } }).then(r => r.json()).catch(() => []);
    if (!cfg?.[0]?.valor || cron !== cfg[0].valor) return json({ error: "No autorizado" }, 401);
    return comenta("Prueba del timbre (no hay ninguna petición nueva).");
  }
  const sb = createClient(URL_SB, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: esAdmin } = await sb.rpc("is_admin");
  if (!esAdmin) return json({ error: "Solo las cuentas del panel" }, 403);
  let id = 0, actualizada = false, anadido = false, avisar = false, deshacer = false, decision = false;
  try { const b = await req.json(); id = Number(b.id) || 0; actualizada = !!b.actualizada; anadido = !!b.anadido; avisar = !!b.avisar; deshacer = !!b.deshacer; decision = !!b.decision; } catch { /* sin cuerpo */ }
  const { data: p } = await sb.from("peticiones_claude").select("id,estado,creado,actualizado,espera,mensajes,avisar_lorena,deshacer,decision,decision_el").eq("id", id).maybeSingle();
  const cuando = p ? new Date(p.actualizado || p.creado).getTime() : 0;
  const reciente = Date.now() - cuando <= 10 * 60 * 1000;
  if (decision) {
    if (!p || !p.decision || !p.decision_el || Date.now() - new Date(p.decision_el).getTime() > 10 * 60 * 1000) return json({ ok: false, motivo: "no_decision" });
    return comenta(p.decision === "publicar" ? `Petición n.º ${p.id}: el padre dice PUBLICAR.` : `Petición n.º ${p.id}: el padre dice DESCARTAR.`);
  }
  if (deshacer) {
    if (!p || !p.deshacer || Date.now() - new Date(p.deshacer).getTime() > 10 * 60 * 1000) return json({ ok: false, motivo: "no_deshacer" });
    return comenta(`Petición n.º ${p.id}: el panel pide volver a como estaba antes.`);
  }
  if (avisar) {
    if (!p || !p.avisar_lorena || Date.now() - new Date(p.avisar_lorena).getTime() > 10 * 60 * 1000) return json({ ok: false, motivo: "no_avisar" });
    return comenta(`Petición n.º ${p.id}: el panel pide que lo mire Lorena.`);
  }
  if (anadido) {
    const ult = Array.isArray(p?.mensajes) ? p.mensajes[p.mensajes.length - 1] : null;
    const ultReciente = ult && ult.quien === "padre" && Date.now() - new Date(ult.cuando).getTime() <= 10 * 60 * 1000;
    if (!p || !ultReciente || !(p.estado === "nueva" || p.estado === "en_curso")) return json({ ok: false, motivo: "no_anadido" });
    return comenta(`Petición n.º ${p.id}: se ha añadido algo en el panel.`);
  }
  if (!p || p.estado !== "nueva" || !reciente) return json({ ok: false, motivo: "no_nueva" });
  return comenta(`Nueva petición en el panel (n.º ${p.id}).`);
});
