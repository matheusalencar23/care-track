"use client";

import { useConsents } from "@/hooks/consents/useConsents";
import { hasValidImageConsent } from "@/lib/consents";

export function useImageConsent(patientId: string): boolean | undefined {
  const { data } = useConsents(patientId);

  return data ? hasValidImageConsent(data) : undefined;
}
