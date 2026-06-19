import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plane, Plus, Pencil, Trash2, Loader2, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "sonner";


export interface Trip {
  id: string;
  user_id: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string;
  end_date: string;
  purpose: string | null;
  companions: string | null;
  visibility: "private" | "friends" | "public";
}

const empty = (uid: string): Partial<Trip> => ({
  user_id: uid,
  destination_city: "",
  destination_country: "",
  start_date: "",
  end_date: "",
  purpose: "",
  companions: "",
  visibility: "friends",
});

export default function TripsManager() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Trip>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("id,user_id,destination_city,destination_country,start_date,end_date,purpose,companions,visibility")
      .eq("user_id", user.id)
      .order("start_date", { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setTrips((data as Trip[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openNew = () => {
    if (!user) return;
    setDraft(empty(user.id));
    setOpen(true);
  };

  const openEdit = (t: Trip) => {
    setDraft(t);
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!draft.start_date || !draft.end_date) {
      toast.error("Pick start and end dates");
      return;
    }
    if (draft.end_date < draft.start_date) {
      toast.error("End date must be after start date");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        destination_city: draft.destination_city || null,
        destination_country: draft.destination_country || null,
        start_date: draft.start_date,
        end_date: draft.end_date,
        purpose: draft.purpose || null,
        companions: draft.companions || null,
        visibility: draft.visibility || "friends",
      };
      if (draft.id) {
        const { error } = await supabase.from("trips").update(payload).eq("id", draft.id);
        if (error) throw error;
        toast.success("Trip updated");
      } else {
        const { error } = await supabase.from("trips").insert(payload);
        if (error) throw error;
        toast.success("Trip created");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Could not save trip");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this trip?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Trip deleted");
      load();
    }
  };

  const upcoming = trips.filter((t) => t.end_date >= new Date().toISOString().slice(0, 10));
  const past = trips.filter((t) => t.end_date < new Date().toISOString().slice(0, 10));

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            My Trips
          </CardTitle>
          <CardDescription>
            Share where you're heading. Friends can see upcoming trips and link them to hosting requests.
          </CardDescription>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Trip
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No trips yet. Create one to give hosts context when you request to stay.
          </p>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Upcoming</p>
                {upcoming.map((t) => (
                  <TripRow key={t.id} trip={t} onEdit={() => openEdit(t)} onDelete={() => remove(t.id)} />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Past</p>
                {past.map((t) => (
                  <TripRow key={t.id} trip={t} onEdit={() => openEdit(t)} onDelete={() => remove(t.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Trip" : "New Trip"}</DialogTitle>
            <DialogDescription>Destination and dates help hosts understand your plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input
                  value={draft.destination_city || ""}
                  onChange={(e) => setDraft({ ...draft, destination_city: e.target.value })}
                  placeholder="Lisbon"
                />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                <Input
                  value={draft.destination_country || ""}
                  onChange={(e) => setDraft({ ...draft, destination_country: e.target.value })}
                  placeholder="Portugal"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start</Label>
                <Input
                  type="date"
                  value={draft.start_date || ""}
                  onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input
                  type="date"
                  value={draft.end_date || ""}
                  onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Purpose (optional)</Label>
              <Input
                value={draft.purpose || ""}
                onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                placeholder="Visiting family, conference, solo trip..."
              />
            </div>
            <div className="space-y-1">
              <Label>Travel companions (optional)</Label>
              <Textarea
                rows={2}
                value={draft.companions || ""}
                onChange={(e) => setDraft({ ...draft, companions: e.target.value })}
                placeholder="Solo, partner, friend @alex..."
              />
            </div>
            <div className="space-y-1">
              <Label>Visibility</Label>
              <Select
                value={draft.visibility || "friends"}
                onValueChange={(v) => setDraft({ ...draft, visibility: v as Trip["visibility"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private — only me</SelectItem>
                  <SelectItem value="friends">Friends — confirmed friends</SelectItem>
                  <SelectItem value="public">Public — any Xcrol user</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {draft.id ? "Save changes" : "Create trip"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TripRow({
  trip,
  onEdit,
  onDelete,
}: {
  trip: Trip;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const place = [trip.destination_city, trip.destination_country].filter(Boolean).join(", ") || "Somewhere";
  const fmt = (d: string) => new Date(d).toLocaleDateString();
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/20 p-3">
      <div className="space-y-1 text-sm">
        <p className="font-medium flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {place}
        </p>
        <p className="text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> {fmt(trip.start_date)} – {fmt(trip.end_date)}
        </p>
        {trip.purpose && <p className="text-xs text-muted-foreground">{trip.purpose}</p>}
        <p className="text-xs text-muted-foreground capitalize">{trip.visibility}</p>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
