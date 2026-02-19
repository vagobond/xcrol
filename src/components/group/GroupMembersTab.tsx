import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import type { GroupMember } from "@/hooks/use-groups";

interface GroupMembersTabProps {
  members: GroupMember[];
  isAdmin: boolean;
  userId?: string;
  onPromote: (memberId: string) => void;
  onDemote: (memberId: string) => void;
}

const GroupMembersTab = ({ members, isAdmin, userId, onPromote, onDemote }: GroupMembersTabProps) => (
  <Card>
    <CardContent className="pt-4 space-y-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={member.profile?.avatar_url ?? undefined} />
            <AvatarFallback>{member.profile?.display_name?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{member.profile?.display_name ?? "Unknown"}</p>
          </div>
          <Badge
            variant={member.role === "admin" ? "default" : member.role === "co_admin" ? "secondary" : "outline"}
            className="text-xs shrink-0"
          >
            {member.role === "admin" ? "Creator" : member.role === "co_admin" ? "Co-Admin" : "Member"}
          </Badge>
          {isAdmin && member.user_id !== userId && member.role !== "admin" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => (member.role === "co_admin" ? onDemote(member.id) : onPromote(member.id))}
              title={member.role === "co_admin" ? "Demote to member" : "Promote to co-admin"}
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default GroupMembersTab;
