import { supabase } from "@/integrations/supabase/client";

export interface ResolvedNotification {
  resolvedRoute: string | null;
  contentPreview: string | null;
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

  // Group entity IDs by resolution strategy
  const riverReplyIds: string[] = [];
  const brookPostIds: string[] = [];
  const brookCommentIds: string[] = [];
  const brookReactionIds: string[] = [];
  const groupCommentIds: string[] = [];
  const groupReactionIds: string[] = [];
  const groupCommentReactionIds: string[] = [];

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
      case "group_comment":
        groupCommentIds.push(n.entity_id);
        break;
      case "group_reaction":
        groupReactionIds.push(n.entity_id);
        break;
      case "group_comment_reaction":
        groupCommentReactionIds.push(n.entity_id);
        break;
    }
  }

  // Batch queries in parallel
  const queries: Promise<void>[] = [];

  // River replies -> get entry_id and entry content
  if (riverReplyIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("river_replies")
          .select("id, entry_id")
          .in("id", riverReplyIds);
        if (!data) return;

        const entryIds = [...new Set(data.map((r) => r.entry_id))];
        const { data: entries } = await supabase
          .from("xcrol_entries" as any)
          .select("id, content")
          .in("id", entryIds);

        const entryMap = new Map((entries || []).map((e: any) => [e.id, e.content]));
        const replyToEntry = new Map(data.map((r) => [r.id, r.entry_id]));

        for (const n of notifications) {
          if (n.type === "river_reply" || n.type === "river_reply_reply") {
            const entryId = replyToEntry.get(n.entity_id);
            result.set(n.id, {
              resolvedRoute: entryId ? `/the-river?post=${entryId}` : "/the-river",
              contentPreview: entryId ? truncate(entryMap.get(entryId)) : null,
              parentEntityId: entryId || n.entity_id,
            });
          }
        }
      })()
    );
  }

  // Brook posts -> entity_id IS the post, get brook_id from it
  if (brookPostIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("brook_posts")
          .select("id, brook_id, content")
          .in("id", brookPostIds);
        if (!data) return;
        const postMap = new Map(data.map((p) => [p.id, p]));
        for (const n of notifications) {
          if (n.type === "brook_post") {
            const post = postMap.get(n.entity_id);
            result.set(n.id, {
              resolvedRoute: post ? `/brook/${post.brook_id}` : "/the-forest",
              contentPreview: post ? truncate(post.content) : null,
              parentEntityId: post?.brook_id || n.entity_id,
            });
          }
        }
      })()
    );
  }

  // Brook comments -> get post_id -> brook_id
  if (brookCommentIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("brook_comments")
          .select("id, post_id, content")
          .in("id", brookCommentIds);
        if (!data) return;
        const postIds = [...new Set(data.map((c) => c.post_id))];
        const { data: posts } = await supabase
          .from("brook_posts")
          .select("id, brook_id, content")
          .in("id", postIds);
        const postMap = new Map((posts || []).map((p) => [p.id, p]));
        const commentMap = new Map(data.map((c) => [c.id, c]));

        for (const n of notifications) {
          if (n.type === "brook_comment") {
            const comment = commentMap.get(n.entity_id);
            const post = comment ? postMap.get(comment.post_id) : null;
            result.set(n.id, {
              resolvedRoute: post ? `/brook/${post.brook_id}` : "/the-forest",
              contentPreview: post ? truncate(post.content) : null,
              parentEntityId: comment?.post_id || n.entity_id,
            });
          }
        }
      })()
    );
  }

  // Brook reactions -> entity_id is post_id
  if (brookReactionIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("brook_reactions")
          .select("id, post_id")
          .in("id", brookReactionIds);
        if (!data) return;
        const postIds = [...new Set(data.map((r) => r.post_id))];
        const { data: posts } = await supabase
          .from("brook_posts")
          .select("id, brook_id, content")
          .in("id", postIds);
        const postMap = new Map((posts || []).map((p) => [p.id, p]));
        const reactionMap = new Map(data.map((r) => [r.id, r]));

        for (const n of notifications) {
          if (n.type === "brook_reaction") {
            const reaction = reactionMap.get(n.entity_id);
            const post = reaction ? postMap.get(reaction.post_id) : null;
            result.set(n.id, {
              resolvedRoute: post ? `/brook/${post.brook_id}` : "/the-forest",
              contentPreview: post ? truncate(post.content) : null,
              parentEntityId: reaction?.post_id || n.entity_id,
            });
          }
        }
      })()
    );
  }

  // Group comments -> get post_id -> group_id -> slug
  if (groupCommentIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("group_post_comments")
          .select("id, post_id")
          .in("id", groupCommentIds);
        if (!data) return;
        const postIds = [...new Set(data.map((c) => c.post_id))];
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
        const commentMap = new Map(data.map((c) => [c.id, c]));

        for (const n of notifications) {
          if (n.type === "group_comment") {
            const comment = commentMap.get(n.entity_id);
            const post = comment ? postMap.get(comment.post_id) : null;
            const slug = post ? groupMap.get(post.group_id) : null;
            result.set(n.id, {
              resolvedRoute: slug ? `/group/${slug}` : "/the-village",
              contentPreview: post ? truncate(post.content) : null,
              parentEntityId: comment?.post_id || n.entity_id,
            });
          }
        }
      })()
    );
  }

  // Group reactions -> entity_id is reaction id, get post_id -> group slug
  if (groupReactionIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("group_post_reactions")
          .select("id, post_id")
          .in("id", groupReactionIds);
        if (!data) return;
        const postIds = [...new Set(data.map((r) => r.post_id))];
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
        const reactionMap = new Map(data.map((r) => [r.id, r]));

        for (const n of notifications) {
          if (n.type === "group_reaction") {
            const reaction = reactionMap.get(n.entity_id);
            const post = reaction ? postMap.get(reaction.post_id) : null;
            const slug = post ? groupMap.get(post.group_id) : null;
            result.set(n.id, {
              resolvedRoute: slug ? `/group/${slug}` : "/the-village",
              contentPreview: post ? truncate(post.content) : null,
              parentEntityId: reaction?.post_id || n.entity_id,
            });
          }
        }
      })()
    );
  }

  // Group comment reactions -> comment_id -> post_id -> group slug
  if (groupCommentReactionIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("group_comment_reactions")
          .select("id, comment_id")
          .in("id", groupCommentReactionIds);
        if (!data) return;
        const commentIds = [...new Set(data.map((r) => r.comment_id))];
        const { data: comments } = await supabase
          .from("group_post_comments")
          .select("id, post_id")
          .in("id", commentIds);
        const postIds = [...new Set((comments || []).map((c) => c.post_id))];
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
        const commentMap = new Map((comments || []).map((c) => [c.id, c]));
        const reactionMap = new Map(data.map((r) => [r.id, r]));

        for (const n of notifications) {
          if (n.type === "group_comment_reaction") {
            const reaction = reactionMap.get(n.entity_id);
            const comment = reaction ? commentMap.get(reaction.comment_id) : null;
            const post = comment ? postMap.get(comment.post_id) : null;
            const slug = post ? groupMap.get(post.group_id) : null;
            result.set(n.id, {
              resolvedRoute: slug ? `/group/${slug}` : "/the-village",
              contentPreview: post ? truncate(post.content) : null,
              parentEntityId: comment?.post_id || n.entity_id,
            });
          }
        }
      })()
    );
  }

  // Hosting/meetup requests - no lookup needed
  for (const n of notifications) {
    if (n.type === "hosting_request" || n.type === "meetup_request") {
      result.set(n.id, {
        resolvedRoute: "/hearthsurf",
        contentPreview: null,
        parentEntityId: n.entity_id,
      });
    }
  }

  await Promise.all(queries);
  return result;
}

function truncate(text: string | undefined | null, length = 60): string | null {
  if (!text) return null;
  return text.length > length ? text.substring(0, length) + "…" : text;
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
    default:
      return type;
  }
}
