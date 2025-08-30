import jsPDF from "jspdf";

export function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (subtitle) doc.text(subtitle, 14, 24);
  const ts = new Date().toLocaleString();
  doc.setFontSize(9);
  doc.text(`Generado: ${ts}`, 200 - 14, 18, { align: "right" });
  doc.line(14, 28, 200 - 14, 28);
}

export function drawFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Página ${i} / ${pageCount}`, 200 - 14, 287, { align: "right" });
  }
}
