import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "donor" | "receiver";
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (role && user.role !== role) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, role, navigate]);

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (role && user.role !== role) return null;
  return <>{children}</>;
}
