"use client";

import Badge from "@/app/ui/badge";
import { formatDateTime } from "@/lib/dates";
import { voidReasonLabels } from "@/lib/records";
import type { Patient } from "@/model/patient";
import type { PatientRecord } from "@/model/record";
import { useEffect, useId, useRef, useState } from "react";
import RecordEditor from "./record-editor";
import RecordVersions from "./record-versions";

interface Props {
  patient: Patient;
  record: PatientRecord;
  isEditing: boolean;
  actionsDisabled: boolean;
  onEdit?: () => void;
  onCloseEdit: () => void;
  onVoid?: () => void;
}

const actionClassName =
  "cursor-pointer rounded-lg px-2 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

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

export default function RecordItem({
  patient,
  record,
  isEditing,
  actionsDisabled,
  onEdit,
  onCloseEdit,
  onVoid,
}: Props) {
  const { author } = record;
  const createdAt = formatDateTime(record.createdAt);
  const [showVersions, setShowVersions] = useState(false);
  const versionsId = useId();
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(isEditing);

  useEffect(() => {
    if (wasEditing.current && !isEditing) {
      editButtonRef.current?.focus();
    }

    wasEditing.current = isEditing;
  }, [isEditing]);

  return (
    <li className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
      <article>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-slate-300">
            <span className="font-semibold text-white">{author.name}</span>
            {` · COREN-${author.corenState} ${author.coren} · `}
            <time dateTime={record.createdAt}>{createdAt}</time>
            {record.editedAt && (
              <span>
                {" · Editado em "}
                <time dateTime={record.editedAt}>
                  {formatDateTime(record.editedAt)}
                </time>
              </span>
            )}
            {record.voidedAt && (
              <span className="ml-2">
                <Badge tone="danger">Anulado</Badge>
              </span>
            )}
          </p>

          {!isEditing && (onEdit || onVoid) && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  ref={editButtonRef}
                  type="button"
                  onClick={onEdit}
                  disabled={actionsDisabled}
                  aria-label={`Editar registro de ${createdAt}`}
                  className={actionClassName}
                >
                  Editar
                </button>
              )}
              {onVoid && (
                <button
                  type="button"
                  onClick={onVoid}
                  disabled={actionsDisabled}
                  aria-label={`Anular registro de ${createdAt}`}
                  className={actionClassName}
                >
                  Anular
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <RecordEditor patient={patient} record={record} onClose={onCloseEdit} />
        ) : (
          record.content && (
            <p
              className={`mt-2 break-words whitespace-pre-wrap ${record.voidedAt ? "text-slate-300" : ""}`}
            >
              {record.content}
            </p>
          )
        )}

        {record.attachments.length > 0 && (
          <p className="mt-2 text-sm text-slate-300">
            {attachmentsLabel(record.attachments.length)}
          </p>
        )}

        <VoidInfo record={record} />

        {record.editedAt && (
          <>
            <button
              type="button"
              aria-expanded={showVersions}
              aria-controls={showVersions ? versionsId : undefined}
              onClick={() => setShowVersions((value) => !value)}
              className={`mt-3 ${actionClassName} -ml-2`}
            >
              {showVersions
                ? "Ocultar versões anteriores"
                : "Ver versões anteriores"}
            </button>

            {showVersions && <RecordVersions id={versionsId} record={record} />}
          </>
        )}
      </article>
    </li>
  );
}
