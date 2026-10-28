import { forwardRef } from "react";
import { billNumber, monthLabel, paymentBalance, paymentStatus, taka } from "@/lib/bill";

export interface ReceiptData {
  bill_no: number | null;
  bill_year: number;
  bill_month: number;
  previous_reading: number;
  current_reading: number;
  units: number;
  electricity_rate: number;
  electricity_bill: number;
  house_rent: number;
  previous_due: number;
  total: number;
  amount_paid: number;
  due: number;
  created_at: string | null;
}

interface Props {
  data: ReceiptData;
  tenantName: string;
  address: string;
}

export const Receipt = forwardRef<HTMLDivElement, Props>(({ data, tenantName, address }, ref) => {
  const status = paymentStatus(Number(data.total), Number(data.amount_paid));
  const balance = paymentBalance(Number(data.total), Number(data.amount_paid));
  const row = (label: string, bn: string, value: string, strong = false) => (
    <tr className={strong ? "font-semibold" : ""}>
      <td className="py-2 pr-4">
        {label} <span className="text-muted-foreground">/ {bn}</span>
      </td>
      <td className="py-2 text-right tabular-nums">{value}</td>
    </tr>
  );
  return (
    <div ref={ref} className="receipt mx-auto w-full max-w-2xl bg-card p-6 text-card-foreground sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-primary pb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">House Bill Receipt</h2>
          <p className="text-sm text-muted-foreground">বাড়ি ভাড়া ও বিল রসিদ</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">
            Bill No: {data.bill_no ? billNumber(data.bill_no, data.bill_year, data.bill_month) : "Not saved yet"}
          </p>
          <p>Month / মাস: {monthLabel(data.bill_year, data.bill_month)}</p>
          <p className="text-muted-foreground">
            Date: {new Date(data.created_at ?? Date.now()).toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-secondary p-4 text-sm">
        <p><span className="text-muted-foreground">Tenant / ভাড়াটিয়া:</span> <span className="font-medium">{tenantName || "—"}</span></p>
        <p><span className="text-muted-foreground">Address / ঠিকানা:</span> <span className="font-medium">{address || "—"}</span></p>
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-primary">Electricity / বিদ্যুৎ</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {row("Previous reading", "পূর্বের রিডিং", String(Number(data.previous_reading)))}
          {row("Current reading", "বর্তমান রিডিং", String(Number(data.current_reading)))}
          {row("Units consumed", "ব্যবহৃত ইউনিট", String(Number(data.units)))}
          {row("Rate per unit", "প্রতি ইউনিট দর", taka(data.electricity_rate))}
        </tbody>
      </table>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-primary">Charges / খরচ</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {row("House rent", "বাড়ি ভাড়া", taka(data.house_rent))}
          {row("Electricity bill", "বিদ্যুৎ বিল", taka(data.electricity_bill))}
          {row("Previous due", "পূর্বের বকেয়া", taka(data.previous_due))}
        </tbody>
      </table>

      <div className="mt-4 rounded-md border-2 border-primary p-4">
        <table className="w-full text-base">
          <tbody>
            {row("Total payable", "মোট প্রদেয়", taka(data.total), true)}
            {row("Amount paid", "পরিশোধিত", taka(data.amount_paid))}
            {row("Remaining due", "বাকি", taka(balance.due), true)}
            {row("Extra paid", "অতিরিক্ত পরিশোধ", taka(balance.extraPaid), true)}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-end justify-between text-sm">
        <span className={`rounded-full px-3 py-1 font-semibold ${status === "Paid" ? "bg-success text-success-foreground" : status === "Unpaid" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>
          {status}
        </span>
        <div className="text-center">
          <div className="mb-1 h-8 w-40 border-b border-foreground" />
          <span className="text-muted-foreground">Signature / স্বাক্ষর</span>
        </div>
      </div>
    </div>
  );
});
Receipt.displayName = "Receipt";
