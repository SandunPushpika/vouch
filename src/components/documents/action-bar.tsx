"use client";
import { useState, useRef, useEffect } from "react";
import {
  Save,
  Printer,
  MoreHorizontal,
  Copy,
  ArrowRightLeft,
  Download,
  Share2,
  RotateCcw,
} from "lucide-react";
import type { InvoiceDocument } from "@/types/domain";
import { download } from "@/lib/utils";
import { useUI } from "@/stores/ui";
import { Button } from "@/components/ui/button";
export function ActionBar({
  doc,
  busy,
  valid,
  persist,
  pdfAction,
  replace,
}: {
  doc: InvoiceDocument;
  busy: boolean;
  valid: boolean;
  persist: () => Promise<boolean>;
  pdfAction: (print?: boolean) => Promise<void>;
  replace: (
    type: InvoiceDocument["type"],
    source?: InvoiceDocument
  ) => Promise<void>;
}) {
  const [more, setMore] = useState(false);
  const toast = useUI((s) => s.toast);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!more) return;
    menu.current
      ?.querySelector<HTMLButtonElement>(".action-menu button")
      ?.focus();
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) setMore(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMore(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [more]);
  return (
    <div className="editor-actions">
      <Button
        variant="outline"
        onClick={async () => {
          if (await persist()) toast("Document saved locally.");
        }}
      >
        <Save size={16} />
        Save document
      </Button>
      <div className="action-right">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Print PDF"
          disabled={busy}
          onClick={() => pdfAction(true)}
        >
          <Printer size={18} />
        </Button>
        <div className="more-wrap" ref={menu}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="More document actions"
            aria-haspopup="menu"
            aria-expanded={more}
            ref={trigger}
            onClick={() => setMore(!more)}
          >
            <MoreHorizontal size={20} />
          </Button>
          {more && (
            <div
              className="action-menu"
              role="menu"
              onKeyDown={(e) => {
                if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key))
                  return;
                e.preventDefault();
                const buttons = Array.from(
                  e.currentTarget.querySelectorAll("button")
                );
                const index = buttons.indexOf(
                  document.activeElement as HTMLButtonElement
                );
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                    ? buttons.length - 1
                    : (index +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        buttons.length) %
                      buttons.length;
                buttons[next]?.focus();
              }}
            >
              <button
                role="menuitem"
                onClick={() => {
                  setMore(false);
                  void replace(doc.type, doc);
                }}
              >
                <Copy size={14} />
                Duplicate
              </button>
              {doc.type === "quotation" && (
                <button role="menuitem" onClick={() => replace("invoice", doc)}>
                  <ArrowRightLeft size={14} />
                  Convert to invoice
                </button>
              )}
              <button
                role="menuitem"
                onClick={() =>
                  download(
                    new Blob([JSON.stringify(doc, null, 2)], {
                      type: "application/json",
                    }),
                    `${doc.number}.json`
                  )
                }
              >
                <Download size={14} />
                Export document data
              </button>
              <button
                role="menuitem"
                onClick={async () => {
                  if (!(await persist())) return;
                  try {
                    const blob = await (
                      await import("@/lib/pdf/document")
                    ).makePdf(doc);
                    const file = new File([blob], `${doc.number}.pdf`, {
                      type: "application/pdf",
                    });
                    if (navigator.canShare?.({ files: [file] }))
                      await navigator.share({ files: [file] });
                    else {
                      download(blob, `${doc.number}.pdf`);
                      toast(
                        "PDF downloaded. Attach it in your preferred messaging app."
                      );
                    }
                  } catch {
                    toast("Sharing was cancelled or unavailable.");
                  }
                }}
              >
                <Share2 size={14} />
                Share PDF
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  if (
                    confirm(
                      "Start a new document? Your current document will stay saved."
                    )
                  )
                    void replace(doc.type);
                }}
              >
                <RotateCcw size={14} />
                Start new document
              </button>
            </div>
          )}
        </div>
        <Button disabled={busy || !valid} onClick={() => pdfAction()}>
          <Download size={16} />
          {busy ? "Preparing…" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}
