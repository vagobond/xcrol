import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Users, Plane, MessageCircle } from "lucide-react";

interface BuddyTrip {
  id: string;
  user_id: string;
  destination_city: string | null;
  destination_country: string | null;
  start_date: string;
  end_date: string;
  purpose: string | null;
  buddy_note: string | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export default function BuddiesTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<BuddyTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("trips")
        .select(
          "id,user_id,destination_city,destination_country,start_date,end_date,purpose,buddy_note,seeking_companions"
        )
        .eq("seeking_companions", true)
        .gte("end_date", today)
        .neq("user_id", user.id)
        .order("start_date", { ascending: true })
        .limit(50);
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      const userIds = [...new Set((data || []).map((t: any) => t.user_id))];
      let profileMap = new Map<string, any>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url,username")
          .in("id", userIds);
        profileMap = new Map((profs || []).map((p: any) => [p.id, p]));
      }
      setTrips(
        (data || []).map((t: any) => ({ ...t, profile: profileMap.get(t.user_id) }))
      );
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground space-y-3">
          <Users className="w-12 h-12 mx-auto opacity-50" />
          <p>No travel buddies looking for company right now.</p>
          <p className="text-xs">
            Mark one of your trips as "Looking for buddies" in My Space → My Trips to appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString();

  return (
    <div className="grid gap-3">
      {trips.map((t) => {
        const place =
          [t.destination_city, t.destination_country].filter(Boolean).join(", ") || "Somewhere";
        const href = t.profile?.username ? `/@${t.profile.username}` : `/u/${t.user_id}`;
        return (
          <Card key={t.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Link to={href}>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={t.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(t.profile?.display_name || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={href} className="font-semibold hover:text-primary">
                      {t.profile?.display_name || "Someone"}
                    </Link>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Plane className="w-3 h-3" />
                      Buddy
                    </Badge>
                  </div>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    {place}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fmt(t.start_date)} – {fmt(t.end_date)}
                    {t.purpose ? ` · ${t.purpose}` : ""}
                  </p>
                  {t.buddy_note && (
                    <p className="text-sm text-muted-foreground italic">"{t.buddy_note}"</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/messages?to=${t.user_id}`)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
