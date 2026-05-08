import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createFoodPost, uploadFoodImage } from "@/services/food";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { LocationSelector } from "@/components/LocationMap";

export const Route = createFileRoute("/post")({
  head: () => ({
    meta: [
      { title: "Post excess food — ShareBite" },
      { name: "description", content: "Share your surplus meals with people nearby." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <PostPage />
    </ProtectedRoute>
  ),
});

function PostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiry, setExpiry] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onPickFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const onLocationSelect = (address: string, lat: number, lng: number) => {
    setLocation(address);
    setLatitude(lat);
    setLongitude(lng);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!foodName || !quantity || !expiry || !location) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      let image_url: string | undefined;
      if (file) image_url = await uploadFoodImage(file, user.id);
      await createFoodPost({
        user_id: user.id,
        food_name: foodName,
        quantity,
        expiry_time: new Date(expiry).toISOString(),
        description,
        location,
        image_url,
      });
      toast.success("Food posted!");
      navigate({ to: "/feed" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Post excess food</h1>
        <p className="text-muted-foreground mt-1">
          Share what you have. Someone nearby will appreciate it.
        </p>
      </div>
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle>Food details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Photo</Label>
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={preview} alt="Preview" className="w-full h-56 object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 rounded-full"
                    onClick={() => onPickFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload an image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Food name *</Label>
                <Input
                  id="name"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Veg biryani"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity *</Label>
                <Input
                  id="qty"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Serves 4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry time *</Label>
              <Input
                id="expiry"
                type="datetime-local"
                required
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Freshly cooked, vegetarian, contains nuts…"
              />
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <LocationSelector
                onLocationSelect={onLocationSelect}
                initialLocation={location}
              />
              {location && (
                <div className="text-sm text-muted-foreground">
                  Selected: {location}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-full"
              size="lg"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post food
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
