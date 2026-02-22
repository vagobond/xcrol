import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Query all profiles with nostr_npub set
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("nostr_npub, nostr_handle, username")
      .not("nostr_npub", "is", null);

    if (error) throw error;

    const names: Record<string, string> = {};
    let fallbackHex: string | null = null;

    for (const p of profiles || []) {
      const npub: string = p.nostr_npub;
      // Decode npub to hex pubkey (NIP-05 spec requires hex)
      const hex = npubToHex(npub);
      if (!hex) continue;

      // Use nostr_handle if set, otherwise username
      const handle = p.nostr_handle || p.username;
      if (handle) {
        names[handle] = hex;
      }

      // First user becomes fallback if none explicitly set
      if (!fallbackHex) {
        fallbackHex = hex;
      }
    }

    // Add fallback "_" entry
    if (fallbackHex) {
      names["_"] = fallbackHex;
    }

    const body = JSON.stringify({ names });

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("NIP-05 error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Decode bech32 npub to hex pubkey */
function npubToHex(npub: string): string | null {
  try {
    const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    // Skip "npub1" prefix (5 chars)
    const data = npub.slice(5);
    const values: number[] = [];
    for (const c of data) {
      const v = CHARSET.indexOf(c);
      if (v === -1) return null;
      values.push(v);
    }
    // Convert 5-bit groups to 8-bit bytes (skip checksum last 6 values)
    const payload = values.slice(0, values.length - 6);
    const bytes: number[] = [];
    let acc = 0;
    let bits = 0;
    for (const v of payload) {
      acc = (acc << 5) | v;
      bits += 5;
      while (bits >= 8) {
        bits -= 8;
        bytes.push((acc >> bits) & 0xff);
      }
    }
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}
