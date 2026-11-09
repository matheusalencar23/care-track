"use client";

import Badge from "@/app/ui/badge";
import Button from "@/app/ui/button";
import RequestId from "@/app/ui/request-id";
import Skeleton from "@/app/ui/skeleton";
import { useRecords } from "@/hooks/records/useRecords";
import { formatDateTime } from "@/lib/dates";
import { voidReasonLabels } from "@/lib/records";
import type { Patient } from "@/model/patient";
import type { PatientRecord, RecordStatus } from "@/model/record";
import { useEffect, useRef, useState } from "react";
import NewRecordForm from "./new-record-form";
import VoidRecordDialog from "./void-record-dialog";

interface Props {
  patient: Patient;
}

const statusOptions: { value: RecordStatus; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "voided", label: "Anulados" },
];

function attachmentsLabel(count: number) {
  return count === 1
    ? "1 anexo. A visualização estará disponível em breve."
    : `${count} anexos. A visualização estará disponível em breve.`;
}

function VoidInfo({ record }: { record: PatientRecord }) {
  if (!record.voidedAt) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-danger-400/30 bg-danger-500/10 p-3 text-sm">
      <p>
        Anulado em {formatDateTime(record.voidedAt)}
        {record.voidReason && `. Motivo: ${voidReasonLabels[record.voidReason]}`}
      </p>
      {record.voidReasonDetails && (
        <p className="mt-1 break-words">{record.voidReasonDetails}</p>
      )}
    </div>
  );
}

interface RecordItemProps {
  record: PatientRecord;
  onVoid?: () => void;
}

function RecordItem({ record, onVoid }: RecordItemProps) {
  const { author } = record;
  const createdAt = formatDateTime(record.createdAt);

  return (
    <li className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
      <article>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-slate-300">
            <span className="font-semibold text-white">{author.name}</span>
            {` · COREN-${author.corenState} ${author.coren} · `}
            <time dateTime={record.createdAt}>{createdAt}</time>
            {record.voidedAt && (
              <span className="ml-2">
                <Badge tone="danger">Anulado</Badge>
              </span>
            )}
          </p>

          {onVoid && (
            <button
              type="button"
              onClick={onVoid}
              aria-label={`Anular registro de ${createdAt}`}
              className="cursor-pointer rounded-lg px-2 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Anular
            </button>
          )}
        </div>

        {record.content && (
          <p
            className={`mt-2 break-words whitespace-pre-wrap ${record.voidedAt ? "text-slate-300" : ""}`}
          >
            {record.content}
          </p>
        )}

        {record.attachments.length > 0 && (
          <p className="mt-2 text-sm text-slate-300">
            {attachmentsLabel(record.attachments.length)}
          </p>
        )}

        <VoidInfo record={record} />
      </article>
    </li>
  );
}

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
  const canVoid = status === "active" && !patient.archivedAt;

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

      <NewRecordForm patient={patient} onSaved={() => setStatus("active")} />

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
                record={record}
                onVoid={canVoid ? () => openVoid(record) : undefined}
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
