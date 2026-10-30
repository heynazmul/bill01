import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { accountStatusLabel } from "@/lib/permissions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — House Bill Tracker" },
      {
        name: "description",
        content: "Log in to add bills and manage the monthly house bill tracker.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, profile, profileError, isLoading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return void toast.error("Enter your email and password");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) return void toast.error(error.message);

    toast.success("Signed in");
    const target = sessionStorage.getItem("postLoginRedirect");
    sessionStorage.removeItem("postLoginRedirect");
    if (target?.startsWith("/")) {
      window.location.assign(target);
    } else {
      void navigate({ to: "/dashboard" });
    }
  }

  if (!isLoading && user) {
    return (
      <AuthCard
        title="You're signed in"
        subtitle={user.email ?? undefined}
        footer={
          <Link to="/history" className="underline underline-offset-4 hover:text-foreground">
            View public bill history
          </Link>
        }
      >
        <div className="space-y-4">
          {profile ? (
            <div className="rounded-lg border bg-secondary p-4 text-sm">
              <p className="font-medium text-foreground">{profile.display_name || profile.email}</p>
              <p className="mt-1 text-muted-foreground">
                {profile.role === "owner" ? "House owner" : "Member"} ·{" "}
                {accountStatusLabel(profile.status)}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {profileError
                ? `Account profile could not be loaded: ${profileError.message}`
                : "No account profile was found. Run the account approval database migration, then reload."}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                toast.success("Signed out");
              }}
            >
              Sign out
            </Button>
          </div>

          {profile?.status === "pending" && (
            <p className="text-sm text-muted-foreground">
              The house owner has been notified. You can browse bill history while you wait for
              approval.
            </p>
          )}
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Log in"
      subtitle="Sign in to add bills, record payments and change settings."
      footer={
        <div className="space-y-2">
          <p>
            Need an account?{" "}
            <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
              Create one
            </Link>
          </p>
          <p>
            <Link to="/history" className="underline underline-offset-4 hover:text-foreground">
              View public bill history without logging in
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-12 text-base"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-12 text-base"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
