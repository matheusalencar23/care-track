import BackLink from "../components/back-link";
import NewPatientForm from "./components/new-patient-form";

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/pacientes">Pacientes</BackLink>

      <h1 className="mt-2 mb-6 text-2xl font-semibold">Novo paciente</h1>

      <NewPatientForm />
    </div>
  );
}
