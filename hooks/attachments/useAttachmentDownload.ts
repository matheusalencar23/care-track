"use client";

import { queryKeys } from "@/lib/query-keys";
import { getAttachmentDownload } from "@/services/attachment.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAttachmentDownload(
  patientId: string,
  attachmentId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.patients.attachmentDownload(patientId, attachmentId),
    queryFn: () => getAttachmentDownload(patientId, attachmentId),
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const isConsentRequired = hasErrorCode(
    query.error,
    "ATTACHMENT_CONSENT_REQUIRED",
  );

  useEffect(() => {
    if (isConsentRequired) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.consents(patientId),
      });
    }
  }, [isConsentRequired, patientId, queryClient]);

  return { ...query, isConsentRequired };
}
