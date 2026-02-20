export interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  hometown_city: string;
  hometown_country: string;
  hometown_latitude: number;
  hometown_longitude: number;
  hometown_description: string | null;
}

export interface HometownGroup {
  city: string;
  country: string;
  lat: number;
  lng: number;
  profiles: ProfileData[];
}

export interface Meetup {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  start_datetime: string | null;
  end_datetime: string | null;
  is_open_ended: boolean;
  created_at: string;
}
