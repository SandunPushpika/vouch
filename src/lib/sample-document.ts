import { defaults, type InvoiceDocument } from "@/types/domain";
export function sampleDocument(
  template: InvoiceDocument["appearance"]["template"] = "modern"
): InvoiceDocument {
  return {
    id: "sample",
    type: "invoice",
    number: "INV-0001",
    status: "issued",
    issueDate: "2026-11-15",
    dueDate: "2026-11-29",
    currency: "USD",
    reference: "",
    po: "",
    business: {
      ...defaults.business,
      company: "Studio North",
      email: "hello@studionorth.design",
      address: "24 Flower Road\nColombo 07, Sri Lanka",
    },
    client: {
      ...defaults.business,
      company: "Acme & Co.",
      email: "accounts@acme.co",
      address: "128 Market Street\nSan Francisco, CA",
    },
    lines: [
      {
        id: "1",
        name: "Brand strategy & direction",
        description: "Discovery, positioning, and creative direction",
        quantity: "1",
        price: "1200",
        tax: "0",
        discount: "0",
        discountType: "percent",
      },
      {
        id: "2",
        name: "Visual identity design",
        description: "Logo, color palette, and brand guidelines",
        quantity: "1",
        price: "1800",
        tax: "0",
        discount: "0",
        discountType: "percent",
      },
      {
        id: "3",
        name: "Website design",
        description: "A thoughtful digital home for your brand",
        quantity: "1",
        price: "2400",
        tax: "0",
        discount: "0",
        discountType: "percent",
      },
    ],
    taxInclusive: false,
    shipping: "0",
    notes: "Thank you for trusting us with your vision.",
    terms: "Payment is due within 14 days.",
    payment: defaults.payment,
    appearance: { ...defaults.appearance, template },
    createdAt: "",
    updatedAt: "",
  };
}
