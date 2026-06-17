/**
 * Per-session jitter for active host map pins.
 *
 * Hometown coordinates are already rounded to 1 decimal globally, but for
 * Hearth Surf hosts shown on a map we add an additional 2–10 km random offset
 * that stays stable for the duration of the browser session (per host id).
 *
 * The exact address is never derivable from a pin — it is only revealed inside
 * an accepted hosting request thread.
 */

const STORAGE_KEY = "xcrol:host-pin-jitter:v1";

type JitterEntry = { dLat: number; dLng: number };

function loadCache(): Record<string, JitterEntry> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, JitterEntry>) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, JitterEntry>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // session storage unavailable — silently fall back to in-memory only
  }
}

const memoryCache: Record<string, JitterEntry> = {};

function randomOffsetKm(): number {
  // 2–10 km in either direction
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * (2 + Math.random() * 8);
}

function ensureEntry(hostId: string): JitterEntry {
  if (memoryCache[hostId]) return memoryCache[hostId];
  const cache = loadCache();
  if (cache[hostId]) {
    memoryCache[hostId] = cache[hostId];
    return cache[hostId];
  }
  const dKm = { lat: randomOffsetKm(), lng: randomOffsetKm() };
  // ~111 km per degree latitude; longitude varies with cos(lat) — apply at call site
  const entry: JitterEntry = { dLat: dKm.lat / 111, dLng: dKm.lng / 111 };
  cache[hostId] = entry;
  memoryCache[hostId] = entry;
  saveCache(cache);
  return entry;
}

export function jitterHostCoords(
  hostId: string,
  lat: number,
  lng: number,
): { lat: number; lng: number } {
  const entry = ensureEntry(hostId);
  const lngScale = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  return {
    lat: lat + entry.dLat,
    lng: lng + entry.dLng / lngScale,
  };
}
