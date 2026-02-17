import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { WaitlistEntry } from "./types";

interface WaitlistTabProps {
  waitlist: WaitlistEntry[];
  onAccepted?: (id: string) => void;
}

function generateInviteCode(): string {
  return crypto.randomUUID();
}

export function WaitlistTab({ waitlist, onAccepted }: WaitlistTabProps) {
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  const handleAccept = async (entry: WaitlistEntry) => {
    setProcessing((prev) => new Set(prev).add(entry.id));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }

      const inviteCode = generateInviteCode();

      // Create the invite record
      const { error: inviteError } = await supabase.from("user_invites").insert({
        inviter_id: session.user.id,
        invitee_email: entry.email,
        invite_code: inviteCode,
        status: "pending",
        sent_at: new Date().toISOString(),
      });
      if (inviteError) throw inviteError;

      // Mark waitlist entry as invited
      const { error: updateError } = await supabase
        .from("waitlist")
        .update({ invited_at: new Date().toISOString() })
        .eq("id", entry.id);
      if (updateError) throw updateError;

      // Send the acceptance email
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-waitlist-acceptance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email: entry.email, inviteCode }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to send email");

      toast.success(`Acceptance email sent to ${entry.email}`);
      setAcceptedIds((prev) => new Set(prev).add(entry.id));
      onAccepted?.(entry.id);
    } catch (error: any) {
      console.error("Error accepting waitlist user:", error);
      toast.error(error.message || "Failed to accept user");
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  const pendingEntries = waitlist.filter((e) => !e.invited_at && !acceptedIds.has(e.id));
  const invitedEntries = waitlist.filter((e) => e.invited_at || acceptedIds.has(e.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Waitlist ({waitlist.length})
        </CardTitle>
        <CardDescription>Users waiting for an invite code. Accept to send them an invitation email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pendingEntries.length === 0 && invitedEntries.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No users on the waitlist</p>
        )}

        {pendingEntries.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending ({pendingEntries.length})</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={processing.has(entry.id)}
                        onClick={() => handleAccept(entry)}
                      >
                        {processing.has(entry.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Accept
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(entry.email); toast.success("Email copied!"); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {invitedEntries.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Already Invited ({invitedEntries.length})</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined Waitlist</TableHead>
                  <TableHead>Invited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitedEntries.map((entry) => (
                  <TableRow key={entry.id} className="opacity-60">
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.invited_at ? new Date(entry.invited_at).toLocaleDateString() : "Just now"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
