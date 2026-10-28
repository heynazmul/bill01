import { createFileRoute } from "@tanstack/react-router";
import { BillForm } from "@/components/BillForm";

export const Route = createFileRoute("/_app/bills/new")({
  head: () => ({ meta: [
    { title: "Add Monthly Bill — House Bill Tracker" },
    { name: "description", content: "Calculate a monthly electricity bill with fixed ৳8,080 rent and generate a receipt." },
    { property: "og:title", content: "Add Monthly Bill — House Bill Tracker" },
    { property: "og:description", content: "Calculate a monthly electricity bill with fixed ৳8,080 rent and generate a receipt." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Monthly Bill</h1>
      <BillForm />
    </div>
  ),
});
