import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Loader2, Save } from "lucide-react";
import { HostingPreferences, ACCOMMODATION_TYPES, COMPENSATION_TYPES } from "./types";

interface Props {
  preferences: HostingPreferences;
  setPreferences: (p: HostingPreferences) => void;
  saving: boolean;
  onSave: () => void;
}

export default function MySpaceTab({ preferences, setPreferences, saving, onSave }: Props) {
  const toggleCompensation = (value: string) => {
    const current = preferences.compensation_type_preferred;
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setPreferences({ ...preferences, compensation_type_preferred: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Your Hosting Space
        </CardTitle>
        <CardDescription>Configure what you offer to travelers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="hosting-toggle">Open to Hosting</Label>
            <p className="text-sm text-muted-foreground">Allow friends to request to stay with you</p>
          </div>
          <Switch
            id="hosting-toggle"
            checked={preferences.is_open_to_hosting}
            onCheckedChange={(checked) => setPreferences({ ...preferences, is_open_to_hosting: checked })}
          />
        </div>

        {preferences.is_open_to_hosting && (
          <>
            <div className="space-y-2">
              <Label>Who can request hosting?</Label>
              <Select
                value={preferences.min_friendship_level}
                onValueChange={(value) => setPreferences({ ...preferences, min_friendship_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly_acquaintance">Wayfarers (Acquaintances) & Above</SelectItem>
                  <SelectItem value="buddy">Companions (Buddies) & Above</SelectItem>
                  <SelectItem value="close_friend">Oath Bound (Close Friends) Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Accommodation Type</Label>
              <Select
                value={preferences.accommodation_type || ""}
                onValueChange={(value) => setPreferences({ ...preferences, accommodation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select accommodation type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOMMODATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Maximum Guests</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={preferences.max_guests}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    max_guests: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                  })
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Compensation Types Preferred</Label>
              <p className="text-xs text-muted-foreground">
                Select all forms of appreciation you're open to (leave all unchecked for no preference)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {COMPENSATION_TYPES.filter((t) => t.value !== "none").map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`comp-${type.value}`}
                      checked={preferences.compensation_type_preferred.includes(type.value)}
                      onCheckedChange={() => toggleCompensation(type.value)}
                    />
                    <label
                      htmlFor={`comp-${type.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Describe your hosting situation</Label>
              <Textarea
                placeholder="e.g., I have a spare room with a comfortable bed, shared bathroom. Quiet neighborhood, close to public transit. Pets in the house. Kitchen access available..."
                value={preferences.hosting_description || ""}
                onChange={(e) => setPreferences({ ...preferences, hosting_description: e.target.value })}
                rows={4}
              />
            </div>
          </>
        )}

        <Button onClick={onSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Hosting Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
