"use client";

import type { RevokeConsentData } from "@/model/consent";
import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import { revokeConsent } from "@/services/consent.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface Options {
  onDone?: () => void;
}

export function useRevokeConsent(
  patientId: string,
  { onDone }: Options = {},
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: RevokeConsentData) => revokeConsent(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.consents(patientId),
      });
      toast.success("Autorização revogada.");
      onDone?.();
    },
    onError: (err) => {
      notifyError(err);

      if (
        hasErrorCode(err, "CONSENT_ALREADY_REVOKED") ||
        hasErrorCode(err, "CONSENT_NOT_FOUND")
      ) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.patients.consents(patientId),
        });
        onDone?.();
      }
    },
  });

  return {
    revokeConsent: mutation.mutate,
    isPending: mutation.isPending,
  };
}
