"use client";

import { useCreatePatient } from "@/hooks/patients/useCreatePatient";
import { applyFieldErrors } from "@/lib/form-errors";
import PatientForm, {
  patientFormFields,
  usePatientForm,
} from "../../components/patient-form";

export default function NewPatientForm() {
  const form = usePatientForm();
  const { createPatient, isPending } = useCreatePatient({
    onValidationError: (err) =>
      applyFieldErrors(err, form.setError, patientFormFields),
  });

  return (
    <PatientForm
      form={form}
      onSubmit={createPatient}
      isPending={isPending}
      submitLabel="Cadastrar paciente"
      pendingLabel="Cadastrando..."
      cancelHref="/pacientes"
    />
  );
}
