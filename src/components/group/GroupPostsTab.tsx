import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { GroupPost, Group } from "@/hooks/use-groups";

interface GroupPostsTabProps {
  posts: GroupPost[] | undefined;
  group: Group;
  userId?: string;
  onCreatePost: (content: string, link?: string) => Promise<void>;
  onDeletePost: (postId: string) => void;
  createPending: boolean;
}

const GroupPostsTab = ({ posts, group, userId, onCreatePost, onDeletePost, createPending }: GroupPostsTabProps) => {
  const [postContent, setPostContent] = useState("");
  const [postLink, setPostLink] = useState("");

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    await onCreatePost(postContent.trim(), postLink.trim() || undefined);
    setPostContent("");
    setPostLink("");
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
              placeholder="Add a link (optional)"
            />
            <Button type="submit" disabled={!postContent.trim() || createPending} size="sm">
              {createPending ? "Posting..." : "Post"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {posts?.map((post) => (
        <Card key={post.id}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={post.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{post.profile?.display_name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{post.profile?.display_name ?? "Unknown"}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    {(post.user_id === userId || group.is_admin) && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeletePost(post.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{post.content}</p>
                {post.link && (
                  <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block truncate">
                    {post.link}
                  </a>
                )}
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
