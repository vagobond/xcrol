import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LinkPreviewResult {
  type: 'pixelfed' | 'peertube' | 'unknown';
  title?: string;
  description?: string;
  image_url?: string;
  video_embed_url?: string;
  duration?: number;
  original_url: string;
}

const PIXELFED_DOMAINS = [
  'pixelfed.social', 'pixelfed.de', 'pixelfed.art', 'pixel.tchncs.de',
  'pixelfed.uno', 'pxlmo.com', 'pixelfed.tokyo', 'pixey.org',
  'pixelfed.au', 'pixelfed.cz', 'gram.social', 'pixelfed.fr',
];

const PEERTUBE_DOMAINS = [
  'peertube.social', 'videos.lukesmith.xyz', 'tilvids.com',
  'tube.tchncs.de', 'video.ploud.fr', 'peertube.tv',
  'tube.spdns.org', 'peertube.co.uk', 'peertube.live',
  'videos.pair2jeux.tube', 'peertube.debian.social',
  'framatube.org', 'diode.zone', 'video.antopie.org',
];

function isAllowedDomain(hostname: string, domains: string[]): boolean {
  return domains.some(d => hostname === d || hostname.endsWith('.' + d));
}

function isPixelFedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return isAllowedDomain(hostname, PIXELFED_DOMAINS);
  } catch {
    return false;
  }
}

function isPeerTubeUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    // Only match known PeerTube domains — no longer matching arbitrary domains by path pattern
    return isAllowedDomain(hostname, PEERTUBE_DOMAINS);
  } catch {
    return false;
  }
}

// Block private/internal IP ranges and localhost
function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Block non-http(s) schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;

    // Block localhost variants
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') return true;

    // Block private IP ranges (RFC1918, link-local, metadata)
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.)/.test(hostname)) return true;

    // Block cloud metadata endpoints
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return true;

    return false;
  } catch {
    return true; // Block malformed URLs
  }
}

async function fetchPixelFedPreview(url: string): Promise<LinkPreviewResult> {
  const parsed = new URL(url);
  const oembedUrl = `${parsed.origin}/api/v1/oembed?url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(oembedUrl, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data.url || data.thumbnail_url) {
        return {
          type: 'pixelfed',
          title: data.title || data.author_name,
          image_url: data.url || data.thumbnail_url,
          original_url: url,
        };
      }
    }
  } catch (e) {
    console.error('oEmbed fetch failed, trying OG fallback:', e);
  }

  return fetchOgPreview(url, 'pixelfed');
}

async function fetchPeerTubePreview(url: string): Promise<LinkPreviewResult> {
  const parsed = new URL(url);

  const wMatch = parsed.pathname.match(/^\/w\/([^/?]+)/);
  const watchMatch = parsed.pathname.match(/^\/videos\/watch\/([^/?]+)/);
  const videoId = wMatch?.[1] || watchMatch?.[1];

  if (videoId) {
    try {
      const apiUrl = `${parsed.origin}/api/v1/videos/${videoId}`;
      const res = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        return {
          type: 'peertube',
          title: data.name,
          description: data.description?.substring(0, 200),
          image_url: data.previewPath ? `${parsed.origin}${data.previewPath}` : (data.thumbnailPath ? `${parsed.origin}${data.thumbnailPath}` : undefined),
          video_embed_url: `${parsed.origin}/videos/embed/${data.uuid || videoId}`,
          duration: data.duration,
          original_url: url,
        };
      }
    } catch (e) {
      console.error('PeerTube API fetch failed:', e);
    }
  }

  return fetchOgPreview(url, 'peertube');
}

async function fetchOgPreview(url: string, type: 'pixelfed' | 'peertube'): Promise<LinkPreviewResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; XcrolBot/1.0)' },
      redirect: 'follow',
    });
    const html = await res.text();

    const getOg = (property: string): string | undefined => {
      const match = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i'));
      return match?.[1];
    };

    const getMeta = (name: string): string | undefined => {
      const match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
      return match?.[1];
    };

    const ogImage = getOg('image');
    const ogTitle = getOg('title');
    const ogDescription = getOg('description') || getMeta('description');
    const ogVideo = getOg('video:url') || getOg('video');
    const ogDuration = getOg('video:duration');

    return {
      type,
      title: ogTitle,
      description: ogDescription?.substring(0, 200),
      image_url: ogImage,
      video_embed_url: type === 'peertube' ? ogVideo : undefined,
      duration: ogDuration ? parseInt(ogDuration) : undefined,
      original_url: url,
    };
  } catch (e) {
    console.error('OG fetch failed:', e);
    return { type: 'unknown', original_url: url };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Block internal/private URLs to prevent SSRF
    if (isBlockedUrl(url)) {
      return new Response(JSON.stringify({ type: 'unknown', original_url: url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: LinkPreviewResult;

    if (isPixelFedUrl(url)) {
      result = await fetchPixelFedPreview(url);
    } else if (isPeerTubeUrl(url)) {
      result = await fetchPeerTubePreview(url);
    } else {
      result = { type: 'unknown', original_url: url };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ type: 'unknown', error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
