// Xcrol AI edge function for Scrolls. Paid (Wayfarer+) feature.
// Currently gated as "coming soon" — always returns 402 until membership ships.
// When membership opens, replace the gate with a real entitlement check and
// uncomment the gateway call below.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "unauthorized" }, 401);
    }

    // ── Wayfarer+ gate ─────────────────────────────────────────────
    // Memberships are not yet sold. Until then, always return 402.
    // When membership ships:
    //   const isPaid = await checkWayfarerPlus(supabase, userData.user.id);
    //   if (!isPaid) return json({ error: "wayfarer_plus_required" }, 402);
    return json(
      {
        error: "wayfarer_plus_required",
        message:
          "Xcrol AI is a Wayfarer+ feature, coming soon. For now, add your own AI provider key in Settings.",
      },
      402,
    );
    // ──────────────────────────────────────────────────────────────
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
