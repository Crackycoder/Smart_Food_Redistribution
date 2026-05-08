import { supabase, type ChatMessage } from "@/integrations/supabase/client";

export async function listMessages(food_id: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("food_id", food_id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(food_id: string, sender_id: string, message: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ food_id, sender_id, message })
    .select("*")
    .single();
  if (error) throw error;
  return data as ChatMessage;
}
