"use client";

import Button from "@/app/ui/button";
import LinkButton from "@/app/ui/link-button";
import { useVerifyEmail } from "@/hooks/auth/useVerifyEmail";
import { isInvalidTokenError } from "@/shared/ApiError";
import Link from "next/link";
import { useEffect, useRef } from "react";
import ResendVerificationForm from "./resendVerificationForm";

interface Props {
  token?: string;
}

export default function VerifyEmail({ token }: Props) {
  const { verifyEmail, isPending, isSuccess, error } = useVerifyEmail();
  // O token é de uso único: a ref evita uma segunda chamada (ex.: efeitos
  // executados duas vezes no Strict Mode), que falharia com o token já usado.
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!token || requestedRef.current) {
      return;
    }

    requestedRef.current = true;
    // Tira o token da barra de endereços e do histórico do navegador.
    window.history.replaceState(null, "", window.location.pathname);
    verifyEmail(token);
  }, [token, verifyEmail]);

  if (!token) {
    return (
      <>
        <p className="mb-5 text-center text-sm text-slate-200">
          O email de confirmação não chegou ou já expirou? Informe seu e-mail que
          enviaremos um novo.
        </p>

        <ResendVerificationForm />

        <BackToLogin />
      </>
    );
  }

  if (isSuccess) {
    return (
      <>
        <p className="text-center text-white">
          Tudo certo! Seu e-mail foi confirmado.
        </p>

        <LinkButton href="/login">Fazer login</LinkButton>
      </>
    );
  }

  if (isInvalidTokenError(error)) {
    return (
      <>
        <p className="mb-5 text-center text-sm text-slate-200">
          Esse link não vale mais: ele expirou ou já foi usado. Se você já
          confirmou seu e-mail, é só fazer login. Se não, peça um novo link.
        </p>

        <ResendVerificationForm />

        <BackToLogin />
      </>
    );
  }

  if (error) {
    // Falha de rede/servidor: o token não foi consumido e pode ser reenviado.
    return (
      <>
        <p className="text-center text-white">
          Não conseguimos confirmar seu e-mail agora. Verifique sua conexão e
          tente de novo.
        </p>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => verifyEmail(token)}
        >
          {isPending ? "Confirmando..." : "Tentar de novo"}
        </Button>

        <BackToLogin />
      </>
    );
  }

  return <p className="text-center text-white">Confirmando seu e-mail...</p>;
}

function BackToLogin() {
  return (
    <p className="mt-4 text-center text-sm text-slate-200">
      <Link
        href="/login"
        className="font-semibold text-white hover:text-teal-300"
      >
        Voltar para o login
      </Link>
    </p>
  );
}
