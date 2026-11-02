"use client";

import { queryKeys } from "@/lib/query-keys";
import { login } from "@/services/auth.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notifyError } from "@/lib/notify-error";

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
    onError: notifyError,
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
  };
}
