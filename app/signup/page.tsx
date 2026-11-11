import Link from "next/link";
import RegisterForm from "./components/registerForm";
import ExternalLayout from "../ui/components/external-layout";
import GuestOnly from "../ui/components/guest-only";

export default function SignUp() {
  return (
    <GuestOnly>
      <ExternalLayout title="Faça seu cadastro para usar a plataforma" wide>
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
    </GuestOnly>
  );
}
