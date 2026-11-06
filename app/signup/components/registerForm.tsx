"use client";

import Button from "@/app/ui/button";
import Checkbox from "@/app/ui/checkbox";
import Input from "@/app/ui/input";
import Select from "@/app/ui/select";
import { useSignup } from "@/hooks/auth/useSignup";
import { TERMS_VERSION } from "@/lib/legal";
import { BRAZILIAN_STATES } from "@/shared/brazilianStates";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import z from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  email: z.email("Email inválido"),
  coren: z
    .string()
    .trim()
    .regex(/^\d{1,9}$/, "Informe apenas os números do COREN (até 9 dígitos)"),
  corenState: z.enum(BRAZILIAN_STATES, "Selecione a UF do COREN"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
  acceptedTerms: z.literal(
    true,
    "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade",
  ),
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
    signup({
      name: data.name,
      email: data.email,
      coren: data.coren,
      corenState: data.corenState,
      password: data.password,
      acceptedTermsVersion: TERMS_VERSION,
    });
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

      <div className="grid grid-cols-[1fr_6.5rem] gap-3">
        <Input
          label="COREN"
          inputMode="numeric"
          autoComplete="off"
          maxLength={9}
          placeholder="Somente números"
          error={errors.coren?.message}
          {...register("coren")}
        />

        <Select
          label="UF"
          defaultValue=""
          error={errors.corenState?.message}
          {...register("corenState")}
        >
          <option value="" disabled>
            UF
          </option>
          {BRAZILIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Senha"
        type="password"
        autoComplete="new-password"
        placeholder="Digite sua senha"
        error={errors.password?.message}
        {...register("password")}
      />

      <Checkbox
        label={
          <>
            Li e aceito os{" "}
            <Link
              href="/termos"
              target="_blank"
              className="font-semibold text-white underline hover:text-teal-300"
            >
              Termos de Uso
            </Link>{" "}
            e estou ciente da{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="font-semibold text-white underline hover:text-teal-300"
            >
              Política de Privacidade
            </Link>
            . Os links abrem em outra aba.
          </>
        }
        error={errors.acceptedTerms?.message}
        {...register("acceptedTerms")}
      />

      <Button disabled={isPending}>
        {isPending ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
}
