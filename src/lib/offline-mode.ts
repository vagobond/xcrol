// Tier 2 read-only static fallback.
//
// When the backend (Postgres / edge functions) is unreachable, the public
// surface of the app stays usable by reading a snapshot JSON written nightly
// by the `nightly-backup` edge function to the public `public-snapshots`
// storage bucket. Writes are disabled with a banner.
//
// This is intentionally lightweight and isolated — no React Query, no
// Supabase client. The snapshot URL is served from the Storage CDN which
// caches independently from Postgres compute.

import { useEffect, useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

export const SNAPSHOT_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/public-snapshots/latest.json`
  : null;

export interface PublicSnapshot {
  generated_at: string;
  stats: {
    entries_today: number;
    hometowns_total: number;
    countries_total: number;
    brooks_active: number;
  };
  // Forward-compatible: more public collections may be added later.
  // Consumers should treat unknown fields as optional.
  river?: Array<{
    id: string;
    user_id: string;
    username: string | null;
    display_name: string | null;
    content: string;
    created_at: string;
  }>;
  publications?: Array<{
    id: string;
    slug: string;
    title: string;
    author_id: string;
    published_at: string;
  }>;
}

let cached: PublicSnapshot | null = null;
let inflight: Promise<PublicSnapshot | null> | null = null;

export async function fetchSnapshot(): Promise<PublicSnapshot | null> {
  if (cached) return cached;
  if (inflight) return inflight;
  if (!SNAPSHOT_URL) return null;
  inflight = (async () => {
    try {
      const res = await fetch(SNAPSHOT_URL, { cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as PublicSnapshot;
      cached = json;
      return json;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export type BackendStatus = "checking" | "online" | "offline";

/**
 * Lightweight backend health probe. Hits the lightweight `health` edge
 * function (already exists, JWT-free, cached). Used to decide whether to
 * surface the offline banner — does NOT gate any rendering.
 */
export function useBackendHealth(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    if (!SUPABASE_URL) {
      setStatus("offline");
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/health`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (cancelled) return;
        // Any HTTP response — even 5xx — means the edge network is up
        // and reachable. Only treat a total network failure as offline,
        // otherwise a degraded-but-responding backend (e.g. stale backup)
        // would incorrectly flip the whole site to read-only mode.
        setStatus("online");
        void res;
      } catch {
        if (!cancelled) setStatus("offline");
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  return status;
}
