import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { ProfileData, HometownGroup, Meetup } from "./types";

export function useIRLLayerData() {
  const { user } = useAuth();

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number; city: string; country: string } | null>(null);
  const [hometownDescription, setHometownDescription] = useState("");
  const [userHometown, setUserHometown] = useState<any>(null);
  const [allHometowns, setAllHometowns] = useState<ProfileData[]>([]);
  const [selectedHometown, setSelectedHometown] = useState<HometownGroup | null>(null);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [showMeetupsModal, setShowMeetupsModal] = useState(false);
  const [showCreateMeetup, setShowCreateMeetup] = useState(false);
  const [expandedHometown, setExpandedHometown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      loadUserProfile(user.id);
    }
  }, [user?.id]);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("hometown_city, hometown_country, hometown_latitude, hometown_longitude, hometown_description, last_hometown_change")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    if (data) {
      setUserHometown(data);
    }
  };

  const loadAllHometowns = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_public_hometowns");
    if (error) {
      console.error("Error loading hometowns:", error);
      return;
    }
    setAllHometowns((data || []) as ProfileData[]);
  }, []);

  const loadMeetups = useCallback(async () => {
    const { data, error } = await supabase
      .from("meetups")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading meetups:", error);
      return;
    }
    setMeetups((data || []) as Meetup[]);
  }, []);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error("Failed to fetch Mapbox token:", err);
        toast.error("Failed to load map");
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    loadAllHometowns();
    loadMeetups();
  }, [loadAllHometowns, loadMeetups]);

  // Search for locations
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !mapboxToken) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place,locality,region,country&limit=5`
      );
      const data = await response.json();
      if (data.features) {
        setSearchResults(data.features);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Group profiles by hometown
  const groupedHometowns = allHometowns.reduce<Record<string, HometownGroup>>((acc, profile) => {
    const key = `${profile.hometown_city}-${profile.hometown_country}`;
    if (!acc[key]) {
      acc[key] = {
        city: profile.hometown_city,
        country: profile.hometown_country,
        lat: profile.hometown_latitude,
        lng: profile.hometown_longitude,
        profiles: [],
      };
    }
    acc[key].profiles.push(profile);
    return acc;
  }, {});

  const locationHasMeetups = useCallback((lat: number, lng: number): boolean => {
    const threshold = 0.5;
    return meetups.some(meetup => {
      if (!meetup.latitude || !meetup.longitude) return false;
      return Math.abs(meetup.latitude - lat) < threshold && Math.abs(meetup.longitude - lng) < threshold;
    });
  }, [meetups]);

  const sortedHometowns = Object.values(groupedHometowns).sort(
    (a, b) => b.profiles.length - a.profiles.length
  );

  const handleClaimHometown = async () => {
    if (!user || !selectedLocation) return;
    const isChangingHometown = !!userHometown?.hometown_city;

    const { error } = await supabase
      .from("profiles")
      .update({
        hometown_city: selectedLocation.city,
        hometown_country: selectedLocation.country,
        hometown_latitude: selectedLocation.lat,
        hometown_longitude: selectedLocation.lng,
        hometown_description: hometownDescription,
        last_hometown_change: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error claiming hometown:", error);
      toast.error("Failed to claim hometown");
      return;
    }

    toast.success(isChangingHometown
      ? `You've moved to ${selectedLocation.city}!`
      : `You've claimed ${selectedLocation.city}!`
    );
    setUserHometown({
      hometown_city: selectedLocation.city,
      hometown_country: selectedLocation.country,
      hometown_latitude: selectedLocation.lat,
      hometown_longitude: selectedLocation.lng,
      hometown_description: hometownDescription,
      last_hometown_change: new Date().toISOString(),
    });
    setShowClaimForm(false);
    setSelectedLocation(null);
    setHometownDescription("");
    loadAllHometowns();
  };

  return {
    user,
    mapboxToken,
    showClaimForm, setShowClaimForm,
    selectedLocation, setSelectedLocation,
    hometownDescription, setHometownDescription,
    userHometown,
    allHometowns,
    selectedHometown, setSelectedHometown,
    showExploreModal, setShowExploreModal,
    meetups,
    showMeetupsModal, setShowMeetupsModal,
    showCreateMeetup, setShowCreateMeetup,
    expandedHometown, setExpandedHometown,
    searchQuery, setSearchQuery,
    searchResults,
    showSearchResults, setShowSearchResults,
    isSearching,
    groupedHometowns,
    locationHasMeetups,
    sortedHometowns,
    handleSearch,
    handleClaimHometown,
    loadMeetups,
  };
}
