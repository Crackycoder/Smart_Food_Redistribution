import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge, ExpiryBadge } from "@/components/StatusBadges";
import { listMyFood } from "@/services/food";
import { listMyClaims } from "@/services/claims";
import { supabase, type Claim, type FoodPost } from "@/integrations/supabase/client";
import { MessageSquare, PlusCircle, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ShareBite" },
      { name: "description", content: "Manage your food posts, claims and chats." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ),
});

type ClaimWithFood = Claim & { food_posts: FoodPost };

function DashboardPage() {
  const { user } = useAuth();
  const [myFood, setMyFood] = useState<FoodPost[] | null>(null);
  const [myClaims, setMyClaims] = useState<ClaimWithFood[] | null>(null);

  useEffect(() => {
    if (!user) return;
    listMyFood(user.id).then(setMyFood).catch((e) => toast.error(e.message));
    listMyClaims(user.id).then(setMyClaims).catch((e) => toast.error(e.message));

    const channel = supabase
      .channel(`dashboard-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "food_posts", filter: `user_id=eq.${user.id}` },
        () => listMyFood(user.id).then(setMyFood),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "claims", filter: `claimer_id=eq.${user.id}` },
        (payload) => {
          listMyClaims(user.id).then(setMyClaims);
          const newStatus = (payload.new as Claim).status;
          if (newStatus === "approved") {
            toast.success("Your claim was approved! You can now chat with the donor.");
          } else if (newStatus === "rejected") {
            toast.info("Your claim was rejected.");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Active chats = claims with approved status (where user is claimer) + matched posts (where user is donor)
  const activeChatsMap = new Map<string, { food_id: string; title: string; subtitle: string }>();
  
  myClaims?.forEach((c) => {
    if (c.status === "approved" && !activeChatsMap.has(c.food_id)) {
      activeChatsMap.set(c.food_id, {
        food_id: c.food_id,
        title: c.food_posts?.food_name ?? "Food",
        subtitle: "You claimed this",
      });
    }
  });
  myFood?.forEach((p) => {
    if (p.status === "matched" && !activeChatsMap.has(p.id)) {
      activeChatsMap.set(p.id, {
        food_id: p.id,
        title: p.food_name,
        subtitle: "You posted this",
      });
    }
  });
  
  const activeChats = Array.from(activeChatsMap.values());

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Hi, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1 capitalize">{user?.role} · {user?.email}</p>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="posts">My Posts</TabsTrigger>
          <TabsTrigger value="claims">My Claims</TabsTrigger>
          <TabsTrigger value="chats">Active Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {!myFood ? (
            <SkeletonList />
          ) : myFood.length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed className="h-6 w-6" />}
              title="No posts yet"
              description="Share some excess food and watch it get claimed."
              action={
                <Link to="/post">
                  <Button className="rounded-full">
                    <PlusCircle className="h-4 w-4" /> Post food
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3">
              {myFood.map((p) => (
                <Card key={p.id} className="rounded-2xl border-border/60">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-muted overflow-hidden">
                      {p.image_url && (
                        <img src={p.image_url} alt={p.food_name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.food_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.quantity}{p.location ? ` · ${p.location}` : ""}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <StatusBadge status={p.status} />
                        <ExpiryBadge expiry={p.expiry_time} />
                      </div>
                    </div>
                    {p.status === "matched" && (
                      <Link to="/chat/$foodId" params={{ foodId: p.id }}>
                        <Button size="sm" variant="secondary" className="rounded-full">
                          <MessageSquare className="h-4 w-4" /> Chat
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
              {user?.role === "donor" && (
                <Link to="/claims">
                  <Button variant="outline" className="rounded-full mt-2">
                    View incoming claim requests
                  </Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          {!myClaims ? (
            <SkeletonList />
          ) : myClaims.length === 0 ? (
            <EmptyState
              title="No claims yet"
              description="Browse the food feed and claim a meal you'd like."
              action={
                <Link to="/feed">
                  <Button className="rounded-full">Browse food</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3">
              {myClaims.map((c) => (
                <Card key={c.id} className="rounded-2xl border-border/60">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-muted overflow-hidden">
                      {c.food_posts?.image_url && (
                        <img
                          src={c.food_posts.image_url}
                          alt={c.food_posts.food_name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {c.food_posts?.food_name ?? "Food"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.food_posts?.quantity}
                      </div>
                      <div className="mt-2">
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                    {c.status === "approved" && (
                      <Link to="/chat/$foodId" params={{ foodId: c.food_id }}>
                        <Button size="sm" variant="secondary" className="rounded-full">
                          <MessageSquare className="h-4 w-4" /> Chat
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chats" className="mt-6">
          {activeChats.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-6 w-6" />}
              title="No active chats"
              description="Chats unlock once a claim is approved."
            />
          ) : (
            <div className="grid gap-3">
              {activeChats.map((c) => (
                <Link key={c.food_id} to="/chat/$foodId" params={{ foodId: c.food_id }}>
                  <Card className="rounded-2xl border-border/60 hover:shadow-[var(--shadow-soft)] transition">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.subtitle}</div>
                      </div>
                      <Button size="sm" variant="ghost" className="rounded-full">
                        Open chat
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}
