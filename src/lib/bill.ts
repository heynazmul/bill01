export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(year: number, month: number) {
  return `${MONTHS[month - 1]} ${year}`;
}

export function taka(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return `৳ ${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export const FIXED_HOUSE_RENT = 8080;

export function paymentBalance(total: number, amountPaid: number) {
  return {
    due: r2(Math.max(0, total - amountPaid)),
    extraPaid: r2(Math.max(0, amountPaid - total)),
  };
}

export interface BillInputs {
  previousReading: number;
  currentReading: number;
  rate: number;
  previousDue: number;
  amountPaid: number;
}

export function calculateBill(i: BillInputs) {
  const units = r2(Math.max(0, i.currentReading - i.previousReading));
  const electricityBill = r2(units * i.rate);
  const total = r2(FIXED_HOUSE_RENT + electricityBill + i.previousDue);
  return { units, electricityBill, total, ...paymentBalance(total, i.amountPaid) };
}

export function paymentStatus(total: number, paid: number) {
  if (paid <= 0) return "Unpaid";
  if (paid >= total) return "Paid";
  return "Partially paid";
}

/**
 * Remaining due to carry into the next bill, taken from the newest bill.
 * `bills` must be ordered newest first, as `fetchBills()` returns it.
 */
export function carriedDue(
  bills: ReadonlyArray<{ total: number | string; amount_paid: number | string }>,
): number {
  const last = bills[0];
  if (!last) return 0;
  return paymentBalance(Number(last.total), Number(last.amount_paid)).due;
}

export function billNumber(no: number, year: number, month: number) {
  return `HB-${year}${String(month).padStart(2, "0")}-${String(no).padStart(4, "0")}`;
}
