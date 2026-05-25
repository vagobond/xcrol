import { supabase } from "@/integrations/supabase/client";

export interface Publication {
  id: string;
  scroll_id: string;
  user_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  blurb: string | null;
  cover_image_url: string | null;
  visibility: "public" | "unlisted";
  published_at: string;
  unpublished_at: string | null;
  view_count: number;
}

export interface PublicationWithContent extends Publication {
  content_json: PublicationItem[];
}

export interface PublicationItem {
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

export const REACTION_EMOJIS = ["✨", "📜", "🔥", "💛", "🌊", "🏰"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export async function publishScroll(
  scrollId: string,
  visibility: "public" | "unlisted" = "public",
): Promise<Publication> {
  const { data, error } = await supabase.rpc("publish_scroll", {
    p_scroll_id: scrollId,
    p_visibility: visibility,
  });
  if (error) throw error;
  return data as unknown as Publication;
}

export async function unpublishPublication(publicationId: string): Promise<void> {
  const { error } = await supabase.rpc("unpublish_publication", {
    p_publication_id: publicationId,
  });
  if (error) throw error;
}

export async function listScrollPublications(scrollId: string): Promise<Publication[]> {
  const { data, error } = await supabase
    .from("scroll_publications")
    .select("id, scroll_id, user_id, slug, title, subtitle, blurb, cover_image_url, visibility, published_at, unpublished_at, view_count")
    .eq("scroll_id", scrollId)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Publication[];
}

export async function listAuthorPublications(userId: string): Promise<Publication[]> {
  const { data, error } = await supabase
    .from("scroll_publications")
    .select("id, scroll_id, user_id, slug, title, subtitle, blurb, cover_image_url, visibility, published_at, unpublished_at, view_count")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .is("unpublished_at", null)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Publication[];
}

export async function getPublicationBySlug(slug: string): Promise<PublicationWithContent | null> {
  const { data, error } = await supabase
    .from("scroll_publications")
    .select("id, scroll_id, user_id, slug, title, subtitle, blurb, cover_image_url, visibility, published_at, unpublished_at, view_count, content_json")
    .eq("slug", slug)
    .is("unpublished_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data as unknown as PublicationWithContent;
}

export interface LibraryEntry extends Publication {
  author_display_name: string | null;
  author_username: string | null;
  author_avatar_url: string | null;
  reaction_count: number;
}

export async function listLibrary(opts: {
  sort?: "newest" | "most_read" | "most_reacted";
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<LibraryEntry[]> {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  let q = supabase
    .from("scroll_publications")
    .select("id, scroll_id, user_id, slug, title, subtitle, blurb, cover_image_url, visibility, published_at, unpublished_at, view_count")
    .eq("visibility", "public")
    .is("unpublished_at", null);

  if (opts.search?.trim()) {
    q = q.ilike("title", `%${opts.search.trim()}%`);
  }
  if (opts.sort === "most_read") q = q.order("view_count", { ascending: false });
  else q = q.order("published_at", { ascending: false });

  const { data, error } = await q.range(offset, offset + limit - 1);
  if (error) throw error;
  const pubs = (data ?? []) as Publication[];
  if (pubs.length === 0) return [];

  const userIds = Array.from(new Set(pubs.map((p) => p.user_id)));
  const pubIds = pubs.map((p) => p.id);

  const [{ data: profiles }, { data: reactions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", userIds),
    supabase
      .from("scroll_publication_reactions")
      .select("publication_id")
      .in("publication_id", pubIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const reactionMap = new Map<string, number>();
  (reactions ?? []).forEach((r) => {
    const id = (r as { publication_id: string }).publication_id;
    reactionMap.set(id, (reactionMap.get(id) ?? 0) + 1);
  });

  let entries: LibraryEntry[] = pubs.map((p) => {
    const prof = profileMap.get(p.user_id) as { display_name?: string; username?: string; avatar_url?: string } | undefined;
    return {
      ...p,
      author_display_name: prof?.display_name ?? null,
      author_username: prof?.username ?? null,
      author_avatar_url: prof?.avatar_url ?? null,
      reaction_count: reactionMap.get(p.id) ?? 0,
    };
  });
  if (opts.sort === "most_reacted") {
    entries = entries.sort((a, b) => b.reaction_count - a.reaction_count);
  }
  return entries;
}

export async function getReactionCounts(publicationId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("scroll_publication_reactions")
    .select("emoji")
    .eq("publication_id", publicationId);
  if (error) throw error;
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    const e = (r as { emoji: string }).emoji;
    counts[e] = (counts[e] ?? 0) + 1;
  });
  return counts;
}

export async function getMyReactions(publicationId: string, userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("scroll_publication_reactions")
    .select("emoji")
    .eq("publication_id", publicationId)
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => (r as { emoji: string }).emoji));
}

export async function toggleReaction(
  publicationId: string,
  userId: string,
  emoji: ReactionEmoji,
  currentlyOn: boolean,
): Promise<void> {
  if (currentlyOn) {
    const { error } = await supabase
      .from("scroll_publication_reactions")
      .delete()
      .eq("publication_id", publicationId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("scroll_publication_reactions")
      .insert({ publication_id: publicationId, user_id: userId, emoji });
    if (error) throw error;
  }
}

export async function incrementView(publicationId: string): Promise<void> {
  await supabase.rpc("increment_publication_view", { p_publication_id: publicationId });
}

export function publicationUrl(slug: string): string {
  return `${window.location.origin}/library/${slug}`;
}
