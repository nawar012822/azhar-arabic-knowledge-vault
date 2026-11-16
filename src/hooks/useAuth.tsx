import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/permissions";
import { useQuery } from "@tanstack/react-query";

interface AuthState {
  user: User | null;
  roles: Role[];
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const Ctx = createContext<AuthState>({ user: null, roles: [], loading: true, isAdmin: false, isStaff: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const rolesQuery = useQuery({
    queryKey: ["roles", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Role[]> => {
      if (!user) return [];
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as Role);
    },
  });
  const roles = user ? rolesQuery.data ?? [] : [];

  useEffect(() => {
    const load = async (u: User | null) => {
      setUser(u);
      setLoading(false);
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // defer: avoid calling Supabase inside the auth callback
        setTimeout(() => void load(session?.user ?? null), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  return <Ctx.Provider value={{ user, roles, loading: loading || (Boolean(user) && rolesQuery.isLoading), isAdmin, isStaff: isAdmin || roles.includes("moderator") }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
