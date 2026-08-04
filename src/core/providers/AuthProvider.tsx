import * as React from "react";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { initSupabaseBrowser } from "@/core/lib/supabase/client";

export interface AuthState {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, meta?: Record<string, unknown>) => Promise<void>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = React.createContext<AuthState | null>(null);

export interface AuthProviderProps {
  config: { url: string; publishableKey: string };
  children: React.ReactNode;
}

export function AuthProvider({ config, children }: AuthProviderProps) {
  const supabase = React.useMemo(() => {
    const url = config?.url || import.meta.env.VITE_SUPABASE_URL;
    const key = config?.publishableKey || import.meta.env.VITE_SUPABASE_ANON_KEY;
    return initSupabaseBrowser(url, key);
  }, [config.url, config.publishableKey]);
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    let mounted = true;
    
    // Safety check for supabase initialization
    if (!supabase || !supabase.auth) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error("Auth session fetch error:", err);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "TOKEN_REFRESHED") return;
      setSession(next);
      setUser(next?.user ?? null);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });

    return () => {
      mounted = false;
      if (sub && sub.subscription) {
        sub.subscription.unsubscribe();
      }
    };
  }, [supabase, router, queryClient]);

  const value = React.useMemo<AuthState>(
    () => ({
      supabase,
      user,
      session,
      loading,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(email, password, meta) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            data: meta,
          },
        });
        if (error) throw error;
      },
      async signInWithOAuth(provider) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/reset-password`
              : undefined,
        });
        if (error) throw error;
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      },
      async signOut() {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
    }),
    [supabase, user, session, loading, queryClient],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return ctx;
}

export function useOptionalAuth(): AuthState | null {
  return React.useContext(AuthCtx);
}