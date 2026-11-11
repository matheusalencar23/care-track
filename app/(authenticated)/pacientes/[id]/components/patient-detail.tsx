"use client";

import Badge from "@/app/ui/badge";
import SensitiveValue from "@/app/ui/sensitive-value";
import Skeleton from "@/app/ui/skeleton";
import { usePatient } from "@/hooks/patients/usePatient";
import { formatAge, formatDate, formatDateTime } from "@/lib/dates";
import { formatWithMask, maskCns, maskCpf } from "@/lib/masks";
import type { Patient } from "@/model/patient";
import { useId, useState, type ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa";
import BackLink from "../../components/back-link";
import PatientLoadError from "../../components/patient-load-error";
import PatientAttachments from "./patient-attachments";
import PatientActions from "./patient-actions";
import RecordsSection from "./records-section";

interface Props {
  id: string;
}

const cardClassName =
  "rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8";

function NotInformed() {
  return <span className="text-slate-300">Não informado</span>;
}

function startsExpanded() {
  return (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(min-width: 640px)").matches
  );
}

function PatientInfo({ patient }: { patient: Patient }) {
  const [isExpanded, setIsExpanded] = useState(startsExpanded);
  const contentId = useId();

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
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => setIsExpanded((value) => !value)}
          className="-m-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-4 rounded-xl p-2 text-left transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Dados cadastrais
          <FaChevronDown
            aria-hidden
            className={`shrink-0 text-sm text-slate-300 transition-transform motion-reduce:transition-none ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </h2>

      <dl
        id={contentId}
        hidden={!isExpanded}
        className="mt-5 grid gap-5 sm:grid-cols-2"
      >
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

      <PatientAttachments key={`attachments-${patient.id}`} patient={patient} />

      <RecordsSection key={patient.id} patient={patient} />
    </div>
  );
}
