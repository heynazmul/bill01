import { forwardRef } from "react";
import {
  billNumberBn,
  dateLabelBn,
  monthLabelBn,
  numberBn,
  paymentStatusBn,
  takaBn,
} from "@/lib/bangla";
import { paymentBalance } from "@/lib/bill";

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

/**
 * Printed receipt. Every visible word is Bangla — the app UI stays English.
 */
export const Receipt = forwardRef<HTMLDivElement, Props>(({ data, tenantName, address }, ref) => {
  const total = Number(data.total);
  const paid = Number(data.amount_paid);
  const balance = paymentBalance(total, paid);
  const status = paymentStatusBn(total, paid);
  const statusTone =
    status === "পরিশোধিত"
      ? "bg-success text-success-foreground"
      : status === "বাকি"
        ? "bg-destructive text-destructive-foreground"
        : "bg-warning text-warning-foreground";

  const row = (label: string, value: string, strong = false) => (
    <tr className={strong ? "font-semibold" : ""}>
      <td className="py-2 pr-4">{label}</td>
      <td className="py-2 text-right tabular-nums">{value}</td>
    </tr>
  );

  return (
    <div
      ref={ref}
      className="receipt font-bangla mx-auto w-full max-w-2xl bg-card p-6 text-card-foreground sm:p-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-primary pb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">বাড়ি ভাড়া ও বিদ্যুৎ বিলের রসিদ</h2>
          <p className="mt-1 text-sm text-muted-foreground">মাসিক পরিশোধের রসিদ</p>
        </div>
        <div className="space-y-1 text-right text-sm">
          <p className="font-semibold">
            রসিদ নং:{" "}
            {data.bill_no
              ? billNumberBn(data.bill_no, data.bill_year, data.bill_month)
              : "এখনো সংরক্ষিত হয়নি"}
          </p>
          <p>বিলের মাস: {monthLabelBn(data.bill_year, data.bill_month)}</p>
          <p className="text-muted-foreground">
            ইস্যু তারিখ: {dateLabelBn(data.created_at ?? new Date())}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1 rounded-md bg-secondary p-4 text-sm">
        <p>
          <span className="text-muted-foreground">ভাড়াটিয়ার নাম:</span>{" "}
          <span className="font-medium">{tenantName || "—"}</span>
        </p>
        <p>
          <span className="text-muted-foreground">ঠিকানা:</span>{" "}
          <span className="font-medium">{address || "—"}</span>
        </p>
      </div>

      <h3 className="mt-6 text-sm font-semibold text-primary">বিদ্যুতের হিসাব</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {row("পূর্বের রিডিং", numberBn(data.previous_reading))}
          {row("বর্তমান রিডিং", numberBn(data.current_reading))}
          {row("ব্যবহৃত ইউনিট", numberBn(data.units))}
          {row("প্রতি ইউনিটের দর", takaBn(data.electricity_rate))}
        </tbody>
      </table>

      <h3 className="mt-6 text-sm font-semibold text-primary">খরচের বিবরণ</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {row("বাড়ি ভাড়া", takaBn(data.house_rent))}
          {row("বিদ্যুৎ বিল", takaBn(data.electricity_bill))}
          {row("পূর্বের বকেয়া", takaBn(data.previous_due))}
        </tbody>
      </table>

      <div className="mt-4 rounded-md border-2 border-primary p-4">
        <table className="w-full text-base">
          <tbody>
            {row("মোট প্রদেয়", takaBn(total), true)}
            {row("পরিশোধিত", takaBn(paid))}
            {row("বাকি", takaBn(balance.due), true)}
            {balance.extraPaid > 0 && row("অতিরিক্ত পরিশোধ", takaBn(balance.extraPaid), true)}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 text-sm">
        <div className="space-y-2">
          <span className={`inline-block rounded-full px-3 py-1 font-semibold ${statusTone}`}>
            {status}
          </span>
          {balance.extraPaid > 0 && (
            <p className="max-w-xs text-xs text-muted-foreground">
              অতিরিক্ত পরিশোধ পরবর্তী মাসের বিলের সাথে সমন্বয় করা হবে।
            </p>
          )}
        </div>
        <div className="text-center">
          <div className="mb-1 h-8 w-40 border-b border-foreground" />
          <span className="text-muted-foreground">স্বাক্ষর</span>
        </div>
      </div>

      <p className="mt-6 border-t pt-3 text-center text-xs text-muted-foreground">
        এই রসিদটি কম্পিউটারভিত্তিকভাবে তৈরি হয়েছে।
      </p>
    </div>
  );
});
Receipt.displayName = "Receipt";
