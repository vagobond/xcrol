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

const TownListingsList = ({
  category,
  subcategory,
  searchQuery,
  showMyListings,
  userId,
  onBack,
  onSelectListing,
}: TownListingsListProps) => {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["town-listings", category, subcategory, searchQuery, showMyListings, userId],
    queryFn: async () => {
      let query = supabase
        .from("town_listings")
        .select("id, title, price, location, category, subcategory, created_at, user_id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100);

      if (showMyListings && userId) {
        query = supabase
          .from("town_listings")
          .select("id, title, price, location, category, subcategory, created_at, user_id, status")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100);
      } else {
        if (category) query = query.eq("category", category);
        if (subcategory) query = query.eq("subcategory", subcategory);
        if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

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
      ) : listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">no listings found</p>
      ) : (
        <div className="border-t border-border">
          {listings.map((listing: any) => (
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
        </div>
      )}
    </div>
  );
};

export default TownListingsList;
