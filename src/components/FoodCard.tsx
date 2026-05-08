import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpiryBadge, StatusBadge } from "@/components/StatusBadges";
import { MapPin, Package2, UtensilsCrossed } from "lucide-react";
import type { FoodPost } from "@/integrations/supabase/client";

export function FoodCard({
  post,
  onClaim,
  claiming,
  showStatus,
  ownerName,
}: {
  post: FoodPost;
  onClaim?: () => void;
  claiming?: boolean;
  showStatus?: boolean;
  ownerName?: string;
}) {
  return (
    <Card className="group overflow-hidden rounded-2xl border-border/60 transition-all hover:shadow-[var(--shadow-soft)] hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.food_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="h-10 w-10" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <ExpiryBadge expiry={post.expiry_time} />
          {showStatus && <StatusBadge status={post.status} />}
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{post.food_name}</h3>
        </div>
        {post.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1">
            <Package2 className="h-3.5 w-3.5" /> {post.quantity}
          </span>
          {post.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {post.location}
            </span>
          )}
        </div>
        {ownerName && (
          <p className="text-xs text-muted-foreground pt-1">Posted by {ownerName}</p>
        )}
      </CardContent>
      {onClaim && (
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full rounded-full"
            onClick={onClaim}
            disabled={claiming}
          >
            {claiming ? "Claiming…" : "Claim this meal"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
