import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase, type AppUser } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: "donor" | "receiver";
  }) => Promise<AppUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "sharebite_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const persist = (u: AppUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login: AuthContextValue["login"] = async (email, password) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("password", password)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Invalid email or password");
    persist(data as AppUser);
    return data as AppUser;
  };

  const register: AuthContextValue["register"] = async (input) => {
    const email = input.email.toLowerCase().trim();
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) throw new Error("An account with this email already exists");
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: input.name.trim(),
        email,
        password: input.password,
        role: input.role,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    persist(data as AppUser);
    return data as AppUser;
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
