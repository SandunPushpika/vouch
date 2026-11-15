import type { Party } from "@/types/domain";

/** Fill missing branding on a draft, while preserving its edited business details. */
export function businessForDraft(
  status: string,
  business: Party,
  saved: Party
): Party {
  if (status !== "draft") return business;
  const identity = (party: Party) =>
    (party.company || party.name).trim().toLowerCase();
  if (!identity(business)) {
    const hasDetails = Object.entries(business).some(
      ([key, value]) => key !== "country" && value.trim()
    );
    if (hasDetails) return business;
    return identity(saved) || saved.logo ? structuredClone(saved) : business;
  }
  if (!business.logo && saved.logo && identity(business) === identity(saved)) {
    return { ...business, logo: saved.logo };
  }
  return business;
}
