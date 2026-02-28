import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_PREFIX = "group_last_visit_";

export function getGroupLastVisit(groupId: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${groupId}`);
  } catch {
    return null;
  }
}

export function setGroupLastVisit(groupId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${groupId}`, new Date().toISOString());
  } catch {
    // localStorage unavailable
  }
}

/**
 * For a list of group IDs the user is a member of, returns a Map of groupId -> new post count
 * (posts created after the user's last visit stored in localStorage).
 */
export function useGroupActivity(memberGroupIds: string[]) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [mountKey, setMountKey] = useState(0);

  // Bump mountKey every time the hook mounts (e.g. navigating back to Village)
  useEffect(() => {
    setMountKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (memberGroupIds.length === 0) {
      setCounts(new Map());
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      const lastVisits = new Map<string, string>();
      for (const gid of memberGroupIds) {
        const lv = getGroupLastVisit(gid);
        if (lv) lastVisits.set(gid, lv);
      }

      const { data, error } = await supabase
        .from("group_posts")
        .select("group_id, created_at")
        .in("group_id", memberGroupIds)
        .order("created_at", { ascending: false });

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

    return () => {
      cancelled = true;
    };
  }, [memberGroupIds.join(","), mountKey]);

  return counts;
}
