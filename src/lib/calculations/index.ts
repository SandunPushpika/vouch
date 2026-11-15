import { format } from "date-fns";
import Decimal from "decimal.js";
import type { InvoiceDocument, Line } from "@/types/domain";
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export function precision(currency: string) {
  try {
    return (
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}
export function money(value: string | number, currency: string) {
  try {
    const digits = precision(currency);
    const fixed = new Decimal(value || 0).toFixed(digits);
    const negative = fixed.startsWith("-");
    const [integer, fraction] = fixed.replace("-", "").split(".");
    const subunitNegative = negative && BigInt(integer) === 0n;
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).formatToParts(
      subunitNegative ? -1n : negative ? -BigInt(integer) : BigInt(integer)
    );
    return parts
      .map((part) =>
        part.type === "fraction"
          ? fraction
          : subunitNegative && part.type === "integer"
          ? "0"
          : part.value
      )
      .join("");
  } catch {
    return `${currency} ${value}`;
  }
}
const n = (v: string) => {
  try {
    return new Decimal(v || 0);
  } catch {
    return new Decimal(0);
  }
};
export function calculate(
  doc: Pick<
    InvoiceDocument,
    "lines" | "currency" | "taxInclusive" | "shipping"
  > &
    Partial<Pick<InvoiceDocument, "type" | "advancePayment">>
) {
  const p = precision(doc.currency),
    round = (v: Decimal) => v.toDecimalPlaces(p);
  let subtotal = new Decimal(0),
    discount = new Decimal(0),
    tax = new Decimal(0);
  const taxes: Record<string, Decimal> = {};
  const lines = doc.lines.map((line: Line) => {
    const raw = round(n(line.price).times(n(line.quantity)));
    const off = round(
      Decimal.min(
        raw,
        line.discountType === "percent"
          ? raw.times(Decimal.min(n(line.discount), 100)).div(100)
          : n(line.discount)
      )
    );
    const net = raw.minus(off);
    const rate = n(line.tax);
    const t = round(
      doc.taxInclusive
        ? net.minus(net.div(rate.div(100).plus(1)))
        : net.times(rate).div(100)
    );
    const base = doc.taxInclusive ? net.minus(t) : net;
    const originalBase = doc.taxInclusive
      ? round(raw.div(rate.div(100).plus(1)))
      : raw;
    const baseDiscount = doc.taxInclusive ? originalBase.minus(base) : off;
    subtotal = subtotal.plus(originalBase);
    discount = discount.plus(baseDiscount);
    tax = tax.plus(t);
    const taxKey = rate.toString();
    taxes[taxKey] = (taxes[taxKey] ?? new Decimal(0)).plus(t);
    return {
      base: base.toFixed(p),
      discount: baseDiscount.toFixed(p),
      tax: t.toFixed(p),
      total: (doc.taxInclusive ? net : net.plus(t)).toFixed(p),
    };
  });
  const total = round(subtotal.minus(discount).plus(tax).plus(n(doc.shipping)));
  const advancePayment =
    doc.type === "invoice"
      ? round(n(doc.advancePayment ?? "0"))
      : new Decimal(0);
  const balanceDue = Decimal.max(total.minus(advancePayment), 0);
  return {
    lines,
    subtotal: subtotal.toFixed(p),
    discount: discount.toFixed(p),
    tax: tax.toFixed(p),
    taxes: Object.entries(taxes)
      .filter(([, v]) => !v.isZero())
      .map(([rate, v]) => ({ rate, amount: v.toFixed(p) })),
    shipping: round(n(doc.shipping)).toFixed(p),
    total: total.toFixed(p),
    advancePayment: advancePayment.toFixed(p),
    balanceDue: balanceDue.toFixed(p),
    hasAdvancePayment: advancePayment.greaterThan(0),
    advanceExceedsTotal: advancePayment.greaterThan(total),
  };
}
export function effectiveStatus(d: InvoiceDocument) {
  if (
    ((d.type === "invoice" && d.status === "issued") ||
      (d.type === "quotation" && d.status === "sent")) &&
    d.dueDate < format(new Date(), "yyyy-MM-dd")
  )
    return d.type === "invoice" ? "overdue" : "expired";
  return d.status;
}
