import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, type Profile } from "@/lib/data";
import { canManageBills, isOwnerProfile } from "@/lib/permissions";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  profileLoading: boolean;
  profileError: Error | null;
  isOwner: boolean;
  isApproved: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error(error);
      setSession(data.session);
      setSessionLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
    retry: 1,
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 15_000 : false),
  });

  useEffect(() => {
    if (!userId) {
      queryClient.removeQueries({ queryKey: ["profile"] });
    }
  }, [queryClient, userId]);

  const profile = profileQuery.data ?? null;
  const profileError = profileQuery.error ?? null;

  async function refreshProfile() {
    await profileQuery.refetch();
  }

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.removeQueries({ queryKey: ["profile"] });
    queryClient.removeQueries({ queryKey: ["pending-profiles"] });
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    isLoading: sessionLoading || (Boolean(userId) && profileQuery.isLoading),
    profileLoading: profileQuery.isLoading,
    profileError,
    isOwner: isOwnerProfile(profile),
    isApproved: canManageBills(profile),
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
