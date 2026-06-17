import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  otherUserId: string;
  otherUserName: string;
  role: "host" | "guest";
}

export const ShareStayMomentButton = ({ otherUserId, otherUserName, role }: Props) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", otherUserId)
      .maybeSingle();

    const handle = data?.username ? `@${data.username}` : otherUserName;
    const prefix =
      role === "host"
        ? `A moment from hosting ${handle}: `
        : `A moment from staying with ${handle}: `;
    navigate(`/my-xcrol?content=${encodeURIComponent(prefix)}`);
    toast.success("Share a moment from your stay 🌿");
  };

  return (
    <Button size="sm" variant="ghost" onClick={handleClick} title="Share a moment from your stay">
      <Sparkles className="w-4 h-4 mr-1" />
      Share moment
    </Button>
  );
};
