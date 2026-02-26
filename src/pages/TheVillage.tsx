import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useGroups } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { useGroupActivity } from "@/hooks/use-group-activity";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFriendshipLabel } from "@/lib/friendship-labels";
import { useMemo } from "react";

const TheVillage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups, isLoading } = useGroups();

  const myGroups = groups?.filter((g) => g.is_member || g.creator_id === user?.id) ?? [];
  const otherGroups = groups?.filter((g) => !g.is_member && g.creator_id !== user?.id) ?? [];

  const memberGroupIds = useMemo(() => myGroups.map((g) => g.id), [myGroups]);
  const activityCounts = useGroupActivity(memberGroupIds);

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-20 pb-8 max-w-4xl mx-auto">
      <Helmet>
        <title>The Village | Xcrol</title>
        <meta name="description" content="User groups and communities" />
      </Helmet>

      <Button
        variant="ghost"
        size="sm"
        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

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
                  <GroupCard
                    key={group.id}
                    group={group}
                    newPostCount={activityCounts.get(group.id) ?? 0}
                    onClick={() => navigate(`/group/${group.slug}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {otherGroups.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Discover Groups</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherGroups.map((group) => (
                  <GroupCard key={group.id} group={group} newPostCount={0} onClick={() => navigate(`/group/${group.slug}`)} />
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

const GroupCard = ({
  group,
  newPostCount,
  onClick,
}: {
  group: ReturnType<typeof useGroups>["data"] extends (infer T)[] | undefined ? T : never;
  newPostCount: number;
  onClick: () => void;
}) => (
  <Card
    className="cursor-pointer hover:border-primary/50 transition-colors"
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center gap-3 pb-2">
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          {group.avatar_url ? (
            <img src={group.avatar_url} alt={group.name} className="aspect-square h-full w-full object-cover" />
          ) : (
            <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        {newPostCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {newPostCount > 99 ? "99+" : newPostCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <CardTitle className="text-base truncate">{group.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{group.member_count} member{group.member_count !== 1 ? "s" : ""}</p>
      </div>
    </CardHeader>
    <CardContent className="pt-0 space-y-2">
      {group.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {getFriendshipLabel(group.trust_level)}
        </Badge>
        {group.membership_status === "pending" && (
          <Badge variant="outline" className="text-xs">Pending</Badge>
        )}
      </div>
    </CardContent>
  </Card>
);

export default TheVillage;
