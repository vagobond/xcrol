import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useVillageActivityCount } from "@/hooks/use-village-activity";
import villageIconSrc from "@/assets/village-icon.png";

const VillageBadge = () => {
  const navigate = useNavigate();
  const villageCount = useVillageActivityCount();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate("/the-village")}
      className="h-9 w-9 relative"
      title="The Village"
    >
      <img src={villageIconSrc} alt="Village" className="h-5 w-5 invert dark:invert-0 brightness-150 contrast-150" />
      {villageCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {villageCount > 99 ? "99+" : villageCount}
        </span>
      )}
    </Button>
  );
};

export default VillageBadge;
