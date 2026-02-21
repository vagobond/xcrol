import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Lock, MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MentionText } from "@/components/MentionText";
import { RiverReplyReactions } from "./RiverReplyReactions";
import type { RiverReply } from "@/components/RiverReplies";

interface RiverReplyItemProps {
  reply: RiverReply;
  currentUserId: string | null;
  allReplies: RiverReply[];
  entryId: string;
  onRepliesChange?: () => void;
  depth?: number;
}

const MAX_DEPTH = 3;

export const RiverReplyItem = ({ reply, currentUserId, allReplies, entryId, onRepliesChange, depth = 0 }: RiverReplyItemProps) => {
  const navigate = useNavigate();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const childReplies = allReplies.filter(r => r.parent_reply_id === reply.id);
  const visibleChildren = expanded ? childReplies : childReplies.slice(0, 2);
  const hasMoreChildren = childReplies.length > 2;

  const handleAuthorClick = () => {
    if (reply.author_username) navigate(`/${reply.author_username}`);
    else navigate(`/u/${reply.user_id}`);
  };

  const handleSubmitReply = async () => {
    if (!currentUserId || !replyContent.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("river_replies")
        .insert({
          entry_id: entryId,
          user_id: currentUserId,
          content: replyContent.trim(),
          parent_reply_id: reply.id,
        });
      if (error) throw error;
      setReplyContent("");
      setShowReplyInput(false);
      toast.success("Reply posted");
      onRepliesChange?.();
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    try {
      const { error } = await supabase
        .from("river_replies")
        .delete()
        .eq("id", reply.id);
      if (error) throw error;
      toast.success("Reply deleted");
      onRepliesChange?.();
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  return (
    <div className="flex gap-2 group">
      <Avatar
        className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-primary transition-all shrink-0 mt-0.5"
        onClick={handleAuthorClick}
      >
        <AvatarImage src={reply.author_avatar_url || undefined} />
        <AvatarFallback className="text-xs">
          {reply.author_display_name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {reply.can_view_content ? (
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span
                className="text-sm font-medium cursor-pointer hover:underline"
                onClick={handleAuthorClick}
              >
                {reply.author_display_name || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">
              <MentionText content={reply.content || ""} />
            </p>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg px-3 py-2 border border-dashed border-border/50">
            <div className="flex items-center gap-1.5">
              <span
                className="text-sm font-medium cursor-pointer hover:underline"
                onClick={handleAuthorClick}
              >
                {reply.author_display_name || "Someone"}
              </span>
              <span className="text-xs text-muted-foreground">replied</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Connect with {reply.author_display_name || "this person"} to see their reply</span>
            </div>
          </div>
        )}

        {/* Actions row: reactions + reply button + delete */}
        <div className="flex items-center gap-1 mt-1">
          <RiverReplyReactions replyId={reply.id} onReactionsChange={onRepliesChange} />
          
          {currentUserId && depth < MAX_DEPTH && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs gap-0.5"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <MessageSquare className="h-3 w-3" />
              Reply
            </Button>
          )}

          {reply.user_id === currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDeleteReply}
            >
              Delete
            </Button>
          )}
        </div>

        {/* Nested reply input */}
        {showReplyInput && (
          <div className="flex gap-2 mt-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              maxLength={500}
            />
            <Button
              size="sm"
              className="self-end"
              onClick={handleSubmitReply}
              disabled={submitting || !replyContent.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Child replies */}
        {childReplies.length > 0 && (
          <div className="mt-2 ml-2 pl-2 border-l border-border/30 space-y-2">
            {visibleChildren.map((child) => (
              <RiverReplyItem
                key={child.id}
                reply={child}
                currentUserId={currentUserId}
                allReplies={allReplies}
                entryId={entryId}
                onRepliesChange={onRepliesChange}
                depth={depth + 1}
              />
            ))}
            {hasMoreChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {childReplies.length - 2} more
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
