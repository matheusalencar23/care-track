export const CONSENT_METHODS = ["written", "verbal"] as const;

export type ConsentMethod = (typeof CONSENT_METHODS)[number];

export const CONSENT_GRANTORS = ["patient", "legal_representative"] as const;

export type ConsentGrantor = (typeof CONSENT_GRANTORS)[number];

export type ConsentType = "image_capture";

export type ConsentStatus = "active" | "revoked";

export interface Consent {
  id: string;
  patientId: string;
  type: ConsentType;
  method: ConsentMethod;
  grantor: ConsentGrantor;
  representativeName: string | null;
  collectedAt: string;
  status: ConsentStatus;
  revokedAt: string | null;
  revocationReason: string | null;
  createdAt: string;
}

export interface GrantConsentData {
  type: ConsentType;
  method: ConsentMethod;
  grantor: ConsentGrantor;
  representativeName?: string;
  collectedAt?: string;
}

export interface RevokeConsentData {
  consentId: string;
  reason?: string;
}
