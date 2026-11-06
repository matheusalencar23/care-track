"use client";

import type { PatientListParams } from "@/model/patient";
import { queryKeys } from "@/lib/query-keys";
import { listPatients } from "@/services/patient.service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const PATIENTS_GC_TIME_MS = 60 * 1000;

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: () => listPatients(params),
    placeholderData: keepPreviousData,
    gcTime: PATIENTS_GC_TIME_MS,
  });
}
