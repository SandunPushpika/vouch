import Dexie, { type Table } from "dexie";
import { addDays, format } from "date-fns";
import {
  defaults,
  emptyParty,
  newLine,
  documentSchema,
  settingsSchema,
  clientSchema,
  itemSchema,
  type Settings,
  type Client,
  type CatalogItem,
  type InvoiceDocument,
} from "@/types/domain";
import { z } from "zod";
class Database extends Dexie {
  documents!: Table<InvoiceDocument, string>;
  clients!: Table<Client, string>;
  items!: Table<CatalogItem, string>;
  settings!: Table<Settings, string>;
  counters!: Table<
    {
      id: string;
      value: number;
    },
    string
  >;
  constructor() {
    super("vouch-local");
    this.version(1).stores({
      documents: "id,number,type,status,updatedAt",
      clients: "id,name,company",
      items: "id,name",
      settings: "id",
      counters: "id",
    });
  }
}
export const db = new Database();
export async function getSettings() {
  return (await db.settings.get("main")) ?? structuredClone(defaults);
}
export async function createDocument(
  type: InvoiceDocument["type"] = "invoice",
  source?: InvoiceDocument
) {
  return db.transaction(
    "rw",
    db.documents,
    db.settings,
    db.counters,
    async () => {
      const s = await getSettings();
      const prefix = type === "invoice" ? s.invoicePrefix : s.quotationPrefix;
      let seq = (await db.counters.get(type))?.value ?? 0;
      let number = "";
      do {
        seq++;
        number = prefix + String(seq).padStart(4, "0");
      } while (await db.documents.where("number").equals(number).count());
      await db.counters.put({ id: type, value: seq });
      const now = new Date().toISOString();
      const d: InvoiceDocument = {
        id: crypto.randomUUID(),
        type,
        number,
        status: "draft",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(addDays(new Date(), s.days), "yyyy-MM-dd"),
        currency: s.currency,
        reference: "",
        po: "",
        business: structuredClone(s.business),
        client: structuredClone(emptyParty),
        lines: [newLine(s.tax)],
        taxInclusive: false,
        shipping: "0",
        notes: s.notes,
        terms: s.terms,
        payment: structuredClone(s.payment),
        appearance: structuredClone(s.appearance),
        createdAt: now,
        updatedAt: now,
      };
      if (source) {
        Object.assign(d, {
          ...structuredClone(source),
          id: d.id,
          type,
          number,
          status: "draft",
          // A copied document is a new bill, not a new receipt of the same payment.
          advancePayment: undefined,
          issueDate: d.issueDate,
          dueDate: d.dueDate,
          createdAt: now,
          updatedAt: now,
        });
      }
      await db.documents.put(d);
      return d;
    }
  );
}
export async function saveDocument(
  d: InvoiceDocument,
  expectedUpdatedAt?: string
) {
  const parsed = documentSchema.parse(d);
  await db.transaction("rw", db.documents, async () => {
    if (expectedUpdatedAt !== undefined) {
      const current = await db.documents.get(d.id);
      if (!current || current.updatedAt !== expectedUpdatedAt)
        throw new Error(
          "This document changed in another tab or was removed. Reopen it from Documents before editing."
        );
    }
    const duplicate = await db.documents
      .where("number")
      .equals(d.number)
      .filter((x) => x.id !== d.id)
      .first();
    if (duplicate)
      throw new Error(
        "This document number already exists. Choose a unique number."
      );
    await db.documents.put(parsed);
  });
}
export const backupSchema = z
  .object({
    version: z.literal(1),
    exportedAt: z.iso.datetime(),
    documents: z.array(documentSchema).max(10000),
    clients: z.array(clientSchema).max(10000),
    items: z.array(itemSchema).max(10000),
    settings: z.array(settingsSchema).max(1),
    counters: z.array(
      z.object({ id: z.string(), value: z.number().int().nonnegative() })
    ),
  })
  .superRefine((data, ctx) => {
    for (const key of [
      "documents",
      "clients",
      "items",
      "settings",
      "counters",
    ] as const) {
      const ids = data[key].map((x) => x.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: "custom", message: "Duplicate IDs in backup" });
    }
    const numbers = data.documents.map((x) => x.number);
    if (new Set(numbers).size !== numbers.length)
      ctx.addIssue({ code: "custom", message: "Duplicate document numbers" });
  });
export async function exportBackup() {
  return db.transaction("r", db.tables, async () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    documents: await db.documents.toArray(),
    clients: await db.clients.toArray(),
    items: await db.items.toArray(),
    settings: await db.settings.toArray(),
    counters: await db.counters.toArray(),
  }));
}
export async function restoreBackup(input: unknown) {
  const b = backupSchema.parse(input);
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) await t.clear();
    await db.documents.bulkPut(b.documents);
    await db.clients.bulkPut(b.clients);
    await db.items.bulkPut(b.items);
    await db.settings.bulkPut(b.settings);
    await db.counters.bulkPut(b.counters);
  });
}
