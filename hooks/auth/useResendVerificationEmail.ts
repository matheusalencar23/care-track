"use client";

import { notifyError } from "@/lib/notify-error";
import { resendVerificationEmail } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";

export function useResendVerificationEmail() {
  const mutation = useMutation({
    mutationFn: resendVerificationEmail,
    onError: notifyError,
  });

  return {
    resendVerificationEmail: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}
