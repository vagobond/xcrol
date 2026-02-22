import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Database, Lock, Info, Download, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserSettings } from "./useSettingsData";

interface DataPrivacySectionProps {
  settings: UserSettings;
  onSettingChange: <K extends keyof UserSettings>(setting: K, value: UserSettings[K]) => void;
}

export const DataPrivacySection = ({ settings, onSettingChange }: DataPrivacySectionProps) => {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to export data");
        return;
      }
      const { data, error } = await supabase.functions.invoke("export-user-data");
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xcrol-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const scopes: { id: keyof UserSettings; label: string; description: string }[] = [
    { id: "default_share_email", label: "Share Email Address", description: "Allow apps to see your email by default" },
    { id: "default_share_hometown", label: "Share Hometown Location", description: "Allow apps to see your hometown coordinates" },
    { id: "default_share_connections", label: "Share Friends List", description: "Allow apps to see who you're connected with" },
    { id: "default_share_xcrol", label: "Share Xcrol Entries", description: "Allow apps to read your diary entries" },
  ];

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Data & Privacy Controls
        </CardTitle>
        <CardDescription>
          Control what data third-party apps can access by default when you use "Login with XCROL"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-primary">Your Data, Your Rules</p>
              <p className="text-muted-foreground mt-1">
                These defaults apply when apps request access. You can always override them during authorization,
                and you can revoke access anytime in "Connected Apps" below.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Default OAuth Scope Permissions
          </h4>

          {scopes.map((scope, i) => (
            <div key={scope.id}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={scope.id}>{scope.label}</Label>
                  <p className="text-sm text-muted-foreground">{scope.description}</p>
                </div>
                <Switch
                  id={scope.id}
                  checked={settings[scope.id] as boolean}
                  onCheckedChange={(checked) => onSettingChange(scope.id, checked)}
                />
              </div>
              {i < scopes.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download My Data
          </h4>
          <p className="text-sm text-muted-foreground">
            Export everything XCROL holds about you — profile, diary entries, messages, friends, posts, and more — as a single JSON file.
          </p>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={exporting}
            className="w-full"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating export…
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download My Data
              </>
            )}
          </Button>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Your personal info visibility (birthday, addresses, etc.) is controlled separately on your{" "}
            <Button variant="link" className="h-auto p-0 text-xs text-primary" onClick={() => navigate("/profile")}>
              Profile page
            </Button>
            . Those settings determine what friends at different levels can see.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
