import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { OAuthApp } from "./types";

interface Props {
  data: { app: OAuthApp; plainSecret: string } | null;
  onClose: () => void;
}

export default function CredentialsDialog({ data, onClose }: Props) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={!!data} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>App Created Successfully!</DialogTitle>
          <DialogDescription>
            Save your client secret now - you won't be able to see it again.
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="space-y-4">
            <div>
              <Label>Client ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded">
                  {data.app.client_id}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(data.app.client_id, "Client ID")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Client Secret</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded break-all">
                  {data.plainSecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(data.plainSecret, "Client Secret")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-destructive mt-1">
                ⚠️ This secret will not be shown again. Save it securely!
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>I've Saved My Credentials</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
