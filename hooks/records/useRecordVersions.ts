"use client";

import { PATIENTS_GC_TIME_MS } from "@/hooks/patients/usePatients";
import { queryKeys } from "@/lib/query-keys";
import { listRecordVersions } from "@/services/record.service";
import { useQuery } from "@tanstack/react-query";

export function useRecordVersions(patientId: string, recordId: string) {
  return useQuery({
    queryKey: queryKeys.patients.recordVersions(patientId, recordId),
    queryFn: () => listRecordVersions(patientId, recordId),
    gcTime: PATIENTS_GC_TIME_MS,
  });
}
