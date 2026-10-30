import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — House Bill Tracker" },
      {
        name: "description",
        content: "Create an account to add and manage monthly house bills.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return void toast.error("Enter your email");
    if (password.length < 6) return void toast.error("Password must be at least 6 characters");
    if (password !== confirm) return void toast.error("Passwords do not match");

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setBusy(false);

    if (error) return void toast.error(error.message);

    // Supabase hides existing-email accounts behind a fake user with no identities.
    if (data.user && data.user.identities?.length === 0) {
      setSubmitted(true);
      return;
    }

    if (data.session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id ?? "")
        .maybeSingle();
      toast.success(
        profile?.role === "owner"
          ? "Owner account created."
          : "Account created. Waiting for owner approval.",
      );
      const target = sessionStorage.getItem("postLoginRedirect");
      sessionStorage.removeItem("postLoginRedirect");
      if (target?.startsWith("/")) {
        window.location.assign(target);
      } else {
        void navigate({ to: "/dashboard" });
      }
      return;
    }

    setSubmitted(true);
  }

  if (!isLoading && user) {
    return (
      <AuthCard
        title="Account already created"
        subtitle={user.email ?? undefined}
        footer={
          <Link to="/history" className="underline underline-offset-4 hover:text-foreground">
            View public bill history
          </Link>
        }
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>You are signed in. The house owner will see your account request on the dashboard.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                setSubmitted(false);
                toast.success("Signed out");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (submitted) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="Your account has been created."
        footer={
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Back to log in
          </Link>
        }
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Open the confirmation link we sent to{" "}
            <span className="font-medium text-foreground">{email}</span>, then log in. The house
            owner has been notified and will approve your account from the dashboard.
          </p>
          <p>
            If you do not see the email, check your spam folder. If this email was already
            registered, use the login page instead.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="New accounts must be approved by the house owner before they can add bills."
      footer={
        <div className="space-y-2">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              Log in
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
          <Label htmlFor="name">Your name (optional)</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            className="h-12 text-base"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            className="h-12 text-base"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            className="h-12 text-base"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Only the admin account becomes the house owner. Every other account waits for approval.
        </p>
      </form>
    </AuthCard>
  );
}
