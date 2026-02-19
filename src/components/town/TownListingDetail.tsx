import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel, getSubcategoryLabel } from "./townCategories";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TownListingDetailProps {
  listingId: string;
  onBack: () => void;
}

const TownListingDetail = ({ listingId, onBack }: TownListingDetailProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["town-listing", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("town_listings")
        .select("*")
        .eq("id", listingId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: author } = useQuery({
    queryKey: ["town-listing-author", listing?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", listing!.user_id)
        .single();
      return data;
    },
    enabled: !!listing?.user_id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("town_listings")
        .delete()
        .eq("id", listingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing deleted" });
      queryClient.invalidateQueries({ queryKey: ["town-listings"] });
      onBack();
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">loading...</p>;
  if (!listing) return <p className="text-sm text-muted-foreground">listing not found</p>;

  const isOwner = user?.id === listing.user_id;

  return (
    <div className="space-y-4 max-w-2xl">
      <button onClick={onBack} className="text-sm text-primary hover:underline">
        « back to listings
      </button>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {getCategoryLabel(listing.category)} &gt; {getSubcategoryLabel(listing.category, listing.subcategory)}
        </p>
        <h2 className="text-xl font-bold text-foreground">{listing.title}</h2>
        {listing.price != null && listing.price > 0 && (
          <p className="text-lg font-semibold text-primary">${listing.price}</p>
        )}
      </div>

      <div className="border border-border rounded p-4 bg-card/30 whitespace-pre-wrap text-sm text-foreground/90">
        {listing.body}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        {listing.location && <p>📍 {listing.location}</p>}
        <p>posted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</p>
        {author && (
          <p>
            by{" "}
            <button
              onClick={() => navigate(`/${author.username}`)}
              className="text-primary hover:underline"
            >
              {author.display_name || author.username}
            </button>
          </p>
        )}
      </div>

      {/* Contact */}
      {listing.contact_info && (
        <div className="border border-border rounded p-3 bg-card/30 text-sm">
          <p className="text-xs text-muted-foreground mb-1 font-medium">contact:</p>
          <p className="text-foreground">{listing.contact_info}</p>
        </div>
      )}

      {!isOwner && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/messages`)}
          className="text-sm"
        >
          {listing.contact_info ? "or message on xcrol" : "reply via message"}
        </Button>
      )}

      {isOwner && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this listing?")) deleteMutation.mutate();
            }}
          >
            delete listing
          </Button>
        </div>
      )}
    </div>
  );
};

export default TownListingDetail;
