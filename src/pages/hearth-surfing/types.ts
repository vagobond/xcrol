export interface HostingPreferences {
  id?: string;
  user_id: string;
  is_open_to_hosting: boolean;
  hosting_description: string | null;
  accommodation_type: string | null;
  max_guests: number;
  min_friendship_level: string;
  compensation_type_preferred: string[];
  is_hosting_paused?: boolean;
  precise_address?: string | null;
  accepts_last_minute?: boolean;
}

export interface HostStayStats {
  hosted_count: number;
  positive_refs: number;
}

export interface HostProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  hometown_city: string | null;
  hometown_country: string | null;
  hosting_preferences: HostingPreferences;
  stay_stats?: HostStayStats;
}

export interface HostingRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: string;
  arrival_date: string | null;
  departure_date: string | null;
  num_guests: number | null;
  companions_note?: string | null;
  skills_offered?: string | null;
  response_message: string | null;
  created_at: string;
  host_precise_address?: string | null;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  to_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const COMPENSATION_TYPES = [
  { value: "none", label: "None" },
  { value: "monetary", label: "Monetary" },
  { value: "food", label: "Food" },
  { value: "hangout_time", label: "Hangout Time" },
  { value: "friendship", label: "Friendship" },
  { value: "fwb", label: "FWB" },
  { value: "skills_exchange", label: "Skill Swap" },
];


export const ACCOMMODATION_TYPES = [
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" },
  { value: "couch", label: "Couch" },
  { value: "floor_space", label: "Floor Space" },
  { value: "guest_house", label: "Guest House / Separate Unit" },
];

export const FRIENDSHIP_LEVEL_LABEL: Record<string, string> = {
  friendly_acquaintance: "Wayfarers & above",
  buddy: "Companions & above",
  close_friend: "Oath Bound only",
};

/**
 * Allowed range for max_guests. Mirrored by a CHECK constraint on
 * hosting_preferences.max_guests — keep the two in sync.
 */
export const MIN_GUESTS = 1;
export const MAX_GUESTS = 10;

export const clampGuests = (value: number): number =>
  Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, Math.trunc(value)));

const KNOWN_COMPENSATION_VALUES = new Set(COMPENSATION_TYPES.map((c) => c.value));

/**
 * Read compensation_type_preferred out of the DB.
 *
 * The column is TEXT, and older code wrote `JSON.stringify(array)` into it while
 * the loader never parsed it back — so each save wrapped the previous value in
 * another layer of escaping. Live rows exist with several generations of nesting.
 * This unwraps however deep it goes, keeps only values we recognise, and dedupes.
 */
export const parseCompensationTypes = (raw: unknown): string[] => {
  const out = new Set<string>();

  const walk = (value: unknown, depth: number) => {
    if (depth > 10 || value == null) return;

    if (Array.isArray(value)) {
      value.forEach((v) => walk(v, depth + 1));
      return;
    }

    if (typeof value !== "string") return;

    const trimmed = value.trim();
    if (!trimmed || trimmed === "none") return;

    if (KNOWN_COMPENSATION_VALUES.has(trimmed)) {
      out.add(trimmed);
      return;
    }

    // Anything else that still looks like JSON is a nested generation.
    if (trimmed.startsWith("[") || trimmed.startsWith('"')) {
      try {
        walk(JSON.parse(trimmed), depth + 1);
      } catch {
        // Not parseable — drop it rather than surfacing escaped text to users.
      }
    }
  };

  walk(raw, 0);
  return [...out];
};

export const getCompensationLabel = (value: string) =>
  COMPENSATION_TYPES.find((c) => c.value === value)?.label || value;

export const getCompensationLabels = (values: string[]) => {
  if (!values || values.length === 0) return null;
  return values.map((v) => getCompensationLabel(v)).join(", ");
};

export const getAccommodationLabel = (value: string | null) =>
  ACCOMMODATION_TYPES.find((a) => a.value === value)?.label || value;

export const getFriendshipLevelLabel = (value: string | null | undefined) =>
  (value && FRIENDSHIP_LEVEL_LABEL[value]) || "Open to all friends";
