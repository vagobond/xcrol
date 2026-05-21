import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollText, Plus, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Scroll {
  id: string;
  title: string;
  subtitle: string | null;
  blurb: string | null;
  updated_at: string;
}

const Scrolls = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scrolls, setScrolls] = useState<Scroll[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scrolls")
      .select("id, title, subtitle, blurb, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load Scrolls", description: error.message, variant: "destructive" });
    } else {
      setScrolls((data as Scroll[]) || []);
    }
    setLoading(false);
  };

  const create = async () => {
    if (!user) return;
    setCreating(true);
    const title = newTitle.trim() || "Untitled Scroll";
    const { data, error } = await supabase
      .from("scrolls")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) {
      toast({ title: "Couldn't create", description: error?.message, variant: "destructive" });
      return;
    }
    navigate(`/scrolls/${data.id}`);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this Scroll? Your original entries are not affected.")) return;
    const { error } = await supabase.from("scrolls").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    } else {
      setScrolls((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <Helmet>
        <title>Your Scrolls — XCROL</title>
        <meta name="description" content="Bundle your XCROL writing into a Scroll — your own personal archive, ready to export." />
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/powers")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Powers
        </Button>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ScrollText className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Your Scrolls</h1>
          <p className="text-muted-foreground italic max-w-lg mx-auto">
            Bundle your own writing — Xcrol entries and group posts — into a Scroll you can keep, export, and one day publish.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Start a new Scroll</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Title (you can change it later)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={120}
            />
            <Button onClick={create} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {scrolls.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No Scrolls yet. Start one above.</p>
          ) : (
            scrolls.map((s) => (
              <Card key={s.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <Link to={`/scrolls/${s.id}`} className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{s.title}</div>
                    {s.subtitle && <div className="text-sm text-muted-foreground truncate">{s.subtitle}</div>}
                    <div className="text-xs text-muted-foreground mt-1">
                      Updated {format(new Date(s.updated_at), "MMM d, yyyy")}
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Coming soon:</strong> publish your Scroll to The Castle library.
            Sales split 60% to you, 40% to XCROL. Build your Scroll now — the gates open later.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Scrolls;
