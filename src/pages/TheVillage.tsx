import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useGroups } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";
import { getFriendshipLabel } from "@/lib/friendship-labels";

const TheVillage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups, isLoading } = useGroups();

  const myGroups = groups?.filter((g) => g.is_member || g.creator_id === user?.id) ?? [];
  const otherGroups = groups?.filter((g) => !g.is_member && g.creator_id !== user?.id) ?? [];

  return (
    <div className="min-h-screen p-4 pt-20 max-w-4xl mx-auto">
      <Helmet>
        <title>The Village | Xcrol</title>
        <meta name="description" content="User groups and communities" />
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-glow">The Village</h1>
          <p className="text-muted-foreground mt-1">Communities you belong to and can discover</p>
        </div>
        {user && <CreateGroupDialog />}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {myGroups.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map((group) => (
                  <GroupCard key={group.id} group={group} onClick={() => navigate(`/group/${group.slug}`)} />
                ))}
              </div>
            </section>
          )}

          {otherGroups.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Discover Groups</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherGroups.map((group) => (
                  <GroupCard key={group.id} group={group} onClick={() => navigate(`/group/${group.slug}`)} />
                ))}
              </div>
            </section>
          )}

          {(!groups || groups.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No groups yet. Be the first to create one!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GroupCard = ({ group, onClick }: { group: ReturnType<typeof useGroups>["data"] extends (infer T)[] | undefined ? T : never; onClick: () => void }) => (
  <Card
    className="cursor-pointer hover:border-primary/50 transition-colors"
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center gap-3 pb-2">
      <Avatar className="h-10 w-10">
        <AvatarImage src={group.avatar_url ?? undefined} />
        <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <CardTitle className="text-base truncate">{group.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{group.member_count} member{group.member_count !== 1 ? "s" : ""}</p>
      </div>
    </CardHeader>
    {group.description && (
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
      </CardContent>
    )}
    <CardContent className="pt-0">
      <Badge variant="secondary" className="text-xs">
        {getFriendshipLabel(group.trust_level)}
      </Badge>
      {group.membership_status === "pending" && (
        <Badge variant="outline" className="text-xs ml-2">Pending</Badge>
      )}
    </CardContent>
  </Card>
);

export default TheVillage;
