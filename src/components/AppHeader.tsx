import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Globe, Waves, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/components/onboarding";
import villageIconSrc from "@/assets/village-icon.png";

const UserMenu = lazy(() => import("./UserMenu"));
const NotificationBell = lazy(() => import("./NotificationBell"));
const VillageBadge = lazy(() => import("./VillageBadge"));
const WorldBadge = lazy(() => import("./WorldBadge"));

const AppHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reopenTutorial } = useTutorial();

  return (
    <header className="fixed top-0 right-0 z-50 p-2 sm:p-4 flex items-center gap-1 sm:gap-2">
      {user ? (
        <>
          <Button variant="ghost" size="icon" onClick={() => navigate("/powers")} className="h-9 w-9" title="Home">
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/the-river")} className="h-9 w-9" title="The River">
            <Waves className="h-5 w-5" />
          </Button>
          <Suspense fallback={
            <Button variant="ghost" size="icon" className="h-9 w-9" title="The Village">
              <img src={villageIconSrc} alt="Village" className="h-5 w-5 invert dark:invert-0 brightness-150 contrast-150" />
            </Button>
          }>
            <VillageBadge />
          </Suspense>
          <Suspense fallback={
            <Button variant="ghost" size="icon" className="h-9 w-9" title="The World">
              <Globe className="h-5 w-5" />
            </Button>
          }>
            <WorldBadge />
          </Suspense>
        </>
      ) : (
        <>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9" title="Home">
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/the-river")} className="h-9 w-9" title="The River">
            <Waves className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/the-village")} className="h-9 w-9" title="The Village">
            <img src={villageIconSrc} alt="Village" className="h-5 w-5 invert dark:invert-0 brightness-150 contrast-150" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/map")} className="h-9 w-9" title="The World">
            <Globe className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={reopenTutorial} className="h-9 w-9" title="Tour Xcrol">
            <Sparkles className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/getting-started")} className="h-9 w-9" title="Help & FAQ">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </>
      )}
      <ThemeToggle />
      {user && (
        <Suspense fallback={null}>
          <NotificationBell />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <UserMenu />
      </Suspense>
    </header>
  );
};

export default AppHeader;
