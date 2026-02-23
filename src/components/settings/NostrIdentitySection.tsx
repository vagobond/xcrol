import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Copy, Download, Upload, Loader2, Radio, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import * as nip19 from "nostr-tools/nip19";
import { isNostrPublishEnabled, setNostrPublishEnabled, isBrookBridgeEnabled, setBrookBridgeEnabled } from "@/lib/nostr-publish";
import { storeSecretKey, getSecretKey, hasLocalKey as checkHasLocalKey, deleteSecretKey } from "@/lib/nostr-keystore";

export function NostrIdentitySection() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [npub, setNpub] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [importValue, setImportValue] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [publishToNostr, setPublishToNostr] = useState(isNostrPublishEnabled());
  const [brookBridge, setBrookBridge] = useState(isBrookBridgeEnabled());
  const [localKeyExists, setLocalKeyExists] = useState(false);
  const [nostrHandle, setNostrHandle] = useState("");
  const [savingHandle, setSavingHandle] = useState(false);

  // Load existing npub and handle from profile
  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("nostr_npub, nostr_handle")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.nostr_npub) {
          setNpub(data.nostr_npub);
          setEnabled(true);
        }
        if (data?.nostr_handle) {
          setNostrHandle(data.nostr_handle);
        }
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [user]);

  // Check if local key exists (async)
  useEffect(() => {
    checkHasLocalKey().then(setLocalKeyExists);
  }, [npub]);

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
      // Clear any existing key material first to guarantee a fresh keypair
      await deleteSecretKey();

      const sk = generateSecretKey();
      const pk = getPublicKey(sk);
      const npubEncoded = nip19.npubEncode(pk);

      await storeSecretKey(sk);
      await saveNpubToProfile(npubEncoded);
      setNpub(npubEncoded);
      setLocalKeyExists(true);
      toast.success("NOSTR keypair generated! Private key stored securely in this browser.");
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
        sk = new Uint8Array(trimmed.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
      }

      const pk = getPublicKey(sk);
      const npubEncoded = nip19.npubEncode(pk);

      await storeSecretKey(sk);
      await saveNpubToProfile(npubEncoded);
      setNpub(npubEncoded);
      setLocalKeyExists(true);
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
      try {
        await clearNpubFromProfile();
        await deleteSecretKey();
        setNpub(null);
        setEnabled(false);
        setLocalKeyExists(false);
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

  const exportNsec = async () => {
    try {
      const sk = await getSecretKey();
      if (sk) {
        const nsecEncoded = nip19.nsecEncode(sk);
        await navigator.clipboard.writeText(nsecEncoded);
        toast.success("nsec copied to clipboard — keep it safe!");
      } else {
        toast.error("No local private key found");
      }
    } catch (err) {
      console.error("Clipboard write failed:", err);
      // Fallback: show nsec in a prompt so user can manually copy
      const sk = await getSecretKey();
      if (sk) {
        const nsecEncoded = nip19.nsecEncode(sk);
        window.prompt("Copy your nsec (private key):", nsecEncoded);
      } else {
        toast.error("No local private key found");
      }
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
          {profileLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              id="nostr-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
            />
          )}
        </div>

        {enabled && (
          <div className="space-y-4 pt-2">
            <Alert variant="default" className="border-amber-500/40 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                Your private key is encrypted and stored in this browser's local database.
                Clearing browser data, resetting the browser, or switching devices will
                <strong> permanently delete</strong> it. Export your nsec and back it up safely.
              </AlertDescription>
            </Alert>

            {npub ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Your public key (npub)</Label>
                  <div className="flex gap-2">
                    <Input value={npub} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={copyNpub}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {localKeyExists && (
                  <Button variant="outline" size="sm" onClick={exportNsec} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Copy private key (nsec)
                  </Button>
                )}

                {!localKeyExists && (
                  <p className="text-xs text-muted-foreground">
                    Private key not found on this device. Import it to sign events.
                  </p>
                )}

                {localKeyExists && (
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

                {localKeyExists && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="brook-bridge-toggle" className="text-sm">
                        Bridge Brook posts to NOSTR (NIP-17 DM)
                      </Label>
                    </div>
                    <Switch
                      id="brook-bridge-toggle"
                      checked={brookBridge}
                      onCheckedChange={(checked) => {
                        setBrookBridge(checked);
                        setBrookBridgeEnabled(checked);
                        toast.success(checked ? "Brook posts will be bridged via NIP-17" : "Brook bridge disabled");
                      }}
                    />
                  </div>
                )}

                {/* NIP-05 Handle */}
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="nostr-handle" className="text-sm">
                    NOSTR Handle (e.g., cd for cd@xcrol.com)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="nostr-handle"
                      placeholder="yourhandle"
                      value={nostrHandle}
                      onChange={(e) => setNostrHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={savingHandle}
                      onClick={async () => {
                        if (!user) return;
                        setSavingHandle(true);
                        try {
                          const { error } = await supabase
                            .from("profiles")
                            .update({ nostr_handle: nostrHandle || null })
                            .eq("id", user.id);
                          if (error) throw error;
                          toast.success("NOSTR handle saved");
                        } catch {
                          toast.error("Failed to save handle");
                        } finally {
                          setSavingHandle(false);
                        }
                      }}
                    >
                      {savingHandle ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This enables @{nostrHandle || "yourhandle"}@xcrol.com discovery on NOSTR. Changes take effect within minutes after saving.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
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
                      <Button onClick={handleImport} disabled={loading || !importValue.trim()} className="flex-1">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Import
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowImport(false); setImportValue(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setShowImport(true)} className="w-full">
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
