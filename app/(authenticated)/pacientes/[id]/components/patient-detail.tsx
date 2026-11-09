"use client";

import Badge from "@/app/ui/badge";
import SensitiveValue from "@/app/ui/sensitive-value";
import Skeleton from "@/app/ui/skeleton";
import { usePatient } from "@/hooks/patients/usePatient";
import { formatAge, formatDate, formatDateTime } from "@/lib/dates";
import { formatWithMask, maskCns, maskCpf } from "@/lib/masks";
import type { Patient } from "@/model/patient";
import type { ReactNode } from "react";
import BackLink from "../../components/back-link";
import PatientLoadError from "../../components/patient-load-error";
import ConsentSection from "./consent-section";
import PatientActions from "./patient-actions";

interface Props {
  id: string;
}

const cardClassName =
  "rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8";

function NotInformed() {
  return <span className="text-slate-300">Não informado</span>;
}

function PatientInfo({ patient }: { patient: Patient }) {
  const fields: { label: string; value: ReactNode }[] = [
    {
      label: "Data de nascimento",
      value: `${formatDate(patient.birthDate)} (${formatAge(patient.birthDate)})`,
    },
    {
      label: "CPF",
      value: patient.cpf ? (
        <SensitiveValue
          label="CPF"
          value={formatWithMask("cpf", patient.cpf)}
          masked={maskCpf(patient.cpf)}
        />
      ) : (
        <NotInformed />
      ),
    },
    {
      label: "Cartão SUS",
      value: patient.cns ? (
        <SensitiveValue
          label="Cartão SUS"
          value={formatWithMask("cns", patient.cns)}
          masked={maskCns(patient.cns)}
        />
      ) : (
        <NotInformed />
      ),
    },
    {
      label: "Telefone",
      value: patient.phone ? (
        formatWithMask("phone", patient.phone)
      ) : (
        <NotInformed />
      ),
    },
    { label: "Cadastrado em", value: formatDateTime(patient.createdAt) },
    { label: "Atualizado em", value: formatDateTime(patient.updatedAt) },
  ];

  return (
    <section aria-labelledby="patient-data-title" className={cardClassName}>
      <h2 id="patient-data-title" className="text-lg font-semibold">
        Dados cadastrais
      </h2>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className="mt-1 flex min-h-8 items-center break-words font-medium">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LoadingState() {
  return (
    <div aria-busy className="space-y-6">
      <span className="sr-only">Carregando paciente...</span>
      <Skeleton className="h-8 w-64" />
      <div className={cardClassName}>
        <Skeleton className="h-5 w-40" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PatientDetail({ id }: Props) {
  const { data: patient, error, isPending, refetch } = usePatient(id);

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-2">
        <BackLink href="/pacientes">Pacientes</BackLink>
        <LoadingState />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <BackLink href="/pacientes">Pacientes</BackLink>

        <PatientLoadError error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <BackLink href="/pacientes">Pacientes</BackLink>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold break-words">
              {patient.name}
            </h1>
            {patient.archivedAt && <Badge tone="warning">Arquivado</Badge>}
          </div>

          <PatientActions patient={patient} />
        </div>

        {patient.archivedAt && (
          <p className="mt-2 text-sm text-slate-300">
            Arquivado em {formatDateTime(patient.archivedAt)}. O prontuário
            continua guardado pelo prazo legal e não pode receber alterações
            enquanto o paciente estiver arquivado.
          </p>
        )}
      </div>

      <PatientInfo patient={patient} />

      <ConsentSection patient={patient} />

      <section aria-labelledby="patient-history-title" className={cardClassName}>
        <h2 id="patient-history-title" className="text-lg font-semibold">
          Histórico
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Os registros de acompanhamento deste paciente ainda estão em
          construção.
        </p>
      </section>
    </div>
  );
}
