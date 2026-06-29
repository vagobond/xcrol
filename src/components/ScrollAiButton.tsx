import { useState } from "react";
import { Sparkles, Loader2, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { runScrollAi, ScrollAiError } from "@/lib/scroll-ai";
import { hasByokKey } from "@/lib/scroll-ai-keystore";
import type {
  ScrollAiAction, ScrollContextForAi, ScrollItemForAi,
} from "@/lib/scroll-ai-prompts";

type Props = {
  label?: string;
  action: ScrollAiAction;
  /** Builds the AI context lazily, so editor changes are picked up at click time. */
  getContext: () => ScrollContextForAi;
  /** For polish_interlude */
  interludeText?: string;
  scrollId: string;
  /** Called when the user accepts a candidate. For chapters: assignments map. */
  onAccept: (result: AcceptPayload) => void;
  size?: "sm" | "icon" | "default";
  variant?: "ghost" | "outline" | "secondary";
};

export type AcceptPayload =
  | { kind: "title" | "blurb"; value: string }
  | { kind: "chapters"; assignments: { item_id: string; chapter_label: string }[] }
  | { kind: "interlude"; polished: string };

export function ScrollAiButton({
  label, action, getContext, interludeText, scrollId, onAccept,
  size = "sm", variant = "outline",
}: Props) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<{ item_id: string; chapter_label: string }[]>([]);
  const [polished, setPolished] = useState("");

  const run = async () => {
    if (!(await hasByokKey())) {
      toast({
        title: "AI key needed",
        description: "Add your AI provider key in Settings, or wait for Wayfarer+ (coming soon).",
        action: (
          <ToastAction altText="Open settings" onClick={() => navigate("/settings#ai-assistance")}>
            Open settings
          </ToastAction>
        ),
      });
      return;
    }
    setBusy(true);
    try {
      const ctx = getContext();
      const res = await runScrollAi(scrollId, action, ctx, { interludeText });
      switch (res.kind) {
        case "title":
        case "blurb":
          setCandidates(res.candidates);
          setOpen(true);
          break;
        case "chapters":
          setAssignments(res.assignments);
          setOpen(true);
          break;
        case "interlude":
          setPolished(res.polished);
          setOpen(true);
          break;
      }
    } catch (e) {
      const msg = e instanceof ScrollAiError
        ? e.message
        : e instanceof Error ? e.message : "Couldn't reach the AI.";
      toast({ title: "AI request failed", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const accept = (payload: AcceptPayload) => {
    onAccept(payload);
    setOpen(false);
  };

  return (
    <>
      <Button onClick={run} disabled={busy} size={size} variant={variant} type="button">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {label && <span className="ml-1">{label}</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {action === "suggest_title" && "Title suggestions"}
              {action === "suggest_blurb" && "Blurb suggestions"}
              {action === "suggest_chapters" && "Chapter suggestions"}
              {action === "polish_interlude" && "Polished interlude"}
            </DialogTitle>
            <DialogDescription>
              <Link to="/scrolls/ai-setup" className="text-xs inline-flex items-center gap-1 text-primary hover:underline">
                <HelpCircle className="h-3 w-3" /> How does this work?
              </Link>
            </DialogDescription>
          </DialogHeader>

          {(action === "suggest_title" || action === "suggest_blurb") && (
            <div className="space-y-2">
              {candidates.map((c, i) => (
                <button
                  key={i}
                  className="w-full text-left p-3 rounded border border-border hover:bg-accent transition"
                  onClick={() => accept({ kind: action === "suggest_title" ? "title" : "blurb", value: c })}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {action === "suggest_chapters" && (
            <div className="space-y-1 max-h-72 overflow-auto text-sm">
              {assignments.map((a) => (
                <div key={a.item_id} className="flex gap-2 p-2 border-b border-border last:border-0">
                  <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0">{a.item_id.slice(0, 6)}</span>
                  <span className="font-medium">{a.chapter_label}</span>
                </div>
              ))}
              <DialogFooter className="pt-3">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => accept({ kind: "chapters", assignments })}>Apply to all</Button>
              </DialogFooter>
            </div>
          )}

          {action === "polish_interlude" && (
            <div className="space-y-3">
              <Textarea value={polished} onChange={(e) => setPolished(e.target.value)} rows={8} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => accept({ kind: "interlude", polished })}>Replace interlude</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function toAiItems(items: Array<{
  item_id: string;
  item_type: "xcrol" | "group_post" | "interlude";
  item_date: string | null;
  group_name: string | null;
  content: string | null;
  custom_title: string | null;
  chapter_label: string | null;
}>): ScrollItemForAi[] {
  return items.map((i) => ({
    item_id: i.item_id,
    item_type: i.item_type,
    item_date: i.item_date,
    group_name: i.group_name,
    content: i.content,
    custom_title: i.custom_title,
    chapter_label: i.chapter_label,
  }));
}
