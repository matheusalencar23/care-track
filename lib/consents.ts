import type { Consent } from "@/model/consent";

export function hasValidImageConsent(consents: Consent[]) {
  return consents.some(
    (consent) =>
      consent.type === "image_capture" &&
      consent.status === "active" &&
      !consent.needsRenewal,
  );
}

export type ImageConsentStatus = "active" | "renewal" | "none";

export function imageConsentStatus(consents: Consent[]): ImageConsentStatus {
  const active = consents.find(
    (consent) => consent.type === "image_capture" && consent.status === "active",
  );

  if (!active) {
    return "none";
  }

  return active.needsRenewal ? "renewal" : "active";
}

export function consentPagePath(patientId: string) {
  return `/pacientes/${encodeURIComponent(patientId)}/autorizacoes`;
}
