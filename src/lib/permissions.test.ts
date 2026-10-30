import { describe, expect, it } from "vitest";

import { accountStatusLabel, canManageBills, isOwnerProfile } from "@/lib/permissions";

describe("account permissions", () => {
  it("only treats approved profiles as bill managers", () => {
    expect(canManageBills({ status: "approved" })).toBe(true);
    expect(canManageBills({ status: "pending" })).toBe(false);
    expect(canManageBills({ status: "rejected" })).toBe(false);
    expect(canManageBills(null)).toBe(false);
  });

  it("only treats an approved owner as the owner", () => {
    expect(isOwnerProfile({ role: "owner", status: "approved" })).toBe(true);
    expect(isOwnerProfile({ role: "owner", status: "pending" })).toBe(false);
    expect(isOwnerProfile({ role: "member", status: "approved" })).toBe(false);
    expect(isOwnerProfile(null)).toBe(false);
  });

  it("labels account statuses for the UI", () => {
    expect(accountStatusLabel("approved")).toBe("Approved");
    expect(accountStatusLabel("rejected")).toBe("Rejected");
    expect(accountStatusLabel("pending")).toBe("Waiting for approval");
  });
});
