import Link from "next/link";
import RegisterForm from "./components/registerForm";
import ExternalLayout from "../ui/components/external-layout";

export default function SingUp() {
  return (
    <ExternalLayout title="Faça seu cadastro para usar a plataforma">
      <RegisterForm />

      <p className="mt-4 text-center text-sm text-slate-200">
        Já possui uma conta?
        <Link
          href="/login"
          className="ml-1 font-semibold text-white hover:text-teal-300"
        >
          Entre
        </Link>
      </p>
    </ExternalLayout>
  );
}
