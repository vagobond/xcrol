import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import InteractionNotificationItem from "@/components/notifications/InteractionNotificationItem";
import NotificationViewToggle from "@/components/notifications/NotificationViewToggle";

const WorldBadge = () => {
  const navigate = useNavigate();
  const {
    user,
    worldInteractions,
    worldBadgeCount,
    viewMode,
    setViewMode,
    markInteractionRead,
    markAllRead,
  } = useNotifications();

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/irl-layer")}
        className="h-9 w-9"
        title="The World"
      >
        <Globe className="h-5 w-5" />
      </Button>
    );
  }

  const WORLD_TYPE_LIST = ["hosting_request", "meetup_request", "introduction_request", "nearby_hometown"];
  const hasUnread = worldInteractions.some((n) => !n.isRead);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          title="The World"
          onContextMenu={(e) => {
            e.preventDefault();
            navigate("/irl-layer");
          }}
        >
          <Globe className="h-5 w-5" />
          {worldBadgeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {worldBadgeCount > 99 ? "99+" : worldBadgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover border border-border z-50">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">The World</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={() => navigate("/irl-layer")}
            >
              Open map
            </Button>
          </div>

          <NotificationViewToggle
            viewMode={viewMode}
            onChange={setViewMode}
            onMarkAllRead={() => markAllRead(WORLD_TYPE_LIST)}
            hasUnread={hasUnread}
          />

          {worldInteractions.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              {viewMode === "unread" ? "No new world activity" : "No recent world activity"}
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {worldInteractions.map((notif, idx) => (
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

export default WorldBadge;
