"use client";

import ConfirmDialog from "@/app/ui/confirm-dialog";
import RadioGroup from "@/app/ui/radio-group";
import Textarea from "@/app/ui/textarea";
import { useVoidRecord } from "@/hooks/records/useVoidRecord";
import { formatDateTime } from "@/lib/dates";
import { applyFieldErrors } from "@/lib/form-errors";
import { voidReasonLabels } from "@/lib/records";
import {
  RECORD_REASON_MAX_LENGTH,
  RECORD_VOID_REASONS,
  type PatientRecord,
} from "@/model/record";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import z from "zod";

interface Props {
  record: PatientRecord;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

const PREVIEW_LENGTH = 200;

const schema = z
  .object({
    reason: z.enum(RECORD_VOID_REASONS, "Informe o motivo da anulação"),
    details: z
      .string()
      .trim()
      .max(
        RECORD_REASON_MAX_LENGTH,
        `A descrição deve ter no máximo ${RECORD_REASON_MAX_LENGTH} caracteres`,
      ),
  })
  .superRefine((values, context) => {
    if (values.reason === "other" && !values.details) {
      context.addIssue({
        code: "custom",
        path: ["details"],
        message: "Descreva o motivo da anulação",
      });
    }
  });

type VoidFormValues = z.infer<typeof schema>;

const formFields = ["reason", "details"] as const;

function preview(content: string) {
  return content.length > PREVIEW_LENGTH
    ? `${content.slice(0, PREVIEW_LENGTH).trimEnd()}…`
    : content;
}

export default function VoidRecordDialog({
  record,
  open,
  onClose,
  onDone,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VoidFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { details: "" },
  });

  const { voidRecord, isPending } = useVoidRecord(record.patientId, {
    onDone,
    onValidationError: (err) => applyFieldErrors(err, setError, formFields),
  });

  const reason = useWatch({ control, name: "reason" });

  function onSubmit(values: VoidFormValues) {
    voidRecord({
      recordId: record.id,
      reason: values.reason,
      ...(values.details && { details: values.details }),
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => handleSubmit(onSubmit)()}
      isPending={isPending}
      tone="danger"
      title="Anular registro?"
      confirmLabel="Anular"
      pendingLabel="Anulando..."
    >
      <div className="space-y-5">
        <p>
          A anulação é <strong>definitiva</strong> e não pode ser desfeita. O
          registro não é apagado: ele sai da linha do tempo e continua guardado,
          com o motivo, no filtro &quot;Anulados&quot;.
        </p>

        <blockquote className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-300">
            {record.author.name} · {formatDateTime(record.createdAt)}
          </p>
          {record.content && (
            <p className="mt-1 break-words whitespace-pre-wrap text-white">
              {preview(record.content)}
            </p>
          )}
        </blockquote>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Controller
            control={control}
            name="reason"
            render={({ field }) => (
              <RadioGroup
                {...field}
                label="Motivo"
                error={errors.reason?.message}
                options={RECORD_VOID_REASONS.map((value) => ({
                  value,
                  label: voidReasonLabels[value],
                }))}
              />
            )}
          />

          <Textarea
            label="Descrição"
            rows={3}
            hint={
              reason === "other"
                ? "Obrigatória para outro motivo."
                : "Opcional."
            }
            disabled={isPending}
            error={errors.details?.message}
            {...register("details")}
          />
        </form>
      </div>
    </ConfirmDialog>
  );
}
