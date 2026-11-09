"use client";

import Button from "@/app/ui/button";
import RequestId from "@/app/ui/request-id";
import Skeleton from "@/app/ui/skeleton";
import { useRecordVersions } from "@/hooks/records/useRecordVersions";
import { formatDateTime } from "@/lib/dates";
import type { PatientRecord } from "@/model/record";

interface Props {
  record: PatientRecord;
  id: string;
}

export default function RecordVersions({ record, id }: Props) {
  const { data, error, isPending, refetch } = useRecordVersions(
    record.patientId,
    record.id,
  );

  const previous = data?.filter((version) => version.version < record.version);

  return (
    <div
      id={id}
      className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
    >
      {isPending ? (
        <div aria-busy className="space-y-2">
          <span className="sr-only">Carregando versões...</span>
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : !previous ? (
        <div role="alert" className="space-y-3">
          <p>Não foi possível carregar as versões anteriores.</p>
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
      ) : previous.length === 0 ? (
        <p className="text-slate-300">Nenhuma versão anterior.</p>
      ) : (
        <ol className="space-y-4">
          {previous.map((version) => (
            <li
              key={version.version}
              className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0"
            >
              <p className="text-xs text-slate-300">
                <span className="font-semibold text-white">
                  Versão {version.version}
                </span>
                {` · ${version.author.name} · COREN-${version.author.corenState} ${version.author.coren} · `}
                <time dateTime={version.createdAt}>
                  {formatDateTime(version.createdAt)}
                </time>
              </p>
              {version.reason && (
                <p className="mt-1 text-xs break-words text-slate-300">
                  Motivo da edição: {version.reason}
                </p>
              )}
              {version.content ? (
                <p className="mt-2 break-words whitespace-pre-wrap text-slate-200">
                  {version.content}
                </p>
              ) : (
                <p className="mt-2 text-slate-300">Sem texto.</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
