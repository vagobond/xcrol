import { useNavigate } from "react-router-dom";
import { Home, Globe, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
port { useAuth } from "@/hooks/use-auth";
import { useVillageActivityCount } from "@/hooks/use-village-activity";
import villageIconSrc from "@/assets/village-icon.png";

const AppHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const villageCount = useVillageActivityCount();

  return (
    <header className="fixed top-0 right-0 z-50 p-2 sm:p-4 flex items-center gap-1 sm:gap-2">
      {user && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/powers")}
            className="h-9 w-9"
            title="Home"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/the-river")}
            className="h-9 w-9"
            title="The River"
          >
            <Waves className="h-5 w-5" />
           </Button>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/irl-layer")}
            className="h-9 w-9"
            title="The World"
          >
            <Globe className="h-5 w-5" />
          </Button>
        </>
      )}
      <AudioMuteButton />
      <ThemeToggle />
      ionBell />}
      <UserMenu />
    </header>
  );
};

export default AppHeader;
