import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";
import { documentAccent } from "@/lib/document-style";
import type { InvoiceDocument } from "@/types/domain";
import { calculate, money } from "@/lib/calculations";
import { download } from "@/lib/utils";
Font.register({
  family: "Geist",
  fonts: [
    { src: "/fonts/Geist-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Geist-Regular.ttf", fontWeight: 700 },
  ],
});
const s = StyleSheet.create({
  page: {
    padding: 42,
    paddingBottom: 64,
    fontFamily: "Geist",
    fontSize: 9,
    color: "#172033",
    // Avoid inherited lineHeight: pagination resolves it repeatedly on dynamic text.
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    alignItems: "flex-start",
  },
  title: { fontSize: 27, fontFamily: "Geist", fontWeight: 700 },
  heading: {
    fontSize: 15,
    fontFamily: "Geist",
    fontWeight: 700,
    marginBottom: 6,
  },
  muted: { color: "#667085" },
  label: { fontSize: 8, color: "#667085", marginBottom: 6, letterSpacing: 1 },
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  half: { width: "47%", flexShrink: 0 },
  metadata: { width: "47%", flexShrink: 0, textAlign: "right" },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e7eaf0",
  },
  desc: { width: "46%", paddingRight: 10 },
  qty: { width: "10%", textAlign: "right" },
  rate: { width: "22%", textAlign: "right" },
  total: { width: "22%", textAlign: "right" },
  totals: { width: "48%", marginLeft: "52%", marginTop: 18 },
  sum: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  note: { marginTop: 20 },
  logo: { width: 75, height: 45, objectFit: "contain", marginBottom: 8 },
  footer: {
    position: "absolute",
    bottom: 18,
    height: 26,
    alignItems: "flex-end",
    left: 42,
    right: 42,
    fontSize: 8,
    color: "#667085",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { width: "84%", maxLines: 2, textOverflow: "ellipsis" },
  pageNumber: { width: "14%", textAlign: "right" },
});
export function PdfDocument({ doc }: { doc: InvoiceDocument }) {
  const t = calculate(doc);
  const color = documentAccent(doc.appearance);
  return (
    <Document
      title={`${doc.type} ${doc.number}`}
      author={doc.business.company || doc.business.name}
    >
      <Page
        size="A4"
        style={[
          s.page,
          doc.appearance.template === "corporate"
            ? { borderTopWidth: 6, borderTopColor: color }
            : {},
        ]}
        wrap
      >
        <View style={s.top} wrap={false}>
          <View style={s.half}>
            {doc.appearance.showLogo && doc.business.logo && (
              <Image
                aria-label="Business logo"
                src={doc.business.logo}
                style={s.logo}
              />
            )}
            <Text style={s.heading}>
              {doc.business.company || doc.business.name || "Your business"}
            </Text>
            {[
              doc.business.address,
              doc.business.email,
              doc.business.phone,
              doc.business.website,
              doc.business.taxNumber && `Tax ID: ${doc.business.taxNumber}`,
              doc.business.registration &&
                `Registration: ${doc.business.registration}`,
            ]
              .filter(Boolean)
              .map((v, i) => (
                <Text key={i} style={s.muted}>
                  {v}
                </Text>
              ))}
          </View>
          <View style={s.metadata}>
            <Text style={[s.title, { color }]}>
              {doc.type === "invoice" ? "INVOICE" : "QUOTATION"}
            </Text>
            <Text>{doc.number}</Text>
            <Text style={s.muted}>{doc.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={s.parties} wrap={false}>
          <View style={s.half}>
            <Text style={s.label}>
              {doc.type === "invoice" ? "BILL TO" : "PREPARED FOR"}
            </Text>
            <Text style={s.heading}>
              {doc.client.company || doc.client.name}
            </Text>
            {[
              doc.client.address,
              doc.client.email,
              doc.client.phone,
              doc.client.taxNumber && `Tax ID: ${doc.client.taxNumber}`,
            ]
              .filter(Boolean)
              .map((v, i) => (
                <Text key={i}>{v}</Text>
              ))}
          </View>
          <View style={s.metadata}>
            <Text>Issue date: {doc.issueDate}</Text>
            <Text>
              {doc.type === "invoice" ? "Due date" : "Valid until"}:{" "}
              {doc.dueDate}
            </Text>
            {doc.reference && <Text>Reference: {doc.reference}</Text>}
            {doc.po && <Text>Purchase order: {doc.po}</Text>}
          </View>
        </View>
        <View
          style={[
            s.row,
            {
              backgroundColor:
                doc.appearance.template === "minimal" ? "white" : color,
              color: doc.appearance.template === "minimal" ? color : "white",
              paddingHorizontal: 8,
              borderBottomWidth:
                doc.appearance.template === "minimal" ? 1.5 : 0,
              borderBottomColor: color,
            },
          ]}
          fixed
        >
          <Text style={s.desc}>DESCRIPTION</Text>
          <Text style={s.qty}>QTY</Text>
          <Text style={s.rate}>RATE</Text>
          <Text style={s.total}>AMOUNT</Text>
        </View>
        {doc.lines.map((l, i) => (
          <View key={l.id} style={s.row} wrap={false}>
            <View style={s.desc}>
              <Text style={{ fontFamily: "Geist", fontWeight: 700 }}>
                {l.name || "Item"}
              </Text>
              {l.description && <Text style={s.muted}>{l.description}</Text>}
              {Number(l.discount) > 0 && (
                <Text style={s.muted}>
                  Discount: {l.discount}
                  {l.discountType === "percent" ? "%" : ` ${doc.currency}`}
                </Text>
              )}
              {Number(l.tax) > 0 && (
                <Text style={s.muted}>
                  Tax: {l.tax}%{doc.taxInclusive ? " (included)" : ""}
                </Text>
              )}
            </View>
            <Text style={s.qty}>{l.quantity}</Text>
            <Text style={s.rate}>{money(l.price, doc.currency)}</Text>
            <Text style={s.total}>{money(t.lines[i].total, doc.currency)}</Text>
          </View>
        ))}
        <View style={s.totals} wrap={false}>
          <View style={s.sum}>
            <Text>Subtotal</Text>
            <Text>{money(t.subtotal, doc.currency)}</Text>
          </View>
          {Number(t.discount) > 0 && (
            <View style={s.sum}>
              <Text>Discount</Text>
              <Text>− {money(t.discount, doc.currency)}</Text>
            </View>
          )}
          {t.taxes.map((v) => (
            <View style={s.sum} key={v.rate}>
              <Text>Tax ({v.rate}%)</Text>
              <Text>{money(v.amount, doc.currency)}</Text>
            </View>
          ))}
          {Number(t.shipping) > 0 && (
            <View style={s.sum}>
              <Text>Additional charges</Text>
              <Text>{money(t.shipping, doc.currency)}</Text>
            </View>
          )}
          {t.hasAdvancePayment && (
            <>
              <View style={s.sum}>
                <Text>Invoice total</Text>
                <Text>{money(t.total, doc.currency)}</Text>
              </View>
              <View style={s.sum}>
                <Text>Advance payment</Text>
                <Text>− {money(t.advancePayment, doc.currency)}</Text>
              </View>
            </>
          )}
          <View
            style={[
              s.sum,
              {
                borderTopWidth: 1,
                borderTopColor: color,
                color,
                fontFamily: "Geist",
                fontWeight: 700,
                fontSize: 12,
              },
            ]}
          >
            <Text>
              {t.hasAdvancePayment ? "Balance due" : "Total"} ({doc.currency})
            </Text>
            <Text>{money(t.balanceDue, doc.currency)}</Text>
          </View>
        </View>
        {doc.notes && (
          <View style={s.note}>
            <Text style={s.label}>NOTES</Text>
            <Text>{doc.notes}</Text>
          </View>
        )}
        {doc.type === "invoice" && doc.payment.enabled && (
          <View style={s.note}>
            <Text style={s.label}>PAYMENT DETAILS</Text>
            {Object.entries(doc.payment)
              .filter(([k, v]) => k !== "enabled" && v)
              .map(([k, v]) => (
                <Text key={k}>
                  {k === "instructions" ? "" : `${k}: `}
                  {v}
                </Text>
              ))}
          </View>
        )}
        {doc.terms && (
          <View style={s.note}>
            <Text style={s.label}>TERMS & CONDITIONS</Text>
            <Text>{doc.terms}</Text>
          </View>
        )}
        <View style={s.footer} fixed>
          {doc.appearance.footer && (
            <Text style={s.footerText}>{doc.appearance.footer}</Text>
          )}
          <Text
            style={[
              s.pageNumber,
              !doc.appearance.footer ? { marginLeft: "86%" } : {},
            ]}
            render={({
              pageNumber,
              totalPages,
            }: {
              pageNumber: number;
              totalPages: number;
            }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
export async function makePdf(doc: InvoiceDocument) {
  return pdf(<PdfDocument doc={doc} />).toBlob();
}
export async function exportPdf(doc: InvoiceDocument, print = false) {
  const blob = await makePdf(doc);
  if (print) {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      download(blob, `${doc.type}-${doc.number}.pdf`);
      return;
    }
    w.addEventListener("load", () => w.print(), { once: true });
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  } else
    download(
      blob,
      `${doc.type === "invoice" ? "Invoice" : "Quotation"}-${doc.number.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      )}.pdf`
    );
}
