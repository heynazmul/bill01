import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchBills, fetchSettings } from "@/lib/data";
import { monthLabel, paymentBalance, paymentStatus, taka } from "@/lib/bill";
import { Button } from "@/components/ui/button";
import { History, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — House Bill Tracker" },
    { name: "description", content: "View monthly rent, electricity bills, outstanding due and extra payments." },
    { property: "og:title", content: "Dashboard — House Bill Tracker" },
    { property: "og:description", content: "View monthly rent, electricity bills, outstanding due and extra payments." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Dashboard,
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
  const bills = useQuery({ queryKey: ["bills"], queryFn: fetchBills });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const now = new Date();
  const list = bills.data ?? [];
  const current = list.find((b) => b.bill_year === now.getFullYear() && b.bill_month === now.getMonth() + 1);
  const latest = list[0];
  const outstanding = list.reduce((s, b) => s + paymentBalance(Number(b.total), Number(b.amount_paid)).due, 0);
  const extraPaid = list.reduce((s, b) => s + paymentBalance(Number(b.total), Number(b.amount_paid)).extraPaid, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">{settings.data?.tenant_name || "Set your house details in Settings"}</p>
      </div>
      {!settings.isLoading && !settings.data && (
        <div className="rounded-xl border border-primary bg-secondary p-4 text-sm">
          First, save your house details and electricity rate in{" "}
          <Link to="/settings" className="font-semibold text-primary underline">Settings</Link>.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`This month's bill (${monthLabel(now.getFullYear(), now.getMonth() + 1)})`} value={current ? taka(current.total) : "Not added"} />
        <Stat label="This month's electricity" value={current ? `${Number(current.units)} units` : "—"} />
        <Stat label="Total outstanding due" value={taka(outstanding)} sub={`Extra paid: ${taka(extraPaid)}`} />
        <Stat
          label="Latest saved bill"
          value={latest ? monthLabel(latest.bill_year, latest.bill_month) : "None yet"}
          sub={latest ? `${taka(latest.total)} · ${paymentStatus(Number(latest.total), Number(latest.amount_paid))}` : undefined}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="h-14 text-base">
          <Link to="/bills/new"><Plus className="mr-2 h-5 w-5" /> Add Monthly Bill</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 text-base">
          <Link to="/history"><History className="mr-2 h-5 w-5" /> View Bill History</Link>
        </Button>
      </div>
    </div>
  );
}
