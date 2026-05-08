import { Badge } from "@/components/ui/badge";
import type { FoodPost } from "@/integrations/supabase/client";
import { useCountdown } from "@/hooks/useCountdown";
import { Clock } from "lucide-react";

export function ExpiryBadge({ expiry }: { expiry: string }) {
  const { expired, label, ms } = useCountdown(expiry);
  const urgent = !expired && ms < 1000 * 60 * 60 * 2;
  return (
    <Badge
      variant={expired ? "destructive" : urgent ? "default" : "secondary"}
      className="gap-1 rounded-full"
    >
      <Clock className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: FoodPost["status"] | "pending" | "approved" | "rejected" }) {
  const map: Record<string, { label: string; className: string }> = {
    available: { label: "Available", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
    matched: { label: "Matched", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
    claimed: { label: "Claimed", className: "bg-muted text-muted-foreground border-border" },
    pending: { label: "Pending", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
    approved: { label: "Approved", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
    rejected: { label: "Rejected", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" },
  };
  const cfg = map[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={`rounded-full capitalize ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
