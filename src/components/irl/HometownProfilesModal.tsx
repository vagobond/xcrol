import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import type { HometownGroup } from "./types";

interface HometownProfilesModalProps {
  hometown: HometownGroup;
  onClose: () => void;
}

export const HometownProfilesModal = ({ hometown, onClose }: HometownProfilesModalProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-primary/20 rounded-lg p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{hometown.city}</h2>
            <p className="text-foreground/70">{hometown.country}</p>
            <p className="text-sm text-primary mt-1">
              {hometown.profiles.length} Xcroler{hometown.profiles.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3">
          {hometown.profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => navigate(`/u/${profile.id}`)}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>
                  {(profile.display_name || "A").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {profile.display_name || "Anonymous Xcroler"}
                </p>
                {profile.hometown_description && (
                  <p className="text-sm text-foreground/60 italic mt-1">
                    "{profile.hometown_description}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
