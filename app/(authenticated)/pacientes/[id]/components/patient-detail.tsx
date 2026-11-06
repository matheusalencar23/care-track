"use client";

import Badge from "@/app/ui/badge";
import Button from "@/app/ui/button";
import EmptyState from "@/app/ui/empty-state";
import LinkButton from "@/app/ui/link-button";
import RequestId from "@/app/ui/request-id";
import SensitiveValue from "@/app/ui/sensitive-value";
import Skeleton from "@/app/ui/skeleton";
import { usePatient } from "@/hooks/patients/usePatient";
import { formatAge, formatDate, formatDateTime } from "@/lib/dates";
import { formatWithMask, maskCns, maskCpf } from "@/lib/masks";
import type { Patient } from "@/model/patient";
import { ApiError, hasErrorCode } from "@/shared/ApiError";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaChevronLeft, FaUserSlash } from "react-icons/fa";

interface Props {
  id: string;
}

const cardClassName =
  "rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8";

function isNotFound(error: unknown) {
  return (
    hasErrorCode(error, "PATIENT_NOT_FOUND") ||
    (error instanceof ApiError &&
      error.statusCode === 422 &&
      error.errors.some((issue) => issue.location === "params"))
  );
}

function NotInformed() {
  return <span className="text-slate-300">Não informado</span>;
}

function BackLink() {
  return (
    <Link
      href="/pacientes"
      className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
    >
      <FaChevronLeft aria-hidden className="text-xs" />
      Pacientes
    </Link>
  );
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
        <BackLink />
        <LoadingState />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <BackLink />

        {isNotFound(error) ? (
          <EmptyState
            icon={FaUserSlash}
            title="Paciente não encontrado"
            description="O endereço pode estar errado, ou o paciente não está na sua lista."
            action={
              <LinkButton href="/pacientes" block={false}>
                Voltar para pacientes
              </LinkButton>
            }
          />
        ) : (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/10 px-6 py-12 text-center shadow-2xl backdrop-blur-2xl"
          >
            <p>Não foi possível carregar o paciente.</p>
            <RequestId error={error} />
            <Button
              type="button"
              variant="secondary"
              block={false}
              onClick={() => refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <BackLink />

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold break-words">{patient.name}</h1>
          {patient.archivedAt && <Badge tone="warning">Arquivado</Badge>}
        </div>

        {patient.archivedAt && (
          <p className="mt-2 text-sm text-slate-300">
            Arquivado em {formatDateTime(patient.archivedAt)}. O prontuário
            continua guardado pelo prazo legal e não pode receber alterações.
          </p>
        )}
      </div>

      <PatientInfo patient={patient} />

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
