import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scroll } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface GuestAuthGateContextValue {
  /**
   * Returns true if the user is authenticated. If not, opens the sign-up
   * prompt modal and returns false. Use as: `if (!requireAuth("post a reply")) return;`
   */
  requireAuth: (action?: string) => boolean;
}

const GuestAuthGateContext = createContext<GuestAuthGateContextValue | null>(null);

export const GuestAuthGateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const requireAuth = useCallback(
    (actionLabel?: string) => {
      if (user) return true;
      setAction(actionLabel ?? null);
      setOpen(true);
      return false;
    },
    [user]
  );

  return (
    <GuestAuthGateContext.Provider value={{ requireAuth }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Scroll className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">
              {action ? `Sign up to ${action}` : "Sign up to join the conversation"}
            </DialogTitle>
            <DialogDescription className="text-center">
              XCROL is a small invite-light social space built on real friendships. Create an
              account and verify your email to post, reply, and react. Your draft will stay
              in the field while you sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild size="lg">
              <Link to="/auth">Sign up or sign in</Link>
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep browsing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GuestAuthGateContext.Provider>
  );
};

export const useRequireAuth = () => {
  const ctx = useContext(GuestAuthGateContext);
  // Fallback: if provider isn't mounted (legacy contexts), behave as auth-required.
  if (!ctx) {
    return (_action?: string) => true;
  }
  return ctx.requireAuth;
};
