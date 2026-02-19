import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateGroup } from "@/hooks/use-groups";
import { getFriendshipLabel } from "@/lib/friendship-labels";

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
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
