"use client";

import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import type { CreateRecordData } from "@/model/record";
import { createRecord } from "@/services/record.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface Options {
  onDone?: () => void;
  onValidationError?: (err: unknown) => boolean;
}

export function useCreateRecord(
  patientId: string,
  { onDone, onValidationError }: Options = {},
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateRecordData) => createRecord(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.allRecords(patientId),
      });
      toast.success("Registro salvo.");
      onDone?.();
    },
    onError: (err) => {
      if (hasErrorCode(err, "VALIDATION_FAILED") && onValidationError?.(err)) {
        return;
      }

      notifyError(err);

      if (hasErrorCode(err, "PATIENT_ARCHIVED")) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.patients.detail(patientId),
        });
      }
    },
  });

  return {
    createRecord: mutation.mutate,
    isPending: mutation.isPending,
  };
}
