import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadges";
import { EmptyState } from "@/components/EmptyState";
import { listClaimsForDonor, approveClaim, updateClaimStatus } from "@/services/claims";
import { supabase, type Claim, type FoodPost } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Inbox, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Row = Claim & {
  food_posts: FoodPost;
  users: { id: string; name: string; email: string };
};

export const Route = createFileRoute("/claims")({
  head: () => ({
    meta: [
      { title: "Claim requests — ShareBite" },
      { name: "description", content: "Approve or reject incoming claim requests." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ClaimsPage />
    </ProtectedRoute>
  ),
});

function ClaimsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [pending, setPending] = useState<{ row: Row; action: "approve" | "reject" } | null>(null);
  const [working, setWorking] = useState(false);

  const refresh = () => {
    if (!user) return;
    listClaimsForDonor(user.id).then(setRows).catch((e) => toast.error(e.message));
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("donor-claims")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "claims" }, (payload) => {
        refresh();
        toast.info("New claim request received!");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const confirm = async () => {
    if (!pending) return;
    setWorking(true);
    try {
      if (pending.action === "approve") {
        await approveClaim(pending.row);
        toast.success("Claim approved — chat is now active");
      } else {
        await updateClaimStatus(pending.row.id, "rejected");
        toast.success("Claim rejected");
      }
      setPending(null);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Claim requests</h1>
        <p className="text-muted-foreground mt-1">
          Approve a request to start chatting with the receiver.
        </p>
      </div>
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle>Incoming requests</CardTitle>
        </CardHeader>
        <CardContent>
          {!rows ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No claim requests yet"
              description="They'll show up here as soon as someone claims your food."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Food</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.food_posts?.food_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{r.users?.name}</div>
                        <div className="text-xs text-muted-foreground">{r.users?.email}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {r.status === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPending({ row: r, action: "reject" })}
                            >
                              <X className="h-4 w-4" /> Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setPending({ row: r, action: "approve" })}
                            >
                              <Check className="h-4 w-4" /> Approve
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.action === "approve" ? "Approve claim?" : "Reject claim?"}
            </DialogTitle>
            <DialogDescription>
              {pending?.action === "approve"
                ? "This will mark the food as matched and open a chat with the receiver."
                : "The receiver will be notified that their request was declined."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={working}
              variant={pending?.action === "reject" ? "destructive" : "default"}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
