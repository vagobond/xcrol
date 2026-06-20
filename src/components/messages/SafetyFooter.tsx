import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, Home, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  currentUserId: string;
  otherUserId: string;
  hostingHinted: boolean;
}

export default function SafetyFooter({ currentUserId, otherUserId, hostingHinted }: Props) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hostingHinted) return;
    (async () => {
      const { data } = await supabase
        .from("hosting_requests")
        .select("id")
        .eq("status", "accepted")
        .or(
          `and(from_user_id.eq.${currentUserId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRequestId(data?.id ?? null);
    })();
  }, [currentUserId, otherUserId, hostingHinted]);

  if (!hostingHinted || !requestId) return null;

  const handleReport = async () => {
    if (!note.trim()) {
      toast.error("Please describe the concern");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("private_stay_feedback").insert({
        hosting_request_id: requestId,
        from_user_id: currentUserId,
        to_user_id: otherUserId,
        content: note.trim(),
      });
      if (error) throw error;
      toast.success("Sent to admins privately. Thank you.");
      setOpen(false);
      setNote("");
    } catch (e) {
      console.error(e);
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
        <Shield className="w-4 h-4" />
        Hearth Surf trust &amp; safety
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/hearthsurf">
            <Home className="w-3.5 h-3.5 mr-1.5" />
            Find nearby hosts
          </Link>
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              Report a safety issue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Private safety report</DialogTitle>
              <DialogDescription>
                Only XCROL admins see this. It is not shown to the other person and does not
                appear on any profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label htmlFor="safety-note">What happened?</Label>
              <Textarea
                id="safety-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="Describe the concern. Admins may follow up on the registered emergency contact if needed."
              />
              <Button onClick={handleReport} disabled={submitting} className="w-full">
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Send privately to admins
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        In a real emergency, contact local emergency services first.
      </p>
    </div>
  );
}
