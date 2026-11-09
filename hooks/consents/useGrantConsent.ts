"use client";

import type { GrantConsentData } from "@/model/consent";
import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import { grantConsent, revokeConsent } from "@/services/consent.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface Options {
  onDone?: () => void;
  onFormError?: (err: unknown) => boolean;
  replacesConsentId?: string;
}

const RENEWAL_REASON = "Renovação: o paciente completou 18 anos.";

const OUTDATED_SCREEN_CODES = [
  "CONSENT_ALREADY_ACTIVE",
  "CONFLICT",
  "PATIENT_ARCHIVED",
];

export function useGrantConsent(
  patientId: string,
  { onDone, onFormError, replacesConsentId }: Options = {},
) {
  const queryClient = useQueryClient();

  const invalidateConsents = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.consents(patientId),
    });

  const mutation = useMutation({
    mutationFn: async (data: GrantConsentData) => {
      if (replacesConsentId) {
        await revokeConsent(patientId, {
          consentId: replacesConsentId,
          reason: RENEWAL_REASON,
        }).catch((err: unknown) => {
          if (!hasErrorCode(err, "CONSENT_ALREADY_REVOKED")) {
            throw err;
          }
        });
      }

      return grantConsent(patientId, data);
    },
    onSuccess: () => {
      invalidateConsents();
      toast.success(
        replacesConsentId ? "Autorização renovada." : "Autorização registrada.",
      );
      onDone?.();
    },
    onError: (err) => {
      if (replacesConsentId) {
        invalidateConsents();
      }

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
