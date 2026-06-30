import { useBackendHealth } from "@/lib/offline-mode";
import { CloudOff } from "lucide-react";

/**
 * Read-only fallback banner. Shows once when the backend health probe fails
 * so visitors understand why writes are disabled and that they're seeing a
 * cached public snapshot. Isolated, presentation-only.
 */
export const OfflineBanner = () => {
  const status = useBackendHealth();
  if (status !== "offline") return null;

  return (
    <div
      role="status"
      className="w-full bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 border-b border-amber-300/60 dark:border-amber-800/60 text-sm"
    >
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
        <CloudOff className="w-4 h-4 shrink-0" />
        <span>
          XCROL is in read-only mode. You're viewing a cached public snapshot — sign-in, posting and replies are temporarily unavailable.
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;
