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

export function hasValidImageConsent(consents: Consent[]) {
  return consents.some(
    (consent) =>
      consent.type === "image_capture" &&
      consent.status === "active" &&
      !consent.needsRenewal,
  );
}

export type ImageConsentStatus = "active" | "renewal" | "none";

export function imageConsentStatus(
  consents: Consent[],
  birthDate: string,
): ImageConsentStatus {
  const active = consents.find(
    (consent) => consent.type === "image_capture" && consent.status === "active",
  );

  if (!active) {
    return "none";
  }

  return active.needsRenewal || consentNeedsRenewal(active, birthDate)
    ? "renewal"
    : "active";
}

export function consentPagePath(patientId: string) {
  return `/pacientes/${encodeURIComponent(patientId)}/autorizacoes`;
}
