import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monthly House Bill Tracker" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content: "Simple monthly rent and electricity bill tracker with printable receipts.",
      },
      { property: "og:title", content: "Monthly House Bill Tracker" },
      {
        property: "og:description",
        content: "Simple monthly rent and electricity bill tracker with printable receipts.",
      },
    ],
  }),
  component: HomeRedirect,
});

// Visitors only get the public bill history. Signed-in accounts land on the
// dashboard, which is behind the login gate.
function HomeRedirect() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    void navigate({ to: user ? "/dashboard" : "/history", replace: true });
  }, [isLoading, navigate, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading bill history…
    </div>
  );
}
