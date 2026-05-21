import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ScrollMeta {
  id: string;
  title: string;
  subtitle: string | null;
  blurb: string | null;
}

interface ScrollItem {
  item_id: string;
  item_position: number;
  item_type: "xcrol" | "group_post" | "interlude";
  chapter_label: string | null;
  custom_title: string | null;
  content: string | null;
  link: string | null;
  item_date: string | null;
  group_name: string | null;
}

const ScrollReader = () => {
  const { scrollId } = useParams<{ scrollId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<ScrollMeta | null>(null);
  const [items, setItems] = useState<ScrollItem[]>([]);

  useEffect(() => {
    if (authLoading || !user || !scrollId) return;
    (async () => {
      const [m, c] = await Promise.all([
        supabase.from("scrolls").select("id, title, subtitle, blurb").eq("id", scrollId).maybeSingle(),
        supabase.rpc("get_scroll_contents", { p_scroll_id: scrollId }),
      ]);
      if (m.data) setMeta(m.data as ScrollMeta);
      if (c.data) setItems(c.data as ScrollItem[]);
      setLoading(false);
    })();
  }, [user, authLoading, scrollId]);

  if (authLoading || loading || !meta) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  let lastChapter: string | null = null;

  return (
    <div className="min-h-screen bg-background pt-20 pb-16 px-4 print:pt-4">
      <Helmet>
        <title>{meta.title}</title>
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <div className="print:hidden mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/scrolls/${scrollId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to editor
          </Button>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <header className="text-center mb-12 not-prose">
            <h1 className="text-4xl font-bold mb-2">{meta.title}</h1>
            {meta.subtitle && <p className="text-lg italic text-muted-foreground">{meta.subtitle}</p>}
            {meta.blurb && <p className="mt-6 text-muted-foreground max-w-xl mx-auto">{meta.blurb}</p>}
          </header>

          {items.map((it) => {
            const showChapter = it.chapter_label && it.chapter_label !== lastChapter;
            if (showChapter) lastChapter = it.chapter_label;
            return (
              <section key={it.item_id} className="mb-8">
                {showChapter && <h2 className="mt-12 mb-6 text-2xl font-semibold border-b pb-2">{it.chapter_label}</h2>}
                {it.custom_title && <h3 className="text-xl font-semibold">{it.custom_title}</h3>}
                {it.item_date && (
                  <p className="text-xs italic text-muted-foreground mb-2">
                    {format(new Date(it.item_date), "MMMM d, yyyy")}
                    {it.group_name ? ` — in ${it.group_name}` : ""}
                  </p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{it.content}</p>
                {it.link && (
                  <p className="text-sm">
                    <a href={it.link.startsWith("http") ? it.link : `https://${it.link}`} target="_blank" rel="noreferrer">
                      {it.link}
                    </a>
                  </p>
                )}
              </section>
            );
          })}
        </article>
      </div>
    </div>
  );
};

export default ScrollReader;
