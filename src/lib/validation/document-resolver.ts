import type { FieldErrors, Resolver } from "react-hook-form";
import { documentSchema, type InvoiceDocument } from "@/types/domain";

/** Connects the shared schema to RHF without a separate resolver dependency. */
export const documentResolver: Resolver<InvoiceDocument> = (values) => {
  const result = documentSchema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };

  // RHF reads nested paths (including numeric line indexes), rather than flat
  // keys such as "lines.0.price". Keep the first error for each field.
  const errors: Record<string, unknown> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.length ? issue.path.map(String) : ["root"];
    let parent = errors;
    for (const key of path.slice(0, -1)) {
      if (!parent[key] || typeof parent[key] !== "object") parent[key] = {};
      parent = parent[key] as Record<string, unknown>;
    }
    const key = path[path.length - 1];
    parent[key] ??= { type: issue.code, message: issue.message };
  }
  return { values: {}, errors: errors as FieldErrors<InvoiceDocument> };
};
