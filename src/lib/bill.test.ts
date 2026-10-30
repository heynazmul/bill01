import { describe, it, expect } from "vitest";
import { carriedDue, calculateBill, paymentBalance, paymentStatus } from "./bill";

const base = {
  previousReading: 1000,
  currentReading: 1150,
  rate: 8,
  previousDue: 500,
  amountPaid: 0,
};

describe("calculateBill", () => {
  it("units = current - previous", () => {
    expect(calculateBill(base).units).toBe(150);
  });
  it("electricity bill = units x rate", () => {
    expect(calculateBill(base).electricityBill).toBe(1200);
  });
  it("uses fixed rent of 8080", () => {
    expect(calculateBill({ ...base, currentReading: 1000, previousDue: 0 }).total).toBe(8080);
  });
  it("total includes only fixed rent, electricity and previous due", () => {
    expect(calculateBill(base).total).toBe(9780);
  });
  it("due = total - paid", () => {
    expect(calculateBill({ ...base, amountPaid: 5000 }).due).toBe(4780);
  });
  it("shows overpayment as extra paid rather than negative due", () => {
    expect(calculateBill({ ...base, amountPaid: 10000 })).toMatchObject({ due: 0, extraPaid: 220 });
  });
  it("shows no extra paid for an underpayment", () => {
    expect(paymentBalance(8080, 8000)).toEqual({ due: 80, extraPaid: 0 });
  });
  it("shows zero due and extra paid for exact payment", () => {
    expect(paymentBalance(8080, 8080)).toEqual({ due: 0, extraPaid: 0 });
  });
});

describe("paymentStatus", () => {
  it("classifies payments", () => {
    expect(paymentStatus(100, 0)).toBe("Unpaid");
    expect(paymentStatus(100, 40)).toBe("Partially paid");
    expect(paymentStatus(100, 100)).toBe("Paid");
  });
});

describe("carriedDue", () => {
  it("returns 0 when there are no previous bills", () => {
    expect(carriedDue([])).toBe(0);
  });

  it("carries the newest bill's outstanding due forward", () => {
    expect(
      carriedDue([
        { total: 10456, amount_paid: 9132 },
        { total: 9868, amount_paid: 9868 },
      ]),
    ).toBe(1324);
  });

  it("never carries a negative due when the last bill was overpaid", () => {
    expect(carriedDue([{ total: 8080, amount_paid: 8500 }])).toBe(0);
  });
});
