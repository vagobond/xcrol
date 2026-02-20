import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ClaimHometownModalProps {
  selectedLocation: { lng: number; lat: number; city: string; country: string };
  hometownDescription: string;
  setHometownDescription: (val: string) => void;
  onClaim: () => void;
  onCancel: () => void;
}

export const ClaimHometownModal = ({
  selectedLocation,
  hometownDescription,
  setHometownDescription,
  onClaim,
  onCancel,
}: ClaimHometownModalProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-primary/20 rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-2xl font-bold">Claim {selectedLocation.city}</h2>
        <p className="text-foreground/70">
          {selectedLocation.city}, {selectedLocation.country}
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium">Why I love my hometown</label>
          <Textarea
            value={hometownDescription}
            onChange={(e) => setHometownDescription(e.target.value)}
            placeholder="Tell other Xcrolers what you love about your hometown"
            className="min-h-[120px]"
          />
        </div>
        <div className="flex gap-3">
          <Button onClick={onClaim} variant="mystical" className="flex-1">
            Claim Hometown
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
