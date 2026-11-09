"use client";

import { PATIENTS_GC_TIME_MS } from "@/hooks/patients/usePatients";
import { queryKeys } from "@/lib/query-keys";
import { listConsents } from "@/services/consent.service";
import { useQuery } from "@tanstack/react-query";

export function useConsents(patientId: string) {
  return useQuery({
    queryKey: queryKeys.patients.consents(patientId),
    queryFn: () => listConsents(patientId),
    gcTime: PATIENTS_GC_TIME_MS,
  });
}
