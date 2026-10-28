import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type Settings = Database["public"]["Tables"]["house_settings"]["Row"];

// No login: all rows share this fixed id so the one-bill-per-month constraint
// and the settings primary key keep working.
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
