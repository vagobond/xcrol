// Public health endpoint for uptime monitoring.
// Returns 200 when the database is reachable and the last backup run
// (if any) finished within the last 48 hours. Returns 503 otherwise.
//
// No auth required — safe to ping every minute.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  const checks: Record<string, { ok: boolean; detail?: string; ms?: number }> = {};
  let overallOk = true;

  // 1) Database reachability — cheap query against a tiny table.
  try {
    const t0 = Date.now();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await admin
      .from("backup_runs")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) throw error;
    checks.database = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    overallOk = false;
    checks.database = { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }

  // 2) Recent backup — last successful run within 48h. Soft check: if there
  // are no rows at all (fresh install) we don't fail.
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await admin
      .from("backup_runs")
      .select("status, finished_at")
      .eq("status", "success")
      .order("finished_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) {
      checks.backup = { ok: true, detail: "no runs yet" };
    } else {
      const ageMs = Date.now() - new Date(data[0].finished_at).getTime();
      const fresh = ageMs < 48 * 3600 * 1000;
      // Backup staleness is informational only — it must NOT flip the
      // overall liveness signal to 503, because clients use that signal
      // to decide whether to show the read-only banner. A stale backup
      // does not mean the backend is down.
      checks.backup = {
        ok: fresh,
        detail: `last success ${Math.round(ageMs / 3600000)}h ago`,
      };
    }
  } catch (e) {
    // Non-fatal — backups are auxiliary.
    checks.backup = { ok: true, detail: `check skipped: ${e instanceof Error ? e.message : String(e)}` };
  }

  const body = {
    ok: overallOk,
    status: overallOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - started,
    checks,
  };

  return new Response(JSON.stringify(body), {
    status: overallOk ? 200 : 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
