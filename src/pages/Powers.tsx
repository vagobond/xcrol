import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Globe, Waves, TreePine, Layers } from "lucide-react";
import villageIconSrc from "@/assets/village-icon.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useInviteNotification } from "@/hooks/use-invite-notification";
import { InviteNotificationModal } from "@/components/InviteNotificationModal";

const Powers = () => {
  const { user } = useAuth();
  const { showNotification, dismissNotification } = useInviteNotification();

  // Custom two-wave icon (like Waves but with 2 lines instead of 3)
  const TwoWaves = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 10c.6.5 1.2 1 2.5 1C7 11 7 9 9.5 9c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 16c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  );

  // Celtic Tree of Life icon for YOU - circular design with branches and roots
  const TreeOfLife = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Trunk */}
      <path d="M12 20V10" />
      {/* Upper branches spreading into circle */}
      <path d="M12 10c-2-3-5-4-7-3" />
      <path d="M12 10c2-3 5-4 7-3" />
      <path d="M12 10c-1-2-3-5-5-6" />
      <path d="M12 10c1-2 3-5 5-6" />
      {/* Side branches */}
      <path d="M12 12c-3-1-6 0-7 2" />
      <path d="M12 12c3-1 6 0 7 2" />
      {/* Roots curving into knotwork */}
      <path d="M12 20c-2 0-4-1-5-2" />
      <path d="M12 20c2 0 4-1 5-2" />
      <path d="M12 20c-1.5 1-3 2-5 1" />
      <path d="M12 20c1.5 1 3 2 5 1" />
    </svg>
  );

  // Village icon — people under a roof/hexagon outline
  const VillageIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Roof / pentagon top */}
      <path d="M12 3L4 9v11h16V9L12 3z" />
      {/* Center person (taller) */}
      <circle cx="12" cy="13" r="1.5" />
      <path d="M12 14.5v2.5" />
      {/* Left person */}
      <circle cx="8.5" cy="14" r="1.2" />
      <path d="M8.5 15.2v2" />
      {/* Right person */}
      <circle cx="15.5" cy="14" r="1.2" />
      <path d="M15.5 15.2v2" />
    </svg>
  );

  // Town icon — buildings/storefronts outline
  const TownIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left building */}
      <rect x="2" y="10" width="7" height="11" />
      <path d="M5.5 7L2 10h7L5.5 7z" />
      <rect x="4" y="14" width="3" height="3" />
      {/* Right building (taller) */}
      <rect x="11" y="6" width="7" height="15" />
      <path d="M14.5 3L11 6h7L14.5 3z" />
      <rect x="13" y="10" width="3" height="3" />
      <rect x="13" y="16" width="3" height="5" />
      {/* Flag on right building */}
      <path d="M18 6V3" />
      <path d="M18 3h3" />
    </svg>
  );

  // Japanese Castle icon — pagoda-style tiered roofs
  const CastleIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Base */}
      <rect x="4" y="18" width="16" height="3" />
      {/* Middle tier */}
      <rect x="6" y="13" width="12" height="5" />
      <path d="M4 13h16" />
      {/* Top tier */}
      <rect x="8" y="8" width="8" height="5" />
      <path d="M6 8h12" />
      {/* Top roof peak */}
      <path d="M12 3L8 8" />
      <path d="M12 3l4 5" />
      {/* Spire */}
      <path d="M12 1v2" />
    </svg>
  );

  // Two pine trees icon for The Forest
  const TwoTrees = ({ className }: { className?: string }) => (
    <div className={`inline-flex items-center ${className}`}>
      <TreePine className="h-5 w-5 -mr-1" />
      <TreePine className="h-5 w-5" />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4 pt-20">
      <div className="text-center space-y-16 animate-fade-in max-w-4xl">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-glow">
            Your Powers Await
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            You hold the power to shape your networks and build your world. 
            What will you create?
          </p>
        </div>

        <TooltipProvider>
          <div className="flex flex-col items-center gap-6">
            {/* Top row: YOU, The River, The World */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to={user ? "/profile" : "/auth"} data-tutorial="you">
                      <TreeOfLife className="mr-2 h-5 w-5" />
                      YOU
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set up your profile, friend-trust levels, hosting, and meetup status</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="divine" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to="/the-river" data-tutorial="river">
                      <Waves className="mr-2 h-5 w-5" />
                      THE RIVER
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>See what your friends are up to</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to="/irl-layer" data-tutorial="world">
                      <Globe className="mr-2 h-5 w-5" />
                      THE WORLD
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Claim your hometown. See where other users live in the world. Explore.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Second row: The Forest (under YOU), The Brook (under River), The Strata (under World) */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to="/the-forest" data-tutorial="forest">
                      <TwoTrees className="mr-2" />
                      THE FOREST
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your network of friends and connections</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to="/the-forest?tab=brooks" data-tutorial="brook">
                      <TwoWaves className="mr-2 h-5 w-5" />
                      THE BROOKS
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Private two-person streams with someone special</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to="/settings" data-tutorial="strata">
                      <Layers className="mr-2 h-5 w-5" />
                      THE STRATA
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your settings and preferences</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Third row: The Village, The Town, The Castle */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to="/the-village" data-tutorial="village">
                      <img src={villageIconSrc} alt="Village" className="mr-2 h-5 w-5 invert dark:invert-0 brightness-150 contrast-150" />
                      THE VILLAGE
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Groups and communities</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to="/the-town" data-tutorial="town">
                      <TownIcon className="mr-2 h-5 w-5" />
                      THE TOWN
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Community classifieds — post it, find it, trade it</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    asChild
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Link to="/the-castle" data-tutorial="castle">
                      <CastleIcon className="mr-2 h-5 w-5" />
                      THE CASTLE
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The path to what lies beyond — a glimpse of what's coming</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>

        <div className="flex flex-col items-center gap-2">
          <Link 
            to="/getting-started"
            className="text-foreground/60 hover:text-foreground transition-colors underline underline-offset-4 text-sm"
          >
            Getting Started / FAQ
          </Link>
          <Link 
            to="/install-app"
            className="text-foreground/60 hover:text-foreground transition-colors underline underline-offset-4 text-sm font-bold"
          >
            Install the XCROL App
          </Link>
        </div>
      </div>

      {user && (
        <InviteNotificationModal
          open={showNotification}
          onOpenChange={() => {}}
          onDismiss={dismissNotification}
        />
      )}
    </div>
  );
};

export default Powers;
