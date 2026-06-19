import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Users, MapPin, Zap, ShieldCheck, Star } from "lucide-react";
import { HostingRequestDialog } from "@/components/HostingRequestDialog";
import {
  HostProfile,
  getAccommodationLabel,
  getCompensationLabels,
  getFriendshipLevelLabel,
} from "./types";

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  hosts: HostProfile[];
  searchLoading: boolean;
  onSearch: () => void;
}

export default function SearchTab({
  searchQuery,
  setSearchQuery,
  hosts,
  searchLoading,
  onSearch,
}: Props) {
  const navigate = useNavigate();
  const [lastMinuteOnly, setLastMinuteOnly] = useState(false);

  const visibleHosts = useMemo(
    () =>
      lastMinuteOnly
        ? hosts.filter((h) => h.hosting_preferences.accepts_last_minute)
        : hosts,
    [hosts, lastMinuteOnly]
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onSearch} disabled={searchLoading}>
          {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="last-minute-filter"
          checked={lastMinuteOnly}
          onCheckedChange={(c) => setLastMinuteOnly(!!c)}
        />
        <Label htmlFor="last-minute-filter" className="text-sm cursor-pointer flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Last-minute hosts only (&lt;48h)
        </Label>
      </div>

      {searchLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibleHosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hosts found matching your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleHosts.map((host) => (
            <Card key={host.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14 cursor-pointer" onClick={() => navigate(`/u/${host.id}`)}>
                    <AvatarImage src={host.avatar_url || undefined} />
                    <AvatarFallback>{(host.display_name || "H").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/u/${host.id}`)}
                    >
                      {host.display_name || "Anonymous Host"}
                    </h3>
                    {(host.hometown_city || host.hometown_country) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[host.hometown_city, host.hometown_country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {host.hosting_preferences.accommodation_type && (
                        <Badge variant="secondary">
                          {getAccommodationLabel(host.hosting_preferences.accommodation_type)}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Max {host.hosting_preferences.max_guests} guest
                        {host.hosting_preferences.max_guests !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {getFriendshipLevelLabel(host.hosting_preferences.min_friendship_level)}
                      </Badge>
                      {host.hosting_preferences.accepts_last_minute && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Last-minute OK
                        </Badge>
                      )}
                      {host.hosting_preferences.compensation_type_preferred.length > 0 && (
                        <Badge variant="outline" className="text-primary border-primary">
                          {getCompensationLabels(host.hosting_preferences.compensation_type_preferred)}
                        </Badge>
                      )}
                    </div>
                    {host.stay_stats && host.stay_stats.hosted_count > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500" />
                        Hosted {host.stay_stats.hosted_count} stay
                        {host.stay_stats.hosted_count !== 1 ? "s" : ""}
                        {host.stay_stats.positive_refs > 0
                          ? ` · ${host.stay_stats.positive_refs} positive reference${
                              host.stay_stats.positive_refs !== 1 ? "s" : ""
                            }`
                          : ""}
                      </p>
                    )}
                    {host.hosting_preferences.hosting_description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {host.hosting_preferences.hosting_description}
                      </p>
                    )}
                  </div>
                  <HostingRequestDialog recipientId={host.id} recipientName={host.display_name || "Host"} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
