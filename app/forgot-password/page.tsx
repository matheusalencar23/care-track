import Link from "next/link";
import ExternalLayout from "../ui/components/external-layout";
import GuestOnly from "../ui/components/guest-only";
import ForgotPasswordForm from "./components/forgotPasswordForm";

export default function ForgotPassword() {
  return (
    <GuestOnly>
      <ExternalLayout title="Informe seu e-mail para redefinir a senha">
        <ForgotPasswordForm />

        <p className="mt-4 text-center text-sm text-slate-200">
          Lembrou a senha?
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
