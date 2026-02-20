import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import type { UnreadMessageSender } from "@/hooks/use-notifications";

interface UnreadMessagesItemProps {
  count: number;
  senders?: UnreadMessageSender[];
}

const UnreadMessagesItem = ({ count, senders = [] }: UnreadMessagesItemProps) => {
  const navigate = useNavigate();

  const senderNames = senders
    .map((s) => s.display_name?.split(" ")[0] || "Someone")
    .filter(Boolean);

  let fromText = "";
  if (senderNames.length === 1) {
    fromText = `from ${senderNames[0]}`;
  } else if (senderNames.length === 2) {
    fromText = `from ${senderNames[0]} and ${senderNames[1]}`;
  } else if (senderNames.length > 2) {
    fromText = `from ${senderNames[0]}, ${senderNames[1]} and ${senderNames.length - 2} other${senderNames.length - 2 > 1 ? "s" : ""}`;
  }

  return (
    <button
      onClick={() => navigate("/messages")}
      className="w-full p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {count} unread message{count > 1 ? "s" : ""}
          </p>
          {fromText && (
            <p className="text-sm text-muted-foreground truncate">{fromText}</p>
          )}
        </div>
      </div>
    </button>
  );
};

export default UnreadMessagesItem;
