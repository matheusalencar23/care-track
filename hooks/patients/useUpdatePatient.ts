"use client";

import type { PatientData } from "@/model/patient";
import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import { updatePatient } from "@/services/patient.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "react-toastify";

const FIELD_ERROR_CODES = ["VALIDATION_FAILED", "PATIENT_BIRTH_DATE_AFTER_CONSENT"];

interface Options {
  onValidationError?: (err: unknown) => boolean;
}

export function useUpdatePatient(id: string, { onValidationError }: Options = {}) {
  const router = useAppRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: PatientData) => updatePatient(id, data),
    onSuccess: (patient) => {
      queryClient.setQueryData(queryKeys.patients.detail(id), patient);
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists });
      toast.success("Dados do paciente atualizados.");
      router.push(`/pacientes/${id}`);
    },
    onError: (err) => {
      if (
        FIELD_ERROR_CODES.some((code) => hasErrorCode(err, code)) &&
        onValidationError?.(err)
      ) {
        return;
      }

      notifyError(err);

      if (
        hasErrorCode(err, "PATIENT_ARCHIVED") ||
        hasErrorCode(err, "PATIENT_NOT_FOUND")
      ) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.patients.detail(id),
        });
      }
    },
  });

  return {
    updatePatient: mutation.mutate,
    isPending: mutation.isPending,
  };
}
