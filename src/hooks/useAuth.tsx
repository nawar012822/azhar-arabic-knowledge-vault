import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/permissions";

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (u: User | null) => {
      setUser(u);
      if (u) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
        setRoles((data ?? []).map((r) => r.role as Role));
      } else setRoles([]);
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
  return <Ctx.Provider value={{ user, roles, loading, isAdmin, isStaff: isAdmin || roles.includes("moderator") }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
