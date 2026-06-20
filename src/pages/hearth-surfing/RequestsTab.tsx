import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Check, X } from "lucide-react";
import { HostingRequest } from "./types";
import { StayReferenceDialog } from "@/components/StayReferenceDialog";
import { ShareStayMomentButton } from "@/components/ShareStayMomentButton";

interface Props {
  loading: boolean;
  incoming: HostingRequest[];
  outgoing: HostingRequest[];
  onRespond: (id: string, status: "accepted" | "declined") => void;
}

const statusVariant = (s: string) =>
  s === "pending" ? "outline" : s === "accepted" ? "default" : "destructive";

const stayIsOver = (departure: string | null): boolean => {
  if (!departure) return false;
  const dep = new Date(departure);
  if (Number.isNaN(dep.getTime())) return false;
  return dep.getTime() < Date.now();
};

export default function RequestsTab({ loading, incoming, outgoing, onRespond }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Incoming Requests</CardTitle>
          <CardDescription>People who want to stay with you</CardDescription>
        </CardHeader>
        <CardContent>
          {incoming.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No incoming requests</p>
          ) : (
            <div className="space-y-3">
              {incoming.map((request) => (
                <div key={request.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={request.from_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(request.from_profile?.display_name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{request.from_profile?.display_name || "Unknown User"}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.arrival_date && request.departure_date
                        ? `${new Date(request.arrival_date).toLocaleDateString()} - ${new Date(request.departure_date).toLocaleDateString()}`
                        : "Dates not specified"}
                      {request.num_guests &&
                        ` • ${request.num_guests} guest${request.num_guests !== 1 ? "s" : ""}`}
                    </p>
                    {request.companions_note && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Traveling with: {request.companions_note}
                      </p>
                    )}
                    {request.skills_offered && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Skills offered: {request.skills_offered}
                      </p>
                    )}
                    <p className="text-sm mt-1">{request.message}</p>
                    <Badge variant={statusVariant(request.status) as any} className="mt-2">
                      {request.status}
                    </Badge>
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => onRespond(request.id, "accepted")}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onRespond(request.id, "declined")}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {request.status === "accepted" && stayIsOver(request.departure_date) && (
                    <div className="flex flex-col gap-1">
                      <StayReferenceDialog
                        hostingRequestId={request.id}
                        recipientId={request.from_user_id}
                        recipientName={request.from_profile?.display_name || "your guest"}
                        role="guest"
                      />
                      <ShareStayMomentButton
                        otherUserId={request.from_user_id}
                        otherUserName={request.from_profile?.display_name || "your guest"}
                        role="host"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Requests</CardTitle>
          <CardDescription>Your hosting requests to others</CardDescription>
        </CardHeader>
        <CardContent>
          {outgoing.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No outgoing requests</p>
          ) : (
            <div className="space-y-3">
              {outgoing.map((request) => (
                <div key={request.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={request.to_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(request.to_profile?.display_name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{request.to_profile?.display_name || "Unknown User"}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.arrival_date && request.departure_date
                        ? `${new Date(request.arrival_date).toLocaleDateString()} - ${new Date(request.departure_date).toLocaleDateString()}`
                        : "Dates not specified"}
                    </p>
                    <Badge variant={statusVariant(request.status) as any} className="mt-2">
                      {request.status}
                    </Badge>
                    {request.response_message && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        Response: {request.response_message}
                      </p>
                    )}
                    {request.status === "accepted" && request.host_precise_address && (
                      <div className="mt-2 rounded-md border border-border bg-muted/40 p-2 text-sm">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Host's address (private to you)
                        </p>
                        <p className="whitespace-pre-line">{request.host_precise_address}</p>
                      </div>
                    )}
                  </div>
                  {request.status === "accepted" && stayIsOver(request.departure_date) && (
                    <div className="flex flex-col gap-1">
                      <StayReferenceDialog
                        hostingRequestId={request.id}
                        recipientId={request.to_user_id}
                        recipientName={request.to_profile?.display_name || "your host"}
                        role="host"
                      />
                      <ShareStayMomentButton
                        otherUserId={request.to_user_id}
                        otherUserName={request.to_profile?.display_name || "your host"}
                        role="guest"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
