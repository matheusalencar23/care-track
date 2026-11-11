"use client";

import EmptyState from "@/app/ui/empty-state";
import LinkButton from "@/app/ui/link-button";
import Skeleton from "@/app/ui/skeleton";
import { usePatient } from "@/hooks/patients/usePatient";
import { useUpdatePatient } from "@/hooks/patients/useUpdatePatient";
import { applyFieldErrors } from "@/lib/form-errors";
import type { Patient, PatientData } from "@/model/patient";
import { hasErrorCode } from "@/shared/ApiError";
import { useRouter } from "next/navigation";
import { FaArchive } from "react-icons/fa";
import BackLink from "../../../components/back-link";
import PatientForm, {
  patientFormFields,
  patientToFormValues,
  usePatientForm,
} from "../../../components/patient-form";
import PatientLoadError from "../../../components/patient-load-error";

interface Props {
  id: string;
}

const BIRTH_DATE_AFTER_CONSENT_MESSAGE =
  "Há uma autorização de uso de imagem coletada antes desta data. Confira a data de nascimento.";

function EditPatientForm({ patient }: { patient: Patient }) {
  const router = useRouter();
  const detailHref = `/pacientes/${patient.id}`;
  const form = usePatientForm(patientToFormValues(patient));
  const { isDirty } = form.formState;
  const { updatePatient, isPending } = useUpdatePatient(patient.id, {
    onValidationError: (err) => {
      if (hasErrorCode(err, "PATIENT_BIRTH_DATE_AFTER_CONSENT")) {
        form.setError(
          "birthDate",
          { type: "server", message: BIRTH_DATE_AFTER_CONSENT_MESSAGE },
          { shouldFocus: true },
        );
        return true;
      }

      return applyFieldErrors(err, form.setError, patientFormFields);
    },
  });

  function onSubmit(data: PatientData) {
    if (!isDirty) {
      router.push(detailHref);
      return;
    }

    updatePatient(data);
  }

  return (
    <PatientForm
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel="Salvar alterações"
      pendingLabel="Salvando..."
      cancelHref={detailHref}
    />
  );
}

function LoadingState() {
  return (
    <div
      aria-busy
      className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
    >
      <span className="sr-only">Carregando paciente...</span>
      <Skeleton className="h-4 w-3/4" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className={`space-y-2 ${index === 0 ? "sm:col-span-2" : ""}`}
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditPatient({ id }: Props) {
  const { data: patient, error, isPending, refetch } = usePatient(id);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={patient ? `/pacientes/${id}` : "/pacientes"}>
        {patient ? patient.name : "Pacientes"}
      </BackLink>

      <h1 className="mt-2 mb-6 text-2xl font-semibold">Editar paciente</h1>

      {isPending ? (
        <LoadingState />
      ) : !patient ? (
        <PatientLoadError error={error} onRetry={() => refetch()} />
      ) : patient.archivedAt ? (
        <EmptyState
          icon={FaArchive}
          title="Paciente arquivado"
          description="Os dados de um paciente arquivado não podem ser alterados. Para editar, reative o paciente."
          action={
            <LinkButton href={`/pacientes/${id}`} block={false}>
              Voltar para o paciente
            </LinkButton>
          }
        />
      ) : (
        <EditPatientForm key={patient.id} patient={patient} />
      )}
    </div>
  );
}
