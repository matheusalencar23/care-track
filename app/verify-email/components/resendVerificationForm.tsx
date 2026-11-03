"use client";

import Button from "@/app/ui/button";
import Input from "@/app/ui/input";
import { useResendVerificationEmail } from "@/hooks/auth/useResendVerificationEmail";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

const schema = z.object({
  email: z.email("Email inválido"),
});

type ResendData = z.infer<typeof schema>;

export default function ResendVerificationForm() {
  const { resendVerificationEmail, isPending, isSuccess } =
    useResendVerificationEmail();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendData>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: ResendData) {
    resendVerificationEmail(data.email);
  }

  if (isSuccess) {
    // A API responde igual para qualquer e-mail, para não revelar quem tem
    // cadastro; a mensagem segue a mesma regra.
    return (
      <p className="text-center text-white">
        Pronto! Se esse e-mail tiver um cadastro aguardando confirmação, o novo
        link chega em instantes. Ele vale por 30 minutos.
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
        {isPending ? "Enviando..." : "Reenviar link de confirmação"}
      </Button>
    </form>
  );
}
