"use client";

import type { Patient } from "@/model/patient";
import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import { archivePatient, unarchivePatient } from "@/services/patient.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

interface Options {
  onDone?: () => void;
}

const ALREADY_IN_STATE = ["PATIENT_ALREADY_ARCHIVED", "PATIENT_NOT_ARCHIVED"];

export function useSetPatientArchived(id: string, { onDone }: Options = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (archived: boolean) =>
      archived ? archivePatient(id) : unarchivePatient(id),
    onSuccess: (patient: Patient) => {
      queryClient.setQueryData(queryKeys.patients.detail(id), patient);
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists });
      toast.success(
        patient.archivedAt ? "Paciente arquivado." : "Paciente reativado.",
      );
      onDone?.();
    },
    onError: (err) => {
      notifyError(err);

      if (ALREADY_IN_STATE.some((code) => hasErrorCode(err, code))) {
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
        onDone?.();
      }
    },
  });

  return {
    setArchived: mutation.mutate,
    isPending: mutation.isPending,
  };
}
