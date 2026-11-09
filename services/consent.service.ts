import { api } from "@/lib/api";
import type {
  Consent,
  GrantConsentData,
  RevokeConsentData,
} from "@/model/consent";

function consentsPath(patientId: string) {
  return `/patients/${encodeURIComponent(patientId)}/consents`;
}

export async function listConsents(patientId: string): Promise<Consent[]> {
  const response = await api.get(consentsPath(patientId));
  return response.data;
}

export async function grantConsent(
  patientId: string,
  data: GrantConsentData,
): Promise<Consent> {
  const response = await api.post(consentsPath(patientId), data);
  return response.data;
}

export async function revokeConsent(
  patientId: string,
  { consentId, reason }: RevokeConsentData,
): Promise<Consent> {
  const response = await api.post(
    `${consentsPath(patientId)}/${encodeURIComponent(consentId)}/revoke`,
    reason ? { reason } : {},
  );
  return response.data;
}
