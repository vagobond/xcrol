import { supabase } from "@/integrations/supabase/client";

export interface ResolvedNotification {
  resolvedRoute: string | null;
  /** Short preview of the new content that triggered the notification (the reply, comment, post, message, emoji…). */
  contentPreview: string | null;
  /** Optional snippet of the parent entity for context (e.g., the post that was commented on). */
  parentSnippet: string | null;
  /** Used to group notifications about the same parent thread. */
  parentEntityId: string | null;
}

/**
 * Resolve a notification's entity_id into a deep-link route, content preview, and parent entity ID.
 * Batches resolution for multiple notifications at once.
 */
export async function resolveNotifications(
  notifications: { id: string; type: string; entity_id: string }[]
): Promise<Map<string, ResolvedNotification>> {
  const result = new Map<string, ResolvedNotification>();

  const riverReplyIds: string[] = [];
  const brookPostIds: string[] = [];
  const brookCommentIds: string[] = [];
  const brookReactionIds: string[] = [];
  const groupPostIds: string[] = [];
  const groupCommentIds: string[] = [];
  const groupReactionIds: string[] = [];
  const groupCommentReactionIds: string[] = [];
  const hostingRequestIds: string[] = [];
  const meetupRequestIds: string[] = [];
  const introductionRequestIds: string[] = [];
  const nearbyProfileIds: string[] = [];

  for (const n of notifications) {
    switch (n.type) {
      case "river_reply":
      case "river_reply_reply":
        riverReplyIds.push(n.entity_id);
        break;
      case "brook_post":
        brookPostIds.push(n.entity_id);
        break;
      case "brook_comment":
        brookCommentIds.push(n.entity_id);
        break;
      case "brook_reaction":
        brookReactionIds.push(n.entity_id);
        break;
      case "group_post":
        groupPostIds.push(n.entity_id);
        break;
      case "group_comment":
        groupCommentIds.push(n.entity_id);
        break;
      case "group_reaction":
        groupReactionIds.push(n.entity_id);
        break;
      case "group_comment_reaction":
        groupCommentReactionIds.push(n.entity_id);
        break;
      case "hosting_request":
        hostingRequestIds.push(n.entity_id);
        break;
      case "meetup_request":
        meetupRequestIds.push(n.entity_id);
        break;
      case "introduction_request":
        introductionRequestIds.push(n.entity_id);
        break;
      case "nearby_hometown":
        nearbyProfileIds.push(n.entity_id);
        break;
    }
  }

  const queries: Promise<void>[] = [];

  // ── River replies ─────────────────────────────────────
  if (riverReplyIds.length > 0) {
    queries.push((async () => {
      const { data: replies } = await supabase
        .from("river_replies")
        .select("id, entry_id, content")
        .in("id", riverReplyIds);
      if (!replies) return;
      const entryIds = [...new Set(replies.map((r) => r.entry_id))];
      const { data: entries } = await supabase
        .from("xcrol_entries")
        .select("id, content")
        .in("id", entryIds);
      const entryMap = new Map((entries || []).map((e) => [e.id, e.content]));
      const replyMap = new Map(replies.map((r) => [r.id, r]));
      for (const n of notifications) {
        if (n.type !== "river_reply" && n.type !== "river_reply_reply") continue;
        const reply = replyMap.get(n.entity_id);
        const entryId = reply?.entry_id;
        result.set(n.id, {
          resolvedRoute: entryId
            ? `/the-river?post=${entryId}&reply=${n.entity_id}`
            : "/the-river",
          contentPreview: truncate(reply?.content),
          parentSnippet: entryId ? truncate(entryMap.get(entryId)) : null,
          parentEntityId: entryId || n.entity_id,
        });
      }
    })());
  }

  // ── Brook posts ──────────────────────────────────────
  if (brookPostIds.length > 0) {
    queries.push((async () => {
      const { data: posts } = await supabase
        .from("brook_posts")
        .select("id, brook_id, content")
        .in("id", brookPostIds);
      if (!posts) return;
      const postMap = new Map(posts.map((p) => [p.id, p]));
      for (const n of notifications) {
        if (n.type !== "brook_post") continue;
        const post = postMap.get(n.entity_id);
        result.set(n.id, {
          resolvedRoute: post ? `/brook/${post.brook_id}?post=${post.id}` : "/the-forest",
          contentPreview: truncate(post?.content),
          parentSnippet: null,
          parentEntityId: post?.brook_id || n.entity_id,
        });
      }
    })());
  }

  // ── Brook comments ───────────────────────────────────
  if (brookCommentIds.length > 0) {
    queries.push((async () => {
      const { data: comments } = await supabase
        .from("brook_comments")
        .select("id, post_id, content")
        .in("id", brookCommentIds);
      if (!comments) return;
      const postIds = [...new Set(comments.map((c) => c.post_id))];
      const { data: posts } = await supabase
        .from("brook_posts")
        .select("id, brook_id, content")
        .in("id", postIds);
      const postMap = new Map((posts || []).map((p) => [p.id, p]));
      const commentMap = new Map(comments.map((c) => [c.id, c]));
      for (const n of notifications) {
        if (n.type !== "brook_comment") continue;
        const comment = commentMap.get(n.entity_id);
        const post = comment ? postMap.get(comment.post_id) : null;
        result.set(n.id, {
          resolvedRoute: post
            ? `/brook/${post.brook_id}?post=${post.id}&comment=${n.entity_id}`
            : "/the-forest",
          contentPreview: truncate(comment?.content),
          parentSnippet: truncate(post?.content),
          parentEntityId: comment?.post_id || n.entity_id,
        });
      }
    })());
  }

  // ── Brook reactions ──────────────────────────────────
  if (brookReactionIds.length > 0) {
    queries.push((async () => {
      const { data: reactions } = await supabase
        .from("brook_reactions")
        .select("id, post_id, emoji")
        .in("id", brookReactionIds);
      if (!reactions) return;
      const postIds = [...new Set(reactions.map((r) => r.post_id))];
      const { data: posts } = await supabase
        .from("brook_posts")
        .select("id, brook_id, content")
        .in("id", postIds);
      const postMap = new Map((posts || []).map((p) => [p.id, p]));
      const reactionMap = new Map(reactions.map((r) => [r.id, r]));
      for (const n of notifications) {
        if (n.type !== "brook_reaction") continue;
        const reaction = reactionMap.get(n.entity_id);
        const post = reaction ? postMap.get(reaction.post_id) : null;
        result.set(n.id, {
          resolvedRoute: post
            ? `/brook/${post.brook_id}?post=${post.id}`
            : "/the-forest",
          contentPreview: reaction?.emoji ? `Reacted ${reaction.emoji}` : null,
          parentSnippet: truncate(post?.content),
          parentEntityId: reaction?.post_id || n.entity_id,
        });
      }
    })());
  }

  // ── Group posts ──────────────────────────────────────
  if (groupPostIds.length > 0) {
    queries.push((async () => {
      const { data: posts } = await supabase
        .from("group_posts")
        .select("id, group_id, content")
        .in("id", groupPostIds);
      if (!posts) return;
      const groupIds = [...new Set(posts.map((p) => p.group_id))];
      const { data: groups } = await supabase
        .from("groups")
        .select("id, slug")
        .in("id", groupIds);
      const groupMap = new Map((groups || []).map((g) => [g.id, g.slug]));
      const postMap = new Map(posts.map((p) => [p.id, p]));
      for (const n of notifications) {
        if (n.type !== "group_post") continue;
        const post = postMap.get(n.entity_id);
        const slug = post ? groupMap.get(post.group_id) : null;
        result.set(n.id, {
          resolvedRoute: slug ? `/group/${slug}?post=${post!.id}` : "/the-village",
          contentPreview: truncate(post?.content),
          parentSnippet: null,
          parentEntityId: post?.group_id || n.entity_id,
        });
      }
    })());
  }

  // ── Group comments ───────────────────────────────────
  if (groupCommentIds.length > 0) {
    queries.push((async () => {
      const { data: comments } = await supabase
        .from("group_post_comments")
        .select("id, post_id, content")
        .in("id", groupCommentIds);
      if (!comments) return;
      const postIds = [...new Set(comments.map((c) => c.post_id))];
      const { data: posts } = await supabase
        .from("group_posts")
        .select("id, group_id, content")
        .in("id", postIds);
      const groupIds = [...new Set((posts || []).map((p) => p.group_id))];
      const { data: groups } = await supabase
        .from("groups")
        .select("id, slug")
        .in("id", groupIds);
      const groupMap = new Map((groups || []).map((g) => [g.id, g.slug]));
      const postMap = new Map((posts || []).map((p) => [p.id, p]));
      const commentMap = new Map(comments.map((c) => [c.id, c]));
      for (const n of notifications) {
        if (n.type !== "group_comment") continue;
        const comment = commentMap.get(n.entity_id);
        const post = comment ? postMap.get(comment.post_id) : null;
        const slug = post ? groupMap.get(post.group_id) : null;
        result.set(n.id, {
          resolvedRoute: slug
            ? `/group/${slug}?post=${post!.id}&comment=${n.entity_id}`
            : "/the-village",
          contentPreview: truncate(comment?.content),
          parentSnippet: truncate(post?.content),
          parentEntityId: comment?.post_id || n.entity_id,
        });
      }
    })());
  }

  // ── Group reactions on posts ─────────────────────────
  if (groupReactionIds.length > 0) {
    queries.push((async () => {
      const { data: reactions } = await supabase
        .from("group_post_reactions")
        .select("id, post_id, emoji")
        .in("id", groupReactionIds);
      if (!reactions) return;
      const postIds = [...new Set(reactions.map((r) => r.post_id))];
      const { data: posts } = await supabase
        .from("group_posts")
        .select("id, group_id, content")
        .in("id", postIds);
      const groupIds = [...new Set((posts || []).map((p) => p.group_id))];
      const { data: groups } = await supabase
        .from("groups")
        .select("id, slug")
        .in("id", groupIds);
      const groupMap = new Map((groups || []).map((g) => [g.id, g.slug]));
      const postMap = new Map((posts || []).map((p) => [p.id, p]));
      const reactionMap = new Map(reactions.map((r) => [r.id, r]));
      for (const n of notifications) {
        if (n.type !== "group_reaction") continue;
        const reaction = reactionMap.get(n.entity_id);
        const post = reaction ? postMap.get(reaction.post_id) : null;
        const slug = post ? groupMap.get(post.group_id) : null;
        result.set(n.id, {
          resolvedRoute: slug ? `/group/${slug}?post=${post!.id}` : "/the-village",
          contentPreview: reaction?.emoji ? `Reacted ${reaction.emoji}` : null,
          parentSnippet: truncate(post?.content),
          parentEntityId: reaction?.post_id || n.entity_id,
        });
      }
    })());
  }

  // ── Group reactions on comments ──────────────────────
  if (groupCommentReactionIds.length > 0) {
    queries.push((async () => {
      const { data: reactions } = await supabase
        .from("group_comment_reactions")
        .select("id, comment_id, emoji")
        .in("id", groupCommentReactionIds);
      if (!reactions) return;
      const commentIds = [...new Set(reactions.map((r) => r.comment_id))];
      const { data: comments } = await supabase
        .from("group_post_comments")
        .select("id, post_id, content")
        .in("id", commentIds);
      const postIds = [...new Set((comments || []).map((c) => c.post_id))];
      const { data: posts } = await supabase
        .from("group_posts")
        .select("id, group_id")
        .in("id", postIds);
      const groupIds = [...new Set((posts || []).map((p) => p.group_id))];
      const { data: groups } = await supabase
        .from("groups")
        .select("id, slug")
        .in("id", groupIds);
      const groupMap = new Map((groups || []).map((g) => [g.id, g.slug]));
      const postMap = new Map((posts || []).map((p) => [p.id, p]));
      const commentMap = new Map((comments || []).map((c) => [c.id, c]));
      const reactionMap = new Map(reactions.map((r) => [r.id, r]));
      for (const n of notifications) {
        if (n.type !== "group_comment_reaction") continue;
        const reaction = reactionMap.get(n.entity_id);
        const comment = reaction ? commentMap.get(reaction.comment_id) : null;
        const post = comment ? postMap.get(comment.post_id) : null;
        const slug = post ? groupMap.get(post.group_id) : null;
        result.set(n.id, {
          resolvedRoute: slug
            ? `/group/${slug}?post=${post!.id}&comment=${comment!.id}`
            : "/the-village",
          contentPreview: reaction?.emoji ? `Reacted ${reaction.emoji}` : null,
          parentSnippet: truncate(comment?.content),
          parentEntityId: comment?.post_id || n.entity_id,
        });
      }
    })());
  }

  // ── Hosting requests ─────────────────────────────────
  if (hostingRequestIds.length > 0) {
    queries.push((async () => {
      const { data: reqs } = await supabase
        .from("hosting_requests")
        .select("id, message, arrival_date, departure_date")
        .in("id", hostingRequestIds);
      if (!reqs) return;
      const reqMap = new Map(reqs.map((r) => [r.id, r]));
      for (const n of notifications) {
        if (n.type !== "hosting_request") continue;
        const r = reqMap.get(n.entity_id);
        const dates = r?.arrival_date && r?.departure_date
          ? `${new Date(r.arrival_date).toLocaleDateString()} – ${new Date(r.departure_date).toLocaleDateString()}`
          : null;
        result.set(n.id, {
          resolvedRoute: `/hearthsurf?tab=requests&request=${n.entity_id}`,
          contentPreview: truncate(r?.message),
          parentSnippet: dates,
          parentEntityId: n.entity_id,
        });
      }
    })());
  }

  // ── Meetup requests (delivered as messages too) ──────
  if (meetupRequestIds.length > 0) {
    queries.push((async () => {
      const { data: reqs } = await supabase
        .from("meetup_requests")
        .select("id, from_user_id, purpose, message")
        .in("id", meetupRequestIds);
      if (!reqs) return;
      const reqMap = new Map(reqs.map((r) => [r.id, r]));
      for (const n of notifications) {
        if (n.type !== "meetup_request") continue;
        const r = reqMap.get(n.entity_id);
        const purpose = r?.purpose ? `${r.purpose.charAt(0).toUpperCase()}${r.purpose.slice(1)}` : null;
        result.set(n.id, {
          resolvedRoute: r?.from_user_id ? `/messages?with=${r.from_user_id}` : "/messages",
          contentPreview: truncate(r?.message),
          parentSnippet: purpose ? `Meetup • ${purpose}` : "Meetup request",
          parentEntityId: n.entity_id,
        });
      }
    })());
  }

  // ── Introduction requests ────────────────────────────
  if (introductionRequestIds.length > 0) {
    queries.push((async () => {
      const { data: reqs } = await supabase
        .from("introduction_requests")
        .select("id, target_id, message")
        .in("id", introductionRequestIds);
      if (!reqs) return;
      const targetIds = [...new Set((reqs || []).map((r) => r.target_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", targetIds);
      const nameMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));
      const reqMap = new Map(reqs.map((r) => [r.id, r]));
      for (const n of notifications) {
        if (n.type !== "introduction_request") continue;
        const r = reqMap.get(n.entity_id);
        const targetName = r?.target_id ? nameMap.get(r.target_id) : null;
        result.set(n.id, {
          resolvedRoute: `/the-forest?tab=introductions&intro=${n.entity_id}`,
          contentPreview: truncate(r?.message),
          parentSnippet: targetName ? `Wants intro to ${targetName}` : null,
          parentEntityId: n.entity_id,
        });
      }
    })());
  }

  // ── Nearby hometowns ─────────────────────────────────
  if (nearbyProfileIds.length > 0) {
    queries.push((async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, hometown_city, hometown_country")
        .in("id", nearbyProfileIds);
      if (!profiles) return;
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      for (const n of notifications) {
        if (n.type !== "nearby_hometown") continue;
        const p = profileMap.get(n.entity_id);
        const place = p
          ? [p.hometown_city, p.hometown_country].filter(Boolean).join(", ")
          : null;
        result.set(n.id, {
          resolvedRoute: `/irl-layer?focus=${n.entity_id}`,
          contentPreview: place || null,
          parentSnippet: null,
          parentEntityId: n.entity_id,
        });
      }
    })());
  }

  await Promise.all(queries);
  return result;
}

function truncate(text: string | undefined | null, length = 80): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  return trimmed.length > length ? trimmed.substring(0, length) + "…" : trimmed;
}

/**
 * Group type bucket - determines which notification types can be grouped together.
 */
export function getGroupBucket(type: string): string {
  switch (type) {
    case "river_reply":
    case "river_reply_reply":
      return "river_activity";
    case "brook_post":
    case "brook_comment":
      return "brook_comment";
    case "brook_reaction":
      return "brook_reaction";
    case "group_post":
      return "group_post";
    case "group_comment":
      return "group_comment";
    case "group_reaction":
      return "group_reaction";
    case "group_comment_reaction":
      return "group_comment_reaction";
    case "hosting_request":
      return "hosting_request";
    case "meetup_request":
      return "meetup_request";
    case "introduction_request":
      return "introduction_request";
    case "nearby_hometown":
      return "nearby_hometown";
    default:
      return type;
  }
}
