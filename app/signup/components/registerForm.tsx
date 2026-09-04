"use client";

import Button from "@/app/ui/button";
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
  const { signup } = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: RegisterData) {
    await signup(data);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm text-white">Nome</label>

        <input
          type="text"
          placeholder="Digite seu nome"
          {...register("name")}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
        />
        {errors.name && (
          <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm text-white">E-mail</label>

        <input
          type="text"
          placeholder="Digite seu email"
          {...register("email")}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm text-white">Senha</label>

        <input
          type="password"
          placeholder="Digite sua senha"
          {...register("password")}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <Button isDisabled={isSubmitting}>
        {isSubmitting ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
}
