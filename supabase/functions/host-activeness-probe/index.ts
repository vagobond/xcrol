// Cron-invoked function: emails active hosts who haven't signed in for 60+ days
// asking them to confirm or pause their listing.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_PUBLIC_URL") ?? "https://xcrol.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INACTIVE_DAYS = 60;
const REPROBE_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Eligible hosts: open to hosting, not currently paused, no recent probe.
    const reprobeBefore = new Date(Date.now() - REPROBE_DAYS * 86400_000).toISOString();
    const { data: prefs, error } = await admin
      .from("hosting_preferences")
      .select("id, user_id, last_activeness_probe_at, is_hosting_paused")
      .eq("is_open_to_hosting", true)
      .eq("is_hosting_paused", false)
      .or(`last_activeness_probe_at.is.null,last_activeness_probe_at.lt.${reprobeBefore}`);
    if (error) throw error;

    let probed = 0;
    let skipped = 0;
    const inactiveCutoff = Date.now() - INACTIVE_DAYS * 86400_000;

    for (const p of prefs ?? []) {
      const { data: userData } = await admin.auth.admin.getUserById(p.user_id);
      const user = userData?.user;
      if (!user?.email) { skipped++; continue; }
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
      if (lastSignIn > inactiveCutoff) { skipped++; continue; }

      const { data: profile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", p.user_id)
        .maybeSingle();

      const token = crypto.randomUUID();
      const { error: tokErr } = await admin
        .from("hosting_preferences")
        .update({ last_probe_token: token, last_activeness_probe_at: new Date().toISOString() })
        .eq("id", p.id);
      if (tokErr) { skipped++; continue; }

      const confirmUrl = `${SUPABASE_URL}/functions/v1/host-activeness-response?token=${token}&action=confirm`;
      const pauseUrl = `${SUPABASE_URL}/functions/v1/host-activeness-response?token=${token}&action=pause`;
      const name = profile?.display_name || "there";

      if (RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "XCROL <noreply@invites.xcrol.com>",
            to: [user.email],
            subject: "Still hosting on Hearth Surf?",
            html: `
              <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1a1a1a;">
                <h2 style="color: #6d28d9;">Hi ${name},</h2>
                <p>We haven't seen you on XCROL in a couple of months, and your Hearth Surf listing is still public.</p>
                <p>Travelers trust listings that are kept fresh. Could you take one second to let us know?</p>
                <p style="margin: 32px 0;">
                  <a href="${confirmUrl}" style="background:#6d28d9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;margin-right:12px;display:inline-block;">Yes, still hosting</a>
                  <a href="${pauseUrl}" style="background:#f3f4f6;color:#111;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Pause my listing</a>
                </p>
                <p style="color:#666;font-size:13px;">If you do nothing, your listing stays visible — but we'll ask again in 30 days. You can resume any time from Hearth Surf → My Space.</p>
              </div>`,
          }),
        });
      }
      probed++;
    }

    return new Response(JSON.stringify({ probed, skipped, total: prefs?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("host-activeness-probe error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
