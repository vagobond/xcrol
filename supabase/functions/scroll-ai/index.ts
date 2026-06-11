// Xcrol AI edge function for Scrolls. Paid (Wayfarer+) feature.
//
// Today this returns 402 for every user because Wayfarer+ memberships are
// not sold yet. The gate is structured around `hasWayfarerPlus()` so the
// day membership ships, only that function — and the commented Lovable AI
// Gateway block below — need to change.
//
// Free users use the BYOK browser path in src/lib/scroll-ai.ts; this
// function is never called for them.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Entitlement check. When Wayfarer+ memberships ship, swap the body for
 * a real query against the membership/entitlement source (e.g. a
 * `memberships` table with active/expires_at columns, or a Stripe
 * subscription mirror). Until then, no one is entitled.
 */
async function hasWayfarerPlus(
  _supabase: SupabaseClient,
  _userId: string,
): Promise<boolean> {
  // TODO(wayfarer-plus): replace with real entitlement lookup.
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    if (!(await hasWayfarerPlus(supabase, userData.user.id))) {
      return json(
        {
          error: "wayfarer_plus_required",
          message:
            "Xcrol AI is a Wayfarer+ feature, coming soon. For now, add your own AI provider key in Settings.",
        },
        402,
      );
    }

    // ── Wayfarer+ path (not yet reachable) ────────────────────────
    // When membership ships, implement the model call here using the
    // AI SDK + Lovable AI Gateway. Sketch:
    //
    //   import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
    //   import { generateText, Output } from "npm:ai";
    //   import { z } from "npm:zod";
    //
    //   const { scroll_id, action, payload } = await req.json();
    //   const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    //   if (!lovableKey) return json({ error: "missing_lovable_key" }, 500);
    //
    //   const gateway = createOpenAICompatible({
    //     name: "lovable",
    //     baseURL: "https://ai.gateway.lovable.dev/v1",
    //     headers: {
    //       "Lovable-API-Key": lovableKey,
    //       "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    //     },
    //   });
    //
    //   const { output } = await generateText({
    //     model: gateway("google/gemini-3-flash-preview"),
    //     output: Output.object({ schema: /* per-action schema */ }),
    //     prompt: /* built from scroll_id + action + payload */,
    //   });
    //
    //   return json(output, 200);
    return json({ error: "not_implemented" }, 501);
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
