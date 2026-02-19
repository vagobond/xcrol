import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { GroupMember } from "@/hooks/use-groups";

interface GroupRequestsTabProps {
  pendingMembers: GroupMember[];
  onApprove: (memberId: string) => void;
  onReject: (memberId: string) => void;
}

const GroupRequestsTab = ({ pendingMembers, onApprove, onReject }: GroupRequestsTabProps) => (
  <Card>
    <CardContent className="pt-4 space-y-3">
      {pendingMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending requests</p>
      ) : (
        pendingMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={member.profile?.avatar_url ?? undefined} />
              <AvatarFallback>{member.profile?.display_name?.charAt(0) ?? "?"}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium flex-1 truncate">{member.profile?.display_name ?? "Unknown"}</p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => onApprove(member.id)}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => onReject(member.id)}>Reject</Button>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

export default GroupRequestsTab;
