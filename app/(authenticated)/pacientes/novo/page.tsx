import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import NewPatientForm from "./components/new-patient-form";

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
      >
        <FaChevronLeft aria-hidden className="text-xs" />
        Pacientes
      </Link>

      <h1 className="mt-2 mb-6 text-2xl font-semibold">Novo paciente</h1>

      <NewPatientForm />
    </div>
  );
}
