import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface AcceptanceRequest {
  email: string;
  inviteCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, inviteCode }: AcceptanceRequest = await req.json();

    if (!email || !inviteCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing email or inviteCode" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const safeCode = escapeHtml(inviteCode);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "XCROL <noreply@invites.xcrol.com>",
        to: [email],
        subject: "You're in!!!!! Come xcrol with us!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background: #0a0a0a; color: #e0e0e0; line-height: 1.7; }
              .container { max-width: 650px; margin: 0 auto; padding: 40px 20px; }
              .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 48px; border: 1px solid rgba(139, 92, 246, 0.3); }
              h1 { color: #ffffff; font-size: 26px; margin-bottom: 28px; font-weight: normal; }
              h2 { color: #a78bfa; font-size: 18px; margin-top: 28px; margin-bottom: 12px; font-weight: 600; }
              p { color: #c0c0c0; font-size: 16px; line-height: 1.8; margin-bottom: 18px; }
              a { color: #a78bfa; text-decoration: underline; }
              .code { background: rgba(139, 92, 246, 0.3); color: #e9d5ff; padding: 12px 24px; border-radius: 8px; font-family: monospace; font-size: 18px; display: inline-block; margin: 16px 0; letter-spacing: 2px; }
              .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .signature { margin-top: 36px; padding-top: 24px; border-top: 1px solid rgba(139, 92, 246, 0.3); }
              .signature p { margin-bottom: 6px; }
              .closing { color: #a78bfa; font-weight: 600; font-size: 17px; margin-top: 28px; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
              .footer p { color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Hey there 👋</h1>

                <p>You're off the waitlist — <strong style="color: #ffffff;">welcome to Xcrol!</strong></p>

                <p>Here's how to get started:</p>

                <h2>1. Add me as a friend</h2>
                <p>Head to <a href="https://xcrol.com/@cd">xcrol.com/@cd</a> and send me a friend request. I want to be connected with you.</p>

                <h2>2. Fill out your profile</h2>
                <p>Add your display name, avatar, bio, and most importantly — <strong style="color: #ffffff;">your hometown</strong>. Your hometown puts you on the map (literally) and is the foundation of how Xcrol connects real people in real places.</p>

                <h2>3. Come to The River</h2>
                <p><a href="https://xcrol.com/the-river">The River</a> is the heart of Xcrol — a calm, chronological feed with no algorithms, no ads, and no noise. See what's flowing by and dip your feet in. One post per day, 240 characters. That's it.</p>

                <p>Use this invite code when you sign up:</p>
                <div class="code">${safeCode}</div>

                <br>
                <a href="https://xcrol.com/auth?invite=${encodeURIComponent(inviteCode)}" class="cta">Join Xcrol →</a>

                <p class="closing">I'm so happy you are here.</p>

                <div class="signature">
                  <p style="color: #ffffff; margin-bottom: 4px;">~CD</p>
                  <p><a href="https://xcrol.com/@cd">xcrol.com/@cd</a></p>
                </div>

                <div class="footer">
                  <p>You received this email because you joined the Xcrol waitlist.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Waitlist acceptance email sent successfully to:", email);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-waitlist-acceptance:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
