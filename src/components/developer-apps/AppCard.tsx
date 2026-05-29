import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { OAuthApp } from "./types";

interface Props {
  app: OAuthApp;
  onEdit: (app: OAuthApp) => void;
  onDelete: (app: OAuthApp) => void;
}

export default function AppCard({ app, onEdit, onDelete }: Props) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{app.name}</h3>
              {app.is_verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>

            {app.description && (
              <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
            )}

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Client ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  {app.client_id}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(app.client_id, "Client ID")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Secret:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  ••••••••••••••••
                </code>
                <span className="text-xs text-muted-foreground italic">hashed</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-20">Redirects:</span>
                <div className="flex-1">
                  {app.redirect_uris.map((uri, i) => (
                    <code key={i} className="text-xs bg-muted px-2 py-1 rounded block mb-1 truncate">
                      {uri}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Created {format(new Date(app.created_at), "MMM d, yyyy")}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(app)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(app)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
