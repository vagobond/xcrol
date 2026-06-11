import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Trash2, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  type ByokProvider,
  PROVIDER_LABELS,
  PROVIDER_DEFAULT_MODELS,
  storeByokKey,
  getByokConfig,
  hasByokKey,
  deleteByokKey,
} from "@/lib/scroll-ai-keystore";
import { testByokKey } from "@/lib/scroll-ai-byok";

export function AiAssistanceSection() {
  const [provider, setProvider] = useState<ByokProvider>("openrouter");
  const [model, setModel] = useState(PROVIDER_DEFAULT_MODELS.openrouter);
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const has = await hasByokKey();
      setHasKey(has);
      if (has) {
        const cfg = await getByokConfig();
        if (cfg) {
          setProvider(cfg.provider);
          setModel(cfg.model);
        }
      }
    })();
  }, []);

  const onProviderChange = (p: ByokProvider) => {
    setProvider(p);
    setModel(PROVIDER_DEFAULT_MODELS[p]);
  };

  const onTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    const ok = await testByokKey(provider, apiKey.trim());
    setTesting(false);
    if (ok) toast.success("Key works");
    else toast.error("That key didn't authenticate. Check it and try again.");
  };

  const onSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await storeByokKey(apiKey.trim(), { provider, model: model.trim() || PROVIDER_DEFAULT_MODELS[provider] });
      setApiKey("");
      setHasKey(true);
      toast.success("AI key saved on this device");
    } catch {
      toast.error("Couldn't save the key");
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    await deleteByokKey();
    setHasKey(false);
    setApiKey("");
    toast.success("AI key removed from this device");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Assistance for Scrolls
          {hasKey && <Badge variant="secondary" className="ml-2">BYOK active</Badge>}
        </CardTitle>
        <CardDescription>
          Help with titles, blurbs, chapter labels and polishing your interludes. Xcrol never rewrites your
          original posts.{" "}
          <Link to="/scrolls/ai-setup" className="text-primary hover:underline">
            Read the setup guide
          </Link>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your provider key is encrypted and kept only in this browser. Xcrol servers never see it.
            Clearing browser data removes the key.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Provider</Label>
            <Select value={provider} onValueChange={(v) => onProviderChange(v as ByokProvider)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVIDER_LABELS) as ByokProvider[]).map((p) => (
                  <SelectItem key={p} value={p}>{PROVIDER_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">
            API key {hasKey && <span className="text-muted-foreground">(a key is already saved — paste a new one to replace it)</span>}
          </Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "•••••••••••• (saved)" : "Paste your provider API key"}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onTest} disabled={!apiKey.trim() || testing}>
            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Test connection
          </Button>
          <Button size="sm" onClick={onSave} disabled={!apiKey.trim() || saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save key
          </Button>
          {hasKey && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="w-4 h-4 mr-2" /> Remove key
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/scrolls/ai-setup">
              <ExternalLink className="w-4 h-4 mr-2" /> Where do I get a key?
            </Link>
          </Button>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Prefer not to manage keys? <span className="font-medium">Xcrol AI</span> (no key needed) is coming
            with Wayfarer+ memberships.{" "}
            <Badge variant="outline" className="ml-1">Coming soon</Badge>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
