/**
 * Render a receipt element to a single A4 PDF.
 *
 * Waits for webfonts (Bangla text) so the canvas is not captured with a
 * fallback font, renders at 3x for crisp small text, and compresses the image
 * so a receipt stays well under a megabyte.
 */
export async function downloadPdf(el: HTMLElement, filename: string) {
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Font loading API is best effort; carry on with whatever is available.
    }
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(el, {
    scale: 3,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const img = canvas.toDataURL("image/jpeg", 0.95);

  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;

  let w = pageW - margin * 2;
  let h = (canvas.height * w) / canvas.width;

  // A receipt is a single page: if it is taller than A4, scale it down instead
  // of splitting the signature off onto a second page.
  if (h > pageH - margin * 2) {
    h = pageH - margin * 2;
    w = (canvas.width * h) / canvas.height;
  }

  pdf.addImage(img, "JPEG", (pageW - w) / 2, margin, w, h, undefined, "FAST");
  pdf.save(filename);
}
