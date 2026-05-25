import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { listAuthorPublications, type Publication } from "@/lib/scroll-publish";
import { format } from "date-fns";

export function AuthorPublications({ userId }: { userId: string }) {
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAuthorPublications(userId).then((p) => { setPubs(p); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  if (loading || pubs.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <ScrollText className="h-4 w-4" /> Scrolls
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {pubs.map((p) => (
            <Link
              key={p.id}
              to={`/library/${p.slug}`}
              className="group block rounded border border-border overflow-hidden hover:border-primary/40 transition-colors"
            >
              <div className="aspect-[4/5] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 font-serif text-center text-sm italic text-primary/60 line-clamp-4">
                    {p.title}
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="font-serif text-sm line-clamp-2 group-hover:text-primary transition-colors">{p.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {format(new Date(p.published_at), "MMM yyyy")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
