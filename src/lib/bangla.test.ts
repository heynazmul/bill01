import { describe, expect, it } from "vitest";

import {
  billNumberBn,
  dateLabelBn,
  monthLabelBn,
  numberBn,
  paymentStatusBn,
  takaBn,
  toBanglaDigits,
} from "./bangla";

describe("Bangla formatting", () => {
  it("converts ASCII digits to Bangla digits", () => {
    expect(toBanglaDigits(2026)).toBe("২০২৬");
    expect(toBanglaDigits("10,456.00")).toBe("১০,৪৫৬.০০");
  });

  it("formats plain numbers without decimals", () => {
    expect(numberBn(288)).toBe("২৮৮");
    expect(numberBn(10456)).toBe("১০,৪৫৬");
  });

  it("formats money as taka with Bangla digits", () => {
    expect(takaBn(8080)).toBe("৳ ৮,০৮০.০০");
    expect(takaBn(0)).toBe("৳ ০.০০");
    expect(takaBn(null)).toBe("৳ ০.০০");
  });

  it("labels months and dates in Bangla", () => {
    expect(monthLabelBn(2026, 9)).toBe("সেপ্টেম্বর ২০২৬");
    expect(monthLabelBn(2026, 12)).toBe("ডিসেম্বর ২০২৬");
    expect(dateLabelBn("2026-10-30T12:00:00")).toBe("৩০ অক্টোবর ২০২৬");
    expect(dateLabelBn(null)).toBe("");
  });

  it("builds a Bangla receipt number", () => {
    expect(billNumberBn(12, 2026, 9)).toBe("২০২৬০৯-০০১২");
  });

  it("classifies payments in Bangla", () => {
    expect(paymentStatusBn(100, 0)).toBe("বাকি");
    expect(paymentStatusBn(100, 40)).toBe("আংশিক পরিশোধিত");
    expect(paymentStatusBn(100, 100)).toBe("পরিশোধিত");
    expect(paymentStatusBn(100, 120)).toBe("পরিশোধিত");
  });
});
