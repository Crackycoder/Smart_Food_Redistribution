import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? "";
const supabaseAnonKey =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  // Helpful console warning; we still create a client so the app boots.
  // The user is expected to add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
  // eslint-disable-next-line no-console
  console.warn(
    "[ShareBite] Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  },
);

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "donor" | "receiver";
  created_at: string;
};

export type FoodPost = {
  id: string;
  user_id: string;
  food_name: string;
  quantity: string;
  expiry_time: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  status: "available" | "matched" | "claimed";
  created_at: string;
};

export type Claim = {
  id: string;
  food_id: string;
  claimer_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type ChatMessage = {
  id: string;
  food_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};
