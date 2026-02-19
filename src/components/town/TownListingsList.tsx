import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel, getSubcategoryLabel } from "./townCategories";
import { formatDistanceToNow } from "date-fns";

interface TownListingsListProps {
  category?: string;
  subcategory?: string;
  searchQuery?: string;
  showMyListings?: boolean;
  userId?: string;
  onBack: () => void;
  onSelectListing: (id: string) => void;
}

const PAGE_SIZE = 50;

const TownListingsList = ({
  category,
  subcategory,
  searchQuery,
  showMyListings,
  userId,
  onBack,
  onSelectListing,
}: TownListingsListProps) => {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["town-listings", category, subcategory, searchQuery, showMyListings, userId, limit],
    queryFn: async () => {
      let query = supabase
        .from("town_listings")
        .select("id, title, price, location, category, subcategory, created_at, user_id, status")
        .order("created_at", { ascending: false })
        .limit(limit + 1); // fetch one extra to detect if there are more

      if (showMyListings) {
        if (!userId) return [];
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("status", "active");
        // Filter out expired listings
        query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
        if (category) query = query.eq("category", category);
        if (subcategory) query = query.eq("subcategory", subcategory);
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,body.ilike.%${searchQuery}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !showMyListings || !!userId,
  });

  const hasMore = listings.length > limit;
  const displayListings = hasMore ? listings.slice(0, limit) : listings;

  const title = showMyListings
    ? "my listings"
    : subcategory
    ? `${getCategoryLabel(category ?? "")} > ${getSubcategoryLabel(category ?? "", subcategory)}`
    : category
    ? getCategoryLabel(category)
    : searchQuery
    ? `search results: "${searchQuery}"`
    : "all listings";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-primary hover:underline">
          « back
        </button>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">loading...</p>
      ) : displayListings.length === 0 ? (
        <p className="text-sm text-muted-foreground">no listings found</p>
      ) : (
        <div className="border-t border-border">
          {displayListings.map((listing: any) => (
            <button
              key={listing.id}
              onClick={() => onSelectListing(listing.id)}
              className="w-full text-left flex items-baseline gap-3 py-1.5 px-1 border-b border-border/50 hover:bg-accent/30 transition-colors"
            >
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
              </span>
              <span className="text-sm text-primary hover:underline flex-1 truncate">
                {listing.title}
              </span>
              {showMyListings && listing.status !== "active" && (
                <span className="text-xs text-destructive font-medium whitespace-nowrap">
                  [{listing.status}]
                </span>
              )}
              {listing.price != null && listing.price > 0 && (
                <span className="text-xs text-foreground/70 font-medium whitespace-nowrap">
                  ${listing.price}
                </span>
              )}
              {listing.location && (
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                  ({listing.location})
                </span>
              )}
            </button>
          ))}

          {hasMore && (
            <button
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="w-full text-center py-3 text-sm text-primary hover:underline font-medium"
            >
              load more...
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TownListingsList;
