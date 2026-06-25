import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    let hardTimeout: ReturnType<typeof setTimeout> | undefined;

    const applySession = (nextSession: Session | null, finalized = true) => {
      if (!mounted) return;
      if (finalized) initializedRef.current = true;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    const clearTimers = () => {
      if (graceTimer) clearTimeout(graceTimer);
      if (hardTimeout) clearTimeout(hardTimeout);
    };

    const restoreStoredSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        clearTimers();
        applySession(session);
      } catch (error) {
        clearTimers();
        console.error("Auth session restore failed:", error);
        applySession(null);
      }
    };

    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") {
          // A real stored session should be trusted immediately. A null initial
          // session gets a short grace window so ProtectedRoute does not bounce a
          // signed-in user before getSession finishes restoring browser storage.
          if (session) {
            clearTimers();
            applySession(session);
          } else if (!initializedRef.current) {
            graceTimer = setTimeout(() => {
              if (!initializedRef.current) applySession(null);
            }, 1200);
          }
          return;
        }

        clearTimers();
        applySession(session);
      }
    );

    // THEN check for existing session. Guard it so a browser/storage/SW edge case
    // can never leave protected pages on an infinite spinner.
    restoreStoredSession();
    hardTimeout = setTimeout(() => {
      if (!initializedRef.current) {
        console.warn("Auth session restore timed out; continuing as signed out.");
        applySession(null);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimers();
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
