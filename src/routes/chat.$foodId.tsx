import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listMessages, sendMessage } from "@/services/chat";
import { getFoodPost } from "@/services/food";
import {
  supabase,
  type ChatMessage,
  type FoodPost,
} from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/chat/$foodId")({
  head: () => ({
    meta: [
      { title: "Chat — ShareBite" },
      { name: "description", content: "Coordinate the food handoff in realtime." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  ),
});

function ChatPage() {
  const { foodId } = Route.useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [food, setFood] = useState<FoodPost | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFoodPost(foodId).then(setFood).catch((e) => toast.error(e.message));
    listMessages(foodId).then(setMessages).catch((e) => toast.error(e.message));

    const channel = supabase
      .channel(`chat-${foodId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `food_id=eq.${foodId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          if (m.sender_id !== user?.id) {
            toast.info("New message received");
          }
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [foodId]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      food_id: foodId,
      sender_id: user.id,
      message: text.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    try {
      const real = await sendMessage(foodId, user.id, optimistic.message);
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? real : x)));
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
      </Link>

      <Card className="rounded-2xl border-border/60 overflow-hidden flex flex-col h-[75vh]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 bg-card/60">
          <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden">
            {food?.image_url ? (
              <img src={food.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{food?.food_name ?? "Food"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {food?.quantity}{food?.location ? ` · ${food.location}` : ""}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-10">
                Say hi to coordinate pickup 👋
              </div>
            ) : (
              messages.map((m) => {
                const own = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${own ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        own
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                      <p className={`text-[10px] mt-1 ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {format(new Date(m.created_at), "p")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={onSend} className="border-t border-border/60 p-3 flex gap-2 bg-card/60">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
