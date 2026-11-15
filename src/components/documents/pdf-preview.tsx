"use client";
import { PDFViewer } from "@react-pdf/renderer";
import { PdfDocument } from "@/lib/pdf/document";
import type { InvoiceDocument } from "@/types/domain";
export default function PdfPreview({ doc }: { doc: InvoiceDocument }) {
  return (
    <PDFViewer
      innerRef={(frame) => {
        if (frame) frame.title = "Exact paginated document preview";
      }}
      width="100%"
      height={650}
      style={{ border: 0, borderRadius: 6 }}
    >
      <PdfDocument doc={doc} />
    </PDFViewer>
  );
}
