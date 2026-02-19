import { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

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
            setSearchQuery("");
          }}
        >
          Xcrol Town
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          community classifieds · post it, find it, trade it
        </p>
      </div>

      {/* Views */}
      {view.type === "home" && (
        <TownHomepage
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={() => {
            if (searchQuery.trim()) {
              setView({ type: "listings", search: searchQuery.trim() });
            }
          }}
          onSelectCategory={(catKey) =>
            setView({ type: "listings", category: catKey })
          }
          onSelectSubcategory={(catKey, subKey) =>
            setView({ type: "listings", category: catKey, subcategory: subKey })
          }
          onPostClick={() => setView({ type: "create" })}
          onMyListingsClick={() => setView({ type: "my-listings" })}
        />
      )}

      {view.type === "listings" && (
        <TownListingsList
          category={view.category}
          subcategory={view.subcategory}
          searchQuery={view.search}
          onBack={() => {
            setView({ type: "home" });
            setSearchQuery("");
          }}
          onSelectListing={(id) => setView({ type: "detail", id })}
        />
      )}

      {view.type === "my-listings" && (
        <TownListingsList
          showMyListings
          userId={user?.id}
          onBack={() => setView({ type: "home" })}
          onSelectListing={(id) => setView({ type: "detail", id })}
        />
      )}

      {view.type === "detail" && (
        <TownListingDetail
          listingId={view.id}
          onBack={() => setView({ type: "home" })}
        />
      )}

      {view.type === "create" && (
        <TownCreateListing
          defaultCategory={view.category}
          defaultSubcategory={view.subcategory}
          onBack={() => setView({ type: "home" })}
          onCreated={() => setView({ type: "my-listings" })}
        />
      )}
    </div>
  );
};

export default TheTown;
