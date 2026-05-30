import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Home, Clock, Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import SearchTab from "./hearth-surfing/SearchTab";
import RequestsTab from "./hearth-surfing/RequestsTab";
import MySpaceTab from "./hearth-surfing/MySpaceTab";
import { HostingPreferences, HostProfile, HostingRequest } from "./hearth-surfing/types";

const HearthSurfing = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [hosts, setHosts] = useState<HostProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [preferences, setPreferences] = useState<HostingPreferences>({
    user_id: "",
    is_open_to_hosting: false,
    hosting_description: null,
    accommodation_type: null,
    max_guests: 1,
    min_friendship_level: "buddy",
    compensation_type_preferred: [],
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [incomingRequests, setIncomingRequests] = useState<HostingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<HostingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadPreferences();
      loadRequests();
      searchHosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("hosting_preferences")
        .select(
          "id, user_id, is_open_to_hosting, hosting_description, accommodation_type, max_guests, min_friendship_level, compensation_type_preferred"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        let compensationTypes: string[] = [];
        const raw = data.compensation_type_preferred;
        if (Array.isArray(raw)) compensationTypes = raw;
        else if (typeof raw === "string" && raw) compensationTypes = raw === "none" ? [] : [raw];

        setPreferences({
          id: data.id,
          user_id: data.user_id,
          is_open_to_hosting: data.is_open_to_hosting,
          hosting_description: data.hosting_description,
          accommodation_type: data.accommodation_type,
          max_guests: data.max_guests || 1,
          min_friendship_level: data.min_friendship_level,
          compensation_type_preferred: compensationTypes,
        });
      } else {
        setPreferences((prev) => ({ ...prev, user_id: user.id }));
      }
    } catch (error) {
      console.error("Error loading hosting preferences:", error);
    } finally {
      setPrefsLoading(false);
    }
  };

  const loadRequests = async () => {
    if (!user) return;
    try {
      const cols =
        "id, from_user_id, to_user_id, message, status, arrival_date, departure_date, num_guests, response_message, created_at";

      const { data: incoming, error: inError } = await supabase
        .from("hosting_requests")
        .select(cols)
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false });
      if (inError) throw inError;

      const { data: outgoing, error: outError } = await supabase
        .from("hosting_requests")
        .select(cols)
        .eq("from_user_id", user.id)
        .order("created_at", { ascending: false });
      if (outError) throw outError;

      const allUserIds = [
        ...new Set([
          ...(incoming || []).map((r) => r.from_user_id),
          ...(outgoing || []).map((r) => r.to_user_id),
        ]),
      ];

      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", allUserIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        setIncomingRequests(
          (incoming || []).map((r) => ({ ...r, from_profile: profileMap.get(r.from_user_id) }))
        );
        setOutgoingRequests(
          (outgoing || []).map((r) => ({ ...r, to_profile: profileMap.get(r.to_user_id) }))
        );
      } else {
        setIncomingRequests(incoming || []);
        setOutgoingRequests(outgoing || []);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const searchHosts = async () => {
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("hosting_preferences")
        .select(
          "*, profiles!hosting_preferences_user_id_fkey(id, display_name, avatar_url, hometown_city, hometown_country)"
        )
        .eq("is_open_to_hosting", true);

      if (error) throw error;

      const hostProfiles: HostProfile[] = (data || [])
        .filter((d: any) => d.profiles && d.user_id !== user?.id)
        .map((d: any) => ({
          id: d.profiles.id,
          display_name: d.profiles.display_name,
          avatar_url: d.profiles.avatar_url,
          hometown_city: d.profiles.hometown_city,
          hometown_country: d.profiles.hometown_country,
          hosting_preferences: {
            id: d.id,
            user_id: d.user_id,
            is_open_to_hosting: d.is_open_to_hosting,
            hosting_description: d.hosting_description,
            accommodation_type: d.accommodation_type,
            max_guests: d.max_guests,
            min_friendship_level: d.min_friendship_level,
            compensation_type_preferred: Array.isArray(d.compensation_type_preferred)
              ? d.compensation_type_preferred
              : d.compensation_type_preferred && d.compensation_type_preferred !== "none"
              ? [d.compensation_type_preferred]
              : [],
          },
        }));

      const filtered = searchQuery
        ? hostProfiles.filter(
            (h) =>
              h.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              h.hometown_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              h.hometown_country?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : hostProfiles;

      setHosts(filtered);
    } catch (error) {
      console.error("Error searching hosts:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const prefData = {
        user_id: user.id,
        is_open_to_hosting: preferences.is_open_to_hosting,
        hosting_description: preferences.hosting_description,
        accommodation_type: preferences.accommodation_type,
        max_guests: preferences.max_guests,
        min_friendship_level: preferences.min_friendship_level,
        compensation_type_preferred: JSON.stringify(preferences.compensation_type_preferred),
      };

      if (preferences.id) {
        const { error } = await supabase
          .from("hosting_preferences")
          .update(prefData)
          .eq("id", preferences.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("hosting_preferences")
          .insert(prefData)
          .select()
          .single();
        if (error) throw error;
        setPreferences((prev) => ({ ...prev, id: data.id }));
      }

      toast.success("Hosting preferences saved!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestResponse = async (requestId: string, status: "accepted" | "declined") => {
    try {
      const { error } = await supabase
        .from("hosting_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
      toast.success(`Request ${status}!`);
      loadRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    }
  };

  if (authLoading || prefsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingIncoming = incomingRequests.filter((r) => r.status === "pending");
  const pendingOutgoing = outgoingRequests.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            Hearth Surf
          </h1>
          <p className="text-muted-foreground">
            Find hosts, manage your hosting preferences, and connect with travelers
          </p>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Hosts
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Requests
              {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {pendingIncoming.length + pendingOutgoing.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-space" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              My Space
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <SearchTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              hosts={hosts}
              searchLoading={searchLoading}
              onSearch={searchHosts}
            />
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <RequestsTab
              loading={requestsLoading}
              incoming={incomingRequests}
              outgoing={outgoingRequests}
              onRespond={handleRequestResponse}
            />
          </TabsContent>

          <TabsContent value="my-space" className="space-y-6">
            <MySpaceTab
              preferences={preferences}
              setPreferences={setPreferences}
              saving={saving}
              onSave={handleSavePreferences}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HearthSurfing;
