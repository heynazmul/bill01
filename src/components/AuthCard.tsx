import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-bold text-primary">
          <Home className="h-5 w-5" /> House Bill Tracker
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {footer ?? (
            <Link to="/history" className="underline underline-offset-4 hover:text-foreground">
              View public bill history
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
