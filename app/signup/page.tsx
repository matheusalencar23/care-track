import Image from "next/image";
import logo from "../../public/logo.png";
import LoginForm from "../login/components/loginForm";
import Card from "../ui/card";
import Link from "next/link";
import RegisterForm from "./components/registerForm";

export default function SingUp() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <Card>
        <div className="mb-6 flex flex-col items-center">
          <Image src={logo} alt="Logo" className="w-50 mb-2" loading="eager" />

          <h1 className="text-4xl font-bold text-blue-900">
            Care<span className="text-teal-600">Track</span>
          </h1>

          <p className="mt-2 text-center text-sm text-slate-200">
            Faça seu cadastro para usar a plataforma
          </p>
        </div>

        {/* Form */}
        <RegisterForm />

        {/* Footer */}
        <p className="mt-4 text-center text-sm text-slate-200">
          Já possui uma conta?
          <Link
            href="/login"
            className="ml-1 font-semibold text-white hover:text-teal-300"
          >
            Entre
          </Link>
        </p>
      </Card>
    </main>
  );
}
