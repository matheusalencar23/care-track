"use client";

import { verifyEmail } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";

/**
 * Confirma o e-mail com o token do link enviado pela API. Os erros não viram
 * toast: a página de confirmação mostra o resultado na própria tela.
 */
export function useVerifyEmail() {
  const mutation = useMutation({
    mutationFn: verifyEmail,
  });

  return {
    verifyEmail: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
