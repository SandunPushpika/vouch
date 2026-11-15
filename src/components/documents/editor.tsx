"use client";
import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { documentResolver } from "@/lib/validation/document-resolver";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "motion/react";
import {
  FileText,
  ClipboardList,
  Building2,
  UserRound,
  Plus,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  documentSchema,
  emptyParty,
  newLine,
  type InvoiceDocument,
  type Party,
} from "@/types/domain";
import { businessForDraft } from "@/lib/business-profile";
import { db, createDocument, getSettings } from "@/lib/db";
import { calculate, money } from "@/lib/calculations";
import { currencies } from "@/constants/brand";
import { useUI } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  Field,
  Input,
  Modal,
  PageIntro,
  SearchBox,
  Transition,
} from "@/components/ui/shared";
import { PartyForm } from "./party-form";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import { LineItems } from "./line-items";
import { PreviewPanel } from "./preview-panel";
import { ActionBar } from "./action-bar";
const ExactPdfPreview = dynamic(() => import("./pdf-preview"), {
  ssr: false,
  loading: () => <p className="muted">Preparing paginated PDF preview…</p>,
});
export default function Editor() {
  const query = useSearchParams();
  const [doc, setDoc] = useState<InvoiceDocument>();
  const [error, setError] = useState("");
  const id = query.get("id");
  const pending = useRef<{
    key: string | null;
    promise: Promise<InvoiceDocument>;
  } | null>(null);
  useEffect(() => {
    let active = true;
    if (!pending.current || pending.current.key !== id)
      pending.current = {
        key: id,
        promise: (async () => {
          const d = id
            ? await db.documents.get(id)
            : await db.documents
                .orderBy("updatedAt")
                .reverse()
                .filter((x) => x.status === "draft")
                .first();
          if (id && !d)
            throw new Error(
              "This document was not found. Open Documents to select one."
            );
          return d ?? (await createDocument());
        })(),
      };
    pending.current.promise
      .then((d) => {
        if (active) setDoc(d);
      })
      .catch((error: unknown) => {
        if (active)
          setError(
            error instanceof Error && error.message.startsWith("This document")
              ? error.message
              : "Local storage is unavailable. Enable IndexedDB in your browser, then reload."
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  return error ? (
    <div className="empty">
      <p className="error">{error}</p>
      <a href="/app/documents/" className="button button-outline">
        Open Documents
      </a>
    </div>
  ) : doc ? (
    <DocumentEditor key={doc.id} initial={doc} onReplace={setDoc} />
  ) : (
    <div className="loading-state">
      <div className="skeleton" />
      <p>Opening your workspace…</p>
    </div>
  );
}
function DocumentEditor({
  initial,
  onReplace,
}: {
  initial: InvoiceDocument;
  onReplace: (d: InvoiceDocument) => void;
}) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);
  const form = useForm<InvoiceDocument>({
    resolver: documentResolver,
    defaultValues: initial,
    mode: "onChange",
  });
  const doc = useWatch({ control: form.control }) as InvoiceDocument;
  const lineArray = useFieldArray({ control: form.control, name: "lines" });
  const { append } = lineArray;
  const clients = useLiveQuery(() => db.clients.toArray()) ?? [];
  const items = useLiveQuery(() => db.items.toArray()) ?? [];
  const savedSettings = useLiveQuery(() => db.settings.get("main"));
  useEffect(() => {
    if (!savedSettings) return;
    const current = form.getValues("business");
    const next = businessForDraft(
      form.getValues("status"),
      current,
      savedSettings.business
    );
    if (next !== current)
      form.setValue("business", next, {
        shouldDirty: true,
        shouldValidate: true,
      });
  }, [savedSettings, form]);
  const { saveState, persist } = useDraftPersistence(form, doc, initial);
  const [party, setParty] = useState<"business" | "client" | null>(null);
  const [choose, setChoose] = useState<"client" | "item" | null>(null);
  const [search, setSearch] = useState("");
  const [mobileTab, setMobileTab] = useState("edit");
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState(false);
  const valid = documentSchema.safeParse(doc);
  const totals = calculate(doc);
  const advanceError = valid.success
    ? undefined
    : valid.error.issues.find((issue) => issue.path[0] === "advancePayment")
        ?.message;
  const reg = form.register;
  const set = form.setValue;
  const pdfAction = async (print = false) => {
    if (!(await persist())) return;
    setBusy(true);
    try {
      await (
        await import("@/lib/pdf/document")
      ).exportPdf(form.getValues(), print);
      toast(print ? "PDF opened for printing." : "PDF downloaded.");
    } catch {
      toast(
        "PDF could not be generated. Try a smaller logo or shorter item descriptions."
      );
    } finally {
      setBusy(false);
    }
  };
  const replace = async (
    type: InvoiceDocument["type"],
    source?: InvoiceDocument
  ) => {
    if (!(await persist())) return;
    try {
      const d = await createDocument(type, source);
      onReplace(d);
      router.replace(`/app?id=${d.id}`);
    } catch {
      toast("Could not create a document. Check your storage.");
    }
  };
  const useSavedBusiness = async () => {
    try {
      const settings = await getSettings();
      if (
        !settings.business.name &&
        !settings.business.company &&
        !settings.business.logo
      ) {
        toast(
          "Add your business details and save them in Business Settings first."
        );
        return;
      }
      set("business", structuredClone(settings.business), {
        shouldDirty: true,
        shouldValidate: true,
      });
      set("appearance.showLogo", settings.appearance.showLogo, {
        shouldDirty: true,
      });
      toast("Saved business profile applied to this document.");
    } catch {
      toast(
        "Your saved business profile could not be loaded. Please try again."
      );
    }
  };
  const updateParty = async (p: Party) => {
    if (!party) return;
    set(party, p, { shouldDirty: true });
    if (party === "business") {
      const { getSettings } = await import("@/lib/db");
      const s = await getSettings();
      await db.settings.put({ ...s, business: p });
    } else if (p.name || p.company) {
      const existing = clients.find(
        (c) =>
          (c.name === doc.client.name && c.company === doc.client.company) ||
          (c.name === p.name && c.company === p.company)
      );
      await db.clients.put({
        ...p,
        id: existing?.id ?? crypto.randomUUID(),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
    }
    setParty(null);
    toast("Details saved locally.");
  };
  return (
    <Transition>
      <PageIntro
        title="Create Document"
        description="Good work deserves a great invoice. Let’s make yours."
        action={
          <div
            className={`save-indicator ${
              saveState === "Saved locally" ? "" : "pending"
            }`}
            role="status"
          >
            <CheckCircle2 size={15} />
            {saveState}
          </div>
        }
      />
      <div className="mobile-editor-tabs">
        <Button
          variant={mobileTab === "edit" ? "default" : "ghost"}
          onClick={() => setMobileTab("edit")}
        >
          Edit document
        </Button>
        <Button
          variant={mobileTab === "preview" ? "default" : "ghost"}
          onClick={() => setMobileTab("preview")}
        >
          Live preview
        </Button>
      </div>
      <div className="editor-grid">
        <div
          className={`editor-column ${
            mobileTab !== "edit" ? "mobile-hidden" : ""
          }`}
        >
          <div className="type-tabs">
            {(["invoice", "quotation"] as const).map((type) => (
              <button
                key={type}
                aria-pressed={doc.type === type}
                className={doc.type === type ? "selected" : ""}
                onClick={() => {
                  if (type !== doc.type) void replace(type, doc);
                }}
              >
                {doc.type === type && (
                  <motion.span
                    className="tab-indicator"
                    layoutId="document-type"
                  />
                )}
                {type === "invoice" ? (
                  <FileText size={17} />
                ) : (
                  <ClipboardList size={17} />
                )}
                <span>{type === "invoice" ? "Invoice" : "Quotation"}</span>
              </button>
            ))}
          </div>
          <Card title="Document details" icon={<FileText size={17} />}>
            <div className="grid-2">
              <Field label="Document number">
                <Input
                  {...reg("number")}
                  aria-invalid={!!form.formState.errors.number}
                />
              </Field>
              <Field label="Currency">
                <select {...reg("currency")}>
                  {currencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Issue date">
                <Input type="date" {...reg("issueDate")} />
              </Field>
              <Field
                label={doc.type === "invoice" ? "Due date" : "Valid until"}
              >
                <Input type="date" {...reg("dueDate")} />
              </Field>
            </div>
            <details className="optional">
              <summary>
                Reference & purchase order <ChevronDown size={13} />
              </summary>
              <div className="grid-2">
                <Field label="Reference">
                  <Input {...reg("reference")} />
                </Field>
                <Field label="Purchase order">
                  <Input {...reg("po")} />
                </Field>
              </div>
            </details>
          </Card>
          <div className="party-cards">
            {(["business", "client"] as const).map((key) => (
              <Card
                key={key}
                title={
                  key === "business"
                    ? "From (Your Business)"
                    : doc.type === "invoice"
                    ? "Bill To (Client)"
                    : "Prepared For"
                }
                icon={
                  key === "business" ? (
                    <Building2 size={16} />
                  ) : (
                    <UserRound size={16} />
                  )
                }
                action={
                  <button className="text-button" onClick={() => setParty(key)}>
                    Edit
                  </button>
                }
              >
                {doc[key].name || doc[key].company ? (
                  <div className="party-info">
                    <strong>{doc[key].company || doc[key].name}</strong>
                    <p>{doc[key].email}</p>
                    <p>{doc[key].address}</p>
                    {key === "business" && doc.business.logo && (
                      <img
                        src={doc.business.logo}
                        alt="Business logo"
                        style={{
                          maxWidth: 80,
                          maxHeight: 40,
                          objectFit: "contain",
                          marginTop: 8,
                        }}
                      />
                    )}
                    {key === "client" && (
                      <button
                        className="text-button"
                        onClick={() =>
                          set("client", structuredClone(emptyParty))
                        }
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    className="party-empty"
                    onClick={() =>
                      key === "client"
                        ? setChoose("client")
                        : setParty("business")
                    }
                  >
                    <span className="party-add">
                      <Plus size={18} />
                    </span>
                    <strong>
                      {key === "business"
                        ? "Add your business"
                        : "Select or add a client"}
                    </strong>
                    <span>
                      {key === "business"
                        ? "Make it yours with your details"
                        : "Who’s the good work for?"}
                    </span>
                  </button>
                )}
                {key === "business" && (
                  <button
                    className="text-button"
                    onClick={useSavedBusiness}
                    title="Replace this document’s business details with your saved profile"
                  >
                    Use saved profile
                  </button>
                )}
                {key === "client" &&
                  (doc.client.name || doc.client.company) && (
                    <button
                      className="text-button"
                      onClick={() => setChoose("client")}
                    >
                      Choose another client
                    </button>
                  )}
              </Card>
            ))}
          </div>
          <LineItems
            form={form}
            array={lineArray}
            doc={doc}
            onCatalog={() => {
              setSearch("");
              setChoose("item");
            }}
          />
          <div className="notes-totals">
            <div>
              <Card title="A personal touch">
                <Field label="Notes">
                  <textarea
                    rows={3}
                    {...reg("notes")}
                    placeholder="Thank you for your business!"
                  />
                </Field>
                <Field label="Terms & conditions">
                  <textarea
                    rows={3}
                    {...reg("terms")}
                    placeholder="Your payment or quotation terms"
                  />
                </Field>
              </Card>
            </div>
            <Card title="Summary">
              <div className="totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(totals.subtotal, doc.currency)}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>− {money(totals.discount, doc.currency)}</strong>
                </div>
                {totals.taxes.map((t) => (
                  <div key={t.rate}>
                    <span>Tax ({t.rate}%)</span>
                    <strong>{money(t.amount, doc.currency)}</strong>
                  </div>
                ))}
                <Field label="Additional charges">
                  <Input inputMode="decimal" {...reg("shipping")} />
                </Field>
                {doc.type === "invoice" && (
                  <section className="advance-payment-controls">
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={doc.advancePayment !== undefined}
                        onChange={(e) =>
                          set(
                            "advancePayment",
                            e.target.checked ? "0" : undefined,
                            { shouldDirty: true, shouldValidate: true }
                          )
                        }
                      />
                      Record an advance payment
                    </label>
                    {doc.advancePayment !== undefined && (
                      <Field
                        label={`Advance payment (${doc.currency})`}
                        hint="Amount already received. Deducted from the balance due, not from taxes."
                      >
                        <Input
                          inputMode="decimal"
                          aria-invalid={!!advanceError}
                          aria-describedby={
                            advanceError ? "advance-payment-error" : undefined
                          }
                          {...reg("advancePayment")}
                        />
                        {advanceError && (
                          <small
                            id="advance-payment-error"
                            className="error"
                            role="alert"
                          >
                            {advanceError}
                          </small>
                        )}
                      </Field>
                    )}
                  </section>
                )}
                {totals.hasAdvancePayment && (
                  <div>
                    <span>Invoice total</span>
                    <strong>{money(totals.total, doc.currency)}</strong>
                  </div>
                )}
                <div className="grand-total">
                  <span>
                    {totals.hasAdvancePayment ? "Balance due" : "Total"}
                  </span>
                  <strong>{money(totals.balanceDue, doc.currency)}</strong>
                </div>
              </div>
            </Card>
          </div>
          {doc.type === "invoice" && (
            <Card title="Payment information" icon={<ShieldCheck size={16} />}>
              <label className="check-label">
                <input type="checkbox" {...reg("payment.enabled")} /> Include
                payment details in this invoice
              </label>
              {doc.payment.enabled && (
                <>
                  <p className="hint">
                    Bank details stay on this device and are included in PDFs
                    and backups.
                  </p>
                  <div className="grid-2">
                    {(
                      [
                        "bank",
                        "holder",
                        "account",
                        "branch",
                        "swift",
                        "iban",
                      ] as const
                    ).map((k) => (
                      <Field
                        key={k}
                        label={
                          {
                            bank: "Bank name",
                            holder: "Account holder",
                            account: "Account number",
                            branch: "Branch",
                            swift: "SWIFT / BIC",
                            iban: "IBAN",
                          }[k]
                        }
                      >
                        <Input {...reg(`payment.${k}`)} />
                      </Field>
                    ))}
                  </div>
                  <Field label="Other payment instructions">
                    <textarea {...reg("payment.instructions")} />
                  </Field>
                </>
              )}
            </Card>
          )}
          {!valid.success && (
            <p className="error" role="alert">
              Please check your dates, email, quantities, prices, discounts, and
              tax rates, and advance payment. Numbers allow up to 6 decimal
              places; tax cannot exceed 100%.
            </p>
          )}
          <ActionBar
            doc={doc}
            busy={busy}
            valid={valid.success}
            persist={persist}
            pdfAction={pdfAction}
            replace={replace}
          />
          <div className="editor-reassurance">
            <ShieldCheck size={13} />
            No signup. No subscriptions. Just your work.
          </div>
        </div>
        <PreviewPanel
          form={form}
          doc={doc}
          mobileTab={mobileTab}
          valid={valid.success}
          onFull={() => setFull(true)}
        />
      </div>
      <Modal
        open={!!party}
        onOpenChange={(v) => {
          if (!v) setParty(null);
        }}
        title={
          party === "business" ? "Your business details" : "Client details"
        }
      >
        {party && (
          <PartyForm key={party} initial={doc[party]} onSave={updateParty} />
        )}
      </Modal>
      <Modal
        open={!!choose}
        onOpenChange={(v) => {
          if (!v) setChoose(null);
        }}
        title={choose === "client" ? "Choose a client" : "Add a saved item"}
      >
        <SearchBox value={search} onChange={setSearch} />
        <div className="selection-list">
          {choose === "client"
            ? clients
                .filter((c) =>
                  `${c.name} ${c.company} ${c.email}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      set("client", c);
                      setChoose(null);
                    }}
                  >
                    <strong>{c.company || c.name}</strong>
                    <span>{c.email}</span>
                  </button>
                ))
            : items
                .filter((c) =>
                  c.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((c) => (
                  <button
                    key={c.id}
                    disabled={c.currency !== doc.currency}
                    onClick={() => {
                      append({
                        ...newLine(c.tax),
                        name: c.name,
                        description: c.description,
                        price: c.price,
                      });
                      setChoose(null);
                    }}
                  >
                    <strong>{c.name}</strong>
                    <span>
                      {money(c.price, c.currency)}
                      {c.currency !== doc.currency
                        ? " · Switch document currency to use"
                        : ""}
                    </span>
                  </button>
                ))}
        </div>
        {choose === "client" && (
          <Button
            onClick={() => {
              setChoose(null);
              setParty("client");
            }}
          >
            <Plus size={15} />
            Create client
          </Button>
        )}
        {choose === "item" && (
          <Button variant="outline" onClick={() => router.push("/app/items")}>
            Manage saved items
          </Button>
        )}
      </Modal>
      <Modal open={full} onOpenChange={setFull} title="Document preview">
        <div className="large-preview">
          {valid.success && <ExactPdfPreview doc={doc} />}
        </div>
        <Button onClick={() => pdfAction()}>Download PDF</Button>
      </Modal>
    </Transition>
  );
}
