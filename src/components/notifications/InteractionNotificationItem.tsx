import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Heart,
  Home,
  MapPin,
  Users,
  Droplets,
  Globe,
  UserPlus,
} from "lucide-react";
import type { GroupedNotification } from "@/hooks/use-notifications";

const typeConfig: Record<string, { icon: typeof MessageCircle; color: string }> = {
  river_reply: { icon: MessageCircle, color: "text-emerald-500" },
  river_reply_reply: { icon: MessageCircle, color: "text-emerald-500" },
  brook_post: { icon: Droplets, color: "text-cyan-500" },
  brook_comment: { icon: MessageCircle, color: "text-cyan-500" },
  brook_reaction: { icon: Heart, color: "text-cyan-500" },
  hosting_request: { icon: Home, color: "text-orange-500" },
  meetup_request: { icon: MapPin, color: "text-violet-500" },
  introduction_request: { icon: UserPlus, color: "text-amber-500" },
  nearby_hometown: { icon: Globe, color: "text-sky-500" },
  group_post: { icon: Users, color: "text-blue-500" },
  group_comment: { icon: MessageCircle, color: "text-blue-500" },
  group_reaction: { icon: Heart, color: "text-blue-500" },
  group_comment_reaction: { icon: Heart, color: "text-blue-500" },
};

function formatActors(actors: { name: string }[]): string {
  if (actors.length === 1) return actors[0].name;
  if (actors.length === 2) return `${actors[0].name} and ${actors[1].name}`;
  const othersCount = actors.length - 1;
  return `${actors[0].name} and ${othersCount} other${othersCount > 1 ? "s" : ""}`;
}

interface Props {
  notification: GroupedNotification;
  onMarkRead: (ids: string[]) => void;
}

const InteractionNotificationItem = ({ notification, onMarkRead }: Props) => {
  const navigate = useNavigate();
  const config = typeConfig[notification.type] || {
    icon: MessageCircle,
    color: "text-muted-foreground",
  };
  const Icon = config.icon;
  const isRead = !!notification.isRead;

  const handleClick = async () => {
    if (!isRead) onMarkRead(notification.notificationIds);
    if (notification.resolvedRoute) {
      navigate(notification.resolvedRoute);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full p-3 rounded-lg border border-border transition-colors text-left ${
        isRead ? "bg-muted/20 opacity-60 hover:opacity-80" : "bg-muted/50 hover:bg-muted"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            <span className="font-semibold">{formatActors(notification.actors)}</span>{" "}
            {notification.label}
          </p>
          {notification.contentPreview && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate italic">
              "{notification.contentPreview}"
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(notification.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </button>
  );
};

export default InteractionNotificationItem;
