// Bangla formatting helpers used by the receipt. Kept free of React so they can
// be unit tested and reused anywhere the printed document is rendered.

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

export const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const;

/** Replace every ASCII digit with its Bangla counterpart. */
export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

const asNumber = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** 288 -> "২৮৮", 10456 -> "১০,৪৫৬" */
export function numberBn(value: number | string | null | undefined): string {
  return toBanglaDigits(asNumber(value).toLocaleString("en-IN", { maximumFractionDigits: 2 }));
}

/** 10456 -> "৳ ১০,৪৫৬.০০" (Bangla digits, two decimals). */
export function takaBn(value: number | string | null | undefined): string {
  const formatted = asNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `৳ ${toBanglaDigits(formatted)}`;
}

/** (2026, 9) -> "সেপ্টেম্বর ২০২৬" */
export function monthLabelBn(year: number, month: number): string {
  return `${BN_MONTHS[month - 1] ?? ""} ${toBanglaDigits(year)}`.trim();
}

/** "2026-10-30" -> "৩০ অক্টোবর ২০২৬" */
export function dateLabelBn(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${toBanglaDigits(date.getDate())} ${BN_MONTHS[date.getMonth()]} ${toBanglaDigits(
    date.getFullYear(),
  )}`;
}

/** 12, 2026, 9 -> "২০২৬০৯-০০১২" */
export function billNumberBn(no: number, year: number, month: number): string {
  return `${toBanglaDigits(year)}${toBanglaDigits(String(month).padStart(2, "0"))}-${toBanglaDigits(
    String(no).padStart(4, "0"),
  )}`;
}

export type BanglaPaymentStatus = "বাকি" | "আংশিক পরিশোধিত" | "পরিশোধিত";

export function paymentStatusBn(total: number, paid: number): BanglaPaymentStatus {
  if (paid <= 0) return "বাকি";
  if (paid >= total) return "পরিশোধিত";
  return "আংশিক পরিশোধিত";
}
