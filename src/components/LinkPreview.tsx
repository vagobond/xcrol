import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Play, Globe } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { StoredPreview } from "@/lib/link-preview-store";

interface LinkPreviewData {
  type: "pixelfed" | "peertube" | "generic" | "unknown";
  title?: string;
  description?: string;
  image_url?: string;
  video_embed_url?: string;
  duration?: number;
  site_name?: string;
  favicon_url?: string;
  original_url: string;
}

interface LinkPreviewProps {
  url: string;
  /**
   * Preview data already stored on the entry row. When present, it renders
   * directly and NO edge call is made — this is the path virtually every
   * render takes, and it is why The River no longer burns the link-preview
   * rate limit (30/min/IP) on every page view.
   *
   * Pass `undefined` (not null) for callers that have no stored data at all
   * (compose previews); pass the row's fields for entries. A row whose link
   * predates stored previews has a link but a null `preview_type`, and falls
   * back to fetching once.
   */
  stored?: StoredPreview | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isPreviewableUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * xcrol.com is https, so browsers upgrade an <img src="http://…"> to https —
 * and a host without TLS (e.g. a self-hosted image) then fails to load. Send
 * plain-http images through the image-proxy function, which relays them over
 * https. https images load directly.
 */
function displayImageSrc(src: string): string {
  if (!/^http:\/\//i.test(src)) return src;
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(src)}`;
}

/**
 * Instagram post/reel links → Instagram's own public embed page.
 *
 * Instagram login-walls server-side fetches (Xcrol's edge function gets a
 * redirect to /accounts/login/ with no OG tags), so a scraped preview can
 * never work. The embed page is what Instagram publishes for sharing a post
 * anywhere; loaded in the reader's own browser it needs no app or token.
 * Profile, story and share-sheet links have no embed and stay plain links.
 */
function instagramEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "instagram.com") return null;
    const m = u.pathname.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    if (!m) return null;
    const kind = m[1] === "reels" ? "reel" : m[1];
    return `https://www.instagram.com/${kind}/${m[2]}/embed/captioned/`;
  } catch {
    return null;
  }
}

/** Instagram's embed iframe, resized from the MEASURE messages it posts. */
function InstagramEmbed({ src }: { src: string }) {
  const [height, setHeight] = useState(640);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.instagram.com") return;
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        const h = msg?.type === "MEASURE" ? Number(msg?.details?.height) : NaN;
        if (h > 100 && h < 3000) setHeight(Math.ceil(h));
      } catch { /* not ours */ }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-border bg-background">
      <iframe
        src={src}
        className="w-full border-0 block"
        style={{ height }}
        loading="lazy"
        scrolling="no"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Instagram post"
      />
    </div>
  );
}

/** Stored row fields → the shape the renderers below already expect. */
function fromStored(stored: StoredPreview, url: string): LinkPreviewData | null {
  if (!stored.preview_type) return null;
  return {
    type: stored.preview_type,
    title: stored.preview_title ?? undefined,
    description: stored.preview_description ?? undefined,
    image_url: stored.preview_image_url ?? undefined,
    site_name: stored.preview_site_name ?? undefined,
    favicon_url: stored.preview_favicon_url ?? undefined,
    // Video embeds are resolved at click time from the original url; the
    // stored row deliberately keeps no iframe src.
    video_embed_url: undefined,
    original_url: url,
  };
}

export const LinkPreview = ({ url, stored }: LinkPreviewProps) => {
  // Wait for the session to load so logged-in requests carry the user's
  // token, but fetch either way: the edge function serves anonymous viewers
  // previews for links that appear in public entries.
  const { loading: authLoading } = useAuth();
  const storedData = stored ? fromStored(stored, url) : null;
  // A caller that passed stored fields has already resolved this link — even
  // a null result means "nothing to show", so never fetch for it.
  const useStored = stored !== undefined;
  const [data, setData] = useState<LinkPreviewData | null>(storedData);
  const [loading, setLoading] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const igEmbed = instagramEmbedUrl(url);

  useEffect(() => {
    // Instagram renders from its own embed page; nothing to resolve.
    if (igEmbed) return;
    if (useStored) {
      // Stored path: render what the row carries, make no network call.
      setData(storedData);
      setLoading(false);
      return;
    }
    if (authLoading) return;
    if (!url || !isPreviewableUrl(url)) return;

    let cancelled = false;
    setLoading(true);

    supabase.functions
      .invoke("link-preview", { body: { url } })
      .then(({ data: result, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Link preview error:", error);
          setData(null);
        } else if (result?.type && result.type !== "unknown") {
          setData(result as LinkPreviewData);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
    // storedData is derived from `stored`; keying on the type + url is enough
    // to re-render when the row's preview changes.
  }, [url, igEmbed, authLoading, useStored, stored?.preview_type, stored?.preview_image_url]);

  if (igEmbed) return <InstagramEmbed src={igEmbed} />;

  if (!isPreviewableUrl(url) || loading || !data) {
    return null;
  }

  // PixelFed: inline image
  if (data.type === "pixelfed" && data.image_url) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-border">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={displayImageSrc(data.image_url)}
            alt={data.title || "PixelFed image"}
            className="w-full max-h-[400px] object-cover"
            loading="lazy"
          />
        </a>
        {data.title && (
          <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground truncate">
            {data.title}
          </div>
        )}
      </div>
    );
  }

  // PeerTube: thumbnail with play button, click to embed or open
  if (data.type === "peertube") {
    if (showEmbed && data.video_embed_url) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-border">
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={data.video_embed_url}
              className="w-full h-full"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups"
              title={data.title || "PeerTube video"}
            />
          </AspectRatio>
        </div>
      );
    }

    return (
      <div
        className="mt-2 rounded-lg overflow-hidden border border-border cursor-pointer group relative"
        onClick={() => {
          if (data.video_embed_url) {
            setShowEmbed(true);
          } else {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        }}
      >
        {data.image_url ? (
          <AspectRatio ratio={16 / 9}>
            <img
              src={displayImageSrc(data.image_url)}
              alt={data.title || "PeerTube video"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </AspectRatio>
        ) : (
          <div className="w-full aspect-video bg-muted flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {data.duration != null && data.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {formatDuration(data.duration)}
          </div>
        )}

        {data.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
            <p className="text-white text-sm truncate">{data.title}</p>
          </div>
        )}
      </div>
    );
  }

  // Generic OG card
  if (data.type === "generic") {
    const hasImage = !!data.image_url;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex rounded-lg overflow-hidden border border-border bg-muted/30 hover:bg-muted/50 transition-colors no-underline"
      >
        {hasImage && (
          <div className="flex-shrink-0 w-24 sm:w-32 bg-muted">
            <img
              src={displayImageSrc(data.image_url)}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            {data.favicon_url ? (
              <img
                src={data.favicon_url}
                alt=""
                className="h-3.5 w-3.5 rounded-sm"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <Globe className="h-3.5 w-3.5" />
            )}
            <span className="truncate">{data.site_name}</span>
          </div>
          {data.title && (
            <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
              {data.title}
            </p>
          )}
          {data.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </a>
    );
  }

  return null;
};
