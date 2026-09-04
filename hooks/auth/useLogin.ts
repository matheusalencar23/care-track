"use client";

import { queryKeys } from "@/lib/query-keys";
import { login } from "@/services/auth.service";
import { ApiError } from "@/shared/ApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.me,
      });

      router.push("/dashboard");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
        return;
      }

      toast.error("Ocorreu um erro inesperado. Por favor, tente novamente.");
    },
  });

  return {
    login: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
