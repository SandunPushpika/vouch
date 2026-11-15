"use client";
import { AnimatePresence, motion } from "motion/react";
import {
  ClipboardList,
  Plus,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from "lucide-react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import type { InvoiceDocument } from "@/types/domain";
import { newLine } from "@/types/domain";
import { calculate, money } from "@/lib/calculations";
import { Card, Input } from "@/components/ui/shared";
export function LineItems({
  form,
  array,
  doc,
  onCatalog,
}: {
  form: UseFormReturn<InvoiceDocument>;
  array: UseFieldArrayReturn<InvoiceDocument, "lines">;
  doc: InvoiceDocument;
  onCatalog: () => void;
}) {
  const reg = form.register;
  const { fields, append, remove, move, insert } = array;
  const totals = calculate(doc);
  return (
    <Card
      title="Items & services"
      icon={<ClipboardList size={17} />}
      action={
        <button className="text-button" onClick={onCatalog}>
          Add from catalog
        </button>
      }
      className="line-card"
    >
      <div className="line-head">
        <span>Description</span>
        <span>Qty</span>
        <span>Rate</span>
        <span>Amount</span>
      </div>
      <AnimatePresence initial={false}>
        {fields.map((field, i) => (
          <motion.div
            layout
            key={field.id}
            className="line-editor"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="line-main">
              <div>
                <Input
                  aria-label={`Item ${i + 1} name`}
                  placeholder="e.g. Website development"
                  maxLength={200}
                  {...reg(`lines.${i}.name`)}
                />
                <Input
                  className="description-input"
                  aria-label={`Item ${i + 1} description`}
                  placeholder="Add a description (optional)"
                  maxLength={1000}
                  {...reg(`lines.${i}.description`)}
                />
              </div>
              <label className="line-number-field">
                <span className="mobile-line-label">Quantity</span>
                <Input
                  aria-label={`Item ${i + 1} quantity`}
                  inputMode="decimal"
                  {...reg(`lines.${i}.quantity`)}
                />
              </label>
              <label className="line-number-field">
                <span className="mobile-line-label">Unit price</span>
                <Input
                  aria-label={`Item ${i + 1} price`}
                  inputMode="decimal"
                  {...reg(`lines.${i}.price`)}
                />
              </label>
              <strong className="line-amount">
                <span className="mobile-line-label">Amount</span>
                {money(totals.lines[i]?.total ?? "0", doc.currency)}
              </strong>
            </div>
            <div className="line-extras">
              <label>
                Discount{" "}
                <Input
                  aria-label={`Item ${i + 1} discount`}
                  inputMode="decimal"
                  {...reg(`lines.${i}.discount`)}
                />
                <select
                  aria-label="Discount type"
                  {...reg(`lines.${i}.discountType`)}
                >
                  <option value="percent">%</option>
                  <option value="fixed">{doc.currency}</option>
                </select>
              </label>
              <label>
                Tax{" "}
                <Input
                  aria-label={`Item ${i + 1} tax rate`}
                  inputMode="decimal"
                  {...reg(`lines.${i}.tax`)}
                />
                %
              </label>
              <div className="line-actions">
                <button
                  title="Move up"
                  aria-label="Move item up"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  title="Move down"
                  aria-label="Move item down"
                  disabled={i === fields.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  title="Duplicate item"
                  aria-label="Duplicate item"
                  onClick={() =>
                    insert(i + 1, { ...doc.lines[i], id: crypto.randomUUID() })
                  }
                >
                  <Copy size={13} />
                </button>
                <button
                  title="Remove item"
                  aria-label="Remove item"
                  onClick={() => remove(i)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <button className="add-line" onClick={() => append(newLine())}>
        <Plus size={16} />
        Add a line item
      </button>
      <div className="tax-toggle">
        <label>
          <input type="checkbox" {...reg("taxInclusive")} /> Prices include tax
        </label>
        <span>Calculated per line</span>
      </div>
    </Card>
  );
}
