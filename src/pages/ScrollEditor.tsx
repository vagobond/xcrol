import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, ArrowUp, ArrowDown, Loader2, Plus, Sparkles, Trash2,
  Download, Eye, BookOpen, ImageIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { downloadScrollExport } from "@/lib/scroll-export";

interface ScrollMeta {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  blurb: string | null;
  cover_image_url: string | null;
}

interface ScrollItem {
  item_id: string;
  item_position: number;
  item_type: "xcrol" | "group_post" | "interlude";
  source_id: string | null;
  chapter_label: string | null;
  custom_title: string | null;
  custom_body: string | null;
  content: string | null;
  link: string | null;
  item_date: string | null;
  group_name: string | null;
  privacy_level: string | null;
}

const ScrollEditor = () => {
  const { scrollId } = useParams<{ scrollId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<ScrollMeta | null>(null);
  const [items, setItems] = useState<ScrollItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [compileOpen, setCompileOpen] = useState(false);
  const [interludeOpen, setInterludeOpen] = useState(false);
  const [interludeText, setInterludeText] = useState("");
  const [interludeTitle, setInterludeTitle] = useState("");

  // compile form
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState(today);
  const [incXcrol, setIncXcrol] = useState(true);
  const [incGroups, setIncGroups] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [exporting, setExporting] = useState<"epub" | "pdf" | null>(null);
  const [coverOk, setCoverOk] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !scrollId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, scrollId]);

  const load = async () => {
    if (!scrollId) return;
    setLoading(true);
    const [{ data: metaRow, error: metaErr }, { data: itemRows, error: itemsErr }] = await Promise.all([
      supabase.from("scrolls").select("id, user_id, title, subtitle, blurb").eq("id", scrollId).maybeSingle(),
      supabase.rpc("get_scroll_contents", { p_scroll_id: scrollId }),
    ]);
    if (metaErr || !metaRow) {
      toast({ title: "Scroll not found", description: metaErr?.message, variant: "destructive" });
      navigate("/scrolls");
      return;
    }
    setMeta(metaRow as ScrollMeta);
    if (itemsErr) {
      toast({ title: "Couldn't load contents", description: itemsErr.message, variant: "destructive" });
    } else {
      setItems((itemRows as ScrollItem[]) || []);
    }
    setLoading(false);
  };

  const saveMeta = async () => {
    if (!meta) return;
    setSaving(true);
    const { error } = await supabase
      .from("scrolls")
      .update({ title: meta.title, subtitle: meta.subtitle, blurb: meta.blurb })
      .eq("id", meta.id);
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  const compile = async () => {
    if (!scrollId) return;
    setCompiling(true);
    const { error } = await supabase.rpc("compile_scroll_draft", {
      p_scroll_id: scrollId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_include_xcrol: incXcrol,
      p_include_groups: incGroups,
    });
    setCompiling(false);
    if (error) {
      toast({ title: "Compile failed", description: error.message, variant: "destructive" });
      return;
    }
    setCompileOpen(false);
    toast({ title: "Draft compiled" });
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx], b = items[j];
    const newItems = [...items];
    newItems[idx] = { ...b, item_position: a.item_position };
    newItems[j] = { ...a, item_position: b.item_position };
    setItems(newItems);
    const [r1, r2] = await Promise.all([
      supabase.from("scroll_items").update({ item_position: b.item_position }).eq("id", a.item_id),
      supabase.from("scroll_items").update({ item_position: a.item_position }).eq("id", b.item_id),
    ]);
    const error = r1.error || r2.error;
    if (error) {
      toast({ title: "Reorder failed", description: error.message, variant: "destructive" });
      load();
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("scroll_items").delete().eq("id", id);
    if (error) toast({ title: "Remove failed", description: error.message, variant: "destructive" });
    else setItems((prev) => prev.filter((i) => i.item_id !== id));
  };

  const updateChapter = async (id: string, label: string) => {
    setItems((prev) => prev.map((i) => i.item_id === id ? { ...i, chapter_label: label } : i));
    await supabase.from("scroll_items").update({ chapter_label: label }).eq("id", id);
  };

  const addInterlude = async () => {
    if (!scrollId || !interludeText.trim()) return;
    const nextPos = items.length > 0 ? Math.max(...items.map((i) => i.item_position)) + 1 : 0;
    const { error } = await supabase.from("scroll_items").insert({
      scroll_id: scrollId,
      item_type: "interlude",
      item_position: nextPos,
      custom_title: interludeTitle.trim() || null,
      custom_body: interludeText.trim(),
    });
    if (error) {
      toast({ title: "Couldn't add", description: error.message, variant: "destructive" });
      return;
    }
    setInterludeOpen(false);
    setInterludeText("");
    setInterludeTitle("");
    load();
  };

  const exportMarkdown = () => {
    if (!meta) return;
    const lines: string[] = [];
    lines.push(`# ${meta.title}`);
    if (meta.subtitle) lines.push(`\n*${meta.subtitle}*`);
    if (meta.blurb) lines.push(`\n${meta.blurb}`);
    lines.push("\n---\n");

    let lastChapter: string | null = null;
    items.forEach((it) => {
      if (it.chapter_label && it.chapter_label !== lastChapter) {
        lines.push(`\n## ${it.chapter_label}\n`);
        lastChapter = it.chapter_label;
      }
      if (it.custom_title) lines.push(`### ${it.custom_title}`);
      if (it.item_date) {
        lines.push(`*${format(new Date(it.item_date), "MMMM d, yyyy")}${it.group_name ? ` — in ${it.group_name}` : ""}*\n`);
      }
      if (it.content) lines.push(it.content);
      if (it.link) lines.push(`\n[${it.link}](${it.link})`);
      lines.push("\n");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <Helmet>
        <title>{meta.title} — Scroll Editor</title>
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/scrolls")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Scrolls
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/scrolls/${scrollId}/read`)}>
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportMarkdown}>Markdown (.md)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  Print / Save as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={meta.subtitle ?? ""} onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })} maxLength={200} />
            </div>
            <div>
              <Label>Blurb</Label>
              <Textarea value={meta.blurb ?? ""} onChange={(e) => setMeta({ ...meta, blurb: e.target.value })} maxLength={1000} rows={3} />
            </div>
            <Button onClick={saveMeta} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save details"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Dialog open={compileOpen} onOpenChange={setCompileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Sparkles className="h-4 w-4 mr-2" /> Auto-compile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Auto-compile from your content</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>From</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>To</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={incXcrol} onCheckedChange={(v) => setIncXcrol(!!v)} />
                  Include my Xcrol entries (incl. River posts)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={incGroups} onCheckedChange={(v) => setIncGroups(!!v)} />
                  Include my group posts
                </label>
                <p className="text-xs text-muted-foreground">
                  Only your own first-party content is added. Items already in this Scroll are skipped.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCompileOpen(false)}>Cancel</Button>
                <Button onClick={compile} disabled={compiling}>
                  {compiling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Compile"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={interludeOpen} onOpenChange={setInterludeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add interlude</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add interlude</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title (optional)</Label>
                  <Input value={interludeTitle} onChange={(e) => setInterludeTitle(e.target.value)} maxLength={120} />
                </div>
                <div>
                  <Label>Text</Label>
                  <Textarea value={interludeText} onChange={(e) => setInterludeText(e.target.value)} rows={6} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInterludeOpen(false)}>Cancel</Button>
                <Button onClick={addInterlude}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Empty Scroll. Auto-compile from a date range or add an interlude to start.
              </CardContent>
            </Card>
          ) : (
            items.map((it, idx) => (
              <Card key={it.item_id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Chapter label"
                      value={it.chapter_label ?? ""}
                      onChange={(e) => setItems((prev) => prev.map((p) => p.item_id === it.item_id ? { ...p, chapter_label: e.target.value } : p))}
                      onBlur={(e) => updateChapter(it.item_id, e.target.value)}
                      className="h-7 text-xs max-w-[180px]"
                    />
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {it.item_type === "xcrol" ? "Xcrol" : it.item_type === "group_post" ? `Group${it.group_name ? ` · ${it.group_name}` : ""}` : "Interlude"}
                    </span>
                    {it.item_date && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(it.item_date), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  {it.custom_title && <div className="font-semibold">{it.custom_title}</div>}
                  <p className="whitespace-pre-wrap text-sm">{it.content}</p>
                  {it.link && (
                    <a href={it.link.startsWith("http") ? it.link : `https://${it.link}`} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                      {it.link}
                    </a>
                  )}
                  <div className="flex gap-1 justify-end pt-2">
                    <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(it.item_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {items.length > 0 && (
          <p className="text-xs text-center text-muted-foreground italic">
            Tip: export to Markdown, then ask ChatGPT or Claude to polish it into a publishable book.
          </p>
        )}
      </div>
    </div>
  );
};

export default ScrollEditor;
