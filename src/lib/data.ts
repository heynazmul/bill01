import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type Settings = Database["public"]["Tables"]["house_settings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Bills and settings are shared rows. Write access is controlled by the
// approved-account policies in Supabase, not by a per-user row owner.
export const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

export async function fetchSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from("house_settings").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchBills(): Promise<Bill[]> {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .order("bill_year", { ascending: false })
    .order("bill_month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchBill(id: string): Promise<Bill> {
  const { data, error } = await supabase.from("bills").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchPendingProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function reviewAccount(
  id: string,
  decision: "approved" | "rejected",
): Promise<Profile> {
  const { data, error } = await supabase.rpc("review_account", {
    target_id: id,
    decision,
  });
  if (error) throw error;
  if (!data) throw new Error("Account review did not return a profile");
  return data;
}
