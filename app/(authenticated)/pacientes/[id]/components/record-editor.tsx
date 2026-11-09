"use client";

import Button from "@/app/ui/button";
import Input from "@/app/ui/input";
import Textarea from "@/app/ui/textarea";
import { useUpdateRecord } from "@/hooks/records/useUpdateRecord";
import { formatDateTime } from "@/lib/dates";
import { applyFieldErrors } from "@/lib/form-errors";
import { recordContentHint, recordContentSchema } from "@/lib/records";
import type { Patient } from "@/model/patient";
import {
  RECORD_REASON_MAX_LENGTH,
  type PatientRecord,
} from "@/model/record";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";

interface Props {
  patient: Patient;
  record: PatientRecord;
  onClose: () => void;
}

const schema = z.object({
  content: recordContentSchema,
  reason: z
    .string()
    .trim()
    .max(
      RECORD_REASON_MAX_LENGTH,
      `O motivo deve ter no máximo ${RECORD_REASON_MAX_LENGTH} caracteres`,
    ),
});

type EditFormValues = z.infer<typeof schema>;

const formFields = ["content", "reason"] as const;

export default function RecordEditor({ patient, record, onClose }: Props) {
  const [startVersion] = useState(record.version);
  const [hasConflict, setHasConflict] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: record.content ?? "", reason: "" },
  });

  const { updateRecord, isPending } = useUpdateRecord(patient.id, {
    onDone: onClose,
    onOutdated: () => setHasConflict(true),
    onValidationError: (err) => applyFieldErrors(err, setError, formFields),
  });

  useEffect(() => {
    setFocus("content");
  }, [setFocus]);

  const content = useWatch({ control, name: "content" });
  const isArchived = Boolean(patient.archivedAt);
  const changedElsewhere = hasConflict && record.version !== startVersion;

  function onSubmit(values: EditFormValues) {
    if (values.content === (record.content ?? "").trim()) {
      onClose();
      return;
    }

    updateRecord({
      recordId: record.id,
      content: values.content,
      version: hasConflict ? record.version : startVersion,
      ...(values.reason && { reason: values.reason }),
    });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 space-y-4"
    >
      {changedElsewhere && (
        <div
          role="alert"
          className="rounded-xl border border-warning-400/30 bg-warning-500/10 p-4 text-sm"
        >
          <p className="font-semibold text-warning-400">
            Este registro foi alterado em outro lugar enquanto você editava.
          </p>
          <p className="mt-1 text-slate-300">
            Texto atual, salvo por {record.author.name}
            {record.editedAt && ` em ${formatDateTime(record.editedAt)}`}:
          </p>
          <p className="mt-2 break-words whitespace-pre-wrap text-white">
            {record.content}
          </p>
          <p className="mt-2 text-slate-300">
            O seu texto continua no campo abaixo. Ao salvar, ele vira a versão
            atual, e a versão acima continua guardada nas versões anteriores.
          </p>
        </div>
      )}

      <Textarea
        label="Texto do registro"
        rows={6}
        readOnly={isArchived}
        hint={recordContentHint(content)}
        error={errors.content?.message}
        {...register("content")}
      />

      <Input
        label="Motivo da edição"
        autoComplete="off"
        readOnly={isArchived}
        hint="Opcional. Fica nas versões anteriores; não é preciso incluir dados clínicos."
        error={errors.reason?.message}
        {...register("reason")}
      />

      {isArchived && (
        <p role="alert" className="text-sm text-warning-400">
          O paciente foi arquivado e esta edição ainda não foi salva. Reative o
          paciente para salvar ou copie o texto antes de fechar.
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          block={false}
          disabled={isPending}
          onClick={onClose}
        >
          {isArchived ? "Fechar sem salvar" : "Cancelar"}
        </Button>

        <Button block={false} disabled={isPending || isArchived}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
