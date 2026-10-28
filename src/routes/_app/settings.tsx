import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchSettings, SINGLETON_ID } from "@/lib/data";
import { FIXED_HOUSE_RENT, taka } from "@/lib/bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [
    { title: "Settings — House Bill Tracker" },
    { name: "description", content: "Save house details and electricity rate with fixed monthly rent of ৳8,080." },
    { property: "og:title", content: "Settings — House Bill Tracker" },
    { property: "og:description", content: "Save house details and electricity rate with fixed monthly rent of ৳8,080." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SettingsPage,
});

const money = z.coerce.number().min(0, "Amounts cannot be negative").max(100000000);
const schema = z.object({
  tenant_name: z.string().trim().max(120),
  address: z.string().trim().max(250),
  electricity_rate: money,
});
type Form = Record<keyof z.infer<typeof schema>, string>;

const fields: { key: keyof Form; label: string; num?: boolean }[] = [
  { key: "tenant_name", label: "House / tenant name" },
  { key: "address", label: "Address or room number" },
  { key: "electricity_rate", label: "Electricity rate per unit (৳)", num: true },
];

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [form, setForm] = useState<Form>({
    tenant_name: "", address: "", electricity_rate: "0",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data)
      setForm({
        tenant_name: data.tenant_name, address: data.address,
        electricity_rate: String(data.electricity_rate),
      });
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    setBusy(true);
    const { error } = await supabase
      .from("house_settings")
      .upsert({ ...parsed.data, house_rent: FIXED_HOUSE_RENT, gas_bill: 0, water_bill: 0, other_charges: 0, user_id: SINGLETON_ID, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={save} className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <div className="flex items-center justify-between border-b pb-4">
        <span className="font-medium">Monthly house rent (fixed)</span>
        <span className="text-lg font-semibold text-primary">{taka(FIXED_HOUSE_RENT)}</span>
      </div>
      {fields.map((f) => (
        <div key={f.key} className="space-y-2">
          <Label htmlFor={f.key}>{f.label}</Label>
          <Input
            id={f.key}
            className="h-12 text-base"
            type={f.num ? "number" : "text"}
            step="any"
            min={f.num ? 0 : undefined}
            value={form[f.key]}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
          />
        </div>
      ))}
      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>Save settings</Button>
    </form>
  );
}
