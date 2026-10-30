import { useRef, useState, type ReactNode } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Receipt, type ReceiptData } from "@/components/Receipt";
import { downloadPdf } from "@/lib/pdf";

export function ReceiptView({
  data,
  tenantName,
  address,
  extra,
}: {
  data: ReceiptData;
  tenantName: string;
  address: string;
  extra?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const name = `receipt-${data.bill_year}-${String(data.bill_month).padStart(2, "0")}.pdf`;

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    try {
      await downloadPdf(ref.current, name);
    } catch {
      toast.error("পিডিএফ তৈরি করা যায়নি");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2">
        <Button variant="outline" onClick={download} disabled={busy}>
          <Download className="mr-2 h-4 w-4" />
          {busy ? "তৈরি হচ্ছে…" : "পিডিএফ ডাউনলোড"}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> প্রিন্ট করুন
        </Button>
        {extra}
      </div>
      <div className="rounded-xl border shadow-sm print:border-0 print:shadow-none">
        <Receipt ref={ref} data={data} tenantName={tenantName} address={address} />
      </div>
    </div>
  );
}
