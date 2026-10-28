import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Home } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: Layout,
});

const navCls = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground";
const activeCls = { className: "rounded-md px-3 py-2 text-sm font-medium bg-accent text-accent-foreground" };

function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-primary">
            <Home className="h-5 w-5" /> House Bill Tracker
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <Link to="/dashboard" className={navCls} activeProps={activeCls}>Dashboard</Link>
            <Link to="/bills/new" className={navCls} activeProps={activeCls}>Add Bill</Link>
            <Link to="/history" className={navCls} activeProps={activeCls}>History</Link>
            <Link to="/settings" className={navCls} activeProps={activeCls}>Settings</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
