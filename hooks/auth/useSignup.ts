"use client";

import { notifyError } from "@/lib/notify-error";
import { signup } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export function useSignup() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      toast.success(
        "Cadastro realizado! Enviamos um link de confirmação para o seu e-mail.",
      );
      router.push("/login");
    },
    onError: notifyError,
  });

  return {
    signup: mutation.mutate,
    isPending: mutation.isPending,
  };
}
