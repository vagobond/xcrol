import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import InteractionNotificationItem from "@/components/notifications/InteractionNotificationItem";
import NotificationViewToggle from "@/components/notifications/NotificationViewToggle";
import villageIconSrc from "@/assets/village-icon.png";

const VillageBadge = () => {
  const navigate = useNavigate();
  const {
    user,
    villageInteractions,
    villageBadgeCount,
    viewMode,
    setViewMode,
    markInteractionRead,
    markAllRead,
  } = useNotifications();

  // Badge mirrors the dropdown contents (notification-table rows) so the number
  // never disagrees with what the user sees. Per-group "new since last visit"
  // dots still appear on each group card inside The Village.
  const totalCount = villageBadgeCount;

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/the-village")}
        className="h-9 w-9 relative"
        title="The Village"
      >
        <img src={villageIconSrc} alt="Village" className="h-5 w-5 invert dark:invert-0 brightness-150 contrast-150" />
      </Button>
    );
  }

  const VILLAGE_TYPE_LIST = ["group_post", "group_comment", "group_reaction", "group_comment_reaction"];
  const hasUnread = villageInteractions.some((n) => !n.isRead);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          title="The Village"
          onContextMenu={(e) => {
            e.preventDefault();
            navigate("/the-village");
          }}
        >
          <img src={villageIconSrc} alt="Village" className="h-5 w-5 invert dark:invert-0 brightness-150 contrast-150" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover border border-border z-50">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">The Village</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={() => navigate("/the-village")}
            >
              Open
            </Button>
          </div>

          <NotificationViewToggle
            viewMode={viewMode}
            onChange={setViewMode}
            onMarkAllRead={() => markAllRead(VILLAGE_TYPE_LIST)}
            hasUnread={hasUnread}
          />

          {villageInteractions.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              {viewMode === "unread" ? "No new village activity" : "No recent village activity"}
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {villageInteractions.map((notif, idx) => (
                <InteractionNotificationItem
                  key={notif.notificationIds[0] || idx}
                  notification={notif}
                  onMarkRead={markInteractionRead}
                />
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default VillageBadge;
