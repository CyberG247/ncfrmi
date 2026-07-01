import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "commissioner" | "officer" | "guest";

type Ctx = {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  setRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  session: null,
  user: null,
  role: "guest",
  loading: true,
  setRole: () => {},
  signOut: async () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const sim = localStorage.getItem("ncfrmi_simulated_user");
      if (sim) {
        const parsed = JSON.parse(sim);
        return {
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh",
          user: {
            id: `mock-id-${parsed.role}`,
            aud: "authenticated",
            role: "authenticated",
            email: parsed.email,
            user_metadata: {
              full_name: parsed.role === "commissioner" ? "Hon. Commissioner Aliyu Ahmed" : "Officer Musa Bello"
            },
            app_metadata: {},
            created_at: new Date().toISOString()
          }
        } as any;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const sim = localStorage.getItem("ncfrmi_simulated_user");
      if (sim) {
        return JSON.parse(sim).role;
      }
    } catch (e) {
      console.error(e);
    }
    return "guest";
  });

  useEffect(() => {
    const sim = localStorage.getItem("ncfrmi_simulated_user");
    if (sim) {
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sim = localStorage.getItem("ncfrmi_simulated_user");
    if (sim) {
      try {
        setRoleState(JSON.parse(sim).role);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (session?.user) {
      const email = session.user.email;
      const savedRoles = JSON.parse(localStorage.getItem("ncfrmi_user_roles") || "{}");
      if (savedRoles[email]) {
        setRoleState(savedRoles[email]);
      } else if (email?.includes("commissioner")) {
        setRoleState("commissioner");
      } else if (email?.includes("officer")) {
        setRoleState("officer");
      } else {
        setRoleState("officer"); // default logged in user to officer for testing
      }
    } else {
      setRoleState("guest");
    }
  }, [session]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (session?.user?.email) {
      const savedRoles = JSON.parse(localStorage.getItem("ncfrmi_user_roles") || "{}");
      savedRoles[session.user.email] = newRole;
      localStorage.setItem("ncfrmi_user_roles", JSON.stringify(savedRoles));
    }
  };

  const signOut = async () => {
    localStorage.removeItem("ncfrmi_simulated_user");
    setRoleState("guest");
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ session, user: session?.user ?? null, role, loading, setRole, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
