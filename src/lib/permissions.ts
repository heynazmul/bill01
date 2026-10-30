import type { Profile } from "@/lib/data";

export type ProfileStatus = "pending" | "approved" | "rejected";

export function isOwnerProfile(
  profile: Pick<Profile, "role" | "status"> | null | undefined,
): boolean {
  return profile?.role === "owner" && profile.status === "approved";
}

export function canManageBills(profile: Pick<Profile, "status"> | null | undefined): boolean {
  return profile?.status === "approved";
}

export function accountStatusLabel(status: string | null | undefined): string {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Waiting for approval";
}
