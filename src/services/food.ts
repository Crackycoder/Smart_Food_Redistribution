import { supabase, type FoodPost } from "@/integrations/supabase/client";

export async function listAvailableFood(): Promise<FoodPost[]> {
  const { data, error } = await supabase
    .from("food_posts")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FoodPost[];
}

export async function listMyFood(userId: string): Promise<FoodPost[]> {
  const { data, error } = await supabase
    .from("food_posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FoodPost[];
}

export async function getFoodPost(id: string): Promise<FoodPost | null> {
  const { data, error } = await supabase
    .from("food_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as FoodPost) ?? null;
}

export async function createFoodPost(input: {
  user_id: string;
  food_name: string;
  quantity: string;
  expiry_time: string;
  description?: string;
  location?: string;
  image_url?: string;
}): Promise<FoodPost> {
  const { data, error } = await supabase
    .from("food_posts")
    .insert({ ...input, status: "available" })
    .select("*")
    .single();
  if (error) throw error;
  return data as FoodPost;
}

export async function updateFoodStatus(
  id: string,
  status: FoodPost["status"],
) {
  const { error } = await supabase
    .from("food_posts")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function uploadFoodImage(file: File, userId: string) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("food-images")
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("food-images").getPublicUrl(path);
  return data.publicUrl;
}
