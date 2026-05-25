import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Copy, EyeOff, Check } from "lucide-react";
import {
  listScrollPublications,
  unpublishPublication,
  publicationUrl,
  type Publication,
} from "@/lib/scroll-publish";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  scrollId: string;
  refreshKey?: number;
}

export function PublicationsList({ scrollId, refreshKey = 0 }: Props) {
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPubs(await listScrollPublications(scrollId));
    } catch (e) {
      toast({ title: "Couldn't load publications", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [scrollId, refreshKey]);

  const unpub = async (id: string) => {
    if (!confirm("Unpublish this snapshot? The public link will stop working.")) return;
    try {
      await unpublishPublication(id);
      toast({ title: "Unpublished" });
      load();
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const copy = async (slug: string, id: string) => {
    await navigator.clipboard.writeText(publicationUrl(slug));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) {
    return <div className="text-center p-4"><Loader2 className="h-4 w-4 animate-spin inline" /></div>;
  }
  if (pubs.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          No publications yet. Publish this Scroll to share it.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Publications</h3>
      {pubs.map((p) => {
        const live = !p.unpublished_at;
        return (
          <Card key={p.id} className={live ? "" : "opacity-60"}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={p.visibility === "public" ? "default" : "secondary"}>{p.visibility}</Badge>
                  {!live && <Badge variant="outline">Unpublished</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(p.published_at), "MMM d, yyyy")} · {p.view_count} views
                  </span>
                </div>
                <code className="text-xs text-muted-foreground truncate block mt-1">/library/{p.slug}</code>
              </div>
              {live && (
                <>
                  <Button size="icon" variant="ghost" onClick={() => copy(p.slug, p.id)} title="Copy link">
                    {copiedId === p.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" asChild title="Open">
                    <a href={`/library/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => unpub(p.id)} title="Unpublish">
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
