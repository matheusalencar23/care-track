"use client";

import { notifyError } from "@/lib/notify-error";
import {
  broadcastLogout,
  clearSession,
  waitForPendingRenewal,
} from "@/lib/session";
import { logout } from "@/services/auth.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await waitForPendingRenewal();
      return logout();
    },
    onSuccess: () => {
      clearSession();
      broadcastLogout();
      // Remove todos os dados em cache (usuário, pacientes etc.) para que
      // nada da sessão encerrada seja exibido após o logout.
      queryClient.clear();
      router.push("/login");
    },
    onError: notifyError,
  });

  return {
    signout: mutation.mutate,
    isPending: mutation.isPending,
  };
}
