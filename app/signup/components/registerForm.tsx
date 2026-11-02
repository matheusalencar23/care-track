"use client";

import Button from "@/app/ui/button";
import Input from "@/app/ui/input";
import { useSignup } from "@/hooks/auth/useSignup";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "Senha muito curta"),
});

type RegisterData = z.infer<typeof schema>;

export default function RegisterForm() {
  const { signup, isPending } = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: RegisterData) {
    signup(data);
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Nome"
        autoComplete="name"
        placeholder="Digite seu nome"
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="Digite seu email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Senha"
        type="password"
        autoComplete="new-password"
        placeholder="Digite sua senha"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button disabled={isPending}>
        {isPending ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
}
