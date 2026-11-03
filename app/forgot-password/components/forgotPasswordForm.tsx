"use client";

import Button from "@/app/ui/button";
import Input from "@/app/ui/input";
import { useForgotPassword } from "@/hooks/auth/useForgotPassword";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

const schema = z.object({
  email: z.email("Email inválido"),
});

type ForgotPasswordData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const { forgotPassword, isPending, isSuccess } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: ForgotPasswordData) {
    forgotPassword(data.email);
  }

  if (isSuccess) {
    // A API responde igual para qualquer e-mail, para não revelar quem tem
    // cadastro; a mensagem segue a mesma regra.
    return (
      <p className="text-center text-white">
        Se este e-mail estiver cadastrado, você receberá um link para redefinir
        a senha em instantes. Ele vale por 30 minutos.
      </p>
    );
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="Digite seu email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Button disabled={isPending}>
        {isPending ? "Enviando..." : "Recuperar senha"}
      </Button>
    </form>
  );
}
