import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { listAvailableFood } from "@/services/food";
import { createClaim } from "@/services/claims";
import type { FoodPost } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { FoodCard } from "@/components/FoodCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Food feed — ShareBite" },
      { name: "description", content: "Browse food available near you in realtime." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <FeedPage />
    </ProtectedRoute>
  ),
});

function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FoodPost[] | null>(null);
  const [query, setQuery] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAvailableFood()
      .then((data) => !cancelled && setPosts(data))
      .catch((e) => toast.error(e.message));

    const channel = supabase
      .channel("food-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "food_posts" },
        (payload) => {
          setPosts((prev) => {
            if (!prev) return prev;
            const newRow = payload.new as FoodPost;
            const oldRow = payload.old as FoodPost;
            if (payload.eventType === "INSERT") {
              if (newRow.status === "available") return [newRow, ...prev];
              return prev;
            }
            if (payload.eventType === "UPDATE") {
              if (newRow.status !== "available") {
                return prev.filter((p) => p.id !== newRow.id);
              }
              return prev.map((p) => (p.id === newRow.id ? newRow : p));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((p) => p.id !== oldRow.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const onClaim = async (post: FoodPost) => {
    if (!user) return;
    if (post.user_id === user.id) {
      toast.error("You can't claim your own post");
      return;
    }
    setClaimingId(post.id);
    try {
      await createClaim(post.id, user.id);
      toast.success("Claim sent! Waiting for approval.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setClaimingId(null);
    }
  };

  const filtered = posts?.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.food_name.toLowerCase().includes(q) ||
      (p.location ?? "").toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Available now</h1>
          <p className="text-muted-foreground mt-1">
            {posts ? `${filtered?.length ?? 0} meals waiting to be shared` : "Loading meals…"}
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food, location…"
            className="pl-9 rounded-full"
          />
        </div>
      </div>

      {!posts ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <FoodCard
              key={p.id}
              post={p}
              onClaim={p.user_id !== user?.id ? () => onClaim(p) : undefined}
              claiming={claimingId === p.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<UtensilsCrossed className="h-6 w-6" />}
          title="No food available right now"
          description="Check back soon, or post some excess food yourself."
          action={
            <Link to="/post">
              <Button className="rounded-full">Post food</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
