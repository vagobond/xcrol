import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plane, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface TripWithProfile {
  id: string;
  user_id: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string;
  end_date: string;
  purpose: string | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export default function FriendsTripsCard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);

      // RLS handles visibility — just ask for upcoming non-own trips
      const { data, error } = await supabase
        .from("trips")
        .select(
          "id,user_id,destination_city,destination_country,start_date,end_date,purpose"
        )
        .gte("end_date", today)
        .neq("user_id", user.id)
        .order("start_date", { ascending: true })
        .limit(10);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const userIds = [...new Set((data || []).map((t) => t.user_id))];
      let profileMap = new Map<string, any>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url,username")
          .in("id", userIds);
        profileMap = new Map((profs || []).map((p: any) => [p.id, p]));
      }

      setTrips(
        (data || []).map((t) => ({ ...t, profile: profileMap.get(t.user_id) }))
      );
      setLoading(false);
    })();
  }, [user]);

  if (loading || trips.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plane className="w-4 h-4" />
          Friends on the move
        </CardTitle>
        <CardDescription>Upcoming trips your friends have shared.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {trips.map((t) => {
          const place = [t.destination_city, t.destination_country].filter(Boolean).join(", ") || "Somewhere";
          const fmt = (d: string) => new Date(d).toLocaleDateString();
          const href = t.profile?.username ? `/@${t.profile.username}` : `/profile/${t.user_id}`;
          return (
            <Link
              key={t.id}
              to={href}
              className="flex items-center gap-3 rounded-md border border-border bg-muted/20 p-2 hover:bg-muted/40 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={t.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {(t.profile?.display_name || "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-sm">
                <p className="truncate">
                  <span className="font-medium">{t.profile?.display_name || "Someone"}</span>{" "}
                  <span className="text-muted-foreground">→</span>{" "}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {place}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {fmt(t.start_date)} – {fmt(t.end_date)}
                  {t.purpose ? ` · ${t.purpose}` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
