import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MentionText } from "@/components/MentionText";
import { LinkPreview } from "@/components/LinkPreview";
import { GroupPostReactions } from "@/components/group/GroupPostReactions";
import { GroupPostComments } from "@/components/group/GroupPostComments";
import type { GroupPost, Group } from "@/hooks/use-groups";

interface GroupPostsTabProps {
  posts: GroupPost[] | undefined;
  group: Group;
  userId?: string;
  onCreatePost: (content: string, link?: string) => Promise<void>;
  onDeletePost: (postId: string) => void;
  createPending: boolean;
  lastVisitedAt?: string | null;
}

const GroupPostsTab = ({ posts, group, userId, onCreatePost, onDeletePost, createPending, lastVisitedAt }: GroupPostsTabProps) => {
  const navigate = useNavigate();
  const [postContent, setPostContent] = useState("");
  const [postLink, setPostLink] = useState("");

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    await onCreatePost(postContent.trim(), postLink.trim() || undefined);
    setPostContent("");
    setPostLink("");
  };

  const handleAuthorClick = (post: GroupPost) => {
    if (post.profile?.username) navigate(`/${post.profile.username}`);
    else navigate(`/u/${post.user_id}`);
  };

  return (
    <div className="space-y-4">
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
              placeholder="Add a link (optional — PixelFed & PeerTube embeds supported)"
            />
            <Button type="submit" disabled={!postContent.trim() || createPending} size="sm">
              {createPending ? "Posting..." : "Post"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {posts?.map((post) => (
        <Card key={post.id} className="hover:bg-accent/50 transition-colors">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar
                className="h-10 w-10 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => handleAuthorClick(post)}
              >
                <AvatarImage src={post.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{post.profile?.display_name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium cursor-pointer hover:underline"
                      onClick={() => handleAuthorClick(post)}
                    >
                      {post.profile?.display_name ?? "Unknown"}
                    </span>
                    {post.profile?.username && (
                      <span className="text-muted-foreground text-xs">@{post.profile.username}</span>
                    )}
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    {lastVisitedAt && new Date(post.created_at) > new Date(lastVisitedAt) && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 leading-none">
                        New
                      </Badge>
                    )}
                  </div>
                  {(post.user_id === userId || group.is_admin) && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeletePost(post.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <p className="mt-2 text-sm whitespace-pre-wrap break-words">
                  <MentionText content={post.content} />
                </p>

                {post.link && (
                  <>
                    <LinkPreview url={post.link} />
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {(() => {
                        try { return new URL(post.link).hostname; } catch { return post.link; }
                      })()}
                    </a>
                  </>
                )}

                {/* Reactions */}
                <div className="mt-3">
                  <GroupPostReactions targetId={post.id} targetType="post" />
                </div>

                {/* Threaded Comments */}
                <GroupPostComments postId={post.id} currentUserId={userId ?? null} lastVisitedAt={lastVisitedAt} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {(!posts || posts.length === 0) && (
        <p className="text-center text-muted-foreground py-8">No posts yet. Be the first to share!</p>
      )}
    </div>
  );
};

export default GroupPostsTab;
