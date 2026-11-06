"use client";

import { queryKeys } from "@/lib/query-keys";
import { getPatient } from "@/services/patient.service";
import { useQuery } from "@tanstack/react-query";
import { PATIENTS_GC_TIME_MS } from "./usePatients";

export function usePatient(id: string) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: () => getPatient(id),
    gcTime: PATIENTS_GC_TIME_MS,
  });
}
