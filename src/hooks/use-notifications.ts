import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { resolveNotifications, getGroupBucket } from "@/lib/notification-resolver";
import type { ResolvedNotification } from "@/lib/notification-resolver";

export interface FriendRequest {
  id: string;
  from_user_id: string;
  message: string | null;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface PendingFriendship {
  id: string;
  friend_id: string;
  friend_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface NewReference {
  id: string;
  from_user_id: string;
  reference_type: string;
  rating: number | null;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  hasLeftReturn?: boolean;
}

const getDismissedReferenceIds = (): string[] => {
  try {
    const stored = localStorage.getItem("dismissed_reference_notifications");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export interface UnreadMessageSender {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ActorInfo {
  name: string;
  avatar_url: string | null;
}

export interface GroupedNotification {
  /** IDs of all notifications in this group */
  notificationIds: string[];
  type: string;
  actors: ActorInfo[];
  count: number;
  contentPreview: string | null;
  resolvedRoute: string | null;
  created_at: string;
  label: string;
}

const typeLabels: Record<string, string> = {
  river_reply: "commented on your Xcrol entry",
  river_reply_reply: "replied to your comment",
  brook_post: "posted in your Brook",
  brook_comment: "commented on your Brook post",
  brook_reaction: "reacted to your Brook post",
  hosting_request: "sent you a hosting request",
  meetup_request: "sent you a meetup request",
  group_comment: "commented on your group post",
  group_reaction: "reacted to your group post",
  group_comment_reaction: "reacted to your group comment",
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [pendingFriendships, setPendingFriendships] = useState<PendingFriendship[]>([]);
  const [newReferences, setNewReferences] = useState<NewReference[]>([]);
  const [unreadMessageSenders, setUnreadMessageSenders] = useState<UnreadMessageSender[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotification[]>([]);
  const { unreadCount: unreadMessageCount } = useUnreadMessages(user?.id || null);

  useEffect(() => {
    if (user) {
      loadRequests();
      loadPendingFriendships();
      loadNewReferences();
      loadUnreadMessageSenders();
      loadInteractionNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user && unreadMessageCount > 0) {
      loadUnreadMessageSenders();
    } else {
      setUnreadMessageSenders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadMessageCount]);

  const loadUnreadMessageSenders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("from_user_id")
      .eq("to_user_id", user.id)
      .is("read_at", null);

    if (error || !data || data.length === 0) {
      setUnreadMessageSenders([]);
      return;
    }

    const senderIds = [...new Set(data.map((m) => m.from_user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", senderIds);

    setUnreadMessageSenders(
      (profiles || []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }))
    );
  };

  const loadNewReferences = async () => {
    if (!user) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("user_references")
      .select("id, from_user_id, reference_type, rating, created_at")
      .eq("to_user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading references:", error);
      return;
    }

    if (!data || data.length === 0) {
      setNewReferences([]);
      return;
    }

    const dismissedIds = getDismissedReferenceIds();
    const undismissedData = data.filter((ref) => !dismissedIds.includes(ref.id));

    if (undismissedData.length === 0) {
      setNewReferences([]);
      return;
    }

    const fromUserIds = [...new Set(undismissedData.map((ref) => ref.from_user_id))];

    const [profilesResult, returnRefsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", fromUserIds),
      supabase
        .from("user_references")
        .select("to_user_id")
        .eq("from_user_id", user.id)
        .in("to_user_id", fromUserIds),
    ]);

    const profilesMap = new Map(
      (profilesResult.data || []).map((p) => [p.id, p])
    );
    const returnRefSet = new Set(
      (returnRefsResult.data || []).map((r) => r.to_user_id)
    );

    const referencesWithDetails = undismissedData.map((ref) => ({
      ...ref,
      from_profile: profilesMap.get(ref.from_user_id) || undefined,
      hasLeftReturn: returnRefSet.has(ref.from_user_id),
    }));

    const unreturned = referencesWithDetails.filter((ref) => !ref.hasLeftReturn);
    setNewReferences(unreturned);
  };

  const loadRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_requests")
      .select("id, from_user_id, to_user_id, message, created_at")
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading requests:", error);
      return;
    }

    if (!data || data.length === 0) {
      setRequests([]);
      return;
    }

    const fromUserIds = [...new Set(data.map((req) => req.from_user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", fromUserIds);

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    const requestsWithProfiles = data.map((req) => ({
      ...req,
      from_profile: profilesMap.get(req.from_user_id) || undefined,
    }));

    setRequests(requestsWithProfiles);
  };

  const loadPendingFriendships = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friendships")
      .select("id, friend_id")
      .eq("user_id", user.id)
      .eq("needs_level_set", true);

    if (error) {
      console.error("Error loading pending friendships:", error);
      return;
    }

    if (!data || data.length === 0) {
      setPendingFriendships([]);
      return;
    }

    const friendIds = [...new Set(data.map((f) => f.friend_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", friendIds);

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    const friendshipsWithProfiles = data.map((friendship) => ({
      ...friendship,
      friend_profile: profilesMap.get(friendship.friend_id) || undefined,
    }));

    setPendingFriendships(friendshipsWithProfiles);
  };

  const dismissReferenceNotification = (refId: string) => {
    const dismissed = getDismissedReferenceIds();
    if (!dismissed.includes(refId)) {
      dismissed.push(refId);
      localStorage.setItem(
        "dismissed_reference_notifications",
        JSON.stringify(dismissed)
      );
    }
    setNewReferences((prev) => prev.filter((ref) => ref.id !== refId));
  };

  const loadInteractionNotifications = async () => {
    if (!user) return;

    const [notifsResult, settingsResult] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_settings")
        .select("notify_river_replies, notify_brook_activity, notify_hosting_requests, notify_meetup_requests, notify_group_activity")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const { data, error } = notifsResult;

    if (error || !data || data.length === 0) {
      setGroupedNotifications([]);
      return;
    }

    // Build type-to-setting mapping for filtering
    const s = settingsResult.data;
    const typeSettingMap: Record<string, boolean> = {
      river_reply: s?.notify_river_replies ?? true,
      river_reply_reply: s?.notify_river_replies ?? true,
      brook_post: s?.notify_brook_activity ?? true,
      brook_comment: s?.notify_brook_activity ?? true,
      brook_reaction: s?.notify_brook_activity ?? true,
      hosting_request: s?.notify_hosting_requests ?? true,
      meetup_request: s?.notify_meetup_requests ?? true,
      group_comment: s?.notify_group_activity ?? true,
      group_reaction: s?.notify_group_activity ?? true,
      group_comment_reaction: s?.notify_group_activity ?? true,
    };

    const filteredData = data.filter((n: any) => typeSettingMap[n.type] !== false);

    if (filteredData.length === 0) {
      setGroupedNotifications([]);
      return;
    }

    // Fetch actor profiles
    const actorIds = [...new Set(filteredData.map((n: any) => n.actor_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", actorIds);

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    // Resolve deep links and content previews
    const resolved = await resolveNotifications(
      filteredData.map((n: any) => ({ id: n.id, type: n.type, entity_id: n.entity_id }))
    );

    // Group notifications by (bucket, parentEntityId)
    const groupMap = new Map<string, {
      notificationIds: string[];
      type: string;
      actors: ActorInfo[];
      actorIdSet: Set<string>;
      contentPreview: string | null;
      resolvedRoute: string | null;
      created_at: string;
    }>();

    for (const n of filteredData as any[]) {
      const bucket = getGroupBucket(n.type);
      const resolution = resolved.get(n.id);
      const parentId = resolution?.parentEntityId || n.entity_id;
      const groupKey = `${bucket}::${parentId}`;

      const existing = groupMap.get(groupKey);
      const actorProfile = profilesMap.get(n.actor_id);
      const actorInfo: ActorInfo = {
        name: actorProfile?.display_name?.split(" ")[0] || "Someone",
        avatar_url: actorProfile?.avatar_url || null,
      };

      if (existing) {
        existing.notificationIds.push(n.id);
        if (!existing.actorIdSet.has(n.actor_id)) {
          existing.actorIdSet.add(n.actor_id);
          existing.actors.push(actorInfo);
        }
        // Keep most recent created_at
        if (n.created_at > existing.created_at) {
          existing.created_at = n.created_at;
        }
        // Use first resolved route / preview found
        if (!existing.resolvedRoute && resolution?.resolvedRoute) {
          existing.resolvedRoute = resolution.resolvedRoute;
        }
        if (!existing.contentPreview && resolution?.contentPreview) {
          existing.contentPreview = resolution.contentPreview;
        }
      } else {
        groupMap.set(groupKey, {
          notificationIds: [n.id],
          type: n.type,
          actors: [actorInfo],
          actorIdSet: new Set([n.actor_id]),
          contentPreview: resolution?.contentPreview || null,
          resolvedRoute: resolution?.resolvedRoute || null,
          created_at: n.created_at,
        });
      }
    }

    // Convert to array sorted by most recent
    const grouped: GroupedNotification[] = Array.from(groupMap.values())
      .map((g) => ({
        notificationIds: g.notificationIds,
        type: g.type,
        actors: g.actors,
        count: g.actors.length,
        contentPreview: g.contentPreview,
        resolvedRoute: g.resolvedRoute,
        created_at: g.created_at,
        label: typeLabels[g.type] || "interacted with your content",
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    setGroupedNotifications(grouped);
  };

  const markInteractionRead = useCallback(async (notifIds: string | string[]) => {
    const ids = Array.isArray(notifIds) ? notifIds : [notifIds];
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    setGroupedNotifications((prev) =>
      prev.filter((g) => !g.notificationIds.some((id) => ids.includes(id)))
    );
  }, []);

  // Count grouped notifications (each group = 1 notification item)
  const interactionCount = groupedNotifications.length;

  const totalNotifications =
    requests.length +
    pendingFriendships.length +
    unreadMessageCount +
    newReferences.length +
    interactionCount;

  useEffect(() => {
    if ("setAppBadge" in navigator) {
      if (totalNotifications > 0) {
        navigator.setAppBadge(totalNotifications).catch(() => {});
      } else {
        navigator.clearAppBadge?.().catch(() => {});
      }
    }
  }, [totalNotifications]);

  return {
    user,
    requests,
    pendingFriendships,
    newReferences,
    unreadMessageCount,
    unreadMessageSenders,
    groupedNotifications,
    totalNotifications,
    dismissReferenceNotification,
    markInteractionRead,
    loadRequests,
    loadPendingFriendships,
  };
};
