import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface MutualFriend {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AskIntroductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requesterId: string; // the person who sent the friend request (target of intro)
}

const AskIntroductionDialog = ({
  open,
  onOpenChange,
  requesterId,
}: AskIntroductionDialogProps) => {
  const { user } = useAuth();
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    const fetchMutualFriends = async () => {
      setLoading(true);
      setSelectedFriendId(null);
      setMessage("");

      // Get my friends
      const { data: myFriends } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", user.id);

      // Get requester's friends
      const { data: theirFriends } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", requesterId);

      const myFriendIds = new Set((myFriends || []).map((f) => f.friend_id));
      const mutualIds = (theirFriends || [])
        .map((f) => f.friend_id)
        .filter((id) => myFriendIds.has(id));

      if (mutualIds.length === 0) {
        setMutualFriends([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", mutualIds);

      setMutualFriends(profiles || []);
      setLoading(false);
    };

    fetchMutualFriends();
  }, [open, user, requesterId]);

  const handleSubmit = async () => {
    if (!user || !selectedFriendId || !message.trim()) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("introduction_requests").insert({
        requester_id: user.id,
        introducer_id: selectedFriendId,
        target_id: requesterId,
        message: message.trim(),
      });

      if (error) throw error;

      toast.success("Introduction request sent!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error sending intro request:", err);
      toast.error("Failed to send introduction request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ask for an Introduction</DialogTitle>
          <DialogDescription>
            Request a mutual friend to introduce you before you decide on this
            friend request.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : mutualFriends.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            You have no mutual friends with this person.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Select a mutual friend</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {mutualFriends.map((friend) => (
                  <button
                    key={friend.id}
                    className={`flex items-center gap-2 w-full p-2 rounded-lg text-left transition-colors ${
                      selectedFriendId === friend.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedFriendId(friend.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback>
                        {(friend.display_name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {friend.display_name || "Unknown"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Your message</p>
              <Textarea
                placeholder="Hi! Could you introduce me to this person?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selectedFriendId || !message.trim() || submitting}
              className="w-full"
            >
              {submitting ? "Sending…" : "Send Introduction Request"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AskIntroductionDialog;
