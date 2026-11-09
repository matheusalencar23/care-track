"use client";

import { PATIENTS_GC_TIME_MS } from "@/hooks/patients/usePatients";
import { queryKeys } from "@/lib/query-keys";
import { listRecords } from "@/services/record.service";
import { useInfiniteQuery } from "@tanstack/react-query";

export const RECORDS_PAGE_SIZE = 20;

export function useRecords(patientId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.patients.records(patientId),
    queryFn: ({ pageParam }) =>
      listRecords(patientId, { cursor: pageParam, limit: RECORDS_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    gcTime: PATIENTS_GC_TIME_MS,
  });
}
