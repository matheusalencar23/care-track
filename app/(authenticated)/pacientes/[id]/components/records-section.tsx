"use client";

import Button from "@/app/ui/button";
import RequestId from "@/app/ui/request-id";
import Skeleton from "@/app/ui/skeleton";
import { useRecords } from "@/hooks/records/useRecords";
import type { Patient } from "@/model/patient";
import type { PatientRecord, RecordStatus } from "@/model/record";
import { useEffect, useRef, useState } from "react";
import NewRecordForm from "./new-record-form";
import RecordItem from "./record-item";
import VoidRecordDialog from "./void-record-dialog";

interface Props {
  patient: Patient;
}

const statusOptions: { value: RecordStatus; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "voided", label: "Anulados" },
];

interface LoadMoreProps {
  isLoading: boolean;
  onLoad: () => void;
}

function LoadMore({ isLoading, onLoad }: LoadMoreProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;

    if (!button || isLoading || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoad();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(button);

    return () => observer.disconnect();
  }, [isLoading, onLoad]);

  return (
    <div className="mt-6 flex justify-center">
      <Button
        ref={buttonRef}
        type="button"
        variant="secondary"
        block={false}
        disabled={isLoading}
        onClick={() => onLoad()}
      >
        {isLoading ? "Carregando..." : "Carregar registros anteriores"}
      </Button>
    </div>
  );
}

export default function RecordsSection({ patient }: Props) {
  const [status, setStatus] = useState<RecordStatus>("active");
  const [voiding, setVoiding] = useState<PatientRecord | null>(null);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [voidCount, setVoidCount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const listTitleRef = useRef<HTMLHeadingElement>(null);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchNextPageError,
    isPending,
    refetch,
  } = useRecords(patient.id, status);

  const records = data?.pages.flatMap((page) => page.items);
  const canChange = status === "active" && !patient.archivedAt;
  const editingRecord = records?.find((record) => record.id === editingId);

  function changeStatus(next: RecordStatus) {
    setEditingId(null);
    setStatus(next);
  }

  useEffect(() => {
    if (voidCount > 0) {
      listTitleRef.current?.focus();
    }
  }, [voidCount]);

  function openVoid(record: PatientRecord) {
    setVoiding(record);
    setIsVoidOpen(true);
  }

  function finishVoid() {
    setIsVoidOpen(false);
    setVoidCount((count) => count + 1);
  }

  return (
    <section
      aria-labelledby="patient-history-title"
      className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
    >
      <h2 id="patient-history-title" className="text-lg font-semibold">
        Histórico
      </h2>

      <NewRecordForm patient={patient} onSaved={() => changeStatus("active")} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <h3
          ref={listTitleRef}
          tabIndex={-1}
          className="font-semibold focus:outline-none"
        >
          {status === "voided" ? "Registros anulados" : "Registros"}
        </h3>

        <div
          role="group"
          aria-label="Situação dos registros"
          className="flex rounded-xl border border-white/20 bg-white/10 p-1"
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => changeStatus(option.value)}
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

      {isPending ? (
        <div aria-busy className="mt-6 space-y-3">
          <span className="sr-only">Carregando registros...</span>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : !records ? (
        <div role="alert" className="mt-6 space-y-3 text-sm">
          <p>Não foi possível carregar os registros.</p>
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
      ) : records.length === 0 ? (
        <p className="mt-6 text-sm text-slate-300">
          {status === "voided"
            ? "Nenhum registro anulado. Os registros anulados continuam guardados e aparecem aqui, com o motivo."
            : "Nenhum registro neste histórico."}
        </p>
      ) : (
        <>
          <ol className="mt-6 space-y-5">
            {records.map((record) => (
              <RecordItem
                key={record.id}
                patient={patient}
                record={record}
                isEditing={record.id === editingId}
                actionsDisabled={Boolean(editingRecord)}
                onEdit={canChange ? () => setEditingId(record.id) : undefined}
                onCloseEdit={() => setEditingId(null)}
                onVoid={canChange ? () => openVoid(record) : undefined}
              />
            ))}
          </ol>

          {error ? (
            <div role="alert" className="mt-6 space-y-3 text-sm">
              <p>Não foi possível atualizar os registros.</p>
              <RequestId error={error} />
              <Button
                type="button"
                variant="secondary"
                block={false}
                disabled={isFetching}
                onClick={() =>
                  isFetchNextPageError ? fetchNextPage() : refetch()
                }
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            hasNextPage && (
              <LoadMore isLoading={isFetching} onLoad={fetchNextPage} />
            )
          )}
        </>
      )}

      {voiding && (
        <VoidRecordDialog
          key={voiding.id}
          record={voiding}
          open={isVoidOpen}
          onClose={() => setIsVoidOpen(false)}
          onDone={finishVoid}
        />
      )}
    </section>
  );
}
