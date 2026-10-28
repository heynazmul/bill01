import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchBills, fetchSettings, SINGLETON_ID, type Bill } from "@/lib/data";
import { calculateBill, FIXED_HOUSE_RENT, MONTHS, taka } from "@/lib/bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptView } from "@/components/ReceiptActions";

type Num = "previous_reading" | "current_reading" | "electricity_rate" | "previous_due" | "amount_paid";

export function BillForm({ existing }: { existing?: Bill }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const billsQ = useQuery({ queryKey: ["bills"], queryFn: fetchBills });
  const now = new Date();
  const [year, setYear] = useState(existing?.bill_year ?? now.getFullYear());
  const [month, setMonth] = useState(existing?.bill_month ?? now.getMonth() + 1);
  const [v, setV] = useState<Record<Num, string>>(() => {
    const e = existing;
    const s = (n: unknown) => (n == null ? "" : String(Number(n)));
    return {
      previous_reading: s(e?.previous_reading), current_reading: s(e?.current_reading),
      electricity_rate: s(e?.electricity_rate), previous_due: s(e?.previous_due ?? 0),
      amount_paid: s(e?.amount_paid ?? 0),
    };
  });
  const [prefilled, setPrefilled] = useState(!!existing);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  // Prefill from settings + last bill's closing reading for new bills
  useEffect(() => {
    if (prefilled || settingsQ.isLoading || billsQ.isLoading) return;
    const st = settingsQ.data;
    const last = billsQ.data?.[0];
    setV((p) => ({
      ...p,
      previous_reading: last ? String(Number(last.current_reading)) : p.previous_reading,
      electricity_rate: String(Number(st?.electricity_rate ?? 0)),
    }));
    setPrefilled(true);
  }, [prefilled, settingsQ.isLoading, billsQ.isLoading, settingsQ.data, billsQ.data]);

  const n = (k: Num) => Number(v[k] || 0);
  const calc = useMemo(
    () => calculateBill({
      previousReading: n("previous_reading"), currentReading: n("current_reading"), rate: n("electricity_rate"),
      previousDue: n("previous_due"), amountPaid: n("amount_paid"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [v],
  );

  const duplicate = billsQ.data?.find((b) => b.bill_year === year && b.bill_month === month && b.id !== existing?.id);
  const readingError =
    v.current_reading !== "" && n("current_reading") < n("previous_reading")
      ? "Current reading cannot be lower than the previous reading."
      : null;
  const negative = (Object.keys(v) as Num[]).some((k) => n(k) < 0 || Number.isNaN(n(k)));

  function validate() {
    if (v.current_reading === "") return "Enter the current meter reading.";
    if (negative) return "Values cannot be negative.";
    if (readingError) return readingError;
    if (duplicate) return `A bill for ${MONTHS[month - 1]} ${year} already exists. Edit that bill instead.`;
    return null;
  }

  async function save() {
    const err = validate();
    if (err) return void toast.error(err);
    setBusy(true);
    const row = {
      bill_year: year, bill_month: month,
      previous_reading: n("previous_reading"), current_reading: n("current_reading"),
      units: calc.units, electricity_rate: n("electricity_rate"), electricity_bill: calc.electricityBill,
      house_rent: FIXED_HOUSE_RENT, gas_bill: 0, water_bill: 0,
      other_charges: 0, previous_due: n("previous_due"), discount: 0,
      total: calc.total, amount_paid: n("amount_paid"), due: calc.due,
    };
    const res = existing
      ? await supabase.from("bills").update({ ...row, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single()
      : await supabase.from("bills").insert({ ...row, user_id: SINGLETON_ID }).select().single();
    setBusy(false);
    if (res.error) {
      return void toast.error(res.error.code === "23505" ? "A bill for this month already exists." : res.error.message);
    }
    toast.success("Bill saved");
    qc.invalidateQueries({ queryKey: ["bills"] });
    qc.invalidateQueries({ queryKey: ["bill", res.data.id] });
    navigate({ to: "/receipt/$id", params: { id: res.data.id } });
  }

  const field = (k: Num, label: string, hint?: string) => (
    <div className="space-y-2">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type="number" step="any" min={0} inputMode="decimal" className="h-12 text-base"
        value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - 5 + i);
  const selectCls = "h-12 w-full rounded-md border border-input bg-background px-3 text-base";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="month">Billing month</Label>
            <select id="month" className={selectCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <select id="year" className={selectCls} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {duplicate && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
              A bill for this month already exists.{" "}
              <Link to="/bills/$id/edit" params={{ id: duplicate.id }} className="font-semibold underline">Edit it instead</Link>
            </p>
          )}
        </section>

        <section className="space-y-4 rounded-xl border bg-secondary/50 p-4">
          <h2 className="font-semibold text-primary">Electricity meter</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("previous_reading", "Previous reading", existing ? undefined : "Taken from last month's closing reading — you can correct it.")}
            {field("current_reading", "Current reading")}
          </div>
          {readingError && <p className="text-sm font-medium text-destructive">{readingError}</p>}
          {field("electricity_rate", "Rate per unit (৳)")}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {field("previous_due", "Previous due (৳)")}
          {field("amount_paid", "Amount paid now (৳)")}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border-2 border-primary bg-card p-5 lg:sticky lg:top-6">
        <h2 className="font-semibold">Bill summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">House rent (fixed)</dt><dd>{taka(FIXED_HOUSE_RENT)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Units used</dt><dd>{calc.units}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Electricity bill</dt><dd>{taka(calc.electricityBill)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold"><dt>Total</dt><dd className="text-primary">{taka(calc.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Remaining due</dt><dd>{taka(calc.due)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Extra paid</dt><dd className="text-success">{taka(calc.extraPaid)}</dd></div>
        </dl>
        <Button size="lg" className="h-14 w-full text-base" onClick={() => { const e = validate(); if (e) toast.error(e); else setPreview(true); }}>
          <FileText className="mr-2 h-5 w-5" /> Generate Receipt
        </Button>
        <Button size="lg" variant="outline" className="h-12 w-full" onClick={save} disabled={busy}>
          <Save className="mr-2 h-4 w-4" /> Save bill
        </Button>
      </aside>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader className="no-print"><DialogTitle>Receipt preview</DialogTitle></DialogHeader>
          <ReceiptView
            tenantName={settingsQ.data?.tenant_name ?? ""}
            address={settingsQ.data?.address ?? ""}
            data={{
              bill_no: existing?.bill_no ?? null, bill_year: year, bill_month: month,
              previous_reading: n("previous_reading"), current_reading: n("current_reading"), units: calc.units,
              electricity_rate: n("electricity_rate"), electricity_bill: calc.electricityBill,
              house_rent: FIXED_HOUSE_RENT, previous_due: n("previous_due"),
              total: calc.total, amount_paid: n("amount_paid"), due: calc.due, created_at: existing?.created_at ?? null,
            }}
            extra={<Button onClick={save} disabled={busy}><Save className="mr-2 h-4 w-4" /> Save bill</Button>}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
