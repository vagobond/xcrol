import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, Lock, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MentionText } from "@/components/MentionText";

export interface RiverReply {
  id: string;
  entry_id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_username: string | null;
  can_view_content: boolean;
}

interface RiverRepliesProps {
  entryId: string;
  currentUserId: string | null;
  replies: RiverReply[];
  onRepliesChange?: () => void;
}

export const RiverReplies = ({ entryId, currentUserId, replies, onRepliesChange }: RiverRepliesProps) => {
  const navigate = useNavigate();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const replyCount = replies.length;
  const visibleReplies = expanded ? replies : replies.slice(0, 2);
  const hasMore = replyCount > 2;

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

  const handleDeleteReply = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from("river_replies")
        .delete()
        .eq("id", replyId);

      if (error) throw error;
      toast.success("Reply deleted");
      onRepliesChange?.();
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  const handleAuthorClick = (reply: RiverReply) => {
    if (reply.author_username) {
      navigate(`/${reply.author_username}`);
    } else {
      navigate(`/u/${reply.user_id}`);
    }
  };

  if (replyCount === 0 && !currentUserId) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      {/* Reply toggle button */}
      <div className="flex items-center gap-2 mb-2">
        {currentUserId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Reply
          </Button>
        )}
        {replyCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </span>
        )}
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="flex gap-2 mb-3">
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

      {/* Replies list */}
      {visibleReplies.length > 0 && (
        <div className="space-y-2">
          {visibleReplies.map((reply) => (
            <div key={reply.id} className="flex gap-2 group">
              <Avatar
                className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-primary transition-all shrink-0 mt-0.5"
                onClick={() => handleAuthorClick(reply)}
              >
                <AvatarImage src={reply.author_avatar_url || undefined} optimizeSize={64} />
                <AvatarFallback className="text-xs">
                  {reply.author_display_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                {reply.can_view_content ? (
                  // Full reply visible - viewer is friends with replier
                  <div className="bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-sm font-medium cursor-pointer hover:underline"
                        onClick={() => handleAuthorClick(reply)}
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
                  // Masked reply - viewer is NOT friends with replier
                  <div className="bg-muted/30 rounded-lg px-3 py-2 border border-dashed border-border/50">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-sm font-medium cursor-pointer hover:underline"
                        onClick={() => handleAuthorClick(reply)}
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

                {/* Delete own replies */}
                {reply.user_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteReply(reply.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Show more/less */}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground w-full"
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
                  Show {replyCount - 2} more {replyCount - 2 === 1 ? "reply" : "replies"}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
