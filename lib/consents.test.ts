import { describe, expect, it } from "vitest";
import type { Consent } from "@/model/consent";
import { consentNeedsRenewal, consentPagePath, hasValidImageConsent, imageConsentStatus } from "./consents";

const birthDate = "2008-11-09";
const beforeAdulthood = new Date("2026-11-08T12:00:00.000Z");
const afterAdulthood = new Date("2026-11-09T12:00:00.000Z");

function consent(overrides: Partial<Consent> = {}): Consent {
  return {
    id: "c1",
    patientId: "p1",
    type: "image_capture",
    method: "written",
    grantor: "legal_representative",
    representativeName: "Rita Lima",
    collectedAt: "2020-01-01T12:00:00.000Z",
    status: "active",
    needsRenewal: false,
    revokedAt: null,
    revocationReason: null,
    createdAt: "2020-01-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("consentNeedsRenewal", () => {
  it("pede renovação quando o menor completa 18 anos", () => {
    expect(consentNeedsRenewal(consent(), birthDate, beforeAdulthood)).toBe(false);
    expect(consentNeedsRenewal(consent(), birthDate, afterAdulthood)).toBe(true);
  });

  it("não pede para responsável legal de quem já era adulto na coleta", () => {
    const collectedAt = "2026-11-09T00:00:00.000Z";

    expect(consentNeedsRenewal(consent({ collectedAt }), birthDate, afterAdulthood)).toBe(false);
  });

  it("não pede para autorização do próprio paciente nem para a revogada", () => {
    expect(consentNeedsRenewal(consent({ grantor: "patient" }), birthDate, afterAdulthood)).toBe(false);
    expect(consentNeedsRenewal(consent({ status: "revoked" }), birthDate, afterAdulthood)).toBe(false);
  });
});

describe("hasValidImageConsent", () => {
  it("aceita a autorização ativa que não precisa de renovação", () => {
    expect(hasValidImageConsent([consent()])).toBe(true);
  });

  it("recusa lista vazia, autorização revogada e autorização que precisa de renovação", () => {
    expect(hasValidImageConsent([])).toBe(false);
    expect(hasValidImageConsent([consent({ status: "revoked", revokedAt: "2026-01-01T12:00:00.000Z" })])).toBe(false);
    expect(hasValidImageConsent([consent({ needsRenewal: true })])).toBe(false);
  });
});

describe("imageConsentStatus", () => {
  it("indica sem autorização, autorizado e renovação necessária", () => {
    expect(imageConsentStatus([], birthDate)).toBe("none");
    expect(imageConsentStatus([consent({ status: "revoked" })], birthDate)).toBe("none");
    expect(imageConsentStatus([consent({ grantor: "patient", representativeName: null })], birthDate)).toBe("active");
    expect(imageConsentStatus([consent({ needsRenewal: true })], birthDate)).toBe("renewal");
  });
});

describe("consentPagePath", () => {
  it("usa só o ID opaco do paciente", () => {
    expect(consentPagePath("0b6f1c2a-1111-4000-8000-000000000001")).toBe(
      "/pacientes/0b6f1c2a-1111-4000-8000-000000000001/autorizacoes",
    );
  });
});
