import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadBundle, slugify } from "./shared.ts";
import { buildEpub } from "./epub.ts";
import { buildPdf } from "./pdf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    let body: { scroll_id?: string; format?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const scrollId = body.scroll_id;
    const format = body.format;
    if (!scrollId || typeof scrollId !== "string") {
      return json({ error: "scroll_id required" }, 400);
    }
    if (format !== "epub" && format !== "pdf") {
      return json({ error: "format must be 'epub' or 'pdf'" }, 400);
    }

    const bundle = await loadBundle(scrollId, userData.user.id);
    if ("error" in bundle) {
      return json({ error: bundle.error }, bundle.status);
    }

    const slug = slugify(bundle.meta.title);

    if (format === "epub") {
      const bytes = buildEpub(bundle);
      return new Response(bytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/epub+zip",
          "Content-Disposition": `attachment; filename="${slug}.epub"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const bytes = await buildPdf(bundle);
    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("export-scroll error", e);
    return json({ error: e instanceof Error ? e.message : "Server error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
