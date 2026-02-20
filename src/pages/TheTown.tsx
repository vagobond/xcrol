import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/use-auth";
import TownHomepage from "@/components/town/TownHomepage";
import TownListingsList from "@/components/town/TownListingsList";
import TownListingDetail from "@/components/town/TownListingDetail";
import TownCreateListing from "@/components/town/TownCreateListing";

type TownView =
  | { type: "home" }
  | { type: "listings"; category?: string; subcategory?: string; search?: string }
  | { type: "my-listings" }
  | { type: "detail"; id: string }
  | { type: "create"; category?: string; subcategory?: string };

const TheTown = () => {
  const { user } = useAuth();
  const [view, setView] = useState<TownView>({ type: "home" });
  const [previousView, setPreviousView] = useState<TownView | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigateTo = useCallback((newView: TownView) => {
    setPreviousView(view);
    setView(newView);
  }, [view]);

  const goBack = useCallback(() => {
    if (previousView) {
      setView(previousView);
      setPreviousView(null);
    } else {
      setView({ type: "home" });
    }
  }, [previousView]);

  return (
    <div className="min-h-screen pt-20 px-4 pb-12 max-w-5xl mx-auto">
      <Helmet>
        <title>Xcrol Town</title>
        <meta name="description" content="Xcrol Town - community classifieds" />
      </Helmet>

      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            setView({ type: "home" });
            setPreviousView(null);
            setSearchQuery("");
          }}
        >
          Xcrol Town
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Community Marketplace · Post, Find, Trade
        </p>
      </div>

      {/* Views */}
      {view.type === "home" && (
        <TownHomepage
          isAuthenticated={!!user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={() => {
            if (searchQuery.trim()) {
              navigateTo({ type: "listings", search: searchQuery.trim() });
            }
          }}
          onSelectCategory={(catKey) =>
            navigateTo({ type: "listings", category: catKey })
          }
          onSelectSubcategory={(catKey, subKey) =>
            navigateTo({ type: "listings", category: catKey, subcategory: subKey })
          }
          onPostClick={() => navigateTo({ type: "create" })}
          onMyListingsClick={() => navigateTo({ type: "my-listings" })}
        />
      )}

      {view.type === "listings" && (
        <TownListingsList
          category={view.category}
          subcategory={view.subcategory}
          searchQuery={view.search}
          onBack={() => {
            setView({ type: "home" });
            setPreviousView(null);
            setSearchQuery("");
          }}
          onSelectListing={(id) => navigateTo({ type: "detail", id })}
        />
      )}

      {view.type === "my-listings" && (
        <TownListingsList
          showMyListings
          userId={user?.id}
          onBack={() => {
            setView({ type: "home" });
            setPreviousView(null);
          }}
          onSelectListing={(id) => navigateTo({ type: "detail", id })}
        />
      )}

      {view.type === "detail" && (
        <TownListingDetail
          listingId={view.id}
          onBack={goBack}
        />
      )}

      {view.type === "create" && (
        <TownCreateListing
          defaultCategory={view.category}
          defaultSubcategory={view.subcategory}
          onBack={goBack}
          onCreated={() => navigateTo({ type: "my-listings" })}
        />
      )}
    </div>
  );
};

export default TheTown;
