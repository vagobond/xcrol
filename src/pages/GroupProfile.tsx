import { useState } from "react";
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
} from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, LogOut, UserPlus, Shield, Trash2 } from "lucide-react";
import { getFriendshipLabel } from "@/lib/friendship-labels";
import { formatDistanceToNow } from "date-fns";

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

  const [postContent, setPostContent] = useState("");
  const [postLink, setPostLink] = useState("");

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

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !group.id) return;
    await createPost.mutateAsync({
      group_id: group.id,
      content: postContent.trim(),
      link: postLink.trim() || undefined,
    });
    setPostContent("");
    setPostLink("");
  };

  const handleJoin = () => joinGroup.mutate(group.id);
  const handleLeave = () => leaveGroup.mutate(group.id);
  const handleApproveMember = (memberId: string) =>
    updateMember.mutate({ memberId, updates: { status: "active" } });
  const handleRejectMember = (memberId: string) =>
    updateMember.mutate({ memberId, updates: { status: "rejected" } });
  const handlePromote = (memberId: string) =>
    updateMember.mutate({ memberId, updates: { role: "co_admin" } });
  const handleDemote = (memberId: string) =>
    updateMember.mutate({ memberId, updates: { role: "member" } });

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-20 pb-8 max-w-3xl mx-auto">
      <Helmet>
        <title>{group.name} | The Village | Xcrol</title>
        <meta name="description" content={group.description ?? `${group.name} group`} />
      </Helmet>

      {/* Group Header */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={group.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl">{group.name.charAt(0).toUpperCase()}</AvatarFallback>
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
            {user && !group.is_member && group.membership_status !== "pending" && (
              <Button onClick={handleJoin} disabled={joinGroup.isPending} size="sm" className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Request to Join
              </Button>
            )}
            {group.membership_status === "pending" && (
              <Button disabled variant="outline" size="sm" className="w-full sm:w-auto">Pending Approval</Button>
            )}
            {group.is_member && !isCreator && (
              <Button variant="outline" onClick={handleLeave} size="sm" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Leave
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Content - only for members */}
      {group.is_member ? (
        <Tabs defaultValue="posts">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="members">Members ({activeMembers.length})</TabsTrigger>
            {group.is_admin && pendingMembers.length > 0 && (
              <TabsTrigger value="requests">
                Requests ({pendingMembers.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="space-y-4 mt-4">
            {/* New post form */}
            <Card>
              <CardContent className="pt-4">
                <form onSubmit={handlePost} className="space-y-3">
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share something with the group..."
                    rows={3}
                  />
                  <Input
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    placeholder="Add a link (optional)"
                  />
                  <Button
                    type="submit"
                    disabled={!postContent.trim() || createPost.isPending}
                    size="sm"
                  >
                    {createPost.isPending ? "Posting..." : "Post"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Posts list */}
            {posts?.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.profile?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {post.profile?.display_name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {post.profile?.display_name ?? "Unknown"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                          {(post.user_id === user?.id || group.is_admin) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deletePost.mutate({ postId: post.id, groupId: group.id })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{post.content}</p>
                      {post.link && (
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-1 block truncate"
                        >
                          {post.link}
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!posts || posts.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No posts yet. Be the first to share!
              </p>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                {activeMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {member.profile?.display_name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.profile?.display_name ?? "Unknown"}
                      </p>
                    </div>
                    <Badge variant={member.role === "admin" ? "default" : member.role === "co_admin" ? "secondary" : "outline"} className="text-xs">
                      {member.role === "admin" ? "Creator" : member.role === "co_admin" ? "Co-Admin" : "Member"}
                    </Badge>
                    {group.is_admin && member.user_id !== user?.id && member.role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          member.role === "co_admin"
                            ? handleDemote(member.id)
                            : handlePromote(member.id)
                        }
                        title={member.role === "co_admin" ? "Demote to member" : "Promote to co-admin"}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {group.is_admin && (
            <TabsContent value="requests" className="mt-4">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  {pendingMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                  ) : (
                    pendingMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profile?.avatar_url ?? undefined} />
                          <AvatarFallback>
                            {member.profile?.display_name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium flex-1 truncate">
                          {member.profile?.display_name ?? "Unknown"}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveMember(member.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectMember(member.id)}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
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
