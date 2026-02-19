import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  useGroupBySlug,
  useGroupMembers,
  useGroupPosts,
  useCreateGroupPost,
  useJoinGroup,
  useLeaveGroup,
  useUpdateMember,
  useDeleteGroupPost,
  useUpdateGroup,
} from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users } from "lucide-react";
import GroupHeader from "@/components/group/GroupHeader";
import GroupPostsTab from "@/components/group/GroupPostsTab";
import GroupMembersTab from "@/components/group/GroupMembersTab";
import GroupRequestsTab from "@/components/group/GroupRequestsTab";
import GroupSettingsTab from "@/components/group/GroupSettingsTab";

const GroupProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: group, isLoading } = useGroupBySlug(slug);
  const { data: members } = useGroupMembers(group?.id);
  const { data: posts } = useGroupPosts(group?.is_member ? group?.id : undefined);
  const createPost = useCreateGroupPost();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const updateMember = useUpdateMember();
  const deletePost = useDeleteGroupPost();
  const updateGroup = useUpdateGroup();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const activeMembers = members?.filter((m) => m.status === "active") ?? [];
  const pendingMembers = members?.filter((m) => m.status === "pending") ?? [];
  const isCreator = user?.id === group.creator_id;

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-20 pb-8 max-w-3xl mx-auto">
      <Helmet>
        <title>{group.name} | The Village | Xcrol</title>
        <meta name="description" content={group.description ?? `${group.name} group`} />
      </Helmet>

      <GroupHeader
        group={group}
        isCreator={isCreator}
        userId={user?.id}
        onJoin={() => joinGroup.mutate(group.id)}
        onLeave={() => leaveGroup.mutate(group.id)}
        joinPending={joinGroup.isPending}
      />

      {group.is_member ? (
        <Tabs defaultValue="posts">
           <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="members">Members ({activeMembers.length})</TabsTrigger>
            {group.is_admin && pendingMembers.length > 0 && (
              <TabsTrigger value="requests">Requests ({pendingMembers.length})</TabsTrigger>
            )}
            {group.is_admin && (
              <TabsTrigger value="settings">Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <GroupPostsTab
              posts={posts}
              group={group}
              userId={user?.id}
              onCreatePost={async (content, link) => {
                await createPost.mutateAsync({ group_id: group.id, content, link });
              }}
              onDeletePost={(postId) => deletePost.mutate({ postId, groupId: group.id })}
              createPending={createPost.isPending}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <GroupMembersTab
              members={activeMembers}
              isAdmin={!!group.is_admin}
              userId={user?.id}
              onPromote={(id) => updateMember.mutate({ memberId: id, updates: { role: "co_admin" } })}
              onDemote={(id) => updateMember.mutate({ memberId: id, updates: { role: "member" } })}
            />
          </TabsContent>

          {group.is_admin && (
            <TabsContent value="requests" className="mt-4">
              <GroupRequestsTab
                pendingMembers={pendingMembers}
                onApprove={(id) => updateMember.mutate({ memberId: id, updates: { status: "active" } })}
                onReject={(id) => updateMember.mutate({ memberId: id, updates: { status: "rejected" } })}
              />
            </TabsContent>
          )}

          {group.is_admin && (
            <TabsContent value="settings" className="mt-4">
              <GroupSettingsTab
                group={group}
                onSave={async (updates) => {
                  await updateGroup.mutateAsync({ groupId: group.id, updates });
                }}
                saving={updateGroup.isPending}
              />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Join this group to see posts and members</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GroupProfile;
