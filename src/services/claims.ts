import { supabase, type Claim, type FoodPost } from "@/integrations/supabase/client";

export async function createClaim(food_id: string, claimer_id: string) {
  const { data, error } = await supabase
    .from("claims")
    .insert({ food_id, claimer_id, status: "pending" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Claim;
}

export async function listMyClaims(claimer_id: string) {
  const { data, error } = await supabase
    .from("claims")
    .select("*, food_posts(*)")
    .eq("claimer_id", claimer_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<Claim & { food_posts: FoodPost }>;
}

export async function listClaimsForDonor(donor_id: string) {
  // claims joined with food_posts where food_posts.user_id = donor_id
  const { data, error } = await supabase
    .from("claims")
    .select("*, food_posts!inner(*), users:claimer_id(id,name,email)")
    .eq("food_posts.user_id", donor_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<
    Claim & {
      food_posts: FoodPost;
      users: { id: string; name: string; email: string };
    }
  >;
}

export async function updateClaimStatus(id: string, status: Claim["status"]) {
  const { data, error } = await supabase
    .from("claims")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Claim;
}

export async function approveClaim(claim: Claim) {
  await updateClaimStatus(claim.id, "approved");
  const { error } = await supabase
    .from("food_posts")
    .update({ status: "matched" })
    .eq("id", claim.food_id);
  if (error) throw error;
}
