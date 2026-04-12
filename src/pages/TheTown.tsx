import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const parseTownView = (params: URLSearchParams): TownView => {
  const v = params.get("view");
  if (v === "listings") return { type: "listings", category: params.get("cat") || undefined, subcategory: params.get("sub") || undefined, search: params.get("q") || undefined };
  if (v === "my-listings") return { type: "my-listings" };
  if (v === "detail" && params.get("id")) return { type: "detail", id: params.get("id")! };
  if (v === "create") return { type: "create", category: params.get("cat") || undefined, subcategory: params.get("sub") || undefined };
  return { type: "home" };
};

const viewToParams = (view: TownView): Record<string, string> => {
  if (view.type === "home") return {};
  const p: Record<string, string> = { view: view.type };
  if ("category" in view && view.category) p.cat = view.category;
  if ("subcategory" in view && view.subcategory) p.sub = view.subcategory;
  if ("search" in view && view.search) p.q = view.search;
  if ("id" in view && view.id) p.id = view.id;
  return p;
};

const TheTown = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = useMemo(() => parseTownView(searchParams), [searchParams]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const navigateTo = useCallback((newView: TownView) => {
    setSearchParams(viewToParams(newView));
  }, [setSearchParams]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="min-h-screen pt-20 px-4 pb-12 max-w-5xl mx-auto">
      <Helmet>
        <title>Xcrol Town</title>
        <meta name="description" content="Xcrol Town - community classifieds" />
      </Helmet>

      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1
          className="text-3xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            setSearchParams({});
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
            setSearchParams({});
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
            setSearchParams({});
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
