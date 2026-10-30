import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Home, LogIn, LogOut, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPendingProfiles } from "@/lib/data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: Layout,
});

const navCls =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground";
const activeCls = {
  className: "rounded-md px-3 py-2 text-sm font-medium bg-accent text-accent-foreground",
};

function Layout() {
  const navigate = useNavigate();
  const { user, profile, profileError, isLoading, isOwner, isApproved, signOut } = useAuth();
  const pending = useQuery({
    queryKey: ["pending-profiles"],
    queryFn: fetchPendingProfiles,
    enabled: isOwner,
    retry: false,
    refetchInterval: 20_000,
  });
  const pendingCount = pending.data?.length ?? 0;

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/history" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link
            to={user ? "/dashboard" : "/history"}
            className="flex items-center gap-2 font-bold text-primary"
          >
            <Home className="h-5 w-5" /> House Bill Tracker
          </Link>

          <div className="flex flex-wrap items-center gap-1">
            <nav className="flex flex-wrap items-center gap-1">
              {user && (
                <Link to="/dashboard" className={navCls} activeProps={activeCls}>
                  Dashboard
                </Link>
              )}
              {isApproved && (
                <Link to="/bills/new" className={navCls} activeProps={activeCls}>
                  Add Bill
                </Link>
              )}
              <Link to="/history" className={navCls} activeProps={activeCls}>
                History
              </Link>
              {isOwner && (
                <Link to="/settings" className={navCls} activeProps={activeCls}>
                  Settings
                </Link>
              )}
            </nav>

            {isOwner && (
              <Link
                to="/dashboard"
                hash="account-requests"
                className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label={
                  pendingCount > 0
                    ? `${pendingCount} account request${pendingCount === 1 ? "" : "s"}`
                    : "Account requests"
                }
                title="Account requests"
              >
                <Bell className="h-4 w-4" />
                {pendingCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            )}

            <div className="ml-1 flex items-center gap-1 border-l pl-2">
              {isLoading ? (
                <span className="px-2 text-sm text-muted-foreground">…</span>
              ) : user ? (
                <>
                  <span
                    className="hidden max-w-40 truncate text-sm text-muted-foreground sm:inline"
                    title={user.email ?? undefined}
                  >
                    {profile?.display_name || user.email}
                  </span>
                  {profile?.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                  {isOwner && <Badge>Owner</Badge>}
                  <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sign out">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Log out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/login">
                      <LogIn className="h-4 w-4" /> Log in
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/signup">
                      <UserPlus className="h-4 w-4" /> Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        {user && profileError && (
          <div className="border-t border-warning/40 bg-warning/10 px-4 py-2 text-center text-xs text-foreground">
            Account setup is incomplete — run the account approval migration in Supabase, then
            reload.
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
