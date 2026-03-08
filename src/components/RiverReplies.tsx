import { useState } from "react";
import { MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RiverReplyItem } from "@/components/river/RiverReplyItem";

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
  parent_reply_id: string | null;
}

interface RiverRepliesProps {
  entryId: string;
  currentUserId: string | null;
  replies: RiverReply[];
  onRepliesChange?: () => void;
}

export const RiverReplies = ({ entryId, currentUserId, replies, onRepliesChange }: RiverRepliesProps) => {
  const draftKey = `river-reply-draft-${entryId}`;
  const [showReplyInput, setShowReplyInput] = useState(() => {
    return !!sessionStorage.getItem(draftKey);
  });
  const [replyContent, setReplyContent] = useState(() => {
    return sessionStorage.getItem(draftKey) || "";
  });
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const updateReplyContent = (value: string) => {
    setReplyContent(value);
    if (value) {
      sessionStorage.setItem(draftKey, value);
    } else {
      sessionStorage.removeItem(draftKey);
    }
  };

  // Top-level replies only (no parent)
  const topLevelReplies = replies.filter(r => !r.parent_reply_id);
  const replyCount = replies.length;
  const visibleReplies = expanded ? topLevelReplies : topLevelReplies.slice(0, 2);
  const hasMore = topLevelReplies.length > 2;

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
            <RiverReplyItem
              key={reply.id}
              reply={reply}
              currentUserId={currentUserId}
              allReplies={replies}
              entryId={entryId}
              onRepliesChange={onRepliesChange}
            />
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
                  Show {topLevelReplies.length - 2} more {topLevelReplies.length - 2 === 1 ? "reply" : "replies"}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
