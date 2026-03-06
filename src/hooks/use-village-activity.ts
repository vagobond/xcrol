import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getGroupLastVisit } from "@/hooks/use-group-activity";

export function useVillageActivityCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (cancelled || !memberships?.length) return;

      const groupIds = memberships.map((m) => m.group_id);

      // Compute the oldest last-visit across all groups to use as a server-side filter
      let oldestLastVisit: string | null = null;
      for (const gid of groupIds) {
        const lv = getGroupLastVisit(gid);
        if (!lv) {
          // No last visit means ALL posts are "new" – skip server filter for this case
          oldestLastVisit = null;
          break;
        }
        if (!oldestLastVisit || lv < oldestLastVisit) {
          oldestLastVisit = lv;
        }
      }

      let query = supabase
        .from("group_posts")
        .select("group_id, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(500);

      if (oldestLastVisit) {
        query = query.gt("created_at", oldestLastVisit);
      }

      const { data: posts } = await query;

      if (cancelled) return;

      let total = 0;
      for (const post of posts || []) {
        const lastVisit = getGroupLastVisit(post.group_id);
        if (!lastVisit || new Date(post.created_at) > new Date(lastVisit)) {
          total++;
        }
      }

      if (!cancelled) setCount(total);
    };

    fetch();
    return () => { cancelled = true; };
  }, [user?.id]);

  return count;
}
