import { Link, useNavigate } from "@tanstack/react-router";
import { Clock3, Loader2, LockKeyhole, ShieldX } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

/**
 * signedIn — any signed-in account that has not been rejected.
 * approved — signed-in account approved by the owner (bill writes).
 * owner — the house owner only (settings, account approval).
 */
export type GateLevel = "signedIn" | "approved" | "owner";

const defaultTitles: Record<GateLevel, string> = {
  signedIn: "Sign in to open this page",
  approved: "Sign in to manage bills",
  owner: "Sign in to open settings",
};

function Gate({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
        {icon}
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="mt-3 space-y-4 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await signOut();
        void navigate({ to: "/history" });
      }}
    >
      Sign out
    </Button>
  );
}

function rememberRedirect() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("postLoginRedirect", window.location.pathname + window.location.search);
  }
}

export function AuthGate({
  level = "approved",
  title,
  children,
}: {
  level?: GateLevel;
  title?: string;
  children: ReactNode;
}) {
  const { user, profile, isLoading, profileError, refreshProfile, isOwner, isApproved } = useAuth();

  if (isLoading) {
    return (
      <Gate icon={<Loader2 className="h-5 w-5 animate-spin" />} title="Checking your account…">
        <p>Please wait a moment.</p>
      </Gate>
    );
  }

  if (!user) {
    return (
      <Gate icon={<LockKeyhole className="h-5 w-5" />} title={title ?? defaultTitles[level]}>
        <p>Bill history is public. Everything else needs an account.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/login" onClick={rememberRedirect}>
              Log in
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/signup" onClick={rememberRedirect}>
              Create an account
            </Link>
          </Button>
        </div>
        <p>
          <Link to="/history" className="underline underline-offset-4 hover:text-foreground">
            View public bill history
          </Link>
        </p>
      </Gate>
    );
  }

  if (profileError) {
    return (
      <Gate icon={<ShieldX className="h-5 w-5" />} title="Account setup is incomplete">
        <p>
          The account profile could not be loaded. If this app was just installed, run the account
          approval database migration in Supabase, then try again.
        </p>
        <p className="break-words text-xs opacity-70">{profileError.message}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => void refreshProfile()}>Try again</Button>
          <SignOutButton />
        </div>
      </Gate>
    );
  }

  if (!profile) {
    return (
      <Gate icon={<ShieldX className="h-5 w-5" />} title="Profile not found">
        <p>
          Your login works, but no account profile was created. Ask the owner to check the database
          trigger, then sign in again.
        </p>
        <SignOutButton />
      </Gate>
    );
  }

  if (profile.status === "rejected") {
    return (
      <Gate icon={<ShieldX className="h-5 w-5" />} title="Account access denied">
        <p>
          This account was not approved by the house owner. Contact the owner if you think this was
          a mistake.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link to="/history">View bill history</Link>
          </Button>
          <SignOutButton />
        </div>
      </Gate>
    );
  }

  if (level !== "signedIn" && profile.status === "pending") {
    return (
      <Gate icon={<Clock3 className="h-5 w-5" />} title="Waiting for owner approval">
        <p>
          <span className="font-medium text-foreground">{profile.email}</span> is waiting for the
          house owner to approve it. You can browse the public bill history while you wait.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link to="/history">View bill history</Link>
          </Button>
          <SignOutButton />
        </div>
      </Gate>
    );
  }

  if (level === "owner" && !isOwner) {
    return (
      <Gate icon={<LockKeyhole className="h-5 w-5" />} title="Owner access required">
        <p>Only the house owner can open this page.</p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </Gate>
    );
  }

  if (level === "approved" && !isApproved) {
    return (
      <Gate icon={<LockKeyhole className="h-5 w-5" />} title="Approval required">
        <p>Your account is not approved for this action yet.</p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </Gate>
    );
  }

  return <>{children}</>;
}
