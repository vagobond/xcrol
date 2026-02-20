import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, ChevronRight, CalendarIcon, Heart } from "lucide-react";
import { CreateMeetupDialog } from "@/components/CreateMeetupDialog";
import { MeetupsListModal } from "@/components/MeetupsListModal";
import "mapbox-gl/dist/mapbox-gl.css";

import { useIRLLayerData } from "@/components/irl/useIRLLayerData";
import { useMapSetup } from "@/components/irl/useMapSetup";
import { ExploreHometownsModal } from "@/components/irl/ExploreHometownsModal";
import { HometownProfilesModal } from "@/components/irl/HometownProfilesModal";
import { ClaimHometownModal } from "@/components/irl/ClaimHometownModal";
import { MapSearchOverlay } from "@/components/irl/MapSearchOverlay";

const IRLLayer = () => {
  const navigate = useNavigate();
  const data = useIRLLayerData();

  const { mapContainer, map } = useMapSetup({
    mapboxToken: data.mapboxToken,
    user: data.user,
    userHometown: data.userHometown,
    allHometowns: data.allHometowns,
    groupedHometowns: data.groupedHometowns,
    meetups: data.meetups,
    locationHasMeetups: data.locationHasMeetups,
    setSelectedLocation: data.setSelectedLocation,
    setShowClaimForm: data.setShowClaimForm,
    setSelectedHometown: data.setSelectedHometown,
  });

  const handleSelectSearchResult = (result: any) => {
    if (map.current && result.center) {
      map.current.flyTo({
        center: result.center,
        zoom: result.place_type?.includes("country") ? 4 : 10,
        duration: 1500,
      });
    }
    data.setSearchQuery(result.place_name || "");
    data.setShowSearchResults(false);
  };

  const handleExploreClick = (group: any) => {
    data.setShowExploreModal(false);
    data.setSelectedHometown(group);
    if (map.current) {
      map.current.flyTo({
        center: [group.lng, group.lat],
        zoom: 10,
        duration: 1500,
      });
    }
  };

  if (!data.user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-glow">The World</h1>
          <p className="text-foreground/80">Please sign in to claim your hometown</p>
          <Button onClick={() => navigate("/auth")} variant="mystical">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-20 space-y-6">
      <div className="flex justify-between items-center max-w-7xl mx-auto flex-wrap gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-glow">The World</h1>
          <p className="text-foreground/80 mt-2">Claim your hometown on the Laminate map</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => data.setShowExploreModal(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Globe className="w-4 h-4" />
              Explore Hometowns
            </Button>
            <Button onClick={() => data.setShowMeetupsModal(true)} className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
              <CalendarIcon className="w-4 h-4" />
              Meetups/Events
            </Button>
            <Button onClick={() => navigate("/hearthsurf")} className="gap-2 bg-pink-500 hover:bg-pink-600 text-white">
              <Heart className="w-4 h-4" />
              Hearth Surf
            </Button>
            <Button onClick={() => navigate("/powers")} variant="outline">
              Back to Powers
            </Button>
          </div>
          <button
            onClick={() => data.setShowCreateMeetup(true)}
            className="text-sm text-yellow-500 hover:text-yellow-400 underline text-right"
          >
            Create Meetup/Event
          </button>
        </div>
      </div>

      {data.userHometown?.hometown_city && (
        <div className="max-w-7xl mx-auto p-4 border border-primary/20 rounded-lg bg-card">
          <h3 className="text-xl font-semibold mb-2">Your Hometown</h3>
          <p className="text-lg">
            {data.userHometown.hometown_city}, {data.userHometown.hometown_country}
          </p>
          {data.userHometown.hometown_description && (
            <p className="text-foreground/70 mt-2 italic">"{data.userHometown.hometown_description}"</p>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto relative">
        <div ref={mapContainer} className="w-full h-[600px] rounded-lg shadow-lg" />

        <MapSearchOverlay
          searchQuery={data.searchQuery}
          onSearch={data.handleSearch}
          searchResults={data.searchResults}
          showSearchResults={data.showSearchResults}
          setShowSearchResults={data.setShowSearchResults}
          isSearching={data.isSearching}
          onSelectResult={handleSelectSearchResult}
        />

        {!data.userHometown?.hometown_city && (
          <div className="absolute top-4 left-4 z-10 bg-card/95 p-4 rounded-lg border border-primary/20 max-w-xs">
            <p className="text-sm">Click anywhere on the map to claim your hometown!</p>
          </div>
        )}
      </div>

      {/* Every Country Banner */}
      <div
        onClick={() => navigate("/every-country")}
        className="max-w-7xl mx-auto bg-gradient-to-r from-primary/20 via-purple-600/20 to-primary/20 border border-primary/30 rounded-lg p-4 cursor-pointer hover:bg-primary/30 transition-all group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary animate-pulse" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                A person from every country in the world...
                <span className="ml-2 inline-block px-2 py-0.5 text-sm bg-primary text-primary-foreground rounded animate-pulse">
                  click here
                </span>
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Modals */}
      {data.showExploreModal && (
        <ExploreHometownsModal
          allHometownsCount={data.allHometowns.length}
          sortedHometowns={data.sortedHometowns}
          expandedHometown={data.expandedHometown}
          setExpandedHometown={data.setExpandedHometown}
          onClose={() => data.setShowExploreModal(false)}
          onExploreClick={handleExploreClick}
        />
      )}

      {data.selectedHometown && (
        <HometownProfilesModal
          hometown={data.selectedHometown}
          onClose={() => data.setSelectedHometown(null)}
        />
      )}

      {data.showClaimForm && data.selectedLocation && (
        <ClaimHometownModal
          selectedLocation={data.selectedLocation}
          hometownDescription={data.hometownDescription}
          setHometownDescription={data.setHometownDescription}
          onClaim={data.handleClaimHometown}
          onCancel={() => {
            data.setShowClaimForm(false);
            data.setSelectedLocation(null);
            data.setHometownDescription("");
          }}
        />
      )}

      <MeetupsListModal
        open={data.showMeetupsModal}
        onClose={() => data.setShowMeetupsModal(false)}
        onSelectMeetup={(meetup) => {
          if (map.current && meetup.latitude && meetup.longitude) {
            map.current.flyTo({
              center: [meetup.longitude, meetup.latitude],
              zoom: 12,
              duration: 1500,
            });
          }
        }}
      />

      <CreateMeetupDialog
        open={data.showCreateMeetup}
        onOpenChange={data.setShowCreateMeetup}
        onMeetupCreated={data.loadMeetups}
        mapboxToken={data.mapboxToken}
      />
    </div>
  );
};

export default IRLLayer;
