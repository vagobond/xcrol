// Public token endpoint: confirm or pause a host's Hearth Surf listing.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_PUBLIC_URL") ?? "https://xcrol.com";

const page = (title: string, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:Georgia,serif;background:#0a0a0a;color:#e0e0e0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
.card{background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(139,92,246,.3);border-radius:16px;padding:40px;max-width:480px;text-align:center}
h1{color:#a78bfa;font-weight:normal}a{color:#a78bfa}</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p>
<p><a href="${APP_URL}/hearth-surfing">Open Hearth Surf →</a></p></div></body></html>`;

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action");

  if (!token || (action !== "confirm" && action !== "pause")) {
    return new Response(page("Invalid link", "This link is malformed."), {
      status: 400, headers: { "Content-Type": "text/html" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: pref, error } = await admin
    .from("hosting_preferences")
    .select("id")
    .eq("last_probe_token", token)
    .maybeSingle();

  if (error || !pref) {
    return new Response(page("Link expired", "This activeness check link has already been used or expired. You can manage your listing inside the app."), {
      status: 404, headers: { "Content-Type": "text/html" },
    });
  }

  const updates: Record<string, unknown> = {
    last_probe_token: null,
    last_activeness_probe_at: new Date().toISOString(),
    is_hosting_paused: action === "pause",
  };
  await admin.from("hosting_preferences").update(updates).eq("id", pref.id);

  return new Response(
    page(
      action === "pause" ? "Listing paused" : "Thanks — you're still hosting",
      action === "pause"
        ? "Your Hearth Surf listing is hidden from search. Resume any time from Hearth Surf → My Space."
        : "Your listing stays visible. We'll only ask again if you go quiet for a while.",
    ),
    { headers: { "Content-Type": "text/html" } },
  );
});
