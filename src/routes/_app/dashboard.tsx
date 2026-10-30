import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { History, Plus, Check, X } from "lucide-react";
import { fetchBills, fetchPendingProfiles, fetchSettings, reviewAccount } from "@/lib/data";
import { monthLabel, paymentBalance, paymentStatus, taka } from "@/lib/bill";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — House Bill Tracker" },
      {
        name: "description",
        content: "View monthly rent, electricity bills, outstanding due and extra payments.",
      },
      { property: "og:title", content: "Dashboard — House Bill Tracker" },
      {
        property: "og:description",
        content: "View monthly rent, electricity bills, outstanding due and extra payments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGate level="signedIn" title="Sign in to open the dashboard">
      <Dashboard />
    </AuthGate>
  ),
});

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | undefined }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const { profile, isOwner, isApproved } = useAuth();
  const bills = useQuery({ queryKey: ["bills"], queryFn: fetchBills });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const pending = useQuery({
    queryKey: ["pending-profiles"],
    queryFn: fetchPendingProfiles,
    enabled: isOwner,
    retry: false,
    refetchInterval: 20_000,
  });
  const [reviewing, setReviewing] = useState<string | null>(null);
  const previousPending = useRef<number | null>(null);

  const now = new Date();
  const list = bills.data ?? [];
  const current = list.find(
    (b) => b.bill_year === now.getFullYear() && b.bill_month === now.getMonth() + 1,
  );
  const latest = list[0];
  const outstanding = list.reduce(
    (s, b) => s + paymentBalance(Number(b.total), Number(b.amount_paid)).due,
    0,
  );
  const extraPaid = list.reduce(
    (s, b) => s + paymentBalance(Number(b.total), Number(b.amount_paid)).extraPaid,
    0,
  );

  const pendingCount = pending.data?.length ?? 0;

  // Show a toast when a new account request appears while the dashboard is open.
  useEffect(() => {
    if (!isOwner || !pending.data) return;
    const count = pending.data.length;
    if (previousPending.current !== null && count > previousPending.current) {
      const newest = pending.data[count - 1];
      toast.info(
        newest
          ? `New account request from ${newest.display_name || newest.email}`
          : "New account request",
      );
    }
    previousPending.current = count;
  }, [isOwner, pending.data]);

  async function review(id: string, decision: "approved" | "rejected") {
    setReviewing(`${id}:${decision}`);
    try {
      await reviewAccount(id, decision);
      toast.success(decision === "approved" ? "Account approved" : "Account rejected");
      await qc.invalidateQueries({ queryKey: ["pending-profiles"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review this account");
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {settings.data?.tenant_name || "Set your house details in Settings"}
        </p>
      </div>

      {isOwner && !settings.isLoading && !settings.data && (
        <div className="rounded-xl border border-primary bg-secondary p-4 text-sm">
          First, save your house details and electricity rate in{" "}
          <Link to="/settings" className="font-semibold text-primary underline">
            Settings
          </Link>
          .
        </div>
      )}

      {profile?.status === "pending" && (
        <div className="rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
          <p className="font-semibold">Your account is waiting for approval</p>
          <p className="mt-1 text-muted-foreground">
            You can browse public bill history now. Adding bills will unlock after the house owner
            approves your account.
          </p>
        </div>
      )}

      {isOwner && (
        <section
          id="account-requests"
          className="scroll-mt-24 overflow-hidden rounded-xl border bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Account requests</h2>
              <p className="text-sm text-muted-foreground">
                Approve people before they can add bills, record payments or change settings.
              </p>
            </div>
            <Badge variant={pendingCount > 0 ? "default" : "secondary"}>
              {pendingCount} pending
            </Badge>
          </div>

          <div className="divide-y">
            {pending.isLoading && (
              <p className="px-5 py-6 text-sm text-muted-foreground">Loading requests…</p>
            )}

            {pending.error && (
              <p className="px-5 py-6 text-sm text-destructive">
                Could not load account requests: {pending.error.message}
              </p>
            )}

            {!pending.isLoading && !pending.error && pendingCount === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No pending requests. New sign-ups will appear here.
              </p>
            )}

            {pending.data?.map((account) => {
              const approving = reviewing === `${account.id}:approved`;
              const rejecting = reviewing === `${account.id}:rejected`;
              return (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{account.display_name || account.email}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {account.email} · requested{" "}
                      {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      onClick={() => void review(account.id, "approved")}
                      disabled={reviewing !== null}
                    >
                      <Check className="h-4 w-4" />
                      {approving ? "Approving…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void review(account.id, "rejected")}
                      disabled={reviewing !== null}
                    >
                      <X className="h-4 w-4" />
                      {rejecting ? "Rejecting…" : "Reject"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={`This month's bill (${monthLabel(now.getFullYear(), now.getMonth() + 1)})`}
          value={current ? taka(current.total) : "Not added"}
        />
        <Stat
          label="This month's electricity"
          value={current ? `${Number(current.units)} units` : "—"}
        />
        <Stat
          label="Total outstanding due"
          value={taka(outstanding)}
          sub={`Extra paid: ${taka(extraPaid)}`}
        />
        <Stat
          label="Latest saved bill"
          value={latest ? monthLabel(latest.bill_year, latest.bill_month) : "None yet"}
          sub={
            latest
              ? `${taka(latest.total)} · ${paymentStatus(Number(latest.total), Number(latest.amount_paid))}`
              : undefined
          }
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {isApproved && (
          <Button asChild size="lg" className="h-14 text-base">
            <Link to="/bills/new">
              <Plus className="mr-2 h-5 w-5" /> Add Monthly Bill
            </Link>
          </Button>
        )}
        <Button asChild size="lg" variant="outline" className="h-14 text-base">
          <Link to="/history">
            <History className="mr-2 h-5 w-5" /> View Bill History
          </Link>
        </Button>
      </div>
    </div>
  );
}
