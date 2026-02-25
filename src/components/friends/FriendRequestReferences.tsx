import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Reference {
  id: string;
  from_user_id: string;
  reference_type: string;
  rating: number | null;
  content: string;
  created_at: string;
  author_name?: string;
}

interface FriendRequestReferencesProps {
  userId: string;
}

const typeLabels: Record<string, string> = {
  host: "Host",
  guest: "Guest",
  friendly: "Friendly",
  business: "Business",
};

const FriendRequestReferences = ({ userId }: FriendRequestReferencesProps) => {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchReferences = async () => {
      setLoading(true);
      const { data: refs } = await supabase
        .from("user_references")
        .select("id, from_user_id, reference_type, rating, content, created_at")
        .eq("to_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!refs || refs.length === 0) {
        setReferences([]);
        setLoading(false);
        return;
      }

      const authorIds = [...new Set(refs.map((r) => r.from_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p.display_name || "Unknown"])
      );

      setReferences(
        refs.map((r) => ({
          ...r,
          author_name: profileMap.get(r.from_user_id) || "Unknown",
        }))
      );
      setLoading(false);
    };

    fetchReferences();
  }, [userId]);

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Loading references…
      </p>
    );
  }

  if (references.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        This person has no references yet
      </p>
    );
  }

  // Build type counts
  const typeCounts: Record<string, number> = {};
  let ratingSum = 0;
  let ratingCount = 0;
  for (const ref of references) {
    typeCounts[ref.reference_type] = (typeCounts[ref.reference_type] || 0) + 1;
    if (ref.rating != null) {
      ratingSum += ref.rating;
      ratingCount++;
    }
  }

  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : null;
  const summary = Object.entries(typeCounts)
    .map(([type, count]) => `${count} ${typeLabels[type] || type}`)
    .join(", ");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
        <span className="font-medium">
          {references.length} reference{references.length !== 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground">({summary})</span>
        {avgRating != null && (
          <span className="flex items-center gap-0.5 ml-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span>{avgRating.toFixed(1)}</span>
          </span>
        )}
        {open ? (
          <ChevronUp className="w-3 h-3 ml-auto" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-auto" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5 space-y-1.5">
        {references.map((ref) => (
          <div
            key={ref.id}
            className="text-xs p-2 rounded bg-muted/50 space-y-0.5"
          >
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {typeLabels[ref.reference_type] || ref.reference_type}
              </Badge>
              {ref.rating != null && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                  {ref.rating}
                </span>
              )}
              <span className="text-muted-foreground ml-auto">
                by {ref.author_name}
              </span>
            </div>
            <p className="text-muted-foreground line-clamp-2">{ref.content}</p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FriendRequestReferences;
