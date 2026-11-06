"use client";

import { notifyError } from "@/lib/notify-error";
import { queryKeys } from "@/lib/query-keys";
import { createPatient } from "@/services/patient.service";
import { hasErrorCode } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Options {
  onValidationError?: (err: unknown) => boolean;
}

export function useCreatePatient({ onValidationError }: Options = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      toast.success("Paciente cadastrado.");
      router.push("/pacientes");
    },
    onError: (err) => {
      if (hasErrorCode(err, "VALIDATION_FAILED") && onValidationError?.(err)) {
        return;
      }

      notifyError(err);
    },
  });

  return {
    createPatient: mutation.mutate,
    isPending: mutation.isPending,
  };
}
