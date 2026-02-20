import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface UserPointsBadgeProps {
  userId: string;
}

export const UserPointsBadge = ({ userId }: UserPointsBadgeProps) => {
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    const fetchPoints = async () => {
      const { data, error } = await supabase.rpc("calculate_user_points", {
        p_user_id: userId,
      });
      if (!error && data !== null) {
        setPoints(data as number);
      }
    };
    fetchPoints();
  }, [userId]);

  if (points === null) return null;

  return (
    <Badge variant="secondary" className="text-sm gap-1.5 px-3 py-1">
      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
      {points} {points === 1 ? "point" : "points"}
    </Badge>
  );
};
