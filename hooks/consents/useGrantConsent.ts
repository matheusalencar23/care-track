"use client";

import type { GrantConsentData } from "@/model/consent";
import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import { grantConsent } from "@/services/consent.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface Options {
  onDone?: () => void;
  onFormError?: (err: unknown) => boolean;
  isRenewal?: boolean;
}

const OUTDATED_SCREEN_CODES = [
  "CONSENT_ALREADY_ACTIVE",
  "CONFLICT",
  "PATIENT_ARCHIVED",
];

export function useGrantConsent(
  patientId: string,
  { onDone, onFormError, isRenewal = false }: Options = {},
) {
  const queryClient = useQueryClient();

  const invalidateConsents = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.consents(patientId),
    });

  const mutation = useMutation({
    mutationFn: (data: GrantConsentData) => grantConsent(patientId, data),
    onSuccess: () => {
      invalidateConsents();
      toast.success(
        isRenewal ? "Autorização renovada." : "Autorização registrada.",
      );
      onDone?.();
    },
    onError: (err) => {
      if (onFormError?.(err)) {
        return;
      }

      notifyError(err);

      if (OUTDATED_SCREEN_CODES.some((code) => hasErrorCode(err, code))) {
        invalidateConsents();
        queryClient.invalidateQueries({
          queryKey: queryKeys.patients.detail(patientId),
        });
        onDone?.();
      }
    },
  });

  return {
    grantConsent: mutation.mutate,
    isPending: mutation.isPending,
  };
}
