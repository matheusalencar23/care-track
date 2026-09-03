"use client";

import { loginSchema } from "@/schemas/loginSchema";
import { loginRequest } from "@/services/auth.service";
import { ApiError } from "@/shared/ApiError";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import z from "zod";

type LoginData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();

  async function onSubmit(data: LoginData) {
    try {
      await loginRequest(data);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
        return;
      }

      toast.error("Ocorreu um erro inesperado. Por favor, tente novamente.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
        <div className="mb-2 flex justify-between">
          <label className="text-sm text-white">Senha</label>

          {/* TODO: Implementar o fluxo de recuperação de senha */}
          <a href="#" className="text-sm text-white hover:hover:text-teal-300">
            Esqueceu?
          </a>
        </div>

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

      <button className="mt-4 w-full rounded-xl bg-white py-3 font-semibold text-blue-700 transition hover:scale-[1.02]">
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
