import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Mail, MessageCircle, Send, Link2 } from "lucide-react";
import { toast } from "sonner";

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  /** Plain-text snippet to seed the share message (will be truncated). */
  snippet?: string;
  /** Author display label included in share text, e.g. "Sara on XCROL". */
  authorLabel?: string;
}

// Canonical, human-readable URL. Kept on the xcrol.com domain so links look
// trustworthy when shared. Rich previews fall back to the SPA card; platforms
// that scrape JS will pick up route-level meta when available.
const buildShareUrl = (postId: string) => `https://xcrol.com/post/${postId}`;

export function SharePostDialog({
  open,
  onOpenChange,
  postId,
  snippet,
  authorLabel,
}: SharePostDialogProps) {
  const url = buildShareUrl(postId);
  const cleanSnippet = (snippet ?? "").replace(/\s+/g, " ").trim();
  const shortSnippet =
    cleanSnippet.length > 120 ? cleanSnippet.slice(0, 117) + "…" : cleanSnippet;
  const shareText = shortSnippet
    ? `${authorLabel ? `${authorLabel}: ` : ""}"${shortSnippet}"`
    : authorLabel
    ? `${authorLabel} on XCROL`
    : "From XCROL";

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "XCROL", text: shareText, url });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  const platforms: Array<{
    label: string;
    href: string;
    className?: string;
  }> = [
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent("From XCROL")}&body=${encodedText}%0A%0A${encodedUrl}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Share this post
          </DialogTitle>
          <DialogDescription>
            Send a link to friends or post it to your favorite platform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input value={url} readOnly className="flex-1" />
          <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          {platforms.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              {p.label === "Email" ? (
                <Mail className="h-4 w-4" />
              ) : p.label === "WhatsApp" || p.label === "Telegram" ? (
                <Send className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              {p.label}
            </a>
          ))}
        </div>

        {typeof navigator !== "undefined" && (navigator as any).share ? (
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={handleNativeShare}
          >
            More sharing options…
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
