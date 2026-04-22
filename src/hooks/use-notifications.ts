import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { resolveNotifications, getGroupBucket } from "@/lib/notification-resolver";

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

const getDismissedReferenceIds = async (userId: string): Promise<string[]> => {
  try {
    const { data } = await supabase
      .from("dismissed_reference_notifications")
      .select("reference_id")
      .eq("user_id", userId);
    return (data || []).map((d: any) => d.reference_id);
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
  notificationIds: string[];
  type: string;
  actors: ActorInfo[];
  count: number;
  contentPreview: string | null;
  resolvedRoute: string | null;
  created_at: string;
  label: string;
  isRead?: boolean;
}

const typeLabels: Record<string, string> = {
  river_reply: "commented on your Xcrol entry",
  river_reply_reply: "replied to your comment",
  brook_post: "posted in your Brook",
  brook_comment: "commented on your Brook post",
  brook_reaction: "reacted to your Brook post",
  hosting_request: "sent you a hosting request",
  meetup_request: "sent you a meetup request",
  introduction_request: "asked you for an introduction",
  nearby_hometown: "claimed a hometown near you",
  group_post: "posted in a group you're in",
  group_comment: "commented on your group post",
  group_reaction: "reacted to your group post",
  group_comment_reaction: "reacted to your group comment",
};

// Bucket type → which header (Bell/Village/World)
export const BELL_TYPES = [
  "river_reply",
  "river_reply_reply",
  "brook_post",
  "brook_comment",
  "brook_reaction",
] as const;
export const VILLAGE_TYPES = [
  "group_post",
  "group_comment",
  "group_reaction",
  "group_comment_reaction",
] as const;
export const WORLD_TYPES = [
  "hosting_request",
  "meetup_request",
  "introduction_request",
  "nearby_hometown",
] as const;

export type ViewMode = "unread" | "all";

export const useNotifications = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [pendingFriendships, setPendingFriendships] = useState<PendingFriendship[]>([]);
  const [newReferences, setNewReferences] = useState<NewReference[]>([]);
  const [unreadMessageSenders, setUnreadMessageSenders] = useState<UnreadMessageSender[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotification[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("unread");
  const { unreadCount: unreadMessageCount } = useUnreadMessages(user?.id || null);

  useEffect(() => {
    if (user) {
      loadAllNotifications(viewMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewMode]);

  // Reload message senders when unread count changes
  useEffect(() => {
    if (user && unreadMessageCount > 0) {
      loadMessageSendersOnly();
    } else {
      setUnreadMessageSenders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadMessageCount]);

  const loadMessageSendersOnly = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("from_user_id")
      .eq("to_user_id", user.id)
      .is("read_at", null);
    if (!data || data.length === 0) { setUnreadMessageSenders([]); return; }
    const senderIds = [...new Set(data.map((m) => m.from_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", senderIds);
    setUnreadMessageSenders(
      (profiles || []).map((p) => ({ id: p.id, display_name: p.display_name, avatar_url: p.avatar_url }))
    );
  };

  const loadAllNotifications = async (mode: ViewMode = "unread") => {
    if (!user) return;

    const { data, error } = await supabase.rpc("get_user_notifications", {
      p_user_id: user.id,
      p_include_read: mode === "all",
    } as any);

    if (error) {
      console.error("Error loading notifications:", error);
      return;
    }

    const result = data as any;

    const frData = result.friend_requests || [];
    setRequests(
      frData.map((fr: any) => ({
        id: fr.id,
        from_user_id: fr.from_user_id,
        message: fr.message,
        created_at: fr.created_at,
        from_profile: { display_name: fr.from_display_name, avatar_url: fr.from_avatar_url },
      }))
    );

    const pfData = result.pending_friendships || [];
    setPendingFriendships(
      pfData.map((pf: any) => ({
        id: pf.id,
        friend_id: pf.friend_id,
        friend_profile: { display_name: pf.friend_display_name, avatar_url: pf.friend_avatar_url },
      }))
    );

    const umsData = result.unread_message_senders || [];
    setUnreadMessageSenders(
      umsData.map((ums: any) => ({ id: ums.id, display_name: ums.display_name, avatar_url: ums.avatar_url }))
    );

    const nrData = result.new_references || [];
    const dismissedIds = await getDismissedReferenceIds(user.id);
    const references: NewReference[] = nrData
      .filter((nr: any) => !dismissedIds.includes(nr.id) && !nr.has_return_ref)
      .map((nr: any) => ({
        id: nr.id,
        from_user_id: nr.from_user_id,
        reference_type: nr.reference_type,
        rating: nr.rating,
        created_at: nr.created_at,
        from_profile: {
          display_name: nr.from_display_name,
          avatar_url: nr.from_avatar_url,
          username: nr.from_username,
        },
        hasLeftReturn: nr.has_return_ref,
      }));
    setNewReferences(references);

    const inData = result.interaction_notifications || [];
    const settings = result.notification_settings;

    const typeSettingMap: Record<string, boolean> = {
      river_reply: settings?.notify_river_replies ?? true,
      river_reply_reply: settings?.notify_river_replies ?? true,
      brook_post: settings?.notify_brook_activity ?? true,
      brook_comment: settings?.notify_brook_activity ?? true,
      brook_reaction: settings?.notify_brook_activity ?? true,
      hosting_request: settings?.notify_hosting_requests ?? true,
      meetup_request: settings?.notify_meetup_requests ?? true,
      introduction_request: settings?.notify_world_activity ?? true,
      nearby_hometown: settings?.notify_world_activity ?? true,
      group_post: settings?.notify_group_activity ?? true,
      group_comment: settings?.notify_group_activity ?? true,
      group_reaction: settings?.notify_group_activity ?? true,
      group_comment_reaction: settings?.notify_group_activity ?? true,
    };

    const filteredNotifs = inData.filter((n: any) => typeSettingMap[n.type] !== false);

    if (filteredNotifs.length === 0) {
      setGroupedNotifications([]);
      return;
    }

    const resolved = await resolveNotifications(
      filteredNotifs.map((n: any) => ({ id: n.id, type: n.type, entity_id: n.entity_id }))
    );

    const groupMap = new Map<string, {
      notificationIds: string[];
      type: string;
      actors: ActorInfo[];
      actorIdSet: Set<string>;
      contentPreview: string | null;
      resolvedRoute: string | null;
      created_at: string;
      isRead: boolean;
    }>();

    for (const n of filteredNotifs) {
      const bucket = getGroupBucket(n.type);
      const resolution = resolved.get(n.id);
      const parentId = resolution?.parentEntityId || n.entity_id;
      const groupKey = `${bucket}::${parentId}`;
      const isRead = !!n.read_at;

      const actorInfo: ActorInfo = {
        name: n.actor_display_name?.split(" ")[0] || "Someone",
        avatar_url: n.actor_avatar_url || null,
      };

      const existing = groupMap.get(groupKey);
      if (existing) {
        existing.notificationIds.push(n.id);
        if (!existing.actorIdSet.has(n.actor_id)) {
          existing.actorIdSet.add(n.actor_id);
          existing.actors.push(actorInfo);
        }
        if (n.created_at > existing.created_at) existing.created_at = n.created_at;
        if (!existing.resolvedRoute && resolution?.resolvedRoute) existing.resolvedRoute = resolution.resolvedRoute;
        if (!existing.contentPreview && resolution?.contentPreview) existing.contentPreview = resolution.contentPreview;
        if (!isRead) existing.isRead = false; // group is unread if any item unread
      } else {
        groupMap.set(groupKey, {
          notificationIds: [n.id],
          type: n.type,
          actors: [actorInfo],
          actorIdSet: new Set([n.actor_id]),
          contentPreview: resolution?.contentPreview || null,
          resolvedRoute: resolution?.resolvedRoute || null,
          created_at: n.created_at,
          isRead,
        });
      }
    }

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
        isRead: g.isRead,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    setGroupedNotifications(grouped);
  };

  const loadRequests = async () => { loadAllNotifications(viewMode); };
  const loadPendingFriendships = async () => { loadAllNotifications(viewMode); };

  const dismissReferenceNotification = async (refId: string) => {
    if (!user) return;
    try {
      await supabase.from("dismissed_reference_notifications").insert({
        user_id: user.id,
        reference_id: refId,
      });
    } catch { /* ignore */ }
    setNewReferences((prev) => prev.filter((ref) => ref.id !== refId));
  };

  const markInteractionRead = useCallback(async (notifIds: string | string[]) => {
    const ids = Array.isArray(notifIds) ? notifIds : [notifIds];
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    setGroupedNotifications((prev) => {
      if (viewMode === "all") {
        // Just mark them read in-place
        return prev.map((g) =>
          g.notificationIds.some((id) => ids.includes(id)) ? { ...g, isRead: true } : g
        );
      }
      return prev.filter((g) => !g.notificationIds.some((id) => ids.includes(id)));
    });
  }, [viewMode]);

  const markAllRead = useCallback(async (types?: readonly string[]) => {
    if (!user) return;
    const targetIds = groupedNotifications
      .filter((g) => !g.isRead && (!types || (types as readonly string[]).includes(g.type)))
      .flatMap((g) => g.notificationIds);
    if (targetIds.length === 0) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", targetIds);
    setGroupedNotifications((prev) => {
      if (viewMode === "all") {
        return prev.map((g) =>
          targetIds.some((id) => g.notificationIds.includes(id)) ? { ...g, isRead: true } : g
        );
      }
      return prev.filter((g) => !targetIds.some((id) => g.notificationIds.includes(id)));
    });
  }, [user, groupedNotifications, viewMode]);

  // Partition by stream
  const bellInteractions = groupedNotifications.filter((g) =>
    (BELL_TYPES as readonly string[]).includes(g.type)
  );
  const villageInteractions = groupedNotifications.filter((g) =>
    (VILLAGE_TYPES as readonly string[]).includes(g.type)
  );
  const worldInteractions = groupedNotifications.filter((g) =>
    (WORLD_TYPES as readonly string[]).includes(g.type)
  );

  const unreadCountFor = (items: GroupedNotification[]) =>
    items.filter((g) => !g.isRead).length;

  // Bell badge: personal/social only — friend requests, pending friendships, references,
  // unread messages, plus bell-bucket interaction notifications.
  const bellBadgeCount =
    requests.length +
    pendingFriendships.length +
    unreadMessageCount +
    newReferences.length +
    unreadCountFor(bellInteractions);

  const villageBadgeCount = unreadCountFor(villageInteractions);
  const worldBadgeCount = unreadCountFor(worldInteractions);

  const totalNotifications = bellBadgeCount + villageBadgeCount + worldBadgeCount;

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
    // Streams
    bellInteractions,
    villageInteractions,
    worldInteractions,
    bellBadgeCount,
    villageBadgeCount,
    worldBadgeCount,
    // Back-compat
    groupedNotifications,
    totalNotifications,
    // View mode
    viewMode,
    setViewMode,
    // Actions
    dismissReferenceNotification,
    markInteractionRead,
    markAllRead,
    loadRequests,
    loadPendingFriendships,
  };
};
