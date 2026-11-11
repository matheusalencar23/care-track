"use client";

import { notifyError } from "@/lib/notify-error";
import { resetPassword } from "@/services/auth.service";
import { isInvalidTokenError } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "react-toastify";

export function useResetPassword() {
  const router = useAppRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      // A API encerra todas as sessões abertas antes da troca de senha.
      queryClient.clear();
      toast.success("Senha redefinida! Faça login com a nova senha.");
      router.push("/login");
    },
    onError: (err) => {
      // Link inválido, expirado ou já usado: a página mostra o aviso na tela.
      if (!isInvalidTokenError(err)) {
        notifyError(err);
      }
    },
  });

  return {
    resetPassword: mutation.mutate,
    isPending: mutation.isPending,
    isInvalidToken: isInvalidTokenError(mutation.error),
  };
}
