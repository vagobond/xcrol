import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/hooks/use-notifications";

interface Props {
  viewMode: ViewMode;
  onChange: (m: ViewMode) => void;
  onMarkAllRead?: () => void;
  hasUnread?: boolean;
}

const NotificationViewToggle = ({ viewMode, onChange, onMarkAllRead, hasUnread }: Props) => {
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="inline-flex rounded-md border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => onChange("unread")}
          className={`px-2 py-0.5 text-[11px] transition-colors ${
            viewMode === "unread" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-muted"
          }`}
        >
          Unread
        </button>
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`px-2 py-0.5 text-[11px] transition-colors border-l border-border ${
            viewMode === "all" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-muted"
          }`}
        >
          All recent
        </button>
      </div>
      {viewMode === "all" && hasUnread && onMarkAllRead && (
        <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={onMarkAllRead}>
          Mark all read
        </Button>
      )}
    </div>
  );
};

export default NotificationViewToggle;
