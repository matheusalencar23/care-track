import LoginForm from "./components/loginForm";
import Link from "next/link";
import ExternalLayout from "../ui/components/external-layout";

export default function Login() {
  return (
    <ExternalLayout title="Faça login para acessar a plataforma">
      <LoginForm />

      {/* Divider - Adicionar quando implementar o login via google */}
      {/* <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-white/20" />
          <span className="px-4 text-sm text-slate-300">ou</span>
          <div className="h-px flex-1 bg-white/20" />
        </div> */}

      {/* Google - TODO: Implementar autenticação com google */}
      {/* <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 py-3 text-white transition hover:bg-white/20">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path
              fill="#FFC107"
              d="M43.6 20H42V19.9H24V28H35.3C33.6 32.7 29.2 36 24 36C17.4 36 12 30.6 12 24S17.4 12 24 12C27 12 29.7 13.1 31.8 15L37.5 9.3C34 6 29.3 4 24 4C13 4 4 13 4 24S13 44 24 44S44 35 44 24C44 22.7 43.9 21.3 43.6 20Z"
            />
          </svg>
          Entrar com Google
        </button> */}

      {/* Footer */}
      {/* TODO: Implementar o fluxo de criação de conta */}
      <p className="mt-4 text-center text-sm text-slate-200">
        Ainda não possui uma conta?
        <Link
          href="/signup"
          className="ml-1 font-semibold text-white hover:text-teal-300"
        >
          Criar conta
        </Link>
      </p>
    </ExternalLayout>
  );
}
