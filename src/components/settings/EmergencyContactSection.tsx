import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Loader2, Save } from "lucide-react";
import type { UserSettings } from "./useSettingsData";

interface Props {
  settings: UserSettings;
  onSettingChange: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export const EmergencyContactSection = ({ settings, onSettingChange }: Props) => {
  const [value, setValue] = useState(settings.emergency_contact ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(settings.emergency_contact ?? "");
  }, [settings.emergency_contact]);

  const dirty = (value || null) !== (settings.emergency_contact || null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSettingChange("emergency_contact", value.trim() ? value.trim() : null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LifeBuoy className="w-5 h-5" />
          Emergency Contact (Private)
        </CardTitle>
        <CardDescription>
          Optional. Only you can see this. If a Hearth Surf stay is flagged for safety,
          XCROL admins may use this to reach your next-of-kin. Never shown to other users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="emergency-contact">Name, relationship, and how to reach them</Label>
          <Textarea
            id="emergency-contact"
            placeholder={"e.g. Jane Doe (sister) — +1 555 0100 — jane@example.com"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
        <Button onClick={handleSave} disabled={!dirty || saving} className="w-full">
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Emergency Contact
        </Button>
      </CardContent>
    </Card>
  );
};
