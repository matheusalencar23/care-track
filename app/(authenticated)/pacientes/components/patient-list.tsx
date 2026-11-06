"use client";

import Badge from "@/app/ui/badge";
import Button from "@/app/ui/button";
import EmptyState from "@/app/ui/empty-state";
import Input from "@/app/ui/input";
import LinkButton from "@/app/ui/link-button";
import Pagination from "@/app/ui/pagination";
import RequestId from "@/app/ui/request-id";
import Table, { rowLinkClassName, type TableColumn } from "@/app/ui/table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePatients } from "@/hooks/patients/usePatients";
import { formatAge, formatDate } from "@/lib/dates";
import { maskCpf, normalizeSearch } from "@/lib/masks";
import type { Patient, PatientStatus } from "@/model/patient";
import Link from "next/link";
import { useState } from "react";
import { FaArchive, FaSearch, FaUserPlus } from "react-icons/fa";

export const PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 300;

const statusOptions: { value: PatientStatus; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "archived", label: "Arquivados" },
];

const columns: TableColumn<Patient>[] = [
  {
    header: "Nome",
    cell: (patient) => (
      <span className="flex flex-wrap items-center justify-end gap-2 text-right sm:justify-start sm:text-left">
        <Link
          href={`/pacientes/${patient.id}`}
          className={`font-medium ${rowLinkClassName}`}
        >
          {patient.name}
        </Link>
        {patient.archivedAt && <Badge>Arquivado</Badge>}
      </span>
    ),
  },
  {
    header: "Nascimento",
    cell: (patient) => formatDate(patient.birthDate),
  },
  {
    header: "Idade",
    cell: (patient) => formatAge(patient.birthDate),
  },
  {
    header: "CPF",
    cell: (patient) =>
      patient.cpf ? (
        <span className="font-mono">{maskCpf(patient.cpf)}</span>
      ) : (
        <span className="text-slate-300">Não informado</span>
      ),
  },
];

function NewPatientLink() {
  return (
    <LinkButton href="/pacientes/novo" block={false}>
      <FaUserPlus aria-hidden />
      Novo paciente
    </LinkButton>
  );
}

function resultSummary(total: number) {
  if (total === 1) {
    return "1 paciente encontrado";
  }

  return `${total} pacientes encontrados`;
}

export default function PatientList() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<PatientStatus>("active");
  const search = normalizeSearch(useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS));

  const filterKey = `${status}|${search}`;
  const [pageState, setPageState] = useState({ filterKey, page: 1 });
  const page = pageState.filterKey === filterKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ filterKey, page: next });

  const { data, error, isPending, isError, isFetching, isPlaceholderData, refetch } =
    usePatients({ search, status, page, limit: PAGE_SIZE });

  const lastPage = data?.totalPages ?? 0;

  if (!isPlaceholderData && lastPage > 0 && page > lastPage) {
    setPageState({ filterKey, page: lastPage });
  }

  const isUpdating = isFetching && isPlaceholderData;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <NewPatientLink />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Buscar paciente"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Nome, CPF ou Cartão SUS"
            hint="Pelo nome, ou pelo CPF ou Cartão SUS completos."
            autoComplete="off"
            spellCheck={false}
            maxLength={100}
          />
        </div>

        <div
          role="group"
          aria-label="Situação"
          className="flex shrink-0 rounded-xl border border-white/20 bg-white/10 p-1 sm:mb-7"
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => setStatus(option.value)}
              className={`flex-1 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                status === option.value
                  ? "bg-white text-blue-700"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p role="status" className="sr-only">
        {data && !isUpdating ? resultSummary(data.total) : ""}
      </p>

      <section aria-label="Lista de pacientes" className="mt-6">
        {isError && !data ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/10 px-6 py-12 text-center shadow-2xl backdrop-blur-2xl"
          >
            <p>Não foi possível carregar os pacientes.</p>
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
        ) : isPending ? (
          <Table
            caption="Pacientes"
            columns={columns}
            rows={[]}
            getRowKey={(patient) => patient.id}
            isLoading
          />
        ) : data.items.length === 0 ? (
          search ? (
            <EmptyState
              icon={FaSearch}
              title="Nenhum paciente encontrado"
              description="Confira a grafia do nome, ou digite o CPF ou o Cartão SUS completos."
            />
          ) : status === "archived" ? (
            <EmptyState
              icon={FaArchive}
              title="Nenhum paciente arquivado"
              description="Os pacientes arquivados aparecem aqui. O prontuário deles continua guardado pelo prazo legal."
            />
          ) : (
            <EmptyState
              icon={FaUserPlus}
              title="Nenhum paciente cadastrado"
              description="Cadastre seu primeiro paciente para começar a registrar o acompanhamento."
              action={<NewPatientLink />}
            />
          )
        ) : (
          <div
            className={`flex flex-col gap-4 transition-opacity ${isUpdating ? "opacity-60" : ""}`}
            aria-busy={isUpdating}
          >
            <Table
              caption={status === "archived" ? "Pacientes arquivados" : "Pacientes ativos"}
              columns={columns}
              rows={data.items}
              getRowKey={(patient) => patient.id}
            />

            <p className="text-center text-sm text-slate-300">
              {resultSummary(data.total)}
            </p>

            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
              disabled={isUpdating}
            />
          </div>
        )}
      </section>
    </>
  );
}
