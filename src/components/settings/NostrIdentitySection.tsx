import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Key, Copy, Download, Upload, Loader2, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import * as nip19 from "nostr-tools/nip19";
import { isNostrPublishEnabled, setNostrPublishEnabled } from "@/lib/nostr-publish";

const STORAGE_KEY = "xcrol_nostr_nsec_encrypted";

function encryptNsec(nsec: string): string {
  // Simple obfuscation for localStorage — not truly secure, but keeps the key
  // from being stored in plaintext. A passphrase-based encryption layer can
  // be added later.
  return btoa(nsec);
}

function decryptNsec(encoded: string) {
  try {
    return atob(encoded);
  } catch {
    return "";
  }
}

export function NostrIdentitySection() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [npub, setNpub] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [publishToNostr, setPublishToNostr] = useState(isNostrPublishEnabled());

  // Load existing npub from profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nostr_npub")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.nostr_npub) {
        setNpub(data.nostr_npub);
        setEnabled(true);
      }
    })();
  }, [user]);

  const hasLocalKey = () => !!localStorage.getItem(STORAGE_KEY);

  const saveNpubToProfile = async (npubValue: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ nostr_npub: npubValue })
      .eq("id", user.id);
    if (error) throw error;
  };

  const clearNpubFromProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ nostr_npub: null })
      .eq("id", user.id);
    if (error) throw error;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const sk = generateSecretKey();
      const pk = getPublicKey(sk);
      const npubEncoded = nip19.npubEncode(pk);
      const nsecEncoded = nip19.nsecEncode(sk);

      localStorage.setItem(STORAGE_KEY, encryptNsec(nsecEncoded));
      await saveNpubToProfile(npubEncoded);
      setNpub(npubEncoded);
      toast.success("NOSTR keypair generated! Your private key is stored locally.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate keypair");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importValue.trim()) return;
    setLoading(true);
    try {
      const trimmed = importValue.trim();
      let sk: Uint8Array;

      if (trimmed.startsWith("nsec")) {
        const decoded = nip19.decode(trimmed);
        if (decoded.type !== "nsec") throw new Error("Invalid nsec");
        sk = decoded.data as Uint8Array;
      } else {
        // Assume hex
        sk = new Uint8Array(trimmed.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
      }

      const pk = getPublicKey(sk);
      const npubEncoded = nip19.npubEncode(pk);
      const nsecEncoded = nip19.nsecEncode(sk);

      localStorage.setItem(STORAGE_KEY, encryptNsec(nsecEncoded));
      await saveNpubToProfile(npubEncoded);
      setNpub(npubEncoded);
      setImportValue("");
      setShowImport(false);
      toast.success("NOSTR key imported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Invalid NOSTR private key");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!checked && npub) {
      // Disable: remove npub from profile and clear local key
      try {
        await clearNpubFromProfile();
        localStorage.removeItem(STORAGE_KEY);
        setNpub(null);
        setEnabled(false);
        toast.success("NOSTR identity disabled");
      } catch {
        toast.error("Failed to disable NOSTR identity");
      }
    } else {
      setEnabled(checked);
    }
  };

  const copyNpub = () => {
    if (npub) {
      navigator.clipboard.writeText(npub);
      toast.success("npub copied to clipboard");
    }
  };

  const exportNsec = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const nsec = decryptNsec(stored);
      navigator.clipboard.writeText(nsec);
      toast.success("nsec copied to clipboard — keep it safe!");
    } else {
      toast.error("No local private key found");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          NOSTR Identity
        </CardTitle>
        <CardDescription>
          Connect your profile to the NOSTR decentralized network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="nostr-toggle">Enable NOSTR Identity</Label>
          <Switch
            id="nostr-toggle"
            checked={enabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {enabled && (
          <div className="space-y-4 pt-2">
            {npub ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Your public key (npub)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={npub}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="icon" onClick={copyNpub}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {hasLocalKey() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportNsec}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copy private key (nsec)
                  </Button>
                )}

                {!hasLocalKey() && (
                  <p className="text-xs text-muted-foreground">
                    Private key not found on this device. Import it to sign events.
                  </p>
                )}

                {hasLocalKey() && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="publish-toggle" className="text-sm">
                        Auto-publish Xcrol entries to NOSTR
                      </Label>
                    </div>
                    <Switch
                      id="publish-toggle"
                      checked={publishToNostr}
                      onCheckedChange={(checked) => {
                        setPublishToNostr(checked);
                        setNostrPublishEnabled(checked);
                        toast.success(checked ? "Xcrol entries will be published to NOSTR" : "NOSTR publishing disabled");
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Generate New Keypair
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {showImport ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Paste nsec or hex private key"
                      value={importValue}
                      onChange={(e) => setImportValue(e.target.value)}
                      className="font-mono text-xs"
                      type="password"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleImport}
                        disabled={loading || !importValue.trim()}
                        className="flex-1"
                      >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Import
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowImport(false);
                          setImportValue("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowImport(true)}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Existing Key
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
