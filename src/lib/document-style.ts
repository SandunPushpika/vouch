import type { InvoiceDocument } from "@/types/domain";
export function documentAccent(appearance: InvoiceDocument["appearance"]) {
  return appearance.template === "minimal"
    ? "#18181b"
    : appearance.template === "corporate"
    ? "#234e70"
    : appearance.accent;
}
