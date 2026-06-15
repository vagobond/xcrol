import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Home, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface HostingRequestDialogProps {
  recipientId: string;
  recipientName: string;
}

export const HostingRequestDialog = ({ recipientId, recipientName }: HostingRequestDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [numGuests, setNumGuests] = useState(1);
  const [sending, setSending] = useState(false);
  const [conflict, setConflict] = useState<null | { kind: string; start: string; end: string }>(null);
  const [recurringDows, setRecurringDows] = useState<number[]>([]);
  const [recurringHit, setRecurringHit] = useState<number[]>([]);

  // Load recurring unavailability once dialog opens
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("host_recurring_unavailability")
        .select("day_of_week")
        .eq("user_id", recipientId);
      setRecurringDows((data || []).map((r: any) => r.day_of_week));
    })();
  }, [open, recipientId]);

  // Check date-range conflicts whenever dates change
  useEffect(() => {
    setConflict(null);
    setRecurringHit([]);
    if (!arrivalDate || !departureDate) return;
    if (arrivalDate > departureDate) return;

    (async () => {
      const { data } = await supabase
        .from("host_blackout_periods")
        .select("kind, start_date, end_date")
        .eq("user_id", recipientId)
        .lte("start_date", departureDate)
        .gte("end_date", arrivalDate)
        .limit(1);
      if (data && data.length > 0) {
        setConflict({ kind: data[0].kind, start: data[0].start_date, end: data[0].end_date });
      }

      // recurring DOW check
      if (recurringDows.length > 0) {
        const hits: Set<number> = new Set();
        const start = new Date(arrivalDate);
        const end = new Date(departureDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (recurringDows.includes(d.getDay())) hits.add(d.getDay());
        }
        setRecurringHit([...hits]);
      }
    })();
  }, [arrivalDate, departureDate, recipientId, recurringDows]);

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
        .from("hosting_requests")
        .insert({
          from_user_id: user.id,
          to_user_id: recipientId,
          message: message.trim(),
          arrival_date: arrivalDate || null,
          departure_date: departureDate || null,
          num_guests: numGuests,
        });

      if (requestError) throw requestError;

      let dateInfo = "";
      if (arrivalDate && departureDate) {
        dateInfo = `\n\nDates: ${new Date(arrivalDate).toLocaleDateString()} - ${new Date(departureDate).toLocaleDateString()}`;
      } else if (arrivalDate) {
        dateInfo = `\n\nArrival: ${new Date(arrivalDate).toLocaleDateString()}`;
      }

      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          from_user_id: user.id,
          to_user_id: recipientId,
          content: `[Hosting Request - ${numGuests} guest${numGuests > 1 ? "s" : ""}]\n\n${message.trim()}${dateInfo}`,
          platform_suggestion: "hosting",
        });

      if (messageError) throw messageError;

      toast.success("Hosting request sent!");
      setOpen(false);
      setMessage("");
      setArrivalDate("");
      setDepartureDate("");
      setNumGuests(1);
    } catch (error) {
      console.error("Error sending hosting request:", error);
      toast.error("Failed to send hosting request");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Home className="w-4 h-4 mr-2" />
          Request to Stay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Stay</DialogTitle>
          <DialogDescription>
            Send a hosting request to {recipientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival Date</Label>
              <Input
                id="arrival"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Date</Label>
              <Input
                id="departure"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
          </div>

          {(conflict || recurringHit.length > 0) && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                {conflict && (
                  <p>
                    Host is unavailable {new Date(conflict.start).toLocaleDateString()} –{" "}
                    {new Date(conflict.end).toLocaleDateString()}
                    {conflict.kind === "booked" ? " (already booked)" : ""}.
                  </p>
                )}
                {recurringHit.length > 0 && (
                  <p>
                    Host doesn't usually host on{" "}
                    {recurringHit
                      .map((d) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d])
                      .join(", ")}
                    .
                  </p>
                )}
                <p className="text-xs text-muted-foreground">You can still send the request.</p>
              </div>
            </div>
          )}


          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max="10"
              value={numGuests}
              onChange={(e) => setNumGuests(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Your message *</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself, explain why you're traveling, and why you'd like to stay with this person..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} disabled={sending} className="w-full">
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Home className="w-4 h-4 mr-2" />
            )}
            Send Hosting Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
