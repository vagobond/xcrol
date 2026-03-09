import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface AuditLogEntry {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_id: string | null;
  target_type: string | null;
  metadata: Record<string, any>;
  created_at: string;
  actor_name?: string | null;
  target_name?: string | null;
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  user_signup: { label: "User Signup", color: "text-green-600 dark:text-green-400" },
  group_created: { label: "Group Created", color: "text-blue-600 dark:text-blue-400" },
  group_deleted: { label: "Group Deleted", color: "text-red-600 dark:text-red-400" },
  friendship_created: { label: "Friendship Created", color: "text-emerald-600 dark:text-emerald-400" },
  friendship_removed: { label: "Friendship Removed", color: "text-orange-600 dark:text-orange-400" },
  group_member_joined: { label: "Joined Group", color: "text-sky-600 dark:text-sky-400" },
  group_member_left: { label: "Left Group", color: "text-amber-600 dark:text-amber-400" },
  xcrol_entry_posted: { label: "Xcrol Entry", color: "text-purple-600 dark:text-purple-400" },
  group_post_created: { label: "Group Post", color: "text-indigo-600 dark:text-indigo-400" },
  role_granted: { label: "Role Granted", color: "text-yellow-600 dark:text-yellow-400" },
  role_revoked: { label: "Role Revoked", color: "text-red-600 dark:text-red-400" },
  deletion_request_approved: { label: "Deletion Approved", color: "text-red-700 dark:text-red-300" },
  deletion_request_rejected: { label: "Deletion Rejected", color: "text-muted-foreground" },
  town_listing_created: { label: "Town Listing", color: "text-teal-600 dark:text-teal-400" },
  brook_created: { label: "Brook Created", color: "text-cyan-600 dark:text-cyan-400" },
  invite_sent: { label: "Invite Sent", color: "text-violet-600 dark:text-violet-400" },
  reference_created: { label: "Reference Left", color: "text-pink-600 dark:text-pink-400" },
  user_deleted: { label: "User Deleted", color: "text-red-700 dark:text-red-300" },
  broadcast_sent: { label: "Broadcast Sent", color: "text-yellow-600 dark:text-yellow-400" },
  reference_deleted: { label: "Reference Deleted", color: "text-red-600 dark:text-red-400" },
  flag_resolved: { label: "Flag Resolved", color: "text-muted-foreground" },
};

const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "user_signup", label: "User Signups" },
  { value: "friendship_created", label: "Friendships Created" },
  { value: "friendship_removed", label: "Friendships Removed" },
  { value: "group_created", label: "Groups Created" },
  { value: "group_deleted", label: "Groups Deleted" },
  { value: "group_member_joined", label: "Group Joins" },
  { value: "group_member_left", label: "Group Leaves" },
  { value: "group_post_created", label: "Group Posts" },
  { value: "xcrol_entry_posted", label: "Xcrol Entries" },
  { value: "brook_created", label: "Brooks Created" },
  { value: "invite_sent", label: "Invites Sent" },
  { value: "reference_created", label: "References Left" },
  { value: "town_listing_created", label: "Town Listings" },
  { value: "role_granted", label: "Roles Granted" },
  { value: "role_revoked", label: "Roles Revoked" },
  { value: "user_deleted", label: "User Deletions" },
  { value: "broadcast_sent", label: "Broadcasts" },
];

const PAGE_SIZE = 50;

function getEventDescription(entry: AuditLogEntry): string {
  const actor = entry.actor_name || entry.metadata?.display_name || entry.metadata?.username || entry.actor_id?.slice(0, 8) || "System";
  const meta = entry.metadata || {};

  switch (entry.event_type) {
    case "user_signup":
      return `${meta.display_name || "User"} (${meta.email || "no email"}) signed up as @${meta.username || "?"}`;
    case "group_created":
      return `${actor} created group "${meta.name}"`;
    case "group_deleted":
      return `${actor} deleted group "${meta.name}"`;
    case "friendship_created":
      return `${actor} → ${entry.target_name || entry.target_id?.slice(0, 8)} (${meta.level})`;
    case "friendship_removed":
      return `${actor} removed ${entry.target_name || entry.target_id?.slice(0, 8)} (was ${meta.level})`;
    case "group_member_joined":
      return `${actor} joined a group as ${meta.role}`;
    case "group_member_left":
      return `${actor} left a group`;
    case "xcrol_entry_posted":
      return `${actor} posted an entry (${meta.privacy_level})`;
    case "group_post_created":
      return `${actor} posted in a group`;
    case "role_granted":
      return `Granted ${meta.role} role to ${entry.target_name || entry.target_id?.slice(0, 8)}`;
    case "role_revoked":
      return `Revoked ${meta.role} role from ${entry.target_name || entry.target_id?.slice(0, 8)}`;
    case "deletion_request_approved":
      return `Approved deletion for ${entry.target_name || entry.target_id?.slice(0, 8)}`;
    case "deletion_request_rejected":
      return `Rejected deletion for ${entry.target_name || entry.target_id?.slice(0, 8)}`;
    case "town_listing_created":
      return `${actor} posted "${meta.title}" in ${meta.category}`;
    case "brook_created":
      return `${actor} created a brook`;
    case "invite_sent":
      return `${actor} invited ${meta.invitee_email}`;
    case "reference_created":
      return `${actor} left a ${meta.reference_type} reference (${meta.rating}★)`;
    case "user_deleted":
      return `Admin deleted user ${meta.email || meta.username || entry.target_id?.slice(0, 8)}`;
    case "broadcast_sent":
      return `Admin sent broadcast to ${meta.recipient_count} users`;
    default:
      return `${entry.event_type}: ${actor}`;
  }
}

export function AuditLogTab() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_log")
        .select("id, event_type, actor_id, target_id, target_type, metadata, created_at")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterType !== "all") {
        query = query.eq("event_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as AuditLogEntry[];
      setHasMore(rows.length === PAGE_SIZE);

      // Resolve actor/target names
      const userIds = new Set<string>();
      rows.forEach((r) => {
        if (r.actor_id) userIds.add(r.actor_id);
        if (r.target_id && r.target_type !== "group" && r.target_type !== "xcrol_entry" && r.target_type !== "group_post" && r.target_type !== "brook" && r.target_type !== "invite" && r.target_type !== "town_listing") {
          userIds.add(r.target_id);
        }
      });

      const profilesMap = new Map<string, string>();
      if (userIds.size > 0) {
        const { data: profiles } = await supabase.rpc("get_admin_profiles_by_ids", { p_ids: [...userIds] });
        (profiles || []).forEach((p: any) => {
          profilesMap.set(p.id, p.display_name || p.username || p.email || p.id.slice(0, 8));
        });
      }

      const enriched = rows.map((r) => ({
        ...r,
        actor_name: r.actor_id ? profilesMap.get(r.actor_id) || null : null,
        target_name: r.target_id ? profilesMap.get(r.target_id) || null : null,
      }));

      setEntries(enriched);
    } catch (error) {
      console.error("Error loading audit log:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = search
    ? entries.filter((e) => {
        const desc = getEventDescription(e).toLowerCase();
        const type = (EVENT_LABELS[e.event_type]?.label || e.event_type).toLowerCase();
        return desc.includes(search.toLowerCase()) || type.includes(search.toLowerCase());
      })
    : entries;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <CardDescription>Complete activity log of all site events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log entries */}
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading audit log...</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No events found</p>
        ) : (
          <div className="space-y-1">
            {filteredEntries.map((entry) => {
              const eventInfo = EVENT_LABELS[entry.event_type] || { label: entry.event_type, color: "text-muted-foreground" };
              return (
                <div key={entry.id} className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors text-sm">
                  <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5 min-w-[130px]">
                    {format(new Date(entry.created_at), "MMM d, HH:mm:ss")}
                  </span>
                  <span className={`font-medium whitespace-nowrap min-w-[140px] ${eventInfo.color}`}>
                    {eventInfo.label}
                  </span>
                  <span className="text-foreground/80 break-all">
                    {getEventDescription(entry)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
