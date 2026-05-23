// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface ScrollMeta {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  blurb: string | null;
  cover_image_url: string | null;
}

export interface ScrollItem {
  item_id: string;
  item_position: number;
  item_type: "xcrol" | "group_post" | "interlude";
  chapter_label: string | null;
  custom_title: string | null;
  content: string | null;
  link: string | null;
  item_date: string | null;
  group_name: string | null;
}

export interface ScrollBundle {
  meta: ScrollMeta;
  items: ScrollItem[];
  cover?: { bytes: Uint8Array; mime: "image/jpeg" | "image/png" };
}

export function slugify(s: string): string {
  return (s || "scroll").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "scroll";
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loadBundle(
  scrollId: string,
  userId: string,
): Promise<ScrollBundle | { error: string; status: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: meta, error: metaErr } = await admin
    .from("scrolls")
    .select("id, user_id, title, subtitle, blurb, cover_image_url")
    .eq("id", scrollId)
    .maybeSingle();
  if (metaErr) return { error: metaErr.message, status: 500 };
  if (!meta) return { error: "Scroll not found", status: 404 };
  if (meta.user_id !== userId) return { error: "Not your scroll", status: 403 };

  const { data: items, error: itemsErr } = await admin.rpc("get_scroll_contents", {
    p_scroll_id: scrollId,
  });
  if (itemsErr) return { error: itemsErr.message, status: 500 };

  const bundle: ScrollBundle = {
    meta: meta as ScrollMeta,
    items: (items as ScrollItem[]) || [],
  };

  if (meta.cover_image_url) {
    const cover = await fetchCover(meta.cover_image_url);
    if (cover) bundle.cover = cover;
  }

  return bundle;
}

async function fetchCover(
  url: string,
): Promise<{ bytes: Uint8Array; mime: "image/jpeg" | "image/png" } | null> {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);
    const res = await fetch(url, { signal: ctl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    let mime: "image/jpeg" | "image/png" | null = null;
    if (ct.includes("jpeg") || ct.includes("jpg")) mime = "image/jpeg";
    else if (ct.includes("png")) mime = "image/png";
    else return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return null;
    return { bytes: buf, mime };
  } catch {
    return null;
  }
}

/** Group items into chapters; items before the first labelled item fall into a "Prologue". */
export function groupChapters(items: ScrollItem[]): { label: string; items: ScrollItem[] }[] {
  const chapters: { label: string; items: ScrollItem[] }[] = [];
  let current: { label: string; items: ScrollItem[] } | null = null;
  let lastLabel: string | null = null;
  for (const it of items) {
    const lbl = it.chapter_label?.trim() || null;
    if (lbl && lbl !== lastLabel) {
      current = { label: lbl, items: [] };
      chapters.push(current);
      lastLabel = lbl;
    } else if (!current) {
      current = { label: "Prologue", items: [] };
      chapters.push(current);
    }
    current.items.push(it);
  }
  return chapters;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
