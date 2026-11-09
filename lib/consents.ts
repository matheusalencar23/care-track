import { isMinorAt } from "@/lib/dates";
import type { Consent } from "@/model/consent";

export function consentNeedsRenewal(
  consent: Consent,
  birthDate: string,
  now = new Date(),
) {
  return (
    consent.status === "active" &&
    consent.grantor === "legal_representative" &&
    isMinorAt(birthDate, new Date(consent.collectedAt)) &&
    !isMinorAt(birthDate, now)
  );
}
