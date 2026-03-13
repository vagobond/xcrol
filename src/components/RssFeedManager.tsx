import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Rss, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface RssFeed {
  id: string;
  feed_url: string;
  feed_name: string | null;
  feed_icon: string | null;
  max_items: number;
  created_at: string;
}

const ITEM_COUNT_OPTIONS = [
  { value: "3", label: "3 headlines" },
  { value: "5", label: "5 headlines" },
  { value: "10", label: "10 headlines" },
];

export const RssFeedManager = () => {
  const { user } = useAuth();
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (user) loadFeeds();
  }, [user]);

  const loadFeeds = async () => {
    const { data, error } = await supabase
      .from("user_rss_feeds")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error && data) setFeeds(data as RssFeed[]);
    setLoading(false);
  };

  const addFeed = async () => {
    if (!newUrl.trim()) return;

    try {
      new URL(newUrl.trim());
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setAdding(true);
    const { data, error } = await supabase
      .from("user_rss_feeds")
      .insert({ user_id: user!.id, feed_url: newUrl.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already added this feed");
      } else {
        toast.error("Failed to add feed");
      }
      setAdding(false);
      return;
    }

    setFeeds((prev) => [{ ...data, max_items: data.max_items ?? 5 } as RssFeed, ...prev]);
    setNewUrl("");
    toast.success("Feed added! Fetching articles...");
    setAdding(false);

    // Trigger fetch for the new feed
    fetchFeed(data.id);
  };

  const fetchFeed = async (feedId?: string) => {
    setRefreshing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/fetch-rss-feeds`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedId ? { feed_id: feedId } : {}),
        }
      );
      const result = await res.json();
      if (result.fetched > 0) {
        toast.success(`Fetched ${result.fetched} articles`);
      }
    } catch {
      toast.error("Failed to fetch feed articles");
    }
    setRefreshing(false);
    loadFeeds();
  };

  const updateMaxItems = async (feedId: string, maxItems: number) => {
    const { error } = await supabase
      .from("user_rss_feeds")
      .update({ max_items: maxItems })
      .eq("id", feedId);

    if (error) {
      toast.error("Failed to update");
      return;
    }

    setFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, max_items: maxItems } : f))
    );
  };

  const removeFeed = async (id: string) => {
    const { error } = await supabase
      .from("user_rss_feeds")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove feed");
      return;
    }

    setFeeds((prev) => prev.filter((f) => f.id !== id));
    toast.success("Feed removed");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Paste RSS feed URL..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFeed()}
        />
        <Button onClick={addFeed} disabled={adding || !newUrl.trim()} size="sm">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {feeds.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchFeed()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh All
          </Button>
        </div>
      )}

      {feeds.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No RSS feeds added yet. Paste a feed URL above to get started.
        </p>
      )}

      <div className="space-y-2">
        {feeds.map((feed) => (
          <div
            key={feed.id}
            className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Rss className="h-4 w-4 text-orange-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {feed.feed_name || "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {feed.feed_url}
                </p>
              </div>
            </div>
            <Select
              value={String(feed.max_items)}
              onValueChange={(v) => updateMaxItems(feed.id, Number(v))}
            >
              <SelectTrigger className="w-[110px] shrink-0 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_COUNT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFeed(feed.id)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
