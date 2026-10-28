export async function downloadPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  let w = pageW - margin * 2;
  let h = (canvas.height * w) / canvas.width;
  if (h > pageH - margin * 2) {
    h = pageH - margin * 2;
    w = (canvas.width * h) / canvas.height;
  }
  pdf.addImage(img, "PNG", (pageW - w) / 2, margin, w, h);
  pdf.save(filename);
}
