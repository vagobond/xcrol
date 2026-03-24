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
      // Skip polling when the tab is hidden to save bandwidth/battery
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

      // Build map of group_id -> effective last visit (fallback to membership created_at)
      const lastVisits = new Map<string, string>();
      let oldestLastVisit: string | null = null;
      for (const m of memberships) {
        const lv = m.last_visited_at ?? m.created_at;
        lastVisits.set(m.group_id, lv);
        if (!oldestLastVisit || lv < oldestLastVisit) {
          oldestLastVisit = lv;
        }
      }

      const groupIds = memberships.map((m) => m.group_id);

      let query = supabase
        .from("group_posts")
        .select("group_id, created_at")
        .in("group_id", groupIds)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (oldestLastVisit) {
        query = query.gt("created_at", oldestLastVisit);
      }

      const { data: posts } = await query;

      if (cancelled) return;

      let total = 0;
      for (const post of posts || []) {
        const lastVisit = lastVisits.get(post.group_id);
        if (lastVisit && new Date(post.created_at) > new Date(lastVisit)) {
          total++;
        }
      }

      if (!cancelled) setCount(total);
    };

    // Catch up immediately when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        fetchCount();
      }
    };

    const handleVillageVisited = () => { if (!cancelled) fetchCount(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("village-visited", handleVillageVisited);
    fetchCount();
    const interval = setInterval(fetchCount, 600_000); // 10 minutes
    return () => { cancelled = true; clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibilityChange); window.removeEventListener("village-visited", handleVillageVisited); };
  }, [user?.id]);

  return count;
}
