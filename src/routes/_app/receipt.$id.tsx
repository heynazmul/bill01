import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { fetchBill, fetchSettings } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";
import { ReceiptView } from "@/components/ReceiptActions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/receipt/$id")({
  head: () => ({
    meta: [
      { title: "Receipt — House Bill Tracker" },
      {
        name: "description",
        content: "View, print or download your house bill receipt including any extra payment.",
      },
      { property: "og:title", content: "Receipt — House Bill Tracker" },
      {
        property: "og:description",
        content: "View, print or download your house bill receipt including any extra payment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useParams();
  return (
    <AuthGate level="signedIn" title="Sign in to view this receipt">
      <ReceiptContent id={id} />
    </AuthGate>
  );
}

function ReceiptContent({ id }: { id: string }) {
  const { isApproved } = useAuth();
  const bill = useQuery({ queryKey: ["bill", id], queryFn: () => fetchBill(id) });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  if (bill.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!bill.data) return <p className="text-destructive">Bill not found.</p>;
  return (
    <ReceiptView
      data={bill.data}
      tenantName={settings.data?.tenant_name ?? ""}
      address={settings.data?.address ?? ""}
      extra={
        isApproved ? (
          <Button asChild variant="outline">
            <Link to="/bills/$id/edit" params={{ id }}>
              <Pencil className="mr-2 h-4 w-4" /> সম্পাদনা
            </Link>
          </Button>
        ) : null
      }
    />
  );
}
