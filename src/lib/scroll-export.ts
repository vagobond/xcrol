import { supabase } from "@/integrations/supabase/client";

export async function downloadScrollExport(
  scrollId: string,
  format: "epub" | "pdf",
  fallbackTitle: string,
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Please sign in again.");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-scroll`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ scroll_id: scrollId, format }),
  });

  if (!res.ok) {
    let msg = `Export failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const slug = fallbackTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "scroll";
  const ext = format === "epub" ? "epub" : "pdf";
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${slug}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
