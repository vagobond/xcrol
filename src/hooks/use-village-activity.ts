import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useVillageActivityCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const fetchCount = async () => {
      if (document.visibilityState === "hidden") return;

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, last_visited_at, created_at")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (cancelled || !memberships?.length) {
        if (!cancelled) setCount(0);
        return;
      }

      const lastVisits = new Map<string, string>();
      let oldestLastVisit: string | null = null;
      for (const m of memberships) {
        const lv = m.last_visited_at ?? m.created_at;
        lastVisits.set(m.group_id, lv);
        if (!oldestLastVisit || lv < oldestLastVisit) oldestLastVisit = lv;
      }

      const groupIds = memberships.map((m) => m.group_id);

      // Posts (excluding own)
      let postsQ = supabase
        .from("group_posts")
        .select("id, group_id, created_at")
        .in("group_id", groupIds)
        .neq("user_id", user.id)
        .limit(500);
      if (oldestLastVisit) postsQ = postsQ.gt("created_at", oldestLastVisit);
      const { data: posts } = await postsQ;

      let total = 0;
      const postIdToGroup = new Map<string, string>();
      for (const post of posts || []) {
        const lv = lastVisits.get(post.group_id);
        if (lv && new Date(post.created_at) > new Date(lv)) total++;
        postIdToGroup.set(post.id, post.group_id);
      }

      // Comments on any group post (excluding own) — fetch via post→group join client-side
      // Get all group posts in user's groups (lightweight) to map post→group
      const { data: allPosts } = await supabase
        .from("group_posts")
        .select("id, group_id")
        .in("group_id", groupIds)
        .limit(2000);
      const postGroup = new Map<string, string>();
      for (const p of allPosts || []) postGroup.set(p.id, p.group_id);

      if (postGroup.size > 0) {
        let commentsQ = supabase
          .from("group_post_comments")
          .select("post_id, created_at")
          .in("post_id", Array.from(postGroup.keys()))
          .neq("user_id", user.id)
          .limit(500);
        if (oldestLastVisit) commentsQ = commentsQ.gt("created_at", oldestLastVisit);
        const { data: comments } = await commentsQ;
        for (const c of comments || []) {
          const gid = postGroup.get(c.post_id);
          const lv = gid ? lastVisits.get(gid) : null;
          if (lv && new Date(c.created_at) > new Date(lv)) total++;
        }
      }

      if (!cancelled) setCount(total);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !cancelled) fetchCount();
    };
    const handleVillageVisited = () => { if (!cancelled) fetchCount(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("village-visited", handleVillageVisited);
    fetchCount();
    const interval = setInterval(fetchCount, 600_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("village-visited", handleVillageVisited);
    };
  }, [user?.id]);

  return count;
}
