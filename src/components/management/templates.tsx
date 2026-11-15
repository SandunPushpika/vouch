"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Eye, ArrowRight, Palette } from "lucide-react";
import { sampleDocument } from "@/lib/sample-document";
import { templates } from "@/constants/brand";
import { defaults, type InvoiceDocument } from "@/types/domain";
import { db, getSettings } from "@/lib/db";
import { DocumentPreview } from "@/components/documents/preview";
import { Button } from "@/components/ui/button";
import { PageIntro, Modal, Transition } from "@/components/ui/shared";
import { useUI } from "@/stores/ui";
export default function Templates() {
  const saved = useLiveQuery(() => db.settings.get("main"));
  const [preview, setPreview] = useState<
    InvoiceDocument["appearance"]["template"] | null
  >(null);
  const toast = useUI((s) => s.toast);
  return (
    <Transition>
      <PageIntro
        title="Made to make an impression"
        description="Three thoughtfully crafted templates. Every one, completely free."
        action={
          <span className="local-badge">
            <Palette size={15} />
            Your style. Your business.
          </span>
        }
      />
      <div className="template-gallery">
        {templates.map((t) => (
          <article
            className={`template-card ${
              (saved ?? defaults).appearance.template === t.id
                ? "default-template"
                : ""
            }`}
            key={t.id}
          >
            <button
              aria-label={`Preview ${t.name} template`}
              className="template-thumbnail"
              onClick={() => setPreview(t.id)}
            >
              <DocumentPreview doc={sampleDocument(t.id)} mini />
              {(saved ?? defaults).appearance.template === t.id && (
                <span className="template-default">
                  <Check size={12} />
                  Your default
                </span>
              )}
            </button>
            <div className="template-info">
              <h2>
                {t.name}
                <span style={{ background: t.color }} />
              </h2>
              <p>{t.description}</p>
              <div>
                <Button variant="outline" onClick={() => setPreview(t.id)}>
                  <Eye size={15} />
                  Preview
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const s = await getSettings();
                      await db.settings.put({
                        ...s,
                        appearance: { ...s.appearance, template: t.id },
                      });
                      toast(`${t.name} set as the default for new documents.`);
                    } catch {
                      toast("Template preference could not be saved.");
                    }
                  }}
                >
                  Use template
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="template-note">
        <Check size={16} />
        <p>
          Every template supports invoices, quotations, your logo, and
          multi-page documents.
        </p>
      </div>
      <Modal
        open={!!preview}
        onOpenChange={(v) => {
          if (!v) setPreview(null);
        }}
        title={`${
          templates.find((t) => t.id === preview)?.name ?? ""
        } template`}
        description="Sample content for preview only. Your own documents use your business details."
      >
        {preview && <DocumentPreview doc={sampleDocument(preview)} />}
      </Modal>
    </Transition>
  );
}
