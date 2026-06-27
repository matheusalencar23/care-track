"use client";

import Button from "@/app/ui/button";
import { signupSchema } from "@/schemas/signupSchema";
import { signupRequest } from "@/services/auth";
import { ApiError } from "@/shared/ApiError";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import z from "zod";

type RegisterData = z.infer<typeof signupSchema>;

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: RegisterData) {
    try {
      await signupRequest(data);
      toast.success("Usuário cadastrado com sucesso!")
      reset();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      }
      console.error("Erro ao realizar cadastro: ", err);
    }
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
