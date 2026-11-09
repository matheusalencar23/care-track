"use client";

import Button from "@/app/ui/button";
import RequestId from "@/app/ui/request-id";
import Skeleton from "@/app/ui/skeleton";
import { useRecords } from "@/hooks/records/useRecords";
import { formatDateTime } from "@/lib/dates";
import type { Patient } from "@/model/patient";
import type { PatientRecord } from "@/model/record";
import { useEffect, useRef } from "react";
import NewRecordForm from "./new-record-form";

interface Props {
  patient: Patient;
}

function attachmentsLabel(count: number) {
  return count === 1
    ? "1 anexo. A visualização estará disponível em breve."
    : `${count} anexos. A visualização estará disponível em breve.`;
}

function RecordItem({ record }: { record: PatientRecord }) {
  const { author } = record;

  return (
    <li className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
      <article>
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-white">{author.name}</span>
          {` · COREN-${author.corenState} ${author.coren} · `}
          <time dateTime={record.createdAt}>
            {formatDateTime(record.createdAt)}
          </time>
        </p>

        {record.content && (
          <p className="mt-2 break-words whitespace-pre-wrap">
            {record.content}
          </p>
        )}

        {record.attachments.length > 0 && (
          <p className="mt-2 text-sm text-slate-300">
            {attachmentsLabel(record.attachments.length)}
          </p>
        )}
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
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchNextPageError,
    isPending,
    refetch,
  } = useRecords(patient.id);

  const records = data?.pages.flatMap((page) => page.items);

  return (
    <section
      aria-labelledby="patient-history-title"
      className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
    >
      <h2 id="patient-history-title" className="text-lg font-semibold">
        Histórico
      </h2>

      <NewRecordForm patient={patient} />

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
          Nenhum registro neste histórico.
        </p>
      ) : (
        <>
          <ol className="mt-6 space-y-5 border-t border-white/10 pt-5">
            {records.map((record) => (
              <RecordItem key={record.id} record={record} />
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
    </section>
  );
}
