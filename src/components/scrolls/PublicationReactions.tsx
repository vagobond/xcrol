import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  REACTION_EMOJIS,
  getReactionCounts,
  getMyReactions,
  toggleReaction,
  type ReactionEmoji,
} from "@/lib/scroll-publish";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function PublicationReactions({ publicationId }: { publicationId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await getReactionCounts(publicationId);
      setCounts(c);
      if (user) setMine(await getMyReactions(publicationId, user.id));
    })();
  }, [publicationId, user]);

  const click = async (emoji: ReactionEmoji) => {
    if (!user) {
      toast({ title: "Sign in to react", description: "Free account, takes a moment." });
      navigate("/auth");
      return;
    }
    const on = mine.has(emoji);
    setBusy(emoji);
    try {
      await toggleReaction(publicationId, user.id, emoji, on);
      const newMine = new Set(mine);
      const newCounts = { ...counts };
      if (on) { newMine.delete(emoji); newCounts[emoji] = Math.max(0, (newCounts[emoji] ?? 0) - 1); }
      else { newMine.add(emoji); newCounts[emoji] = (newCounts[emoji] ?? 0) + 1; }
      setMine(newMine);
      setCounts(newCounts);
    } catch (e) {
      toast({ title: "Couldn't react", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {REACTION_EMOJIS.map((e) => {
        const on = mine.has(e);
        return (
          <Button
            key={e}
            variant={on ? "default" : "outline"}
            size="sm"
            disabled={busy === e}
            onClick={() => click(e)}
            className="text-base"
          >
            <span className="mr-1.5">{e}</span>
            <span className="text-xs tabular-nums">{counts[e] ?? 0}</span>
          </Button>
        );
      })}
    </div>
  );
}
