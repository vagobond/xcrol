import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Smile } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_EMOJIS = ["❤️", "👍", "🔥", "😂", "😮", "😢", "🙏", "✨"];

export interface ReplyReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users?: { id: string; name: string }[];
}

interface RiverReplyReactionsProps {
  replyId: string;
  initialReactions?: ReplyReaction[];
  onReactionsChange?: () => void;
}

export const RiverReplyReactions = ({ replyId, initialReactions, onReactionsChange }: RiverReplyReactionsProps) => {
  const [reactions, setReactions] = useState<ReplyReaction[]>(initialReactions || []);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("You");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const pendingOps = useRef<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      if (user?.id) {
        supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) setCurrentUserName(data.display_name || data.username || "You");
          });
      }
    });
  }, []);

  useEffect(() => {
    if (!initialReactions) loadReactions();
  }, [replyId, userId]);

  useEffect(() => {
    if (initialReactions) setReactions(initialReactions);
  }, [initialReactions]);

  const loadReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("river_reply_reactions")
        .select("emoji, user_id")
        .eq("reply_id", replyId);

      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p.display_name || p.username || "Anonymous"])
      );

      const grouped = (data || []).reduce((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false, users: [] };
        acc[r.emoji].count++;
        acc[r.emoji].users = acc[r.emoji].users || [];
        acc[r.emoji].users.push({ id: r.user_id, name: profileMap.get(r.user_id) || "Anonymous" });
        if (userId && r.user_id === userId) acc[r.emoji].hasReacted = true;
        return acc;
      }, {} as Record<string, ReplyReaction>);

      setReactions(Object.values(grouped));
    } catch (error) {
      console.error("Error loading reply reactions:", error);
    }
  }, [replyId, userId]);

  const toggleReaction = useCallback(async (emoji: string) => {
    if (!userId) {
      toast.error("Sign in to react");
      return;
    }
    if (pendingOps.current.has(emoji)) return;
    pendingOps.current.add(emoji);

    const existingReaction = reactions.find(r => r.emoji === emoji && r.hasReacted);

    setReactions(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(r => r.emoji === emoji);
      if (existingReaction) {
        if (idx !== -1) {
          if (updated[idx].count === 1) updated.splice(idx, 1);
          else updated[idx] = { ...updated[idx], count: updated[idx].count - 1, hasReacted: false, users: (updated[idx].users || []).filter(u => u.id !== userId) };
        }
      } else {
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], count: updated[idx].count + 1, hasReacted: true, users: [...(updated[idx].users || []), { id: userId, name: currentUserName }] };
        } else {
          updated.push({ emoji, count: 1, hasReacted: true, users: [{ id: userId, name: currentUserName }] });
        }
      }
      return updated;
    });

    setPopoverOpen(false);

    try {
      if (existingReaction) {
        const { error } = await supabase
          .from("river_reply_reactions")
          .delete()
          .eq("reply_id", replyId)
          .eq("user_id", userId)
          .eq("emoji", emoji);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("river_reply_reactions")
          .upsert({ reply_id: replyId, user_id: userId, emoji }, { onConflict: 'reply_id,user_id,emoji' });
        if (error) throw error;
      }
      onReactionsChange?.();
    } catch (error) {
      console.error("Error toggling reply reaction:", error);
      toast.error("Failed to update reaction");
      loadReactions();
    } finally {
      pendingOps.current.delete(emoji);
    }
  }, [userId, reactions, replyId, loadReactions, currentUserName, onReactionsChange]);

  const formatUserList = (users: { id: string; name: string }[]) => {
    if (!users || users.length === 0) return "";
    if (users.length === 1) return users[0].name;
    if (users.length === 2) return `${users[0].name} and ${users[1].name}`;
    return `${users.slice(0, -1).map(u => u.name).join(", ")}, and ${users[users.length - 1].name}`;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 flex-wrap">
        {reactions.map((reaction) => (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <Button
                variant={reaction.hasReacted ? "secondary" : "ghost"}
                size="sm"
                className={`h-6 px-1.5 text-xs gap-0.5 ${reaction.hasReacted ? "ring-1 ring-primary/50" : ""}`}
                onClick={() => toggleReaction(reaction.emoji)}
              >
                <span>{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </Button>
            </TooltipTrigger>
            {reaction.users && reaction.users.length > 0 && (
              <TooltipContent>
                <p className="text-sm">{formatUserList(reaction.users)}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-1.5">
              <Smile className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1">
              {AVAILABLE_EMOJIS.map((emoji) => {
                const existing = reactions.find(r => r.emoji === emoji);
                return (
                  <Button
                    key={emoji}
                    variant={existing?.hasReacted ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0 text-lg"
                    onClick={() => toggleReaction(emoji)}
                  >
                    {emoji}
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
};
