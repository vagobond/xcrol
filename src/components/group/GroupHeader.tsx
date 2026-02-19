import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LogOut, UserPlus } from "lucide-react";
import { getFriendshipLabel } from "@/lib/friendship-labels";
import type { Group } from "@/hooks/use-groups";

interface GroupHeaderProps {
  group: Group;
  isCreator: boolean;
  userId?: string;
  onJoin: () => void;
  onLeave: () => void;
  joinPending: boolean;
}

const GroupHeader = ({ group, isCreator, userId, onJoin, onLeave, joinPending }: GroupHeaderProps) => (
  <Card className="mb-6">
    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <Avatar className="h-16 w-16 shrink-0">
        {group.avatar_url ? (
          <img src={group.avatar_url} alt={group.name} className="aspect-square h-full w-full object-cover" />
        ) : (
          <AvatarFallback className="text-2xl">{group.name.charAt(0).toUpperCase()}</AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <CardTitle className="text-2xl">{group.name}</CardTitle>
        {group.description && (
          <p className="text-muted-foreground mt-1">{group.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="secondary">{getFriendshipLabel(group.trust_level)}</Badge>
          <span className="text-sm text-muted-foreground">
            <Users className="inline h-4 w-4 mr-1" />
            {group.member_count} member{group.member_count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        {userId && !group.is_member && group.membership_status !== "pending" && (
          <Button onClick={onJoin} disabled={joinPending} size="sm" className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Request to Join
          </Button>
        )}
        {group.membership_status === "pending" && (
          <Button disabled variant="outline" size="sm" className="w-full sm:w-auto">Pending Approval</Button>
        )}
        {group.is_member && !isCreator && (
          <Button variant="outline" onClick={onLeave} size="sm" className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Leave
          </Button>
        )}
      </div>
    </CardHeader>
  </Card>
);

export default GroupHeader;
