import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Crown, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CastleProgress {
  points: number;
  pointsTarget: number;
  friends: number;
  friendsTarget: number;
  acceptedInvites: number;
  invitesTarget: number;
  profileComplete: boolean;
}

const POINTS_TARGET = 250;
const FRIENDS_TARGET = 10;
const INVITES_TARGET = 3;

const TheCastle = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<CastleProgress | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadProgress = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [pointsRes, friendsRes, invitesRes, profileRes] = await Promise.all([
        supabase.rpc("calculate_user_points", { p_user_id: user.id }),
        supabase
          .from("friendships")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.rpc("get_user_invite_stats", { p_user_id: user.id }),
        supabase
          .from("profiles")
          .select("display_name, username, avatar_url, bio, hometown_city, link, birthday_month")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      const points = (pointsRes.data as number) ?? 0;
      const friends = friendsRes.count ?? 0;
      const inviteStats = invitesRes.data as { accepted_count?: number } | null;
      const acceptedInvites = inviteStats?.accepted_count ?? 0;
      const p = profileRes.data;
      const profileComplete = !!(
        p?.display_name && p?.username && p?.avatar_url && p?.bio &&
        p?.link && p?.hometown_city && p?.birthday_month
      );

      setProgress({
        points,
        pointsTarget: POINTS_TARGET,
        friends,
        friendsTarget: FRIENDS_TARGET,
        acceptedInvites,
        invitesTarget: INVITES_TARGET,
        profileComplete,
      });
    } catch (err) {
      console.error("Failed to load castle progress:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const pct = (val: number, target: number) =>
    Math.min(100, Math.round((val / target) * 100));

  const totalProgress = progress
    ? Math.round(
        (pct(progress.points, progress.pointsTarget) +
          pct(progress.friends, progress.friendsTarget) +
          pct(progress.acceptedInvites, progress.invitesTarget) +
          (progress.profileComplete ? 100 : 0)) / 4
      )
    : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.15),_transparent_50%)] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 pt-20 pb-12">
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <div className="flex justify-center">
            <div className="relative">
              <Crown className="h-16 w-16 text-primary drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]" />
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-primary/70 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-glow tracking-tight">
            The Castle
          </h1>
          <p className="text-muted-foreground italic max-w-md mx-auto">
            Beyond these gates lies something rare. The gatekeepers grow restless — they sense your approach.
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <span className="font-semibold">Your Approach</span>
              </div>
              <span className="text-2xl font-bold text-primary">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-3" />
            <p className="text-sm text-muted-foreground italic text-center">
              {totalProgress < 25 && "The castle remains shrouded in mist..."}
              {totalProgress >= 25 && totalProgress < 50 && "A distant silhouette emerges on the horizon."}
              {totalProgress >= 50 && totalProgress < 75 && "The gates loom closer. Watchers stir on the ramparts."}
              {totalProgress >= 75 && totalProgress < 100 && "You stand at the threshold. The keepers debate your worthiness."}
              {totalProgress >= 100 && "The gates begin to creak open... patience, traveler. The keepers prepare your welcome."}
            </p>
          </CardContent>
        </Card>

        {progress && (
          <div className="space-y-4">
            <ProgressRow
              label="Earn the Keepers' Favor"
              hint="Accumulate the marks of devotion"
              value={progress.points}
              target={progress.pointsTarget}
              unit="marks"
            />
            <ProgressRow
              label="Gather Your Allies"
              hint="None pass alone"
              value={progress.friends}
              target={progress.friendsTarget}
              unit="bonds"
            />
            <ProgressRow
              label="Spread the Whispers"
              hint="Souls you brought to this realm"
              value={progress.acceptedInvites}
              target={progress.invitesTarget}
              unit="answered"
            />
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Reveal Yourself</p>
                  <p className="text-xs text-muted-foreground italic">A complete profile — no shadows.</p>
                </div>
                <span className={`text-sm font-bold ${progress.profileComplete ? "text-primary" : "text-muted-foreground"}`}>
                  {progress.profileComplete ? "✓ Complete" : "Incomplete"}
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground italic mb-4">
            "What waits within is not for the curious, but for the committed."
          </p>
          <Button variant="outline" onClick={() => navigate("/powers")}>
            Return to Your Powers
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProgressRow = ({
  label,
  hint,
  value,
  target,
  unit,
}: {
  label: string;
  hint: string;
  value: number;
  target: number;
  unit: string;
}) => {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground italic">{hint}</p>
          </div>
          <span className="text-sm font-bold text-primary">
            {value} / {target} {unit}
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </CardContent>
    </Card>
  );
};

export default TheCastle;
