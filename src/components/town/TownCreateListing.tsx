import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { TOWN_CATEGORIES } from "./townCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TownCreateListingProps {
  onBack: () => void;
  onCreated: () => void;
  defaultCategory?: string;
  defaultSubcategory?: string;
}

const TownCreateListing = ({
  onBack,
  onCreated,
  defaultCategory,
  defaultSubcategory,
}: TownCreateListingProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [subcategory, setSubcategory] = useState(defaultSubcategory ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const selectedCat = TOWN_CATEGORIES.find((c) => c.key === category);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!category || !subcategory || !title.trim() || !body.trim()) {
        throw new Error("Please fill in all required fields");
      }
      const parsedPrice = price ? parseFloat(price) : null;
      if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0)) {
        throw new Error("Please enter a valid price");
      }
      const { error } = await supabase.from("town_listings").insert({
        user_id: user.id,
        category,
        subcategory,
        title: title.trim(),
        body: body.trim(),
        price: parsedPrice,
        location: location.trim() || null,
        contact_info: contactInfo.trim() || null,
        contact_method: contactInfo.trim() ? "custom" : "message",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing posted!" });
      queryClient.invalidateQueries({ queryKey: ["town-listings"] });
      onCreated();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm text-primary hover:underline">
          « back
        </button>
        <p className="text-sm text-muted-foreground">
          Please sign in to post a listing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg">
      <button onClick={onBack} className="text-sm text-primary hover:underline">
        « back
      </button>
      <h2 className="text-lg font-bold text-foreground">post to xcrol town</h2>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">category *</Label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory("");
            }}
            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">select category</option>
            {TOWN_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {selectedCat && (
          <div>
            <Label className="text-xs">subcategory *</Label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">select subcategory</option>
              {selectedCat.subcategories.map((sub) => (
                <option key={sub.key} value={sub.key}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label className="text-xs">posting title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="e.g. Vintage guitar for sale"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">price</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="leave blank if not applicable"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">location</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Brooklyn, NY"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">best way to contact you</Label>
          <Input
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            maxLength={200}
            placeholder="e.g. email me at joe@example.com, or call 555-1234"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave blank to be contacted via xcrol messages
          </p>
        </div>

        <div>
          <Label className="text-xs">description *</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            maxLength={5000}
            placeholder="Describe your listing in detail..."
            className="mt-1"
          />
        </div>

        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !category || !subcategory || !title.trim() || !body.trim()}
          className="w-full"
        >
          {createMutation.isPending ? "posting..." : "publish listing"}
        </Button>
      </div>
    </div>
  );
};

export default TownCreateListing;
