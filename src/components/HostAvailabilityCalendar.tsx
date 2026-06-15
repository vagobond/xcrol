import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { CalendarIcon, Loader2, Plus, Trash2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BlackoutPeriod {
  id: string;
  start_date: string;
  end_date: string;
  kind: "blackout" | "booked";
  note: string | null;
  source_hosting_request_id: string | null;
}

const DAYS = [
  { dow: 0, label: "Sun" },
  { dow: 1, label: "Mon" },
  { dow: 2, label: "Tue" },
  { dow: 3, label: "Wed" },
  { dow: 4, label: "Thu" },
  { dow: 5, label: "Fri" },
  { dow: 6, label: "Sat" },
];

export default function HostAvailabilityCalendar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<BlackoutPeriod[]>([]);
  const [recurring, setRecurring] = useState<Set<number>>(new Set());
  const [range, setRange] = useState<DateRange | undefined>();
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: bp }, { data: rec }] = await Promise.all([
        supabase
          .from("host_blackout_periods")
          .select("id, start_date, end_date, kind, note, source_hosting_request_id")
          .eq("user_id", user.id)
          .gte("end_date", new Date().toISOString().slice(0, 10))
          .order("start_date", { ascending: true }),
        supabase
          .from("host_recurring_unavailability")
          .select("day_of_week")
          .eq("user_id", user.id),
      ]);
      setPeriods((bp as BlackoutPeriod[]) || []);
      setRecurring(new Set((rec || []).map((r: any) => r.day_of_week)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addBlackout = async () => {
    if (!user || !range?.from || !range?.to) {
      toast.error("Pick a start and end date");
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from("host_blackout_periods").insert({
        user_id: user.id,
        start_date: format(range.from, "yyyy-MM-dd"),
        end_date: format(range.to, "yyyy-MM-dd"),
        kind: "blackout",
        note: note.trim() || null,
      });
      if (error) throw error;
      setRange(undefined);
      setNote("");
      toast.success("Blackout added");
      load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add blackout");
    } finally {
      setAdding(false);
    }
  };

  const removePeriod = async (id: string) => {
    try {
      const { error } = await supabase.from("host_blackout_periods").delete().eq("id", id);
      if (error) throw error;
      setPeriods((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove");
    }
  };

  const toggleRecurring = async (dow: number) => {
    if (!user) return;
    const next = new Set(recurring);
    if (next.has(dow)) {
      next.delete(dow);
      await supabase
        .from("host_recurring_unavailability")
        .delete()
        .eq("user_id", user.id)
        .eq("day_of_week", dow);
    } else {
      next.add(dow);
      await supabase
        .from("host_recurring_unavailability")
        .insert({ user_id: user.id, day_of_week: dow });
    }
    setRecurring(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Availability Calendar
        </CardTitle>
        <CardDescription>
          Block off dates when you can't host. Accepted requests auto-block their dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add blackout */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="text-sm font-medium">Add a blackout period</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !range?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {range?.from
                    ? range.to
                      ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`
                      : format(range.from, "MMM d, yyyy")
                    : "Pick a date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Input
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="sm:max-w-xs"
            />
            <Button onClick={addBlackout} disabled={adding || !range?.from || !range?.to}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </Button>
          </div>
        </div>

        {/* Upcoming list */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Upcoming unavailable dates</div>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked dates. You're open whenever.</p>
          ) : (
            <ul className="space-y-2">
              {periods.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={p.kind === "booked" ? "default" : "secondary"}>
                      {p.kind === "booked" ? "Booked" : "Blocked"}
                    </Badge>
                    <span>
                      {format(new Date(p.start_date), "MMM d")} –{" "}
                      {format(new Date(p.end_date), "MMM d, yyyy")}
                    </span>
                    {p.note && (
                      <span className="text-muted-foreground truncate">· {p.note}</span>
                    )}
                  </div>
                  {p.kind === "blackout" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePeriod(p.id)}
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recurring weekly */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Never host on these days</div>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((d) => (
              <label
                key={d.dow}
                className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={recurring.has(d.dow)}
                  onCheckedChange={() => toggleRecurring(d.dow)}
                />
                <span className="text-sm">{d.label}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
