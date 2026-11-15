"use client";
import { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { InvoiceDocument } from "@/types/domain";
import { templates } from "@/constants/brand";
import { Field, Input } from "@/components/ui/shared";
import { DocumentPreview } from "./preview";
export function PreviewPanel({
  form,
  doc,
  mobileTab,
  valid,
  onFull,
}: {
  form: UseFormReturn<InvoiceDocument>;
  doc: InvoiceDocument;
  mobileTab: string;
  valid: boolean;
  onFull: () => void;
}) {
  const reg = form.register;
  const [zoom, setZoom] = useState(100);
  return (
    <div
      className={`preview-column ${
        mobileTab !== "preview" ? "mobile-hidden" : ""
      }`}
    >
      <div className="preview-sticky">
        <div className="preview-heading">
          <div>
            <span className="status-dot" />
            <strong>Live preview</strong>
          </div>
          <span>A4 · {doc.currency}</span>
        </div>
        <div className="preview-toolbar">
          <select
            aria-label="Document template"
            {...reg("appearance.template")}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} template
              </option>
            ))}
          </select>
          <div>
            <button
              aria-label="Zoom out"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              <ZoomOut size={16} />
            </button>
            <span>{zoom}%</span>
            <button
              aria-label="Zoom in"
              onClick={() => setZoom(Math.min(150, zoom + 10))}
            >
              <ZoomIn size={16} />
            </button>
            <button aria-label="Fit preview" onClick={() => setZoom(100)}>
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
        <details className="preview-options">
          <summary>
            Document appearance <ChevronDown size={12} />
          </summary>
          <div className="grid-2">
            <Field label="Accent color (Modern)">
              <Input type="color" {...reg("appearance.accent")} />
            </Field>
            <label className="check-label">
              <input type="checkbox" {...reg("appearance.showLogo")} />
              Show logo
            </label>
          </div>
          <Field label="Footer text">
            <Input maxLength={200} {...reg("appearance.footer")} />
          </Field>
        </details>
        <div className="preview-canvas">
          <div style={{ zoom: zoom / 100 }}>
            {valid ? (
              <DocumentPreview doc={doc} />
            ) : (
              <p className="muted">
                Complete valid fields to update the preview.
              </p>
            )}
          </div>
        </div>
        <button className="preview-foot" onClick={() => onFull()}>
          <Maximize2 size={13} />
          Open larger preview
        </button>
        <p className="preview-caption">
          <ShieldCheck size={13} />
          Looks good on screen. Even better on paper.
        </p>
      </div>
    </div>
  );
}
