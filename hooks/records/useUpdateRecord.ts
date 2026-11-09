"use client";

import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import type { UpdateRecordData } from "@/model/record";
import { updateRecord } from "@/services/record.service";
import { ApiError, hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface Options {
  onDone?: () => void;
  onOutdated?: () => void;
  onValidationError?: (err: unknown) => boolean;
}

export const UNSAVED_TEXT_MESSAGE = "O texto que você digitou não foi salvo.";

export function useUpdateRecord(
  patientId: string,
  { onDone, onOutdated, onValidationError }: Options = {},
) {
  const queryClient = useQueryClient();

  const invalidateRecords = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.allRecords(patientId),
    });

  const mutation = useMutation({
    mutationFn: (data: UpdateRecordData) => updateRecord(patientId, data),
    onSuccess: () => {
      invalidateRecords();
      toast.success("Registro atualizado.");
      onDone?.();
    },
    onError: (err) => {
      if (hasErrorCode(err, "VALIDATION_FAILED") && onValidationError?.(err)) {
        return;
      }

      if (hasErrorCode(err, "RECORD_CONTENT_UNCHANGED")) {
        toast.info((err as ApiError).message);
        onDone?.();
        return;
      }

      notifyError(err);

      if (hasErrorCode(err, "RECORD_VERSION_OUTDATED")) {
        invalidateRecords();
        onOutdated?.();
        return;
      }

      if (hasErrorCode(err, "PATIENT_ARCHIVED")) {
        invalidateRecords();
        queryClient.invalidateQueries({
          queryKey: queryKeys.patients.detail(patientId),
        });
        return;
      }

      if (
        hasErrorCode(err, "RECORD_VOIDED") ||
        hasErrorCode(err, "RECORD_NOT_FOUND")
      ) {
        toast.warning(UNSAVED_TEXT_MESSAGE);
        invalidateRecords();
        onDone?.();
      }
    },
  });

  return {
    updateRecord: mutation.mutate,
    isPending: mutation.isPending,
  };
}
