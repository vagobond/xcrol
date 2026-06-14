import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, AlertTriangle, ShieldAlert, Clock, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  hostingRequestId: string;
  recipientId: string;
  recipientName: string;
  role: "host" | "guest"; // role of the *recipient* (who you're referencing)
  /** called after a successful submission */
  onSubmitted?: () => void;
}

type ExistingState =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "mine"; revealed: boolean }
  | { kind: "both_revealed" };

export const StayReferenceDialog = ({
  hostingRequestId,
  recipientId,
  recipientName,
  role,
  onSubmitted,
}: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [existing, setExisting] = useState<ExistingState>({ kind: "loading" });
  const [showLowRatingWarning, setShowLowRatingWarning] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);

  useEffect(() => {
    void checkExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostingRequestId, user?.id]);

  const checkExisting = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_references")
      .select("id, from_user_id, revealed_at")
      .eq("hosting_request_id", hostingRequestId);

    if (error) {
      console.error(error);
      setExisting({ kind: "none" });
      return;
    }

    const mine = data?.find((r) => r.from_user_id === user.id);
    const both = data && data.length >= 2;
    if (both && mine?.revealed_at) {
      setExisting({ kind: "both_revealed" });
    } else if (mine) {
      setExisting({ kind: "mine", revealed: !!mine.revealed_at });
    } else {
      setExisting({ kind: "none" });
    }
  };

  const handleRatingClick = (star: number) => {
    if (star < 3) {
      setPendingRating(star);
      setShowLowRatingWarning(true);
    } else {
      setRating(star);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim()) {
      toast.error("Please write your reference");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("user_references").insert({
        from_user_id: user.id,
        to_user_id: recipientId,
        reference_type: role,
        rating,
        content: content.trim(),
        hosting_request_id: hostingRequestId,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("You've already left a reference for this stay");
        } else {
          throw error;
        }
        return;
      }

      if (privateFeedback.trim()) {
        const { error: pfError } = await supabase
          .from("private_stay_feedback")
          .insert({
            hosting_request_id: hostingRequestId,
            from_user_id: user.id,
            to_user_id: recipientId,
            content: privateFeedback.trim(),
          });
        if (pfError) console.error("Private feedback failed:", pfError);
      }

      toast.success("Reference submitted — hidden until both sides write one (or 14 days)");
      setOpen(false);
      setContent("");
      setPrivateFeedback("");
      setRating(5);
      void checkExisting();
      onSubmitted?.();
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit reference");
    } finally {
      setSending(false);
    }
  };

  if (existing.kind === "loading") return null;
  if (existing.kind === "both_revealed") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Check className="w-4 h-4 mr-2" /> Stay reference revealed
      </Button>
    );
  }
  if (existing.kind === "mine") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Clock className="w-4 h-4 mr-2" /> Waiting for {recipientName}
      </Button>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-2" />
            Leave stay reference
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reference for {recipientName}</DialogTitle>
            <DialogDescription>
              Tied to your stay. Hidden from everyone except the two of you until
              {" "}{recipientName} also writes one — or automatically revealed after 14 days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stay-content">Public reference *</Label>
              <Textarea
                id="stay-content"
                placeholder={role === "host"
                  ? "How was hosting them? What stood out?"
                  : "How was staying with them? Would you recommend?"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <Label htmlFor="stay-private" className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                Private safety note (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Something felt off but you don't want it public? This goes only to Xcrol admins —
                never to {recipientName}, never to other users.
              </p>
              <Textarea
                id="stay-private"
                placeholder="Anything admins should know…"
                value={privateFeedback}
                onChange={(e) => setPrivateFeedback(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleSubmit} disabled={sending} className="w-full">
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              Submit reference
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLowRatingWarning} onOpenChange={setShowLowRatingWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low rating
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're about to leave {pendingRating} star{pendingRating === 1 ? "" : "s"}. This is a
              serious signal. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowLowRatingWarning(false); setPendingRating(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingRating !== null) setRating(pendingRating);
              setShowLowRatingWarning(false);
              setPendingRating(null);
            }}>
              Yes, I'm sure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
