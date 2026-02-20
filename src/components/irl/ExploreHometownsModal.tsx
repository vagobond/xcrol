import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Globe, ChevronRight } from "lucide-react";
import type { HometownGroup, ProfileData } from "./types";

interface ExploreHometownsModalProps {
  allHometownsCount: number;
  sortedHometowns: HometownGroup[];
  expandedHometown: string | null;
  setExpandedHometown: (key: string | null) => void;
  onClose: () => void;
  onExploreClick: (group: HometownGroup) => void;
}

export const ExploreHometownsModal = ({
  allHometownsCount,
  sortedHometowns,
  expandedHometown,
  setExpandedHometown,
  onClose,
  onExploreClick,
}: ExploreHometownsModalProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-primary/20 rounded-lg p-6 max-w-lg w-full space-y-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              Explore Hometowns
            </h2>
            <p className="text-foreground/70 text-sm mt-1">
              {allHometownsCount} Xcroler{allHometownsCount !== 1 ? 's' : ''} across {sortedHometowns.length} location{sortedHometowns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2">
          {sortedHometowns.length === 0 ? (
            <p className="text-foreground/60 text-center py-8">
              No hometowns claimed yet. Be the first!
            </p>
          ) : (
            sortedHometowns.map((group) => {
              const key = `${group.city}-${group.country}`;
              const isExpanded = expandedHometown === key;
              const hasMultiple = group.profiles.length > 1;

              return (
                <div key={key} className="border border-border/50 rounded-lg overflow-hidden">
                  <div
                    onClick={() => {
                      if (hasMultiple) {
                        setExpandedHometown(isExpanded ? null : key);
                      } else {
                        onExploreClick(group);
                      }
                    }}
                    className="flex items-center gap-3 p-3 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold">
                      {group.profiles.length}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{group.city}</p>
                      <p className="text-sm text-foreground/60">{group.country}</p>
                    </div>
                    {hasMultiple ? (
                      <ChevronRight className={`w-5 h-5 text-foreground/60 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExploreClick(group);
                        }}
                        className="text-primary"
                      >
                        View on Map
                      </Button>
                    )}
                  </div>

                  {hasMultiple && isExpanded && (
                    <div className="border-t border-border/50 bg-background/50">
                      <div className="p-2 space-y-1">
                        {group.profiles.map((profile) => (
                          <div
                            key={profile.id}
                            onClick={() => navigate(`/u/${profile.id}`)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 cursor-pointer transition-colors"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(profile.display_name || "A").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">
                              {profile.display_name || "Anonymous Xcroler"}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onExploreClick(group)}
                          className="w-full text-primary"
                        >
                          View on Map
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
