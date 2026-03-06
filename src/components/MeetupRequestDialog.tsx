import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Coffee, Loader2 } from "lucide-react";
import { toast } from "sonner";

type MeetupPurpose = "tourism" | "food" | "friendship" | "romance";

interface MeetupRequestDialogProps {
  recipientId: string;
  recipientName: string;
}

export const MeetupRequestDialog = ({ recipientId, recipientName }: MeetupRequestDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState<MeetupPurpose>("friendship");
  const [message, setMessage] = useState("");
  const [proposedDates, setProposedDates] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }

    setSending(true);
    try {
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error: requestError } = await supabase
        .from("meetup_requests")
        .insert({
          from_user_id: user.id,
          to_user_id: recipientId,
          purpose,
          message: message.trim(),
          proposed_dates: proposedDates.trim() || null,
        });

      if (requestError) throw requestError;

      const purposeLabels = {
        tourism: "🗺️ Tourism",
        food: "🍽️ Food",
        friendship: "☕ Friendship",
        romance: "❤️ Romance",
      };

      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          from_user_id: user.id,
          to_user_id: recipientId,
          content: `[Meetup Request - ${purposeLabels[purpose]}]\n\n${message.trim()}${proposedDates ? `\n\nProposed dates: ${proposedDates}` : ""}`,
          platform_suggestion: "meetup",
        });

      if (messageError) throw messageError;

      toast.success("Meetup request sent!");
      setOpen(false);
      setMessage("");
      setProposedDates("");
      setPurpose("friendship");
    } catch (error) {
      console.error("Error sending meetup request:", error);
      toast.error("Failed to send meetup request");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Coffee className="w-4 h-4 mr-2" />
          Request Meetup
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Meetup</DialogTitle>
          <DialogDescription>
            Send a meetup request to {recipientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>What's the purpose of this meetup?</Label>
            <RadioGroup
              value={purpose}
              onValueChange={(value) => setPurpose(value as MeetupPurpose)}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="tourism" id="tourism" />
                <Label htmlFor="tourism" className="cursor-pointer">🗺️ Tourism</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="food" id="food" />
                <Label htmlFor="food" className="cursor-pointer">🍽️ Food</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="friendship" id="friendship" />
                <Label htmlFor="friendship" className="cursor-pointer">☕ Friendship</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="romance" id="romance" />
                <Label htmlFor="romance" className="cursor-pointer">❤️ Romance</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Your message *</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself and explain why you'd like to meet up..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dates">Proposed dates (optional)</Label>
            <Input
              id="dates"
              placeholder="e.g., Any weekend in January, or Jan 15-20"
              value={proposedDates}
              onChange={(e) => setProposedDates(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={sending} className="w-full">
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Coffee className="w-4 h-4 mr-2" />
            )}
            Send Meetup Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
