"use client";

import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import type { VoidRecordData } from "@/model/record";
import { voidRecord } from "@/services/record.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface Options {
  onDone?: () => void;
  onValidationError?: (err: unknown) => boolean;
}

const OUTDATED_SCREEN_CODES = [
  "RECORD_ALREADY_VOIDED",
  "RECORD_NOT_FOUND",
  "PATIENT_ARCHIVED",
];

export function useVoidRecord(
  patientId: string,
  { onDone, onValidationError }: Options = {},
) {
  const queryClient = useQueryClient();

  const invalidateRecords = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.allRecords(patientId),
    });

  const mutation = useMutation({
    mutationFn: (data: VoidRecordData) => voidRecord(patientId, data),
    onSuccess: (record) => {
      invalidateRecords();

      if (record.attachments.length > 0) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.patients.attachmentList(patientId),
        });
      }

      toast.success("Registro anulado.");
      onDone?.();
    },
    onError: (err) => {
      if (hasErrorCode(err, "VALIDATION_FAILED") && onValidationError?.(err)) {
        return;
      }

      notifyError(err);

      if (OUTDATED_SCREEN_CODES.some((code) => hasErrorCode(err, code))) {
        invalidateRecords();

        if (hasErrorCode(err, "PATIENT_ARCHIVED")) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.patients.detail(patientId),
          });
        }

        onDone?.();
      }
    },
  });

  return {
    voidRecord: mutation.mutate,
    isPending: mutation.isPending,
  };
}
