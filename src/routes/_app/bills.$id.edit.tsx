import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BillForm } from "@/components/BillForm";
import { fetchBill } from "@/lib/data";
import { monthLabel } from "@/lib/bill";

export const Route = createFileRoute("/_app/bills/$id/edit")({
  head: () => ({ meta: [
    { title: "Edit Bill — House Bill Tracker" },
    { name: "description", content: "Update monthly meter readings and payments for your house bill." },
    { property: "og:title", content: "Edit Bill — House Bill Tracker" },
    { property: "og:description", content: "Update monthly meter readings and payments for your house bill." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EditBill,
});

function EditBill() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["bill", id], queryFn: () => fetchBill(id) });
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error || !data) return <p className="text-destructive">Bill not found.</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit bill — {monthLabel(data.bill_year, data.bill_month)}</h1>
      <BillForm key={data.id + data.updated_at} existing={data} />
    </div>
  );
}
