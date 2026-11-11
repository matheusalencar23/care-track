"use client";

import { PATIENTS_GC_TIME_MS } from "@/hooks/patients/usePatients";
import { queryKeys } from "@/lib/query-keys";
import { listAttachments } from "@/services/attachment.service";
import { useInfiniteQuery } from "@tanstack/react-query";

export const ATTACHMENTS_PAGE_SIZE = 20;

export function useAttachments(patientId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.patients.attachmentList(patientId),
    queryFn: ({ pageParam }) =>
      listAttachments(patientId, {
        status: "active",
        cursor: pageParam,
        limit: ATTACHMENTS_PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    gcTime: PATIENTS_GC_TIME_MS,
  });
}
