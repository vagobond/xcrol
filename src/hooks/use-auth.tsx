import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const getStoredSessionSnapshot = (): Session | null => {
  if (typeof window === "undefined") return null;

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : null;
    const preferredKey = projectRef ? `sb-${projectRef}-auth-token` : null;
    const storageKeys = preferredKey
      ? [preferredKey]
      : Object.keys(window.localStorage).filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));

    for (const key of storageKeys) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as { access_token?: string; refresh_token?: string; expires_at?: number; user?: User };
      if (parsed?.access_token && parsed?.refresh_token && parsed?.user?.id) {
        return parsed as Session;
      }
    }
  } catch (error) {
    console.warn("Unable to inspect stored auth session:", error);
  }

  return null;
};

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
    let hardTimeout: ReturnType<typeof setTimeout> | undefined;

    const applySession = (nextSession: Session | null, finalized = true) => {
      if (!mounted) return;
      if (finalized) initializedRef.current = true;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    const clearTimers = () => {
      if (hardTimeout) clearTimeout(hardTimeout);
    };

    const restoreStoredSession = async () => {
      try {
        const storedSession = getStoredSessionSnapshot();
        if (storedSession) {
          // Optimistically keep the app in the signed-in state while Supabase
          // validates/refreshes the session. This prevents route guards from
          // treating a refresh-time null INITIAL_SESSION as a logout.
          applySession(storedSession, false);
        }

        const { data: { session } } = await supabase.auth.getSession();
        clearTimers();
        applySession(session ?? getStoredSessionSnapshot());
      } catch (error) {
        clearTimers();
        console.error("Auth session restore failed:", error);
        applySession(getStoredSessionSnapshot());
      }
    };

    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") {
          // A real stored session should be trusted immediately. A null initial
          // session is not enough to declare the user signed out; wait for the
          // explicit getSession() call below. That prevents refresh-time races
          // from bouncing a valid user to /auth.
          if (session) {
            clearTimers();
            applySession(session);
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
        const storedSession = getStoredSessionSnapshot();
        if (storedSession) {
          console.warn("Auth session restore timed out; using stored session snapshot.");
          applySession(storedSession);
        } else {
          console.warn("Auth session restore timed out; continuing as signed out.");
          applySession(null);
        }
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
