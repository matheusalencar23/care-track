"use client";

import Button from "@/app/ui/button";
import Textarea from "@/app/ui/textarea";
import { useAttachmentUploads } from "@/hooks/attachments/useAttachmentUploads";
import { useImageConsent } from "@/hooks/consents/useImageConsent";
import { useCreateRecord } from "@/hooks/records/useCreateRecord";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { applyFieldErrors } from "@/lib/form-errors";
import { recordContentHint, recordOptionalContentSchema } from "@/lib/records";
import type { Patient } from "@/model/patient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";
import AttachmentUploader from "./attachment-uploader";

interface Props {
  patient: Patient;
  onSaved?: () => void;
}

const schema = z.object({
  content: recordOptionalContentSchema,
});

type RecordFormValues = z.infer<typeof schema>;

const formFields = ["content"] as const;

const PENDING_UPLOADS_MESSAGE =
  "Remova os arquivos que não foram enviados ou envie-os de novo antes de salvar.";

export default function NewRecordForm({ patient, onSaved }: Props) {
  const [savedCount, setSavedCount] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const canAttachMedia = useImageConsent(patient.id);
  const uploads = useAttachmentUploads(patient.id, { canAttachMedia });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  const { createRecord, isPending } = useCreateRecord(patient.id, {
    onDone: () => {
      reset();
      uploads.reset();
      setFormError(null);
      setSavedCount((count) => count + 1);
      onSaved?.();
    },
    onValidationError: (err) => applyFieldErrors(err, setError, formFields),
  });

  useEffect(() => {
    if (savedCount > 0) {
      setFocus("content");
    }
  }, [savedCount, setFocus]);

  const content = useWatch({ control, name: "content" });
  const isArchived = Boolean(patient.archivedAt);
  useUnsavedChangesWarning(
    content.trim() !== "" || uploads.uploads.length > 0,
  );
  const visibleFormError = uploads.hasProblems ? formError : null;

  if (isArchived && !content && uploads.uploads.length === 0) {
    return null;
  }

  function submit({ content }: RecordFormValues) {
    if (uploads.hasProblems) {
      setFormError(PENDING_UPLOADS_MESSAGE);
      return;
    }

    setFormError(null);
    const { attachmentIds } = uploads;

    if (!content && attachmentIds.length === 0) {
      setError(
        "content",
        { message: "Escreva o texto do registro ou anexe um arquivo" },
        { shouldFocus: true },
      );
      return;
    }

    createRecord({
      ...(content && { content }),
      ...(attachmentIds.length > 0 && { attachmentIds }),
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="mt-5">
      <Textarea
        label="Novo registro"
        rows={5}
        readOnly={isArchived}
        hint={`${recordContentHint(content)} O texto é opcional quando há arquivos anexados. A autoria, a data e a hora são registradas automaticamente.`}
        error={errors.content?.message}
        {...register("content")}
      />

      <AttachmentUploader
        patientId={patient.id}
        uploads={uploads.uploads}
        disabled={isArchived || isPending}
        canAttachMedia={canAttachMedia}
        onAddFiles={uploads.addFiles}
        onCancel={uploads.cancel}
        onRetry={uploads.retry}
        onSubmitPassword={uploads.submitPassword}
        onRemove={uploads.remove}
      />

      {isArchived && (
        <p role="alert" className="mt-3 text-sm text-warning-400">
          O paciente foi arquivado e este registro ainda não foi salvo. Reative
          o paciente para salvar ou copie o texto antes de sair da página.
        </p>
      )}

      {visibleFormError && (
        <p role="alert" className="mt-3 text-sm text-danger-400">
          {visibleFormError}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          block={false}
          disabled={isPending || isArchived || uploads.isUploading}
        >
          {isPending
            ? "Salvando..."
            : uploads.isUploading
              ? "Enviando arquivos..."
              : "Salvar registro"}
        </Button>
      </div>
    </form>
  );
}
