"use client";

import Button from "@/app/ui/button";
import Input from "@/app/ui/input";
import { useLogin } from "@/hooks/auth/useLogin";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import z from "zod";

const schema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(8, "Senha muito curta"),
});

type LoginData = z.infer<typeof schema>;

export default function LoginForm() {
  const { login, isPending } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: LoginData) {
    login(data);
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

      <Input
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Digite sua senha"
        error={errors.password?.message}
        labelAction={
          <Link
            href="/forgot-password"
            className="text-sm text-white hover:text-teal-300"
          >
            Esqueceu sua senha?
          </Link>
        }
        {...register("password")}
      />

      <Button disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
