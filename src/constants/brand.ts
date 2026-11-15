export const brand = {
  name: "Vouch",
  tagline: "Good work. Beautifully billed.",
  description:
    "Free, private invoices and quotations. Create professional PDFs with Vouch, entirely on your device.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://vouch.example",
};
export const currencies = [
  "LKR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "INR",
  "JPY",
  "KWD",
  "AED",
  "SGD",
  "CHF",
  "NZD",
  "BHD",
];
export const templates = [
  {
    id: "modern",
    name: "Modern",
    description: "A little color. A lasting impression.",
    color: "#6D28D9",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Beautifully simple. Effortlessly clear.",
    color: "#18181b",
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Structured, confident, and business-ready.",
    color: "#234e70",
  },
] as const;
