import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Eye, Pencil, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchBills, fetchSettings, type Bill } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { MONTHS, monthLabel, paymentBalance, taka } from "@/lib/bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt } from "@/components/Receipt";
import { downloadPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "Bill History — House Bill Tracker" },
      {
        name: "description",
        content: "Review saved monthly house bills, record payments and see extra paid.",
      },
      { property: "og:title", content: "Bill History — House Bill Tracker" },
      {
        property: "og:description",
        content: "Review saved monthly house bills, record payments and see extra paid.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const { user, profile, isApproved } = useAuth();
  const canManage = isApproved;
  const { data = [], isLoading } = useQuery({ queryKey: ["bills"], queryFn: fetchBills });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [fMonth, setFMonth] = useState(0);
  const [fYear, setFYear] = useState(0);
  const [payBill, setPayBill] = useState<Bill | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);

  const years = [...new Set(data.map((b) => b.bill_year))];
  const rows = data.filter(
    (b) => (!fMonth || b.bill_month === fMonth) && (!fYear || b.bill_year === fYear),
  );

  async function recordPayment() {
    if (!canManage) {
      return void toast.error("Sign in with an approved account to record payments");
    }
    if (!payBill) return;
    const amt = Number(payAmount);
    if (!Number.isFinite(amt) || amt <= 0)
      return void toast.error("Enter a payment amount above 0");
    const paid = Math.round((Number(payBill.amount_paid) + amt) * 100) / 100;
    const { due } = paymentBalance(Number(payBill.total), paid);
    const { error } = await supabase
      .from("bills")
      .update({ amount_paid: paid, due, updated_at: new Date().toISOString() })
      .eq("id", payBill.id);
    if (error) return void toast.error(error.message);
    toast.success("Payment recorded");
    setPayBill(null);
    setPayAmount("");
    qc.invalidateQueries({ queryKey: ["bills"] });
    qc.invalidateQueries({ queryKey: ["bill", payBill.id] });
  }

  async function pdf(b: Bill) {
    setPdfBill(b);
    await new Promise((r) => setTimeout(r, 50));
    const el = document.getElementById("pdf-receipt");
    if (el)
      await downloadPdf(
        el,
        `receipt-${b.bill_year}-${String(b.bill_month).padStart(2, "0")}.pdf`,
      ).catch(() => toast.error("PDF failed"));
    setPdfBill(null);
  }

  const sel = "h-11 rounded-md border border-input bg-background px-3";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Bill History</h1>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter month"
            className={sel}
            value={fMonth}
            onChange={(e) => setFMonth(Number(e.target.value))}
          >
            <option value={0}>All months</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter year"
            className={sel}
            value={fYear}
            onChange={(e) => setFYear(Number(e.target.value))}
          >
            <option value={0}>All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {canManage && (
            <Button asChild>
              <Link to="/bills/new">Add bill</Link>
            </Button>
          )}
        </div>
      </div>

      {!canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-secondary p-4 text-sm">
          <p>
            You are viewing public bill history. Sign in with an approved account to add bills or
            record payments.
          </p>
          {!user ? (
            <Button asChild size="sm">
              <Link to="/login">Log in</Link>
            </Button>
          ) : profile?.status === "pending" ? (
            <span className="font-medium text-warning-foreground">Waiting for owner approval</span>
          ) : (
            <span className="font-medium text-muted-foreground">Read-only access</span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary text-left text-secondary-foreground">
            <tr>
              {[
                "Month",
                "Prev. Reading",
                "Curr. Reading",
                "Units",
                "Electricity",
                "Rent",
                "Total",
                "Paid",
                "Due",
                "Extra paid",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-3 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={11} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={11} className="p-6 text-center text-muted-foreground">
                  No bills yet.{" "}
                  <Link to="/bills/new" className="text-primary underline">
                    Add one
                  </Link>
                </td>
              </tr>
            )}
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-muted/50">
                <td className="px-3 py-3 font-medium">{monthLabel(b.bill_year, b.bill_month)}</td>
                <td className="px-3 py-3">{Number(b.previous_reading)}</td>
                <td className="px-3 py-3">{Number(b.current_reading)}</td>
                <td className="px-3 py-3">{Number(b.units)}</td>
                <td className="px-3 py-3">{taka(b.electricity_bill)}</td>
                <td className="px-3 py-3">{taka(b.house_rent)}</td>
                <td className="px-3 py-3 font-semibold">{taka(b.total)}</td>
                <td className="px-3 py-3">{taka(b.amount_paid)}</td>
                <td
                  className={`px-3 py-3 font-semibold ${paymentBalance(Number(b.total), Number(b.amount_paid)).due > 0 ? "text-destructive" : "text-success"}`}
                >
                  {taka(paymentBalance(Number(b.total), Number(b.amount_paid)).due)}
                </td>
                <td className="px-3 py-3 font-semibold text-success">
                  {taka(paymentBalance(Number(b.total), Number(b.amount_paid)).extraPaid)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button asChild size="icon" variant="ghost" title="View receipt">
                      <Link to="/receipt/$id" params={{ id: b.id }} aria-label="View receipt">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Download PDF"
                      aria-label="Download PDF"
                      onClick={() => pdf(b)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canManage && (
                      <>
                        <Button asChild size="icon" variant="ghost" title="Edit">
                          <Link to="/bills/$id/edit" params={{ id: b.id }} aria-label="Edit record">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Record payment"
                          aria-label="Record payment"
                          onClick={() => setPayBill(b)}
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!payBill} onOpenChange={(o) => !o && setPayBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Record payment — {payBill && monthLabel(payBill.bill_year, payBill.bill_month)}
            </DialogTitle>
          </DialogHeader>
          {payBill && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Total {taka(payBill.total)} · Paid {taka(payBill.amount_paid)} · Due{" "}
                {taka(paymentBalance(Number(payBill.total), Number(payBill.amount_paid)).due)} ·
                Extra paid{" "}
                {taka(paymentBalance(Number(payBill.total), Number(payBill.amount_paid)).extraPaid)}
              </p>
              <div className="space-y-2">
                <Label htmlFor="pay">Amount received (৳)</Label>
                <Input
                  id="pay"
                  type="number"
                  min={0}
                  step="any"
                  className="h-12 text-base"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              {Number.isFinite(Number(payAmount)) && Number(payAmount) > 0 && (
                <p className="font-medium text-success">
                  Extra paid after payment:{" "}
                  {taka(
                    paymentBalance(
                      Number(payBill.total),
                      Number(payBill.amount_paid) + Number(payAmount),
                    ).extraPaid,
                  )}
                </p>
              )}
              <Button className="h-12 w-full" onClick={recordPayment}>
                Save payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {pdfBill && (
        <div className="fixed -left-[10000px] top-0 w-[800px]">
          <Receipt
            data={pdfBill}
            tenantName={settings.data?.tenant_name ?? ""}
            address={settings.data?.address ?? ""}
            ref={(el) => {
              if (el) el.id = "pdf-receipt";
            }}
          />
        </div>
      )}
    </div>
  );
}
