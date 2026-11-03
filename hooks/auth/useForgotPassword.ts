"use client";

import { notifyError } from "@/lib/notify-error";
import { forgotPassword } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";

export function useForgotPassword() {
  const mutation = useMutation({
    mutationFn: forgotPassword,
    onError: notifyError,
  });

  return {
    forgotPassword: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}
