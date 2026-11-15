"use client";
import { documentAccent } from "@/lib/document-style";
import type { InvoiceDocument } from "@/types/domain";
import { calculate, money } from "@/lib/calculations";
import { format, parseISO } from "date-fns";
export function DocumentPreview({
  doc,
  mini = false,
}: {
  doc: InvoiceDocument;
  mini?: boolean;
}) {
  const totals = calculate(doc);
  const accent = documentAccent(doc.appearance);
  return (
    <article
      className={`paper template-${doc.appearance.template} ${
        mini ? "mini-paper" : ""
      }`}
      style={{ "--doc-accent": accent } as React.CSSProperties}
    >
      <div className="paper-top">
        <div>
          {doc.appearance.showLogo && doc.business.logo ? (
            <img
              className="paper-logo"
              src={doc.business.logo}
              alt="Business logo"
            />
          ) : (
            <div className="paper-monogram">
              {(doc.business.company || doc.business.name || "B")
                .slice(0, 1)
                .toUpperCase()}
              <span>↗</span>
            </div>
          )}
          <h3>
            {doc.business.company || doc.business.name || "Your business"}
          </h3>
          <p>{doc.business.address || "Your business address"}</p>
          <p>{doc.business.email}</p>
          <p>{doc.business.phone}</p>
          <p>{doc.business.website}</p>
          {doc.business.taxNumber && <p>Tax ID: {doc.business.taxNumber}</p>}
          {doc.business.registration && <p>Reg: {doc.business.registration}</p>}
        </div>
        <div className="paper-title">
          <h2>{doc.type === "invoice" ? "INVOICE" : "QUOTATION"}</h2>
          <strong>{doc.number}</strong>
          <span className="paper-status">{doc.status}</span>
        </div>
      </div>
      <div className="paper-parties">
        <div>
          <div className="paper-label">
            {doc.type === "invoice" ? "BILL TO" : "PREPARED FOR"}
          </div>
          <h4>{doc.client.company || doc.client.name || "Client name"}</h4>
          <p>{doc.client.address || "Client address"}</p>
          <p>{doc.client.email}</p>
          <p>{doc.client.phone}</p>
          {doc.client.taxNumber && <p>Tax ID: {doc.client.taxNumber}</p>}
        </div>
        <div className="paper-dates">
          <div>
            <span>Issue date</span>
            <strong>{format(parseISO(doc.issueDate), "dd MMM yyyy")}</strong>
          </div>
          <div>
            <span>{doc.type === "invoice" ? "Due date" : "Valid until"}</span>
            <strong>{format(parseISO(doc.dueDate), "dd MMM yyyy")}</strong>
          </div>
          {doc.reference && (
            <div>
              <span>Reference</span>
              <strong>{doc.reference}</strong>
            </div>
          )}
          {doc.po && (
            <div>
              <span>Purchase order</span>
              <strong>{doc.po}</strong>
            </div>
          )}
        </div>
      </div>
      <table className="paper-table">
        <thead>
          <tr>
            <th>DESCRIPTION</th>
            <th>QTY</th>
            <th>RATE</th>
            <th>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={l.id}>
              <td>
                <strong>{l.name || "Item description"}</strong>
                {l.description && <p>{l.description}</p>}
                {(Number(l.discount) > 0 || Number(l.tax) > 0) && (
                  <small>
                    {Number(l.discount) > 0
                      ? `Discount: ${l.discount}${
                          l.discountType === "percent"
                            ? "%"
                            : ` ${doc.currency}`
                        } · `
                      : ""}
                    {Number(l.tax) > 0
                      ? `Tax ${l.tax}%${doc.taxInclusive ? " included" : ""}`
                      : ""}
                  </small>
                )}
              </td>
              <td>{l.quantity}</td>
              <td>{money(l.price, doc.currency)}</td>
              <td>{money(totals.lines[i].total, doc.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="paper-totals">
        <div>
          <span>Subtotal</span>
          <strong>{money(totals.subtotal, doc.currency)}</strong>
        </div>
        {Number(totals.discount) > 0 && (
          <div>
            <span>Discount</span>
            <strong>− {money(totals.discount, doc.currency)}</strong>
          </div>
        )}
        {totals.taxes.map((t) => (
          <div key={t.rate}>
            <span>Tax ({t.rate}%)</span>
            <strong>{money(t.amount, doc.currency)}</strong>
          </div>
        ))}
        {Number(totals.shipping) > 0 && (
          <div>
            <span>Additional charges</span>
            <strong>{money(totals.shipping, doc.currency)}</strong>
          </div>
        )}
        {totals.hasAdvancePayment && (
          <>
            <div>
              <span>Invoice total</span>
              <strong>{money(totals.total, doc.currency)}</strong>
            </div>
            <div>
              <span>Advance payment</span>
              <strong>− {money(totals.advancePayment, doc.currency)}</strong>
            </div>
          </>
        )}
        <div className="paper-grand">
          <span>
            {totals.hasAdvancePayment ? "Balance due" : "Total"} ({doc.currency}
            )
          </span>
          <strong>{money(totals.balanceDue, doc.currency)}</strong>
        </div>
      </div>
      {doc.notes && (
        <div className="paper-note">
          <h5>NOTES</h5>
          <p>{doc.notes}</p>
        </div>
      )}
      {doc.type === "invoice" && doc.payment.enabled && (
        <div className="paper-note">
          <h5>PAYMENT DETAILS</h5>
          {Object.entries(doc.payment)
            .filter(([k, v]) => k !== "enabled" && v)
            .map(([k, v]) => (
              <p key={k}>
                {k === "instructions"
                  ? ""
                  : `${k.charAt(0).toUpperCase() + k.slice(1)}: `}
                {v}
              </p>
            ))}
        </div>
      )}
      {doc.terms && (
        <div className="paper-note">
          <h5>TERMS & CONDITIONS</h5>
          <p>{doc.terms}</p>
        </div>
      )}
      <div className="paper-bottom">
        {doc.appearance.footer ||
          "Thank you for the opportunity to work together."}
      </div>
    </article>
  );
}
