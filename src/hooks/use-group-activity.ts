import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * For a list of group IDs the user is a member of, returns a Map of groupId -> new post count
 * (posts created after the user's last_visited_at stored on group_members, falling back to created_at).
 */
export function useGroupActivity(memberGroupIds: string[]) {
  const { user, loading: authLoading } = useAuth();
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (authLoading) return;

    if (!user || memberGroupIds.length === 0) {
      setCounts(new Map());
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      if (!user || cancelled) return;

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, last_visited_at, created_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("group_id", memberGroupIds);

      if (cancelled || !memberships?.length) return;

      // Build a map of group_id -> last visit timestamp (fallback to membership created_at)
      const lastVisits = new Map<string, string>();
      let oldestLastVisit: string | null = null;
      for (const m of memberships) {
        const lv = m.last_visited_at ?? m.created_at;
        lastVisits.set(m.group_id, lv);
        if (!oldestLastVisit || lv < oldestLastVisit) {
          oldestLastVisit = lv;
        }
      }

      let query = supabase
        .from("group_posts")
        .select("group_id, created_at")
        .in("group_id", memberGroupIds)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (oldestLastVisit) {
        query = query.gt("created_at", oldestLastVisit);
      }

      const { data, error } = await query;
      if (error || cancelled) return;

      const result = new Map<string, number>();
      for (const post of data || []) {
        const lastVisit = lastVisits.get(post.group_id);
        if (!lastVisit) continue;
        if (new Date(post.created_at) > new Date(lastVisit)) {
          result.set(post.group_id, (result.get(post.group_id) || 0) + 1);
        }
      }

      if (!cancelled) setCounts(result);
    };

    fetchCounts();

    // Live updates: when a new post lands in one of the user's groups
    // (by someone else), refresh counts so the per-group bubble appears
    // immediately without waiting for a reload or tab focus.
    const channel = supabase
      .channel(`group-activity-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_posts" },
        (payload) => {
          const row: any = payload.new;
          if (!row) return;
          if (row.user_id === user.id) return;
          if (!memberGroupIds.includes(row.group_id)) return;
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [memberGroupIds.join(","), user?.id, authLoading]);

  return counts;
}

