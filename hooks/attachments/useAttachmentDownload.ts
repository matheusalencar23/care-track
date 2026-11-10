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
    queryKey: queryKeys.patients.attachmentDownload(
      patientId,
      attachmentId,
      "inline",
    ),
    queryFn: () => getAttachmentDownload(patientId, attachmentId, "inline"),
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

  async function requestDownloadUrl() {
    const download = await queryClient.fetchQuery({
      queryKey: queryKeys.patients.attachmentDownload(
        patientId,
        attachmentId,
        "attachment",
      ),
      queryFn: () => getAttachmentDownload(patientId, attachmentId),
      staleTime: 0,
      gcTime: 0,
      retry: false,
    });

    return download.downloadUrl;
  }

  return { ...query, isConsentRequired, requestDownloadUrl };
}
