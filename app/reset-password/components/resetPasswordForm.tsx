"use client";

import Button from "@/app/ui/button";
import Input from "@/app/ui/input";
import LinkButton from "@/app/ui/link-button";
import { useResetPassword } from "@/hooks/auth/useResetPassword";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .max(72, "A senha deve ter no máximo 72 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordData = z.infer<typeof schema>;

interface Props {
  token?: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const { resetPassword, isPending, isInvalidToken } = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    // Tira o token da barra de endereços e do histórico do navegador; ele
    // continua disponível na prop até o envio do formulário.
    if (token) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [token]);

  function onSubmit(data: ResetPasswordData) {
    if (token) {
      resetPassword({ token, password: data.password });
    }
  }

  if (!token || isInvalidToken) {
    return (
      <>
        <p className="text-center text-white">
          Este link é inválido, expirou ou já foi usado. Peça um novo link de
          redefinição de senha.
        </p>

        <LinkButton href="/forgot-password">Pedir novo link</LinkButton>
      </>
    );
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        placeholder="Digite a nova senha"
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        placeholder="Repita a nova senha"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button disabled={isPending}>
        {isPending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
