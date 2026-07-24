import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

type SessionState = {
  session: Session | null;
  /** True until the initial session restore has completed. */
  loading: boolean;
};

const SessionContext = createContext<SessionState>({
  session: null,
  loading: true,
});

/**
 * Makes the Supabase auth session available to the whole app.
 * supabase-js persists the session (localStorage on web) and refreshes
 * tokens automatically; we just mirror its state into React.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Without auth config the app still works, just permanently signed out.
    if (!isSupabaseConfigured()) {
      setState({ session: null, loading: false });
      return;
    }

    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, loading: false });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ session, loading: false });
      },
    );
    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
