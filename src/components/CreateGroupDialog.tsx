import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Info } from "lucide-react";
import { useCreateGroup } from "@/hooks/use-groups";
import { getFriendshipLabel } from "@/lib/friendship-labels";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TRUST_LEVELS = [
  "friendly_acquaintance",
  "buddy",
  "close_friend",
  "family",
];

const CreateGroupDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trustLevel, setTrustLevel] = useState("friendly_acquaintance");
  const createGroup = useCreateGroup();
  const { user } = useAuth();

  const { data: hasAcceptedInvite = false } = useQuery({
    queryKey: ["has-accepted-invite", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { count, error } = await supabase
        .from("user_invites")
        .select("id", { count: "exact", head: true })
        .eq("inviter_id", user.id)
        .eq("status", "accepted");
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: !!user?.id,
  });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug) return;

    await createGroup.mutateAsync({
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
      trust_level: trustLevel,
    });
    setOpen(false);
    setName("");
    setDescription("");
    setTrustLevel("friendly_acquaintance");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="mystical" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
        </DialogHeader>
        {!hasAcceptedInvite ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Info className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              To create a group, you must have invited at least one person who accepted your invitation to join XCROL. Head to{" "}
              <Link to="/invite-friends" className="font-medium text-primary underline hover:text-primary/80" onClick={() => setOpen(false)}>Invite Friends</Link> to send an invite first!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Group"
                required
              />
              {slug && (
                <p className="text-xs text-muted-foreground">/group/{slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this group about?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Trust Level to View Content</Label>
              <Select value={trustLevel} onValueChange={setTrustLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRUST_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {getFriendshipLabel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only friends at this level or above with you can see group content
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!name.trim() || createGroup.isPending}
            >
              {createGroup.isPending ? "Creating..." : "Create Group"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
