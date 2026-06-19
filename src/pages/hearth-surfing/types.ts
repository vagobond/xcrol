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
