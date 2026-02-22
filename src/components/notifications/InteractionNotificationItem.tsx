import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle,
  Heart,
  Home,
  MapPin,
  Users,
  Droplets,
} from "lucide-react";

export interface InteractionNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  entity_id: string;
  created_at: string;
  read_at: string | null;
  actor_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const typeConfig: Record<string, { icon: typeof MessageCircle; label: string; color: string; route?: string }> = {
  river_reply: { icon: MessageCircle, label: "commented on your Xcrol entry", color: "text-emerald-500", route: "/the-river" },
  river_reply_reply: { icon: MessageCircle, label: "replied to your comment", color: "text-emerald-500", route: "/the-river" },
  brook_post: { icon: Droplets, label: "posted in your Brook", color: "text-cyan-500", route: "/the-forest" },
  brook_comment: { icon: MessageCircle, label: "commented on your Brook post", color: "text-cyan-500", route: "/the-forest" },
  brook_reaction: { icon: Heart, label: "reacted to your Brook post", color: "text-cyan-500", route: "/the-forest" },
  hosting_request: { icon: Home, label: "sent you a hosting request", color: "text-orange-500", route: "/hearthsurfing" },
  meetup_request: { icon: MapPin, label: "sent you a meetup request", color: "text-violet-500", route: "/hearthsurfing" },
  group_comment: { icon: Users, label: "commented on your group post", color: "text-blue-500", route: "/the-village" },
  group_reaction: { icon: Heart, label: "reacted to your group post", color: "text-blue-500", route: "/the-village" },
  group_comment_reaction: { icon: Heart, label: "reacted to your group comment", color: "text-blue-500", route: "/the-village" },
};

interface Props {
  notification: InteractionNotification;
  onMarkRead: (id: string) => void;
}

const InteractionNotificationItem = ({ notification, onMarkRead }: Props) => {
  const navigate = useNavigate();
  const config = typeConfig[notification.type] || {
    icon: MessageCircle,
    label: "interacted with your content",
    color: "text-muted-foreground",
  };
  const Icon = config.icon;
  const actorName = notification.actor_profile?.display_name?.split(" ")[0] || "Someone";

  const handleClick = async () => {
    onMarkRead(notification.id);
    if (config.route) {
      navigate(config.route);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            <span className="font-semibold">{actorName}</span>{" "}
            {config.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(notification.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </button>
  );
};

export default InteractionNotificationItem;
