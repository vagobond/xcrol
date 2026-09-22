import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";

// The Castle Library is signup-gated (CD, 2026-08-28): anonymous visitors may
// read a publication's free preview (the front matter, extended to roughly an
// introduction's worth of text for entry-style scrolls); the rest requires a
// free Xcrol account. Gate copy is CD's, verbatim — don't reword it. The
// popup pitches on arrival; the inline panel holds the line where the free
// preview ends. Bot link-previews are unaffected — the worker serves those.

// CD's prompt (2026-08-28). "To read the rest" on a gated book; the library
// shelf variant swaps the first clause.
const GATE_PITCH = "It's free. No ads. No algorithms. No data collection. Real people.";

// WTF is Baoism exists in four translated editions (2026-09-22). A reader who
// hits the gate in a language they don't read has no way to discover them, so
// the gate lists the others underneath — in each language's own script, which
// is the only form a non-English reader can actually recognise. The English
// gate copy above is CD's verbatim and is deliberately left untouched.
// `match` is the parenthetical the scroll title carries, e.g. "(Hindi)".
// English is the unsuffixed edition, so it matches on nothing.
const BAOISM_EDITIONS = [
  { slug: "wtf-is-baoism-d58a33", label: "English", match: null },
  { slug: "wtf-is-baoism-hindi-d407d1", label: "हिन्दी", match: "(Hindi)" },
  { slug: "wtf-is-baoism-chinese-3a9806", label: "中文", match: "(Chinese)" },
  { slug: "wtf-is-baoism-japanese-cb97b7", label: "日本語", match: "(Japanese)" },
  { slug: "wtf-is-baoism-thai-e87701", label: "ไทย", match: "(Thai)" },
];

// Only this one book is translated, so the picker is scoped to it rather than
// shown on every gated scroll.
function isBaoism(title?: string): boolean {
  return !!title && title.toLowerCase().includes("wtf is baoism");
}

function OtherLanguages({ bookTitle }: { bookTitle?: string }) {
  if (!isBaoism(bookTitle)) return null;
  const title = bookTitle ?? "";
  // Which edition is the reader in? A translated title ends with its
  // parenthetical; anything else is the English edition.
  const current =
    BAOISM_EDITIONS.find((e) => e.match && title.includes(e.match)) ??
    BAOISM_EDITIONS[0];
  const others = BAOISM_EDITIONS.filter((e) => e.slug !== current.slug);
  if (!others.length) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Also in{" "}
      {others.map((e, i) => (
        <span key={e.slug}>
          {i > 0 && " · "}
          <Link to={`/library/${e.slug}`} className="underline hover:text-foreground">
            {e.label}
          </Link>
        </span>
      ))}
    </p>
  );
}

function useAuthHref(): string {
  const location = useLocation();
  return `/auth?returnUrl=${encodeURIComponent(location.pathname + location.search)}`;
}

function GateButtons() {
  const href = useAuthHref();
  return (
    <div className="flex flex-col gap-2 w-full">
      <Button asChild size="lg">
        <Link to={href}>Sign up — it's free</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to={href}>Log in</Link>
      </Button>
    </div>
  );
}

export function CastleGateDialog({
  open,
  onOpenChange,
  bookTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-center">
            {bookTitle ?? "The Castle Library"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {bookTitle
              ? "To read the rest you need to sign up or log in to Xcrol."
              : "To read the books you need to sign up or log in to Xcrol."}{" "}
            {GATE_PITCH}
          </DialogDescription>
        </DialogHeader>
        <GateButtons />
        <div className="text-center"><OtherLanguages bookTitle={bookTitle} /></div>
      </DialogContent>
    </Dialog>
  );
}

export function CastleGatePanel({ bookTitle }: { bookTitle?: string }) {
  return (
    <div className="not-prose my-12 rounded-lg border border-primary/30 bg-primary/5 p-8 text-center space-y-4">
      <div className="flex justify-center"><BookOpen className="h-8 w-8 text-primary" /></div>
      <h3 className="font-serif text-xl font-semibold">
        To read the rest you need to sign up or log in to Xcrol
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{GATE_PITCH}</p>
      <div className="max-w-xs mx-auto"><GateButtons /></div>
      <OtherLanguages bookTitle={bookTitle} />
    </div>
  );
}
