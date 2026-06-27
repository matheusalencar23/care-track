import Image from "next/image";
import logo from "../../public/logo.png";
import LoginForm from "./components/loginForm";
import Card from "../ui/card";
import Link from "next/link";

export default function Login() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <Card>
        <div className="mb-6 flex flex-col items-center">
          <Image src={logo} alt="Logo" className="w-50 mb-2" loading="eager" />

          <h1 className="text-4xl font-bold text-blue-900">
            Care<span className="text-teal-600">Track</span>
          </h1>

          <p className="mt-2 text-center text-sm text-slate-200">
            Faça login para acessar a plataforma
          </p>
        </div>

        {/* Form */}
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
      </Card>
    </main>
  );
}
