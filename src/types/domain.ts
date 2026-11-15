import { z } from "zod";
import { calculate } from "@/lib/calculations";
const text = z.string().max(10000);
const shortText = z.string().max(300);
const amount = z
  .string()
  .regex(
    /^\d{1,12}(\.\d{0,6})?$/,
    "Enter a positive number (up to 6 decimals)"
  );
export const partySchema = z.object({
  name: shortText,
  company: shortText,
  email: z.union([z.literal(""), z.email()]),
  phone: text,
  address: z.string().max(1000),
  country: text,
  taxNumber: text,
  registration: text,
  website: text,
  notes: text,
  logo: z
    .string()
    .max(2000000)
    .refine(
      (v) =>
        v === "" ||
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
      "Logo must be a local PNG, JPEG, or WebP image"
    ),
});
export type Party = z.infer<typeof partySchema>;
export const clientSchema = partySchema.extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
});
export type Client = z.infer<typeof clientSchema>;
export const itemSchema = z.object({
  id: z.string(),
  name: text.min(1),
  description: text,
  price: amount,
  currency: z.string().length(3),
  unit: text,
  tax: amount.refine((v) => Number(v) <= 100),
  sku: text,
});
export type CatalogItem = z.infer<typeof itemSchema>;
export const lineSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  description: z.string().max(1000),
  quantity: amount,
  price: amount,
  discount: amount,
  discountType: z.enum(["percent", "fixed"]),
  tax: amount.refine((v) => Number(v) <= 100),
});
export type Line = z.infer<typeof lineSchema>;
export const paymentSchema = z.object({
  enabled: z.boolean(),
  bank: text,
  holder: text,
  account: text,
  branch: text,
  swift: text,
  iban: text,
  instructions: text,
});
export const appearanceSchema = z.object({
  template: z.enum(["modern", "minimal", "corporate"]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  showLogo: z.boolean(),
  footer: z.string().max(200),
});
const baseDocumentSchema = z.object({
  id: z.string(),
  type: z.enum(["invoice", "quotation"]),
  number: z.string().min(1).max(100),
  status: z.enum([
    "draft",
    "issued",
    "paid",
    "cancelled",
    "sent",
    "accepted",
    "rejected",
  ]),
  issueDate: z.iso.date(),
  dueDate: z.iso.date(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  reference: text,
  po: text,
  business: partySchema,
  client: partySchema,
  lines: z.array(lineSchema).max(1000),
  taxInclusive: z.boolean(),
  shipping: amount,
  // Missing in older documents/backups; treated as zero without a destructive migration.
  advancePayment: amount.optional(),
  notes: text,
  terms: text,
  payment: paymentSchema,
  appearance: appearanceSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type InvoiceDocument = z.infer<typeof baseDocumentSchema>;
export const documentSchema = baseDocumentSchema.superRefine((doc, ctx) => {
  if (calculate(doc).advanceExceedsTotal) {
    ctx.addIssue({
      code: "custom",
      path: ["advancePayment"],
      message: "Advance payment cannot exceed the invoice total.",
    });
  }
});
export const settingsSchema = z.object({
  id: z.literal("main"),
  business: partySchema,
  currency: z.string().length(3),
  invoicePrefix: z.string().min(1).max(24),
  quotationPrefix: z.string().min(1).max(24),
  days: z.number().int().min(0).max(365),
  tax: amount.refine((v) => Number(v) <= 100),
  notes: text,
  terms: text,
  payment: paymentSchema,
  appearance: appearanceSchema,
});
export type Settings = z.infer<typeof settingsSchema>;
export const emptyParty: Party = {
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  country: "Sri Lanka",
  taxNumber: "",
  registration: "",
  website: "",
  notes: "",
  logo: "",
};
export const defaults: Settings = {
  id: "main",
  business: emptyParty,
  currency: "LKR",
  invoicePrefix: "INV-",
  quotationPrefix: "QUO-",
  days: 14,
  tax: "0",
  notes: "Thank you for your business!",
  terms: "",
  payment: {
    enabled: false,
    bank: "",
    holder: "",
    account: "",
    branch: "",
    swift: "",
    iban: "",
    instructions: "",
  },
  appearance: {
    template: "modern",
    accent: "#6D28D9",
    showLogo: true,
    footer: "",
  },
};
export const newLine = (tax = "0"): Line => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  quantity: "1",
  price: "0",
  discount: "0",
  discountType: "percent",
  tax,
});
