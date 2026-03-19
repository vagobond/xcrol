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
      loadAllNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reload message senders when unread count changes
  useEffect(() => {
    if (user && unreadMessageCount > 0) {
      // Only reload message senders specifically when count changes
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

  /**
   * Single RPC call replaces ~15-20 sequential DB queries.
   */
  const loadAllNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc("get_user_notifications", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error loading notifications:", error);
      return;
    }

    const result = data as any;

    // --- Friend requests ---
    const frData = result.friend_requests || [];
    setRequests(
      frData.map((fr: any) => ({
        id: fr.id,
        from_user_id: fr.from_user_id,
        message: fr.message,
        created_at: fr.created_at,
        from_profile: {
          display_name: fr.from_display_name,
          avatar_url: fr.from_avatar_url,
        },
      }))
    );

    // --- Pending friendships ---
    const pfData = result.pending_friendships || [];
    setPendingFriendships(
      pfData.map((pf: any) => ({
        id: pf.id,
        friend_id: pf.friend_id,
        friend_profile: {
          display_name: pf.friend_display_name,
          avatar_url: pf.friend_avatar_url,
        },
      }))
    );

    // --- Unread message senders ---
    const umsData = result.unread_message_senders || [];
    setUnreadMessageSenders(
      umsData.map((ums: any) => ({
        id: ums.id,
        display_name: ums.display_name,
        avatar_url: ums.avatar_url,
      }))
    );

    // --- New references (filter dismissed & unreturned) ---
    const nrData = result.new_references || [];
    const dismissedIds = getDismissedReferenceIds();
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

    // --- Interaction notifications ---
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
      group_comment: settings?.notify_group_activity ?? true,
      group_reaction: settings?.notify_group_activity ?? true,
      group_comment_reaction: settings?.notify_group_activity ?? true,
    };

    const filteredNotifs = inData.filter((n: any) => typeSettingMap[n.type] !== false);

    if (filteredNotifs.length === 0) {
      setGroupedNotifications([]);
      return;
    }

    // Resolve deep links (still needs client-side resolution for now)
    const resolved = await resolveNotifications(
      filteredNotifs.map((n: any) => ({ id: n.id, type: n.type, entity_id: n.entity_id }))
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

    for (const n of filteredNotifs) {
      const bucket = getGroupBucket(n.type);
      const resolution = resolved.get(n.id);
      const parentId = resolution?.parentEntityId || n.entity_id;
      const groupKey = `${bucket}::${parentId}`;

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

  // Keep these as separate functions for manual refresh after actions
  const loadRequests = async () => { loadAllNotifications(); };
  const loadPendingFriendships = async () => { loadAllNotifications(); };

  const dismissReferenceNotification = (refId: string) => {
    const dismissed = getDismissedReferenceIds();
    if (!dismissed.includes(refId)) {
      dismissed.push(refId);
      localStorage.setItem("dismissed_reference_notifications", JSON.stringify(dismissed));
    }
    setNewReferences((prev) => prev.filter((ref) => ref.id !== refId));
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

  const interactionCount = groupedNotifications.length;
  const totalNotifications =
    requests.length + pendingFriendships.length + unreadMessageCount + newReferences.length + interactionCount;

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
