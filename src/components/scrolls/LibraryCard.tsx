import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Eye, Heart } from "lucide-react";
import { format } from "date-fns";
import type { LibraryEntry } from "@/lib/scroll-publish";

export function LibraryCard({ entry }: { entry: LibraryEntry }) {
  const authorHref = entry.author_username ? `/@${entry.author_username}` : `/u/${entry.user_id}`;
  return (
    <Card className="overflow-hidden hover:border-primary/40 transition-colors group">
      <Link to={`/library/${entry.slug}`} className="block">
        <div className="aspect-[4/5] bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
          {entry.cover_image_url ? (
            <img
              src={entry.cover_image_url}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="font-serif text-2xl text-center text-primary/60 italic line-clamp-4">{entry.title}</div>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4 space-y-2">
        <Link to={`/library/${entry.slug}`} className="block">
          <h3 className="font-serif font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {entry.title}
          </h3>
        </Link>
        {entry.blurb && <p className="text-xs text-muted-foreground line-clamp-2">{entry.blurb}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <Link to={authorHref} className="hover:text-foreground truncate">
            {entry.author_display_name ?? entry.author_username ?? "Anonymous"}
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{entry.view_count}</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{entry.reaction_count}</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/70">{format(new Date(entry.published_at), "MMM d, yyyy")}</p>
      </CardContent>
    </Card>
  );
}
