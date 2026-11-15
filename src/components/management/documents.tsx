"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Plus,
  Files,
  FileText,
  ClipboardList,
  Download,
  Copy,
  Trash2,
  ArrowRightLeft,
  Printer,
  ArrowUpRight,
  Wallet,
  Clock,
} from "lucide-react";
import Decimal from "decimal.js";
import { db, createDocument } from "@/lib/db";
import { calculate, effectiveStatus, money } from "@/lib/calculations";
import type { InvoiceDocument } from "@/types/domain";
import { useUI } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import {
  PageIntro,
  Empty,
  SearchBox,
  Transition,
} from "@/components/ui/shared";
export default function Documents() {
  const router = useRouter();
  const docs = useLiveQuery(() =>
    db.documents.orderBy("updatedAt").reverse().toArray()
  );
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const toast = useUI((s) => s.toast);
  const [busy, setBusy] = useState(false);
  const all = docs ?? [];
  const currencyTotals: Record<string, Decimal> = {};
  all
    .filter(
      (d) =>
        d.type === "invoice" && d.status !== "draft" && d.status !== "cancelled"
    )
    .forEach((d) => {
      currencyTotals[d.currency] = (
        currencyTotals[d.currency] ?? new Decimal(0)
      ).plus(calculate(d).total);
    });
  const filtered = all
    .filter(
      (d) =>
        `${d.number} ${d.client.name} ${d.client.company}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (type === "all" || d.type === type) &&
        (status === "all" || effectiveStatus(d) === status)
    )
    .sort((a, b) =>
      sort === "amount"
        ? a.currency.localeCompare(b.currency) ||
          new Decimal(calculate(b).total).comparedTo(calculate(a).total)
        : sort === "oldest"
        ? a.issueDate.localeCompare(b.issueDate)
        : b.issueDate.localeCompare(a.issueDate)
    );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 10) - 1)
  );
  const create = async () => {
    try {
      const d = await createDocument();
      router.push(`/app?id=${d.id}`);
    } catch {
      toast("Could not create document. Check browser storage.");
    }
  };
  const action = async (kind: string, d: InvoiceDocument) => {
    try {
      if (kind === "delete") {
        if (!confirm(`Delete ${d.number}? This cannot be undone.`)) return;
        await db.documents.delete(d.id);
        toast("Document deleted.");
      } else if (kind === "duplicate" || kind === "convert") {
        const copy = await createDocument(
          kind === "convert" ? "invoice" : d.type,
          d
        );
        router.push(`/app?id=${copy.id}`);
      } else {
        setBusy(true);
        await (
          await import("@/lib/pdf/document")
        ).exportPdf(d, kind === "print");
        toast(
          kind === "print" ? "PDF opened for printing." : "PDF downloaded."
        );
      }
    } catch {
      toast("This action could not be completed. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Transition>
      <PageIntro
        title="Documents"
        description="Your good work, all in one place."
        action={
          <Button onClick={create}>
            <Plus size={17} />
            Create document
          </Button>
        }
      />
      <div className="stats-grid">
        {[
          {
            name: "Total invoices",
            value: all.filter((d) => d.type === "invoice").length,
            Icon: FileText,
          },
          {
            name: "Total quotations",
            value: all.filter((d) => d.type === "quotation").length,
            Icon: ClipboardList,
          },
          {
            name: "Draft documents",
            value: all.filter((d) => d.status === "draft").length,
            Icon: Clock,
          },
        ].map((s) => (
          <div className="stat-card" key={s.name}>
            <span className="stat-icon">
              <s.Icon size={19} />
            </span>
            <span>{s.name}</span>
            <strong>{s.value.toString().padStart(2, "0")}</strong>
          </div>
        ))}
        <div className="stat-card">
          <span className="stat-icon">
            <Wallet size={19} />
          </span>
          <span>Total issued invoices</span>
          {Object.keys(currencyTotals).length ? (
            Object.entries(currencyTotals).map(([c, v]) => (
              <strong className="stat-money" key={c}>
                {money(v.toString(), c)}
              </strong>
            ))
          ) : (
            <strong>—</strong>
          )}
          <small>Separated by currency</small>
        </div>
      </div>
      <section className="card">
        <div className="table-toolbar">
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            placeholder="Search documents or clients…"
          />
          <div className="filters">
            <select
              aria-label="Filter document type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All types</option>
              <option value="invoice">Invoices</option>
              <option value="quotation">Quotations</option>
            </select>
            <select
              aria-label="Filter status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All statuses</option>
              {[
                "draft",
                "issued",
                "paid",
                "overdue",
                "cancelled",
                "sent",
                "accepted",
                "rejected",
                "expired",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="Sort documents"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Amount (by currency)</option>
            </select>
          </div>
        </div>
        {docs === undefined ? (
          <div className="empty">Loading local documents…</div>
        ) : !filtered.length ? (
          <Empty
            title={
              all.length
                ? "No matching documents"
                : "Your next chapter starts here"
            }
            description={
              all.length
                ? "Try another search or clear your filters."
                : "Create your first invoice or quotation. We’ll keep it safe in this browser."
            }
            action={
              <Button onClick={create}>
                <Plus size={16} />
                Create your first document
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Client</th>
                    <th>Issue date</th>
                    <th>Amount</th>
                    <th>Status · manual</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice(currentPage * 10, currentPage * 10 + 10)
                    .map((d) => (
                      <tr key={d.id}>
                        <td>
                          <Link
                            className="document-link"
                            href={`/app?id=${d.id}`}
                          >
                            <span className="doc-icon">
                              {d.type === "invoice" ? (
                                <FileText size={17} />
                              ) : (
                                <Files size={17} />
                              )}
                            </span>
                            <span>
                              <strong>{d.number}</strong>
                              <small>{d.type}</small>
                            </span>
                          </Link>
                        </td>
                        <td>
                          {d.client.company || d.client.name || "No client"}
                        </td>
                        <td>{d.issueDate}</td>
                        <td className="numeric">
                          {money(calculate(d).total, d.currency)}
                        </td>
                        <td>
                          <div
                            className={`status-badge status-${effectiveStatus(
                              d
                            )}`}
                          >
                            {effectiveStatus(d)}
                          </div>
                          <select
                            aria-label={`Update ${d.number} status manually`}
                            value={d.status}
                            onChange={async (e) => {
                              try {
                                await db.documents.update(d.id, {
                                  status: e.target
                                    .value as InvoiceDocument["status"],
                                  updatedAt: new Date().toISOString(),
                                });
                                toast("Status updated manually.");
                              } catch {
                                toast("Status could not be saved.");
                              }
                            }}
                            className="status-select"
                          >
                            {(d.type === "invoice"
                              ? ["draft", "issued", "paid", "cancelled"]
                              : ["draft", "sent", "accepted", "rejected"]
                            ).map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link
                              href={`/app?id=${d.id}`}
                              title="View or edit"
                              aria-label="View or edit document"
                            >
                              <ArrowUpRight size={16} />
                            </Link>
                            <button
                              disabled={busy}
                              aria-label="Download PDF"
                              title="Download PDF"
                              onClick={() => action("download", d)}
                            >
                              <Download size={15} />
                            </button>
                            <button
                              disabled={busy}
                              aria-label="Print PDF"
                              title="Print"
                              onClick={() => action("print", d)}
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              title="Duplicate"
                              aria-label="Duplicate document"
                              onClick={() => action("duplicate", d)}
                            >
                              <Copy size={15} />
                            </button>
                            {d.type === "quotation" && (
                              <button
                                title="Convert to invoice"
                                aria-label="Convert quotation to invoice"
                                onClick={() => action("convert", d)}
                              >
                                <ArrowRightLeft size={15} />
                              </button>
                            )}
                            <button
                              title="Delete"
                              aria-label="Delete document"
                              onClick={() => action("delete", d)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                {filtered.length} document{filtered.length === 1 ? "" : "s"}
              </span>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span>
                  {currentPage + 1} /{" "}
                  {Math.max(1, Math.ceil(filtered.length / 10))}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(currentPage + 1) * 10 >= filtered.length}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
      <p className="hint below-table">
        Statuses are managed by you. Overdue and expired labels follow document
        dates; payments are not verified.
      </p>
    </Transition>
  );
}
