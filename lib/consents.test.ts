import { describe, expect, it } from "vitest";
import type { Consent } from "@/model/consent";
import { consentNeedsRenewal } from "./consents";

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
