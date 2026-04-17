import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function buildEmailHtml(displayName: string, stats: {
  newPosts: number;
  unreadMessages: number;
  pendingRequests: number;
  newHometowns: number;
}): string {
  const greeting = displayName?.split(" ")[0] || "Friend";
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background: #0a0a0a; color: #e0e0e0; line-height: 1.7; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); }
    h1 { color: #ffffff; font-size: 22px; margin-bottom: 24px; font-weight: normal; }
    p { color: #c0c0c0; font-size: 16px; margin-bottom: 16px; }
    .stat-grid { margin: 28px 0; }
    .stat { background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin-bottom: 12px; }
    .stat-num { color: #a78bfa; font-size: 28px; font-weight: 700; display: block; line-height: 1; }
    .stat-label { color: #b0b0b0; font-size: 14px; margin-top: 4px; display: block; }
    .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: #666; font-size: 13px; text-align: center; }
    .footer a { color: #8b5cf6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Hi ${greeting},</h1>
      <p>Here's what happened in your XCROL networks this week:</p>

      <div class="stat-grid">
        <div class="stat"><span class="stat-num">${stats.newPosts}</span><span class="stat-label">new posts in The River from your friends</span></div>
        <div class="stat"><span class="stat-num">${stats.unreadMessages}</span><span class="stat-label">unread messages waiting for you</span></div>
        <div class="stat"><span class="stat-num">${stats.pendingRequests}</span><span class="stat-label">pending friend requests</span></div>
        <div class="stat"><span class="stat-num">${stats.newHometowns}</span><span class="stat-label">new hometowns claimed worldwide</span></div>
      </div>

      <p>Drop by The River to catch up — calm, chronological, and human.</p>
      <a href="https://www.xcrol.com/the-river" class="cta">Visit The River</a>

      <div class="footer">
        <p>You're receiving this because weekly digests are enabled.<br/>
        <a href="https://www.xcrol.com/settings">Manage email preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const { year, week } = getISOWeek(now);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch opted-in users
    const { data: settings, error: settingsErr } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("weekly_digest_enabled", true)
      .eq("email_notifications", true);

    if (settingsErr) throw settingsErr;

    const userIds = (settings ?? []).map((s: any) => s.user_id);
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No opted-in users" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Already-sent users this week
    const { data: alreadySent } = await supabase
      .from("weekly_digest_log")
      .select("user_id")
      .eq("year", year)
      .eq("week_number", week)
      .in("user_id", userIds);

    const sentSet = new Set((alreadySent ?? []).map((r: any) => r.user_id));
    const targetUserIds = userIds.filter((id) => !sentSet.has(id));

    // Aggregate weekly hometown count (same for everyone)
    const { count: newHometownsCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", sevenDaysAgo)
      .not("hometown_city", "is", null);

    let sent = 0;
    let failed = 0;

    for (const userId of targetUserIds) {
      try {
        // Fetch profile + email
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .maybeSingle();

        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        const email = authUser?.user?.email;
        const emailConfirmed = authUser?.user?.email_confirmed_at;
        if (!email || !emailConfirmed) continue;

        // Friend IDs
        const { data: friendships } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", userId);
        const friendIds = (friendships ?? []).map((f: any) => f.friend_id);

        // New posts from friends in last 7 days
        let newPosts = 0;
        if (friendIds.length > 0) {
          const { count } = await supabase
            .from("xcrol_entries")
            .select("id", { count: "exact", head: true })
            .gte("created_at", sevenDaysAgo)
            .in("user_id", friendIds);
          newPosts = count ?? 0;
        }

        // Unread messages
        const { count: unreadMessages } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("to_user_id", userId)
          .is("read_at", null)
          .is("deleted_at", null);

        // Pending friend requests
        const { count: pendingRequests } = await supabase
          .from("friend_requests")
          .select("id", { count: "exact", head: true })
          .eq("to_user_id", userId);

        const totalActivity = (newPosts ?? 0) + (unreadMessages ?? 0) + (pendingRequests ?? 0);
        if (totalActivity === 0) continue; // skip empty digests

        const html = buildEmailHtml(profile?.display_name ?? "Friend", {
          newPosts: newPosts ?? 0,
          unreadMessages: unreadMessages ?? 0,
          pendingRequests: pendingRequests ?? 0,
          newHometowns: newHometownsCount ?? 0,
        });

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "XCROL <noreply@invites.xcrol.com>",
            to: [email],
            subject: "Your weekly XCROL digest",
            html,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error(`Failed for ${userId}:`, errBody);
          failed++;
          continue;
        }

        await supabase.from("weekly_digest_log").insert({
          user_id: userId,
          year,
          week_number: week,
        });
        sent++;
      } catch (err) {
        console.error(`Error processing ${userId}:`, err);
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed, week, year }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-weekly-digest error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
