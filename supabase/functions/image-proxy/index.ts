// HTTPS relay for images that are only served over plain http.
//
// xcrol.com is https, so browsers auto-upgrade an <img src="http://…"> to
// https — and a host with no TLS (Ed's self-hosted edkeyes.org, for one) then
// fails, so the picture never shows even though the link is fine. Verified in
// Chrome on xcrol.com 2026-09-24: http://edkeyes.org/misc/disk_harvest.jpg is
// rewritten to https:// and errors.
//
// This relays such an image over https. It is deliberately NOT an open proxy:
//   * http:// only — https images load directly and never come here
//   * the url must already be the `link` or stored `preview_image_url` of an
//     entry, so it can only relay images people have actually posted
//   * the upstream response must be image/*, capped at MAX_BYTES
//   * every hop goes through safeFetch (SSRF guard, re-validated redirects)
//
// Called from <img src>, which cannot send an Authorization header, so it runs
// with verify_jwt = false (see config.toml). Responses are CDN-cacheable.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { safeFetch } from "../_shared/safefetch.ts";
import { enforceRateLimit } from "../_shared/ratelimit.ts";

const MAX_BYTES = 8 * 1024 * 1024;

const corsHeaders = { "Access-Control-Allow-Origin": "*" };

function fail(status: number, msg: string): Response {
  return new Response(msg, { status, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
}

// Fail closed: any error means "not a posted image".
async function isPostedImage(url: string): Promise<boolean> {
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Entries may store the link with or without the scheme.
    const bare = url.replace(/^http:\/\//i, "");
    // Two parameterised queries rather than an .or() filter string, so no
    // character in a url can change the filter's meaning.
    const byLink = await admin
      .from("xcrol_entries").select("id").in("link", [url, bare]).limit(1);
    if (byLink.error) {
      console.error("posted-image check failed (fail-closed):", byLink.error.message);
      return false;
    }
    if ((byLink.data ?? []).length > 0) return true;
    const byPreview = await admin
      .from("xcrol_entries").select("id").eq("preview_image_url", url).limit(1);
    if (byPreview.error) {
      console.error("posted-image check failed (fail-closed):", byPreview.error.message);
      return false;
    }
    return (byPreview.data ?? []).length > 0;
  } catch (e) {
    console.error("posted-image check error (fail-closed):", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return fail(405, "GET only");

  // A River page renders several images at once; allow more than link-preview's 30.
  const limited = await enforceRateLimit(req, "image-proxy", { limit: 120 }, corsHeaders);
  if (limited) return limited;

  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!/^http:\/\//i.test(url)) return fail(400, "http:// image url required");
  if (!(await isPostedImage(url))) return fail(403, "not a posted image");

  try {
    const { res, timer } = await safeFetch(url, {
      timeoutMs: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; XcrolBot/1.0)" },
    });
    try {
      const type = (res.headers.get("content-type") || "").toLowerCase();
      if (!res.ok || !type.startsWith("image/")) {
        try { await res.body?.cancel(); } catch { /* ignore */ }
        return fail(502, "upstream is not an image");
      }
      const declared = Number(res.headers.get("content-length") || 0);
      if (declared > MAX_BYTES) {
        try { await res.body?.cancel(); } catch { /* ignore */ }
        return fail(413, "image too large");
      }
      // Read with a hard cap even when content-length is absent or lies.
      const reader = res.body!.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > MAX_BYTES) {
          try { await reader.cancel(); } catch { /* ignore */ }
          return fail(413, "image too large");
        }
        chunks.push(value);
      }
      const body = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { body.set(c, off); off += c.length; }

      return new Response(body, {
        headers: {
          ...corsHeaders,
          "Content-Type": type,
          "X-Content-Type-Options": "nosniff",
          // SVG can carry script; forbid it running if opened directly.
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
        },
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    console.error("image-proxy fetch failed:", e);
    return fail(502, "fetch failed");
  }
});
